from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Deployment, Hardware
from .serializers import DeploymentSerializer, HardwareSerializer

class DeploymentListCreateView(generics.ListCreateAPIView):
    queryset = Deployment.objects.all()
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]

class DeploymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Deployment.objects.all()
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]

class HardwareListCreateView(generics.ListCreateAPIView):
    queryset = Hardware.objects.all()
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticated]

class HardwareDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hardware.objects.all()
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticated]
