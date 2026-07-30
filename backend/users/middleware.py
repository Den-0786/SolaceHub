from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse
from users.models import Credential
from deployments.models import SessionTimer


class SessionExpiryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip session check for login endpoint and public endpoints
        if request.path in ['/api/auth/login/', '/api/auth/logout/'] or not request.path.startswith('/api/'):
            return self.get_response(request)

        # Check if there's an active session timer
        try:
            # Get the most recent active session timer
            active_session = SessionTimer.objects.filter(is_active=True).first()
            
            if active_session:
                # Calculate expiry time
                expiry_time = active_session.start_timestamp + timedelta(
                    days=active_session.duration_days,
                    hours=active_session.duration_hours
                )
                
                # Check if session has expired
                if timezone.now() > expiry_time:
                    # Session has expired - process expiry
                    self._process_expired_session(active_session)
                    
                    # Return 401 response for API requests
                    if request.path.startswith('/api/'):
                        return JsonResponse(
                            {
                                'error': 'Session expired',
                                'message': 'Your session has expired. Please contact the system administrator.'
                            },
                            status=401
                        )
        except Exception as e:
            # Log error but don't break the request
            print(f"Session expiry check error: {str(e)}")

        # Check if client credentials have session_expired flag set
        try:
            client_cred = Credential.objects.filter(credential_type='client').first()
            if client_cred and client_cred.session_expired:
                # Return 401 response for API requests
                if request.path.startswith('/api/'):
                    return JsonResponse(
                        {
                            'error': 'Session expired',
                            'message': 'Your session has expired. Please contact the system administrator.'
                        },
                        status=401
                    )
        except Exception as e:
            print(f"Client session check error: {str(e)}")

        response = self.get_response(request)
        return response

    def _process_expired_session(self, session):
        """Process expired session by deleting credentials and setting flags"""
        try:
            # Delete desk operator credentials
            desk_operator_cred = Credential.objects.filter(
                credential_type='desk_operator'
            ).first()
            if desk_operator_cred:
                desk_operator_cred.delete()
            
            # Set session_expired flag for client credentials
            client_cred = Credential.objects.filter(
                credential_type='client'
            ).first()
            if client_cred:
                client_cred.session_expired = True
                client_cred.save()
            
            # Mark session as inactive
            session.is_active = False
            session.save()
            
        except Exception as e:
            print(f"Error processing expired session: {str(e)}")
