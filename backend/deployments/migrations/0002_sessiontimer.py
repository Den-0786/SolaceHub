# Generated migration for SessionTimer model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('deployments', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SessionTimer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_timestamp', models.DateTimeField(help_text='Session start time')),
                ('duration_days', models.IntegerField(default=0, help_text='Duration in days')),
                ('duration_hours', models.IntegerField(default=0, help_text='Duration in hours')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deployment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='session_timer', to='deployments.deployment')),
            ],
            options={
                'verbose_name': 'Session Timer',
                'verbose_name_plural': 'Session Timers',
            },
        ),
    ]
