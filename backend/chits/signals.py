from django.db.models.signals import post_delete
from django.dispatch import receiver

from solacehub.ledger import schedule_renumber

from .models import Chit


@receiver(post_delete, sender=Chit)
def refill_chit_numbering(sender, instance, **kwargs):
    """Close the gap a deleted chit leaves behind.

    The actual renumbering is deferred to the end of the transaction so that
    bulk and cascading deletes are handled once, against the finished ledger.
    """
    schedule_renumber(Chit, instance.event_id)
