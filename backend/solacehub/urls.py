from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/donors/', include('donors.urls')),
    path('api/chits/', include('chits.urls')),
    path('api/deployments/', include('deployments.urls')),
    path('api/reports/', include('reports.urls')),
]
