import csv
import io
import logging
from datetime import timedelta
from django.utils import timezone
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


def expire_deployment_session(event):
    """Backup all donor/chit data for an event, then clear it and lock the session.

    Returns a dict with the generated CSV string so callers can deliver the
    archive to the client even if server-side file storage fails.
    """
    from donors.models import Donor
    from chits.models import Chit
    from users.models import Credential
    from .models import SessionTimer, Backup

    donors = list(Donor.objects.filter(event=event).select_related('logged_by'))
    chits = list(Chit.objects.filter(event=event).select_related('issued_by'))

    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f'solacehub_backup_event_{event.id}_{timestamp}.csv'
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        'Record Type', 'Receipt / Security Code', 'Name', 'Amount', 'Method',
        'Number of People', 'Voucher Type', 'Event Day', 'Date', 'Time',
        'Logged / Issued By', 'Phone', 'Status'
    ])

    for donor in donors:
        writer.writerow([
            'Donation',
            donor.receipt_id,
            donor.donor_name,
            str(donor.amount),
            donor.method,
            '',
            '',
            donor.event_day,
            str(donor.date),
            str(donor.time),
            donor.logged_by.username if donor.logged_by else '',
            donor.phone_number,
            donor.status,
        ])

    for chit in chits:
        writer.writerow([
            'Chit',
            chit.security_code,
            chit.representative_name,
            '',
            '',
            chit.number_of_people,
            chit.voucher_type,
            chit.event_day,
            str(chit.date),
            str(chit.time),
            chit.issued_by.username if chit.issued_by else '',
            '',
            '',
        ])

    csv_string = output.getvalue()
    csv_bytes = csv_string.encode('utf-8-sig')
    output.close()

    record_count = len(donors) + len(chits)

    # Persist the archive server-side, but never let a storage failure block the
    # session lock/expiry or the delivery of the CSV to the owner.
    backup = None
    storage_error = None
    try:
        backup = Backup.objects.create(
            event=event,
            csv_file=ContentFile(csv_bytes, name=filename),
            record_count=record_count,
        )
    except Exception as e:
        storage_error = str(e)
        logger.exception("Failed to store backup file for event %s", event.id)

    # Clear live data
    Donor.objects.filter(event=event).delete()
    Chit.objects.filter(event=event).delete()

    # Lock the session and credentials for this event. Credentials are only
    # flagged, never deleted: removing them made an expired event impossible to
    # recover, because only a logged-in client can provision a desk operator.
    SessionTimer.objects.filter(event=event).update(is_active=False)
    Credential.objects.filter(
        event=event,
        credential_type__in=('client', 'desk_operator'),
    ).update(session_expired=True)

    return {
        'csv': csv_string,
        'record_count': record_count,
        'backup': backup,
        'storage_error': storage_error,
    }


def timer_expiry(timer):
    """Computed expiry datetime for a session timer, or None when no duration is set.

    A timer with zero duration is treated as unarmed (e.g. the placeholder record
    auto-created when a session timer is first fetched) and never expires.
    """
    if timer is None:
        return None
    duration = timedelta(days=timer.duration_days or 0, hours=timer.duration_hours or 0)
    if duration.total_seconds() <= 0:
        return None
    return timer.start_timestamp + duration


def timer_is_expired(timer):
    """Return True when a single timer's own computed expiry has passed."""
    expiry = timer_expiry(timer)
    return expiry is not None and timezone.now() > expiry


def armed_timers(timers):
    """Drop unarmed timers (zero duration) from an iterable of session timers.

    Unarmed timers are the placeholder records created when a timer is first
    fetched, and they never expire. They must not hold an event open either.
    """
    return [timer for timer in timers if timer_expiry(timer) is not None]


def event_session_expired(event_id=None, timer=None):
    """Return True when an event's session has ended.

    Passing an explicit ``timer`` evaluates only that timer, which lets callers
    reason about a single deployment's countdown.

    With only ``event_id``, an event is expired once *every* armed timer it owns
    has elapsed. An event can own several timers (one per deployment), so taking
    only the most recently updated one let a stale sibling countdown override a
    timer the owner had just extended. `is_active` is intentionally ignored so
    credentials stop working the moment the computed expiry passes, even if the
    timer was marked inactive without the credentials ever being locked.
    """
    if timer is not None:
        return timer_is_expired(timer)
    if not event_id:
        return False
    from .models import SessionTimer
    armed = armed_timers(SessionTimer.objects.filter(event_id=event_id))
    if not armed:
        return False
    return all(timer_is_expired(t) for t in armed)


def find_expired_session(event_id=None):
    """Return an expired session timer to drive the one-time lock, or None.

    Timers are grouped per event and an event only counts as expired once all
    of its armed timers have elapsed, so extending one deployment's timer
    re-opens the event instead of being vetoed by a sibling.
    """
    from .models import SessionTimer
    timers = SessionTimer.objects.filter(event_id=event_id) if event_id else SessionTimer.objects.all()

    by_event = {}
    for timer in armed_timers(timers):
        by_event.setdefault(str(timer.event_id), []).append(timer)

    for armed in by_event.values():
        if all(timer_is_expired(t) for t in armed):
            return next(t for t in armed if timer_is_expired(t))
    return None


def rearm_event_session(event, timer=None):
    """Re-open an event's session after the owner extends or unlocks it.

    Extending a timer on its own left the credentials flagged as expired, so the
    login gate kept rejecting the client with "Session expired" even though time
    remained on the clock. Re-arming clears that flag and marks the timer active
    again. The master fallback key is left alone: it is never flagged, and it is
    the credential the owner relies on during a lockout.
    """
    from users.models import Credential
    from .models import SessionTimer

    if event is None:
        return

    if timer is not None:
        SessionTimer.objects.filter(pk=timer.pk).update(is_active=True)
    else:
        SessionTimer.objects.filter(event=event).update(is_active=True)

    Credential.objects.filter(
        event=event,
        credential_type__in=('client', 'desk_operator'),
    ).update(session_expired=False)
