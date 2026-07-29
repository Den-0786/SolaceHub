from django.urls import path
from .views import DonorListCreateView, DonorDetailView

urlpatterns = [
    path('', DonorListCreateView.as_view(), name='donor-list-create'),
    path('<int:pk>/', DonorDetailView.as_view(), name='donor-detail'),
]
