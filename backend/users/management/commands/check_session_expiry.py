from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import Credential
from deployments.models import SessionTimer


class Command(BaseCommand):
    help = 'Check for expired sessions and delete credentials, set session_expired flag'

    def handle(self, *args, **options):
        self.stdout.write('Checking for expired sessions...')
        
        # Get all active session timers
        active_sessions = SessionTimer.objects.filter(is_active=True)
        
        expired_sessions = []
        current_time = timezone.now()
        
        for session in active_sessions:
            # Calculate expiry time
            expiry_time = session.start_timestamp + timedelta(
                days=session.duration_days,
                hours=session.duration_hours
            )
            
            # Check if session has expired
            if current_time > expiry_time:
                expired_sessions.append(session)
                self.stdout.write(f'Expired session found: {session.deployment.title}')
        
        if not expired_sessions:
            self.stdout.write('No expired sessions found.')
            return
        
        # Process expired sessions
        for session in expired_sessions:
            try:
                # Delete desk operator credentials
                desk_operator_cred = Credential.objects.filter(
                    credential_type='desk_operator'
                ).first()
                if desk_operator_cred:
                    desk_operator_cred.delete()
                    self.stdout.write(f'Deleted desk operator credentials for {session.deployment.title}')
                
                # Set session_expired flag for client credentials
                client_cred = Credential.objects.filter(
                    credential_type='client'
                ).first()
                if client_cred:
                    client_cred.session_expired = True
                    client_cred.save()
                    self.stdout.write(f'Set session_expired flag for client credentials in {session.deployment.title}')
                
                # Mark session as inactive
                session.is_active = False
                session.save()
                
                self.stdout.write(self.style.SUCCESS(f'Successfully processed expired session: {session.deployment.title}'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing session {session.deployment.title}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'Processed {len(expired_sessions)} expired session(s)'))
