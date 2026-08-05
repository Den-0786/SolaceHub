from donors.models import Donor
from chits.models import Chit
from deployments.models import Deployment

VOUCHER_DISPLAY_NAMES = {
    'full_meal': 'Full Meal',
    'drinks_only': 'Drinks Only',
    'snacks_only': 'Snacks Only',
}


def get_querysets(event_id):
    """Resolve donors, chits, and deployment scoped to an optional event id."""
    if event_id:
        donors = Donor.objects.filter(event_id=event_id)
        chits = Chit.objects.filter(event_id=event_id)
        deployment = Deployment.objects.filter(event_id=event_id).first()
    else:
        donors = Donor.objects.all()
        chits = Chit.objects.all()
        deployment = None
    return list(donors), list(chits), deployment


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
        row = daily.setdefault(day, {'food': 0, 'beverage': 0, 'vip': 0})
        if c.voucher_type == 'full_meal':
            row['food'] += 1
        elif c.voucher_type == 'drinks_only':
            row['beverage'] += 1
        else:
            row['vip'] += 1
    daily_issuance = [
        {'day': f"Day {day}", 'food': row['food'], 'beverage': row['beverage'], 'vip': row['vip']}
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
    }
