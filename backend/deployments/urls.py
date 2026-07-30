from django.urls import path
from .views import DeploymentListCreateView, DeploymentDetailView, HardwareListCreateView, HardwareDetailView, SessionTimerDetailView

urlpatterns = [
    path('', DeploymentListCreateView.as_view(), name='deployment-list-create'),
    path('<int:pk>/', DeploymentDetailView.as_view(), name='deployment-detail'),
    path('<int:deployment_id>/session-timer/', SessionTimerDetailView.as_view(), name='session-timer-detail'),
    path('hardware/', HardwareListCreateView.as_view(), name='hardware-list-create'),
    path('hardware/<int:pk>/', HardwareDetailView.as_view(), name='hardware-detail'),
]
