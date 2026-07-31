from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse
from rest_framework.authtoken.models import Token
from users.models import Credential
from deployments.utils import expire_deployment_session
from deployments.models import SessionTimer


def _get_event_id(request):
    return request.META.get('HTTP_X_EVENT_ID') or request.GET.get('event_id')


class SessionExpiryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip session check for login endpoint and public endpoints
        if request.path in ['/api/auth/login/', '/api/auth/logout/'] or not request.path.startswith('/api/'):
            return self.get_response(request)

        event_id = _get_event_id(request)

        # Check if there's an active session timer for this event
        try:
            active_sessions = SessionTimer.objects.filter(is_active=True)
            if event_id:
                active_sessions = active_sessions.filter(event_id=event_id)
            active_session = active_sessions.first()

            if active_session:
                expiry_time = active_session.start_timestamp + timedelta(
                    days=active_session.duration_days,
                    hours=active_session.duration_hours
                )

                if timezone.now() > expiry_time:
                    # Session has expired - process expiry
                    self._process_expired_session(active_session)

                    # Owner / master fallback can still use the system; everyone else is blocked
                    if self._get_user_role(request) != 'owner':
                        return JsonResponse(
                            {
                                'error': 'Session expired',
                                'message': 'Your session has expired. Please contact the system administrator.'
                            },
                            status=401
                        )
        except Exception as e:
            print(f"Session expiry check error: {str(e)}")

        # Check if client credentials for this event have session_expired flag set
        try:
            client_creds = Credential.objects.filter(credential_type='client')
            if event_id:
                client_creds = client_creds.filter(event_id=event_id)
            client_cred = client_creds.first()

            if client_cred and client_cred.session_expired:
                # Owner / master fallback can still operate during client lockout
                if self._get_user_role(request) != 'owner':
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

    def _get_user_role(self, request):
        """Read the DRF token header and return the linked user's role."""
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if auth.startswith('Token '):
            token_key = auth.split(' ', 1)[1] if ' ' in auth else ''
            try:
                token = Token.objects.select_related('user').get(key=token_key)
                return token.user.role
            except (Token.DoesNotExist, ValueError):
                pass
        return None

    def _process_expired_session(self, session):
        """Backup then clear all client/operator data and lock credentials for the event."""
        try:
            target = session.event or (session.deployment.event if session.deployment else None)
            if target:
                expire_deployment_session(target)
        except Exception as e:
            print(f"Error processing expired session: {str(e)}")
