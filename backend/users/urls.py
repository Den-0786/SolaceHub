from django.urls import path
from .views import (
    login_view, logout_view, change_password_view, UserListView,
    TenantListCreateView, TenantDetailView,
    TenantCredentialListCreateView, TenantCredentialDetailView
)

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('change-password/', change_password_view, name='change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('tenants/', TenantListCreateView.as_view(), name='tenant-list-create'),
    path('tenants/<int:pk>/', TenantDetailView.as_view(), name='tenant-detail'),
    path('tenants/<int:tenant_id>/credentials/', TenantCredentialListCreateView.as_view(), name='tenant-credential-list-create'),
    path('credentials/<int:pk>/', TenantCredentialDetailView.as_view(), name='tenant-credential-detail'),
]
