"""Helpers for the permanent per-event ledger numbering.

Each donor and chit row gets an ``entry_number`` that never changes once
assigned, so printed receipts and exported lists stay in the same order even
after a record is deleted or its date is corrected.
"""

from threading import local

from django.db import transaction
from django.db.models import F, Max

# Rows are parked this far out of range before being renumbered back down, so
# that lowering them one at a time can never collide with a number still in use.
_PARKING_OFFSET = 1_000_000

_pending = local()


def next_entry_number(model, event_id):
    """Return the next free ``entry_number`` for ``event_id``.

    The Event row is locked for the duration of the transaction so two
    simultaneous submissions cannot claim the same number. The unique
    constraint on (event, entry_number) is the backstop; this lock is what
    keeps us from ever hitting it in normal operation.
    """
    from events.models import Event

    with transaction.atomic():
        if event_id:
            Event.objects.select_for_update().filter(pk=event_id).first()
        last = (
            model.objects.filter(event_id=event_id)
            .aggregate(highest=Max('entry_number'))['highest']
        )
        return (last or 0) + 1


def renumber_event(model, event_id):
    """Renumber an event's rows to a contiguous 1..N after a deletion.

    Deleting entry 10 makes 11 the new entry 10, and so on, so the ledger
    never shows a hole. Callers must be inside a transaction so the renumber
    is rolled back with the delete if anything fails.
    """
    with transaction.atomic():
        row_ids = list(
            model.objects.filter(event_id=event_id)
            .order_by(F('entry_number').asc(nulls_last=True), 'date', 'time', 'id')
            .values_list('id', flat=True)
        )
        if not row_ids:
            return

        model.objects.filter(id__in=row_ids).update(
            entry_number=F('entry_number') + _PARKING_OFFSET
        )
        model.objects.bulk_update(
            [
                model(id=pk, entry_number=position)
                for position, pk in enumerate(row_ids, start=1)
            ],
            ['entry_number'],
            batch_size=500,
        )


def schedule_renumber(model, event_id):
    """Queue a refill to run once, after the current transaction commits.

    Deleting rows fires ``post_delete`` per row, and deleting an Event cascades
    through every Donor it owns. Renumbering inside the signal would therefore
    either run far too often or run against a half-deleted set. Deferring to
    ``on_commit`` and collapsing duplicate requests means the refill always sees
    the finished ledger, and a rolled-back delete schedules nothing at all.
    """
    if not event_id:
        return

    scheduled = getattr(_pending, 'events', None)
    if scheduled is None:
        scheduled = _pending.events = set()
    key = (model.__name__, str(event_id))
    if key in scheduled:
        return
    scheduled.add(key)

    def run():
        try:
            renumber_event(model, event_id)
        finally:
            scheduled.discard(key)

    transaction.on_commit(run)
