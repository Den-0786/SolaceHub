from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Report
from .serializers import ReportSerializer


def get_event_id(request):
    """Read the active event id from the X-Event-ID header or query param."""
    return (
        request.META.get('HTTP_X_EVENT_ID')
        or request.query_params.get('event_id')
    )


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Report.objects.filter(event_id=event_id)
        return Report.objects.all()

    def perform_create(self, serializer):
        event_id = get_event_id(self.request)
        serializer.save(event_id=event_id)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Report.objects.filter(event_id=event_id)
        return Report.objects.all()
