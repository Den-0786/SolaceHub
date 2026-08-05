from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Report
from .serializers import ReportSerializer
from donors.models import Donor
from chits.models import Chit
from deployments.models import Deployment


def get_event_id(request):
    """Read the active event id from the X-Event-ID header or query param."""
    return (
        request.META.get('HTTP_X_EVENT_ID')
        or request.query_params.get('event_id')
    )


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Report.objects.filter(event_id=event_id)
        return Report.objects.all()

    def perform_create(self, serializer):
        event_id = get_event_id(self.request)
        serializer.save(event_id=event_id)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Report.objects.filter(event_id=event_id)
        return Report.objects.all()


class ReportSummaryView(APIView):
    """Compute the live financial/operational report for the active event."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        event_id = get_event_id(request)

        if event_id:
            donors = Donor.objects.filter(event_id=event_id)
            chits = Chit.objects.filter(event_id=event_id)
            deployment = Deployment.objects.filter(event_id=event_id).first()
        else:
            donors = Donor.objects.all()
            chits = Chit.objects.all()
            deployment = None

        donors_list = list(donors)
        chits_list = list(chits)

        # --- Summary ---
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

        # --- Financial audit: day-by-day breakdown ---
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

        # --- Financial audit: desk attendants ---
        attendants = {}
        for d in donors_list:
            name = (
                d.operator_name
                or (d.logged_by.display_name if d.logged_by else None)
                or (d.logged_by.username if d.logged_by else None)
                or 'System'
            )
            att = attendants.setdefault(name, {'entries': 0, 'amount': 0})
            att['entries'] += 1
            att['amount'] += float(d.amount or 0)
        desk_attendants = [
            {'name': name, 'entries': att['entries'], 'amount': round(att['amount'], 2)}
            for name, att in attendants.items()
        ]

        # --- Top donors ---
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

        # --- Refreshment / catering audit ---
        display_names = {
            'full_meal': 'Full Meal',
            'drinks_only': 'Drinks Only',
            'snacks_only': 'Snacks Only',
        }
        chit_type_counts = {}
        for c in chits_list:
            vt = c.voucher_type or ''
            chit_type_counts[vt] = chit_type_counts.get(vt, 0) + 1
        chit_breakdown = [
            {
                'type': display_names.get(vt, vt or 'Other'),
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

        return Response({
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
        })
