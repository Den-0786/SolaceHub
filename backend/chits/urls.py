from django.urls import path
from .views import ChitListCreateView, ChitDetailView

urlpatterns = [
    path('', ChitListCreateView.as_view(), name='chit-list-create'),
    path('<int:pk>/', ChitDetailView.as_view(), name='chit-detail'),
]
