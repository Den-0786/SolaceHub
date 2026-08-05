from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import uuid
from .models import Donor
from .serializers import DonorSerializer


def get_event_id(request):
    """Read the active event id from the X-Event-ID header or query param."""
    return (
        request.META.get('HTTP_X_EVENT_ID')
        or request.query_params.get('event_id')
    )


def generate_receipt_id():
    """Generate a unique, human-readable receipt id like FP-260805143022-A1B2C3."""
    timestamp = timezone.now().strftime('%y%m%d%H%M%S')
    suffix = uuid.uuid4().hex[:6].upper()
    return f'FP-{timestamp}-{suffix}'


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
        receipt_id = serializer.validated_data.get('receipt_id') or generate_receipt_id()
        while Donor.objects.filter(receipt_id=receipt_id).exists():
            receipt_id = generate_receipt_id()
        serializer.save(receipt_id=receipt_id, event_id=event_id, logged_by=self.request.user)


class DonorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Donor.objects.filter(event_id=event_id)
        return Donor.objects.all()
