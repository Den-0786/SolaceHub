import csv
import io
from datetime import date as date_cls
from datetime import time as time_cls
from types import SimpleNamespace

from donors.models import Donor
from chits.models import Chit
from deployments.models import Backup, Deployment
from events.models import Event

VOUCHER_DISPLAY_NAMES = {
    'full_package': 'Full Package',
    'water_only': 'Water Only',
    'drink_only': 'Drink Only',
    'drinks_water': 'Drinks & Water',
    'food_water': 'Food & Water',
    'food_drinks': 'Food & Drinks',
}
VOUCHER_TYPES = list(VOUCHER_DISPLAY_NAMES.keys())


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_date(value):
    if not value:
        return None
    try:
        return date_cls.fromisoformat(str(value).strip())
    except ValueError:
        return None


def _to_time(value):
    if not value:
        return None
    try:
        return time_cls.fromisoformat(str(value).strip())
    except ValueError:
        return None


def _operator_name(value):
    """Operator display name from an archived credential username.

    Archived values look like "{event_uuid}_{username}", so strip the event
    prefix to keep the report readable.
    """
    if not value:
        return 'System'
    value = str(value).strip()
    if '_' in value:
        return value.split('_', 1)[1] or value
    return value


def load_archived_records(event_id):
    """Rebuild donor/chit records from the latest non-empty archived backup.

    Session expiry archives all donor/chit data into a Backup CSV and then
    clears the live tables, so downloads for expired events must source their
    rows from the archive.
    """
    if not event_id:
        return [], []
    backup = (
        Backup.objects.filter(event_id=event_id, record_count__gt=0)
        .order_by('-created_at')
        .first()
    )
    if backup is None:
        return [], []
    try:
        with backup.csv_file.open('r') as f:
            raw = f.read()
    except Exception:
        return [], []
    if raw.startswith('\ufeff'):
        raw = raw[1:]

    reader = csv.DictReader(io.StringIO(raw))
    donors, chits = [], []
    for row in reader:
        record_type = (row.get('Record Type') or '').strip()
        if record_type == 'Donation':
            donors.append(SimpleNamespace(
                receipt_id=row.get('Receipt / Security Code') or '',
                donor_name=row.get('Name') or '',
                phone_number=row.get('Phone') or '',
                amount=_to_float(row.get('Amount')),
                method=row.get('Method') or '',
                event_day=_to_int(row.get('Event Day')),
                date=_to_date(row.get('Date')),
                time=_to_time(row.get('Time')),
                operator_name=_operator_name(row.get('Logged / Issued By')),
                status=row.get('Status') or '',
            ))
        elif record_type == 'Chit':
            chits.append(SimpleNamespace(
                security_code=row.get('Receipt / Security Code') or '',
                representative_name=row.get('Name') or '',
                voucher_type=row.get('Voucher Type') or '',
                number_of_people=_to_int(row.get('Number of People')) or 0,
                event_day=_to_int(row.get('Event Day')),
                date=_to_date(row.get('Date')),
                time=_to_time(row.get('Time')),
                operator_name=_operator_name(row.get('Logged / Issued By')),
            ))
    return donors, chits


def get_event(event_id):
    return Event.objects.filter(id=event_id).first() if event_id else None


def get_querysets(event_id):
    """Resolve donors, chits, and deployment scoped to an optional event id.

    When the live tables are empty (e.g. after session expiry cleared them),
    fall back to the archived backup CSV so reports still contain real data.
    """
    if event_id:
        donors = list(Donor.objects.filter(event_id=event_id))
        chits = list(Chit.objects.filter(event_id=event_id))
        deployment = Deployment.objects.filter(event_id=event_id).first()
    else:
        donors = list(Donor.objects.all())
        chits = list(Chit.objects.all())
        deployment = None

    if not donors and not chits:
        archived_donors, archived_chits = load_archived_records(event_id)
        if archived_donors or archived_chits:
            donors, chits = archived_donors, archived_chits

    return donors, chits, deployment


