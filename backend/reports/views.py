import csv
import io
from datetime import date

from django.http import HttpResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import Report
from .serializers import ReportSerializer
from .report_data import (
    compute_report,
    get_operator_name,
    get_querysets,
    VOUCHER_DISPLAY_NAMES,
    VOUCHER_TYPES,
)


def get_event_id(request):
    """Read the active event id from the query param or X-Event-ID header.

    The explicit query param wins so a per-event export (e.g.
    ?event_id=<id>) is never overridden by the X-Event-ID header that the
    frontend sends for the currently active event.
    """
    return (
        request.query_params.get('event_id')
        or request.META.get('HTTP_X_EVENT_ID')
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
        data = compute_report(get_event_id(request))
        return Response({
            'summary': data['summary'],
            'financialAudit': data['financialAudit'],
            'topDonors': data['topDonors'],
            'refreshmentAudit': data['refreshmentAudit'],
        })


# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------

def _money(value):
    return f"GH¢ {value:,.2f}"


def _table(data, col_widths, alignments=None):
    """Build a reportlab table with a clean audit-style look."""
    table = Table(data, colWidths=col_widths, hAlign='LEFT')
    alignments = alignments or []
    style = [
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#d1d5db')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]
    if data:
        style.append(('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eef2f7')))
        style.append(('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'))
        for i, align in enumerate(alignments):
            if align:
                style.append(('ALIGN', (i, 0), (i, -1), align))
        if len(data) > 1:
            style.append(('BACKGROUND', (0, 1), (-1, -1), colors.white))
    table.setStyle(TableStyle(style))
    return table


def build_pdf(data):
    """Render the complete family audit as a PDF and return it as bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleLarge', parent=styles['Title'], fontSize=18, leading=22, spaceAfter=2
    )
    sub_style = ParagraphStyle(
        'Subtitle', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#6b7280')
    )
    heading_style = ParagraphStyle(
        'SectionHeading', parent=styles['Heading2'], fontSize=13, leading=16,
        spaceBefore=14, spaceAfter=6, textColor=colors.HexColor('#111827'),
    )

    summary = data['summary']
    audit = data['financialAudit']
    top_donors = data['topDonors']
    refreshment = data['refreshmentAudit']

    story = []
    story.append(Paragraph('Complete Family Audit Report', title_style))
    story.append(Paragraph(audit['deceasedName'], sub_style))
    if audit['memorialDates']:
        story.append(Paragraph(f"Memorial dates: {audit['memorialDates']}", sub_style))
    story.append(Paragraph(f"Generated on {date.today().strftime('%B %d, %Y')}", sub_style))

    # Summary
    story.append(Paragraph('Executive Summary', heading_style))
    story.append(_table(
        [
            ['Total Revenue', 'Cash', 'Mobile Money'],
            [_money(summary['totalRevenue']), _money(summary['cashRevenue']), _money(summary['momoRevenue'])],
        ],
        [60 * mm, 60 * mm, 60 * mm],
        alignments=['RIGHT', 'RIGHT', 'RIGHT'],
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        [
            ['Total Donors', 'Vouchers Issued', 'Estimated Guests', 'Average Donation'],
            [
                str(summary['totalDonors']),
                str(summary['totalChitsIssued']),
                str(summary['estimatedGuests']),
                _money(summary['averageDonation']),
            ],
        ],
        [45 * mm, 45 * mm, 45 * mm, 45 * mm],
        alignments=['RIGHT', 'RIGHT', 'RIGHT', 'RIGHT'],
    ))

    # Financial audit
    story.append(Paragraph('Executive Financial Audit Statement', heading_style))
    day_rows = [['Event Day', 'Date', 'Total (GH¢)', 'Donors']]
    for day in audit['dayBreakdown']:
        day_rows.append([day['day'], day['date'], _money(day['total']), str(day['donors'])])
    day_rows.append(['Grand Total', 'All Days', _money(summary['totalRevenue']), str(summary['totalDonors'])])
    story.append(_table(day_rows, [40 * mm, 55 * mm, 55 * mm, 30 * mm], alignments=[None, None, 'RIGHT', 'RIGHT']))
    story.append(Spacer(1, 6))

    attendant_rows = [['Operator Name', 'Total Entries', 'Total Amount (GH¢)']]
    for att in audit['deskAttendants']:
        attendant_rows.append([att['name'], str(att['entries']), _money(att['amount'])])
    story.append(_table(attendant_rows, [90 * mm, 45 * mm, 45 * mm], alignments=[None, 'RIGHT', 'RIGHT']))

    # Top donors
    story.append(Paragraph('Top Donors & VIP Acknowledgment List', heading_style))
    donor_rows = [['Rank', 'Donor Name', 'Amount (GH¢)', 'Phone Number', 'Type']]
    for donor in top_donors:
        donor_rows.append([
            f"#{donor['rank']}",
            donor['name'],
            _money(donor['amount']),
            donor['phone'],
            donor['type'],
        ])
    story.append(_table(donor_rows, [20 * mm, 50 * mm, 40 * mm, 45 * mm, 25 * mm], alignments=[None, None, 'RIGHT', None, None]))

    # Refreshment audit
    story.append(Paragraph('Refreshment & Catering Audit', heading_style))
    chit_rows = [['Voucher Type', 'Count', 'Percentage']]
    for item in refreshment['chitBreakdown']:
        chit_rows.append([item['type'], str(item['count']), f"{item['percentage']}%"])
    story.append(_table(chit_rows, [80 * mm, 50 * mm, 50 * mm], alignments=[None, 'RIGHT', 'RIGHT']))
    story.append(Spacer(1, 6))

    daily_header = ['Event Day'] + [VOUCHER_DISPLAY_NAMES[vt] for vt in VOUCHER_TYPES] + ['Daily Total']
    daily_rows = [daily_header]
    for day in refreshment['dailyIssuance']:
        daily_rows.append([
            day['day'],
            *[str(day[vt]) for vt in VOUCHER_TYPES],
            str(sum(day[vt] for vt in VOUCHER_TYPES)),
        ])
    daily_rows.append([
        'Grand Total',
        *[str(sum(d[vt] for d in refreshment['dailyIssuance'])) for vt in VOUCHER_TYPES],
        str(summary['totalChitsIssued']),
    ])
    daily_col_width = 35 * mm
    story.append(_table(
        daily_rows,
        [daily_col_width] * len(daily_header),
        alignments=['CENTER'] * len(daily_header),
    ))

    doc.build(story)
    return buffer.getvalue()


class ReportPDFExportView(APIView):
    """Download the complete family audit as a PDF."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = compute_report(get_event_id(request))
        pdf_bytes = build_pdf(data)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="family-audit-report-{date.today().isoformat()}.pdf"'
        )
        return response


