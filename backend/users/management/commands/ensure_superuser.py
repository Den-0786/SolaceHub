import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Ensure superuser exists'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv('ADMIN_USERNAME', 'admin')
        password = os.getenv('ADMIN_PASSWORD')
        email = os.getenv('ADMIN_EMAIL', 'admin@solacehub.com')
        
        if not password:
            self.stdout.write(self.style.WARNING('ADMIN_PASSWORD not set in environment variables'))
            return
            
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS('Superuser already exists'))
        else:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                role='owner',
                phone='+233000000000'
            )
            self.stdout.write(self.style.SUCCESS('Superuser created successfully'))
