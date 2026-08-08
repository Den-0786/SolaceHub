from django.core.management.base import BaseCommand
from deployments.models import SessionTimer
from deployments.utils import event_session_expired, expire_deployment_session


class Command(BaseCommand):
    help = 'Check for expired sessions, lock client credentials, and delete desk operator credentials'

    def handle(self, *args, **options):
        self.stdout.write('Checking for expired sessions...')

        expired_sessions = []
        for session in SessionTimer.objects.filter(is_active=True):
            if event_session_expired(timer=session):
                expired_sessions.append(session)
                self.stdout.write(f'Expired session found: {session.deployment.title}')

        if not expired_sessions:
            self.stdout.write('No expired sessions found.')
            return

        # Process expired sessions
        for session in expired_sessions:
            event = session.event or (session.deployment.event if session.deployment else None)
            if event is None:
                self.stdout.write(self.style.WARNING(f'Skipping session #{session.id}: no linked event'))
                continue

            try:
                # expire_deployment_session backs up data, sets the event's
                # client credential session_expired=True, deletes the event's
                # desk-operator credentials, and deactivates the timer.
                expire_deployment_session(event)
                self.stdout.write(self.style.SUCCESS(f'Successfully processed expired session: {session.deployment.title}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing session {session.deployment.title}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'Processed {len(expired_sessions)} expired session(s)'))
