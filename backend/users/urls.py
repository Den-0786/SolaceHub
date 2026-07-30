from django.urls import path
from .views import login_view, logout_view, change_password_view, UserListView, CredentialListView, CredentialDetailView, update_credential_view

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('change-password/', change_password_view, name='change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('credentials/', CredentialListView.as_view(), name='credential-list'),
    path('credentials/<int:pk>/', CredentialDetailView.as_view(), name='credential-detail'),
    path('credentials/update/', update_credential_view, name='credential-update'),
]
