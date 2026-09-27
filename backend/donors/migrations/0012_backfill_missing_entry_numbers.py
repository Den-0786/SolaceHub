from django.db import migrations
from django.db.models import F, Max


def backfill_missing_entry_numbers(apps, schema_editor):
    """Number any row that was created before the ledger numbering shipped.

    Rows written by the older, unnumbered code path arrive with a NULL
    entry_number. They are appended after the numbered rows in chronological
    order, which is where they belong: they were the most recent entries.
    """
    for app_label, model_name in (('donors', 'Donor'), ('chits', 'Chit')):
        model = apps.get_model(app_label, model_name)

        event_ids = (
            model.objects.filter(entry_number__isnull=True)
            .values_list('event_id', flat=True)
            .distinct()
        )
        for event_id in event_ids:
            orphans = list(
                model.objects.filter(event_id=event_id, entry_number__isnull=True)
                .order_by('date', 'time', 'id')
                .values_list('id', flat=True)
            )
            if not orphans:
                continue
            highest = (
                model.objects.filter(event_id=event_id, entry_number__isnull=False)
                .aggregate(top=Max('entry_number'))['top']
                or 0
            )
            # Park first so appending cannot clash with the unique constraint.
            model.objects.filter(id__in=orphans).update(
                entry_number=F('entry_number') + 1_000_000
            )
            model.objects.bulk_update(
                [
                    model(id=pk, entry_number=highest + offset)
                    for offset, pk in enumerate(orphans, start=1)
                ],
                ['entry_number'],
                batch_size=500,
            )


def clear_missing_entry_numbers(apps, schema_editor):
    for app_label, model_name in (('donors', 'Donor'), ('chits', 'Chit')):
        model = apps.get_model(app_label, model_name)
        model.objects.filter(entry_number__gte=1_000_000).update(entry_number=None)


class Migration(migrations.Migration):

    dependencies = [
        ('donors', '0011_backfill_donor_entry_numbers'),
        ('chits', '0008_alter_chit_options_chit_entry_number_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_missing_entry_numbers, clear_missing_entry_numbers),
    ]
