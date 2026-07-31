import csv
import io
from django.utils import timezone
from django.core.files.base import ContentFile


def expire_deployment_session(event):
    """Backup all donor/chit data for an event, then clear it and lock the session."""
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

    csv_bytes = output.getvalue().encode('utf-8-sig')
    output.close()

    record_count = len(donors) + len(chits)
    backup = Backup.objects.create(
        event=event,
        csv_file=ContentFile(csv_bytes, name=filename),
        record_count=record_count,
    )

    # Clear live data
    Donor.objects.filter(event=event).delete()
    Chit.objects.filter(event=event).delete()

    # Lock the session and credentials for this event
    SessionTimer.objects.filter(event=event).update(is_active=False)
    client_cred = Credential.objects.filter(credential_type='client', event=event).first()
    if client_cred:
        client_cred.session_expired = True
        client_cred.save()
    Credential.objects.filter(credential_type='desk_operator', event=event).delete()

    return backup
