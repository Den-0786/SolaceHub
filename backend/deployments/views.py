from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Deployment, Hardware, SessionTimer
from .serializers import DeploymentSerializer, HardwareSerializer, SessionTimerSerializer

class DeploymentListCreateView(generics.ListCreateAPIView):
    queryset = Deployment.objects.all()
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]

class DeploymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Deployment.objects.all()
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]

class SessionTimerDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SessionTimerSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        deployment_id = self.kwargs.get('deployment_id')
        try:
            session_timer = SessionTimer.objects.get(deployment_id=deployment_id)
            return session_timer
        except SessionTimer.DoesNotExist:
            # Create session timer if it doesn't exist
            deployment = Deployment.objects.get(id=deployment_id)
            session_timer = SessionTimer.objects.create(
                deployment=deployment,
                start_timestamp=timezone.now(),
                duration_days=0,
                duration_hours=0,
                is_active=False
            )
            return session_timer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class HardwareListCreateView(generics.ListCreateAPIView):
    queryset = Hardware.objects.all()
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticated]

class HardwareDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hardware.objects.all()
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticated]
