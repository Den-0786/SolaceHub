from django.http import JsonResponse
from rest_framework.authtoken.models import Token
from users.models import Credential
from deployments.utils import expire_deployment_session, find_expired_session


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

        # Fall back to the token user's event when no X-Event-ID / event_id is sent.
        auth_context = self._get_auth_context(request)
        if not event_id and auth_context and auth_context.get('event_id'):
            event_id = auth_context['event_id']

        # Block based on the computed timer expiry (even if the timer was already
        # marked inactive), and only run the one-time lock/backup when the timer
        # is still active so the backup is not recreated on every request.
        try:
            expired_session = find_expired_session(event_id)
            if expired_session:
                if expired_session.is_active:
                    self._process_expired_session(expired_session)

                # Owner / master fallback can still use the system; everyone else is blocked
                if (auth_context or {}).get('role') != 'owner':
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

    def _get_auth_context(self, request):
        """Read the DRF token header and return the linked user's role + event."""
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if auth.startswith('Token '):
            token_key = auth.split(' ', 1)[1] if ' ' in auth else ''
            try:
                token = Token.objects.select_related('user').get(key=token_key)
                return {
                    'role': token.user.role,
                    'event_id': str(token.user.event_id) if token.user.event_id else None,
                }
            except (Token.DoesNotExist, ValueError):
                pass
        return None

    def _get_user_role(self, request):
        context = self._get_auth_context(request)
        return context.get('role') if context else None

    def _process_expired_session(self, session):
        """Backup then clear all client/operator data and lock credentials for the event."""
        try:
            target = session.event or (session.deployment.event if session.deployment else None)
            if target:
                expire_deployment_session(target)
        except Exception as e:
            print(f"Error processing expired session: {str(e)}")
