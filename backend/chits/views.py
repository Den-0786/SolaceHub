from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Chit
from .serializers import ChitSerializer

class ChitListCreateView(generics.ListCreateAPIView):
    queryset = Chit.objects.all()
    serializer_class = ChitSerializer
    permission_classes = [IsAuthenticated]

class ChitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Chit.objects.all()
    serializer_class = ChitSerializer
    permission_classes = [IsAuthenticated]
