from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Donor
from .serializers import DonorSerializer


def get_event_id(request):
    """Read the active event id from the X-Event-ID header or query param."""
    return (
        request.META.get('HTTP_X_EVENT_ID')
        or request.query_params.get('event_id')
    )


class DonorListCreateView(generics.ListCreateAPIView):
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Donor.objects.filter(event_id=event_id)
        return Donor.objects.all()

    def perform_create(self, serializer):
        event_id = get_event_id(self.request)
        serializer.save(event_id=event_id, logged_by=self.request.user)


class DonorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Donor.objects.filter(event_id=event_id)
        return Donor.objects.all()
