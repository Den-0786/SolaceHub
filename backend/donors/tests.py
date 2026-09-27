"""Tests for the permanent per-event ledger numbering.

These run against a throwaway test database, never the live event data.
"""

import datetime as dt
import uuid

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from chits.models import Chit
from deployments.models import Deployment
from donors.models import Donor
from events.models import Event

User = get_user_model()


# Production forces HTTPS, which 301-redirects the plain-HTTP test client.
@override_settings(SECURE_SSL_REDIRECT=False)
class LedgerTestCase(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title='Memorial',
            family_name='Awoonor',
            date=dt.date(2026, 9, 26),
        )
        self.deployment = Deployment.objects.create(
            event=self.event,
            venue='Community Centre',
            client='Awoonor Family',
            phone='+233000000000',
            start_date=dt.date(2026, 9, 26),
            end_date=dt.date(2026, 9, 28),
            deceased_name='Kofi Awoonor',
        )
        # Created directly rather than via create_user, which hardcodes an
        # email kwarg this project's User model does not have.
        self.user = User.objects.create(
            username=f'op{uuid.uuid4().hex[:8]}',
            event=self.event,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def add_donors(self, count, start=1):
        """Create donors straight through the API so numbering is exercised."""
        made = []
        for i in range(start, start + count):
            response = self.client.post(
                '/api/donors/',
                {
                    'donor_name': f'Donor {i}',
                    'phone_number': '+233000000000',
                    'amount': '10.00',
                    'method': 'Cash',
                    'event_day': 1,
                    'time': f'{8 + (i % 10):02d}:00:00',
                },
                HTTP_X_EVENT_ID=str(self.event.id),
            )
            self.assertEqual(response.status_code, 201, response.data)
            made.append(response.data)
        return made

    def numbers(self):
        return sorted(Donor.objects.values_list('entry_number', flat=True))

    def contiguous(self):
        nums = self.numbers()
        return nums == list(range(1, len(nums) + 1))

    def run_delete(self, operation):
        """Run a delete and let its deferred renumber callbacks fire.

        ``TestCase`` wraps each test in a transaction that is rolled back, and
        Django skips ``on_commit`` callbacks in that case. Production requests
        are not wrapped, so the callback does run there. Executing them
        explicitly is what makes the test match real behaviour.
        """
        with self.captureOnCommitCallbacks(execute=True):
            operation()


class NumberingOnCreateTests(LedgerTestCase):
    def test_numbers_start_at_one_and_increment(self):
        self.add_donors(5)
        self.assertEqual(self.numbers(), [1, 2, 3, 4, 5])

    def test_number_is_returned_in_the_response(self):
        created = self.add_donors(3)
        self.assertEqual([row['entry_number'] for row in created], [1, 2, 3])

    def test_number_is_not_client_settable(self):
        response = self.client.post(
            '/api/donors/',
            {
                'donor_name': 'Sneaky',
                'phone_number': '+233000000000',
                'amount': '10.00',
                'method': 'Cash',
                'event_day': 1,
                'time': '09:00:00',
                'entry_number': 99,
            },
            HTTP_X_EVENT_ID=str(self.event.id),
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['entry_number'], 1)

    def test_each_event_numbers_independently(self):
        self.add_donors(3)
        other = Event.objects.create(
            title='Other', family_name='B', date=dt.date(2026, 9, 26)
        )
        with transaction.atomic():
            Donor.objects.create(
                donor_name='Elsewhere',
                phone_number='+233000000000',
                amount='10.00',
                receipt_id='OTHER-1',
                time=dt.time(9, 0),
                method='Cash',
                event_day=1,
                event=other,
                entry_number=1,
            )
        self.assertEqual(
            Donor.objects.filter(event=other).count(), 1
        )
        self.assertEqual(Donor.objects.filter(event=other).first().entry_number, 1)

    def test_duplicate_number_in_one_event_is_rejected(self):
        self.add_donors(2)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Donor.objects.create(
                    donor_name='Clash',
                    phone_number='+233000000000',
                    amount='10.00',
                    receipt_id='CLASH-1',
                    time=dt.time(9, 0),
                    method='Cash',
                    event_day=1,
                    event=self.event,
                    entry_number=1,
                )

    def test_backdating_is_still_refused_on_create(self):
        response = self.client.post(
            '/api/donors/',
            {
                'donor_name': 'Backdated',
                'phone_number': '+233000000000',
                'amount': '10.00',
                'method': 'Cash',
                'event_day': 1,
                'time': '09:00:00',
                'date': '2020-01-01',
            },
            HTTP_X_EVENT_ID=str(self.event.id),
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertNotEqual(response.data['date'], '2020-01-01')


class RefillOnDeleteTests(LedgerTestCase):
    def test_deleting_the_middle_refills_the_gap(self):
        self.add_donors(6)
        names = dict(Donor.objects.values_list('entry_number', 'donor_name'))
        successor = names[4]

        self.run_delete(lambda: Donor.objects.get(entry_number=3).delete())

        self.assertEqual(Donor.objects.count(), 5)
        self.assertTrue(self.contiguous(), self.numbers())
        after = dict(Donor.objects.values_list('entry_number', 'donor_name'))
        self.assertEqual(after[3], successor)

    def test_delete_through_the_api_refills(self):
        self.add_donors(4)
        target = Donor.objects.get(entry_number=2)

        self.run_delete(
            lambda: self.client.delete(
                f'/api/donors/{target.id}/', HTTP_X_EVENT_ID=str(self.event.id)
            )
        )

        self.assertEqual(Donor.objects.count(), 3)
        self.assertTrue(self.contiguous(), self.numbers())

    def test_deleting_several_at_once_refills(self):
        self.add_donors(8)
        self.run_delete(lambda: Donor.objects.filter(entry_number__in=[2, 4, 6]).delete())

        self.assertEqual(Donor.objects.count(), 5)
        self.assertTrue(self.contiguous(), self.numbers())

    def test_deleting_the_newest_leaves_no_gap(self):
        self.add_donors(4)
        self.run_delete(
            lambda: Donor.objects.order_by('-entry_number').first().delete()
        )

        self.assertTrue(self.contiguous(), self.numbers())

    def test_numbering_continues_after_a_deletion(self):
        self.add_donors(5)
        self.run_delete(lambda: Donor.objects.get(entry_number=2).delete())

        self.add_donors(1, start=99)

        self.assertEqual(Donor.objects.count(), 5)
        self.assertTrue(self.contiguous(), self.numbers())
        self.assertEqual(max(self.numbers()), 5)

    def test_rolled_back_delete_leaves_numbering_untouched(self):
        self.add_donors(5)
        before = self.numbers()

        with self.captureOnCommitCallbacks(execute=True):
            with self.assertRaises(RuntimeError):
                with transaction.atomic():
                    Donor.objects.get(entry_number=2).delete()
                    raise RuntimeError('abort')

        self.assertEqual(self.numbers(), before)

    def test_cascade_deleting_the_event_does_not_explode(self):
        self.add_donors(4)
        self.run_delete(
            lambda: Event.objects.filter(pk=self.event.pk).delete()
        )
        self.assertEqual(Donor.objects.count(), 0)


class ChitNumberingTests(LedgerTestCase):
    def add_chits(self, count):
        for i in range(count):
            Chit.objects.create(
                security_code=f'CODE-{i}',
                representative_name=f'Rep {i}',
                number_of_people=2,
                voucher_type='full_package',
                event_day=1,
                time=dt.time(9, i),
                event=self.event,
                entry_number=i + 1,
            )

    def test_deleting_a_chit_refills_its_numbering(self):
        self.add_chits(4)
        self.run_delete(lambda: Chit.objects.get(entry_number=2).delete())

        nums = sorted(Chit.objects.values_list('entry_number', flat=True))
        self.assertEqual(nums, [1, 2, 3])
