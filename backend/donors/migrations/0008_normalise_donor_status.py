from django.db import migrations

# Every donor row created before this point carried status='PRINTED' purely
# because that was the model default at insert time. No code path ever set it,
# so the value never reflected whether a receipt actually printed. Relabel those
# rows to the honest 'RECORDED' state so the ledger does not assert something
# that was never verified.


def normalise_printed_to_recorded(apps, schema_editor):
    Donor = apps.get_model('donors', 'Donor')
    Donor.objects.filter(status='PRINTED').update(status='RECORDED')


def restore_printed(apps, schema_editor):
    Donor = apps.get_model('donors', 'Donor')
    Donor.objects.filter(status='RECORDED').update(status='PRINTED')


class Migration(migrations.Migration):

    dependencies = [
        ('donors', '0007_alter_donor_status'),
    ]

    operations = [
        migrations.RunPython(normalise_printed_to_recorded, restore_printed),
    ]
