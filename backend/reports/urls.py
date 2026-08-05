from django.urls import path
from .views import ReportListCreateView, ReportDetailView, ReportSummaryView

urlpatterns = [
    path('summary/', ReportSummaryView.as_view(), name='report-summary'),
    path('', ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
]
