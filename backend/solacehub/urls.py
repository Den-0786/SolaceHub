from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/donors/', include('donors.urls')),
    path('api/chits/', include('chits.urls')),
    path('api/deployments/', include('deployments.urls')),
    path('api/events/', include('events.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Serve uploaded media (local fallback storage) in production.
    urlpatterns.append(
        path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT})
    )
