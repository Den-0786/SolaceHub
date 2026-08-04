from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging
from .models import Deployment, Hardware, SessionTimer, Backup
from .serializers import (
    DeploymentSerializer,
    HardwareSerializer,
    SessionTimerSerializer,
    BackupSerializer,
)
from .utils import expire_deployment_session

logger = logging.getLogger(__name__)


def get_event_id(request):
    return (
        request.META.get('HTTP_X_EVENT_ID')
        or request.query_params.get('event_id')
    )


class DeploymentListCreateView(generics.ListCreateAPIView):
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Deployment.objects.filter(event_id=event_id)
        return Deployment.objects.all()

    def perform_create(self, serializer):
        event_id = get_event_id(self.request)
        serializer.save(event_id=event_id)


class DeploymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Deployment.objects.filter(event_id=event_id)
        return Deployment.objects.all()


class SessionTimerDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SessionTimerSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        deployment_id = self.kwargs.get('deployment_id')
        event_id = get_event_id(self.request)

        try:
            if event_id:
                return SessionTimer.objects.get(
                    deployment_id=deployment_id,
                    event_id=event_id
                )
            return SessionTimer.objects.get(deployment_id=deployment_id)
        except SessionTimer.DoesNotExist:
            deployment = Deployment.objects.get(id=deployment_id)
            return SessionTimer.objects.create(
                deployment=deployment,
                event_id=event_id,
                start_timestamp=timezone.now(),
                duration_days=0,
                duration_hours=0,
                is_active=False
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class HardwareListCreateView(generics.ListCreateAPIView):
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Hardware.objects.filter(event_id=event_id)
        return Hardware.objects.all()

    def perform_create(self, serializer):
        event_id = get_event_id(self.request)
        serializer.save(event_id=event_id)


class HardwareDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Hardware.objects.filter(event_id=event_id)
        return Hardware.objects.all()


class BackupListView(generics.ListAPIView):
    serializer_class = BackupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Backup.objects.filter(event_id=event_id)
        return Backup.objects.all()


class DeploymentBackupListView(generics.ListAPIView):
    serializer_class = BackupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = get_event_id(self.request)
        if event_id:
            return Backup.objects.filter(event_id=event_id)
        return Backup.objects.all()


class DeploymentBackupCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, deployment_id):
        event_id = get_event_id(request)
        try:
            if event_id:
                deployment = Deployment.objects.get(id=deployment_id, event_id=event_id)
            else:
                deployment = Deployment.objects.get(id=deployment_id)
        except Deployment.DoesNotExist:
            return Response({'error': 'Deployment not found'}, status=status.HTTP_404_NOT_FOUND)

        if not deployment.event:
            return Response({'error': 'Deployment is not linked to an event'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = expire_deployment_session(deployment.event)
        except Exception as e:
            logger.exception("Backup creation failed for deployment %s", deployment_id)
            return Response(
                {'error': f'Backup creation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_data = {
            'record_count': result['record_count'],
            'csv_data': result['csv'],
            'csv_file': BackupSerializer(result['backup']).data['csv_file'] if result['backup'] else None,
        }
        if result.get('storage_error'):
            response_data['warning'] = (
                "Live data archived and delivered, but server-side file storage failed: "
                f"{result['storage_error']}"
            )
        return Response(response_data, status=status.HTTP_201_CREATED)
