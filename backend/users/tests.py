from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from events.models import Event
from .models import User, Credential


class CredentialProvisioningPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.event_a = Event.objects.create(title='Family A', family_name='A', access_code='A0001', date=timezone.now().date(), is_active=True)
        self.event_b = Event.objects.create(title='Family B', family_name='B', access_code='B0001', date=timezone.now().date(), is_active=True)

        self.owner = User(username='owner', role='owner')
        self.owner.set_password('ownerpass')
        self.owner.save()
        self.owner_token = Token.objects.create(user=self.owner)

        self.admin_a = User(username='admin_a', role='client', event=self.event_a)
        self.admin_a.set_password('adminpass')
        self.admin_a.save()
        self.admin_a_token = Token.objects.create(user=self.admin_a)

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_owner_can_provision_client_credential(self):
        self.auth(self.owner_token)
        response = self.client.post(
            reverse('credential-update'),
            {
                'credential_type': 'client',
                'username': 'client_a',
                'password': 'clientpass',
                'event_id': str(self.event_a.id),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        credential = Credential.objects.get(credential_type='client', event=self.event_a)
        self.assertTrue(check_password('clientpass', credential.password_hash))

    def test_owner_cannot_provision_desk_operator(self):
        self.auth(self.owner_token)
        response = self.client.post(
            reverse('credential-update'),
            {
                'credential_type': 'desk_operator',
                'username': 'op_a',
                'password': 'oppass',
                'event_id': str(self.event_a.id),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Credential.objects.filter(credential_type='desk_operator', event=self.event_a).exists())

    def test_admin_can_provision_desk_operator_for_own_event(self):
        self.auth(self.admin_a_token)
        response = self.client.post(
            reverse('credential-update'),
            {
                'credential_type': 'desk_operator',
                'username': 'op_a',
                'desk_operator_name': 'Op One',
                'password': 'oppass',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        credential = Credential.objects.get(credential_type='desk_operator', event=self.event_a)
        self.assertEqual(credential.username, 'op_a')
        self.assertTrue(check_password('oppass', credential.password_hash))

    def test_admin_cannot_provision_credential_for_another_event(self):
        self.auth(self.admin_a_token)
        response = self.client.post(
            reverse('credential-update'),
            {
                'credential_type': 'desk_operator',
                'username': 'op_b',
                'password': 'oppass',
                'event_id': str(self.event_b.id),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        credential = Credential.objects.get(credential_type='desk_operator', event=self.event_a)
        self.assertEqual(credential.username, 'op_b')
        self.assertFalse(Credential.objects.filter(event=self.event_b, credential_type='desk_operator').exists())

    def test_admin_cannot_provision_client_credential(self):
        self.auth(self.admin_a_token)
        response = self.client.post(
            reverse('credential-update'),
            {
                'credential_type': 'client',
                'username': 'client_b',
                'password': 'clientpass',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Credential.objects.filter(credential_type='client', event=self.event_a).exists())

    def test_credential_list_scoped_to_admin_event(self):
        Credential.objects.create(
            credential_type='client', username='client_a', password_hash='x', event=self.event_a
        )
        Credential.objects.create(
            credential_type='desk_operator', username='op_b', password_hash='x', event=self.event_b
        )
        self.auth(self.admin_a_token)
        response = self.client.get(reverse('credential-list'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['credential_type'], 'client')
        self.assertEqual(data[0]['username'], 'client_a')
