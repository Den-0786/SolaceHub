from django.urls import path
from .views import (
    ReportListCreateView,
    ReportDetailView,
    ReportSummaryView,
    ReportPDFExportView,
    ReportCSVExportView,
    ReportDonorListExportView,
)

urlpatterns = [
    path('summary/', ReportSummaryView.as_view(), name='report-summary'),
    path('export/pdf/', ReportPDFExportView.as_view(), name='report-export-pdf'),
    path('export/csv/', ReportCSVExportView.as_view(), name='report-export-csv'),
    path('export/donor-list/', ReportDonorListExportView.as_view(), name='report-export-donor-list'),
    path('', ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
]
