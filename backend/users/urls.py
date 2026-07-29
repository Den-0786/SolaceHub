from django.urls import path
from .views import login_view, logout_view, change_password_view, UserListView

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('change-password/', change_password_view, name='change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
]
