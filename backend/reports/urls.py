from django.urls import path
from .views import (
    ReportListCreateView,
    ReportDetailView,
    ReportSummaryView,
    ReportPDFExportView,
    ReportCSVExportView,
)

urlpatterns = [
    path('summary/', ReportSummaryView.as_view(), name='report-summary'),
    path('export/pdf/', ReportPDFExportView.as_view(), name='report-export-pdf'),
    path('export/csv/', ReportCSVExportView.as_view(), name='report-export-csv'),
    path('', ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
]