def get_operator_name(record):
    """Best-available operator display name for a donor or chit record."""
    if getattr(record, 'operator_name', None):
        return record.operator_name
    user = getattr(record, 'logged_by', None) or getattr(record, 'issued_by', None)
    if user:
        return user.display_name or user.username
    return 'System'


def compute_report(event_id):
    """Compute the full live report payload for an optional event id."""
    donors_list, chits_list, deployment = get_querysets(event_id)

    total_revenue = sum(float(d.amount or 0) for d in donors_list)
    cash_revenue = sum(
        float(d.amount or 0)
        for d in donors_list
        if 'cash' in (d.method or '').lower()
    )
    total_donors = len(donors_list)
    total_chits = len(chits_list)
    average_donation = round(total_revenue / total_donors, 2) if total_donors else 0
    estimated_guests = max(total_chits, 1)

    by_day = {}
    for d in donors_list:
        day = d.event_day or 1
        entry = by_day.setdefault(day, {'total': 0, 'donors': 0, 'date': ''})
        entry['total'] += float(d.amount or 0)
        entry['donors'] += 1
        if d.date:
            entry['date'] = d.date.isoformat()
    day_breakdown = [
        {
            'day': f"Day {day}",
            'date': info['date'],
            'total': round(info['total'], 2),
            'donors': info['donors'],
        }
        for day, info in sorted(by_day.items())
    ]

    attendants = {}
    for d in donors_list:
        name = get_operator_name(d)
        att = attendants.setdefault(name, {'entries': 0, 'amount': 0})
        att['entries'] += 1
        att['amount'] += float(d.amount or 0)
    desk_attendants = [
        {'name': name, 'entries': att['entries'], 'amount': round(att['amount'], 2)}
        for name, att in attendants.items()
    ]

    sorted_donors = sorted(donors_list, key=lambda d: float(d.amount or 0), reverse=True)[:10]
    top_donors = [
        {
            'rank': i + 1,
            'name': d.donor_name,
            'amount': round(float(d.amount or 0), 2),
            'phone': d.phone_number,
            'type': 'VIP' if float(d.amount or 0) >= 1000 else 'Regular',
        }
        for i, d in enumerate(sorted_donors)
    ]

    chit_type_counts = {}
    for c in chits_list:
        vt = c.voucher_type or ''
        chit_type_counts[vt] = chit_type_counts.get(vt, 0) + 1
    chit_breakdown = [
        {
            'type': VOUCHER_DISPLAY_NAMES.get(vt, vt or 'Other'),
            'count': count,
            'percentage': round((count / total_chits) * 100) if total_chits else 0,
        }
        for vt, count in sorted(chit_type_counts.items(), key=lambda x: -x[1])
    ]

    daily = {}
    for c in chits_list:
        day = c.event_day or 1
        row = daily.setdefault(day, {vt: 0 for vt in VOUCHER_TYPES})
        vt = c.voucher_type or ''
        if vt in row:
            row[vt] += 1
    daily_issuance = [
        {'day': f"Day {day}", **row}
        for day, row in sorted(daily.items())
    ]

    return {
        'summary': {
            'totalRevenue': round(total_revenue, 2),
            'cashRevenue': round(cash_revenue, 2),
            'momoRevenue': round(total_revenue - cash_revenue, 2),
            'totalDonors': total_donors,
            'totalChitsIssued': total_chits,
            'estimatedGuests': estimated_guests,
            'averageDonation': average_donation,
        },
        'financialAudit': {
            'deceasedName': deployment.deceased_name if deployment else 'Deceased',
            'memorialDates': (
                f"{deployment.start_date} - {deployment.end_date}" if deployment else ''
            ),
            'dayBreakdown': day_breakdown,
            'deskAttendants': desk_attendants,
        },
        'topDonors': top_donors,
        'refreshmentAudit': {
            'chitBreakdown': chit_breakdown,
            'dailyIssuance': daily_issuance,
        },
        'deployment': deployment,
        'event': get_event(event_id),
    }
