from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Donor
from .serializers import DonorSerializer

class DonorListCreateView(generics.ListCreateAPIView):
    queryset = Donor.objects.all()
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]

class DonorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Donor.objects.all()
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]
