from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Chit
from .serializers import ChitSerializer


def get_event_id(request):
    """Read the active event id from the X-Event-ID header or query param."""
    return (
        request.META.get('HTTP_X_EVENT_ID')
        or request.query_params.get('event_id')
    )


class ChitListCreateView(generics.ListCreateAPIView):
    serializer_class = ChitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Chit.objects.filter(event_id=event_id)
        return Chit.objects.all()

    def perform_create(self, serializer):
        event_id = get_event_id(self.request)
        serializer.save(event_id=event_id, issued_by=self.request.user)


class ChitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Chit.objects.filter(event_id=event_id)
        return Chit.objects.all()
