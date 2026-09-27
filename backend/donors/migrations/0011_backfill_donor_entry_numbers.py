from django.db import migrations


def backfill_entry_numbers(apps, schema_editor):
    """Assign a permanent 1..N ledger position to every existing row.

    Rows are numbered per event, in the chronological order the ledger was
    already using, so the numbering matches exactly what the family was
    reading on screen before this column existed.
    """
    for model_name in ('Donor', 'Chit'):
        model = apps.get_model('donors' if model_name == 'Donor' else 'chits', model_name)
        rows = list(
            model.objects.order_by(
                'event_id', 'date', 'time', 'id'
            ).values_list('id', 'event_id')
        )

        current_event = object()
        counter = 0
        pending = []
        for row_id, event_id in rows:
            if event_id != current_event:
                current_event = event_id
                counter = 0
            counter += 1
            pending.append(model(id=row_id, entry_number=counter))
            if len(pending) >= 500:
                model.objects.bulk_update(pending, ['entry_number'], batch_size=500)
                pending = []
        if pending:
            model.objects.bulk_update(pending, ['entry_number'], batch_size=500)


def clear_entry_numbers(apps, schema_editor):
    for app_label, model_name in (('donors', 'Donor'), ('chits', 'Chit')):
        model = apps.get_model(app_label, model_name)
        model.objects.update(entry_number=None)


class Migration(migrations.Migration):

    dependencies = [
        ('donors', '0010_alter_donor_options_donor_entry_number_and_more'),
        ('chits', '0008_alter_chit_options_chit_entry_number_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_entry_numbers, clear_entry_numbers),
    ]