class ReportCSVExportView(APIView):
    """Download the raw donor/chit data as an Excel-friendly CSV."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        event_id = get_event_id(request)
        donors_list, chits_list, deployment = get_querysets(event_id)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['SolaceHub - Raw Data Export'])
        writer.writerow([
            'Deceased',
            deployment.deceased_name if deployment else '',
        ])
        if deployment:
            writer.writerow(['Memorial dates', f"{deployment.start_date} - {deployment.end_date}"])
        writer.writerow(['Generated on', date.today().isoformat()])
        writer.writerow([])

        writer.writerow(['SECTION: DONORS'])
        writer.writerow([
            'Receipt ID',
            'Donor Name',
            'Phone Number',
            'Amount (GH¢)',
            'Method',
            'Event Day',
            'Date',
            'Time',
            'Operator',
        ])
        for d in donors_list:
            writer.writerow([
                d.receipt_id,
                d.donor_name,
                d.phone_number,
                float(d.amount or 0),
                d.method,
                d.event_day,
                d.date.isoformat() if d.date else '',
                d.time.isoformat() if d.time else '',
                get_operator_name(d),
            ])
        writer.writerow([])

        writer.writerow(['SECTION: CHITS'])
        writer.writerow([
            'Security Code',
            'Representative Name',
            'Voucher Type',
            'Number of People',
            'Event Day',
            'Date',
            'Time',
            'Operator',
        ])
        for c in chits_list:
            writer.writerow([
                c.security_code,
                c.representative_name,
                VOUCHER_DISPLAY_NAMES.get(c.voucher_type, c.voucher_type or ''),
                c.number_of_people,
                c.event_day,
                c.date.isoformat() if c.date else '',
                c.time.isoformat() if c.time else '',
                get_operator_name(c),
            ])
        writer.writerow([])

        csv_content = '\ufeff' + output.getvalue()
        response = HttpResponse(csv_content, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = (
            f'attachment; filename="solacehub-raw-data-{date.today().isoformat()}.csv"'
        )
        return response
