import uuid
import random
from django.db import models


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    family_name = models.CharField(max_length=200)
    date = models.DateField()
    access_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.family_name} – {self.title}"

    def save(self, *args, **kwargs):
        # Auto-generate access_code if not provided
        if not self.access_code and self.family_name:
            # Generate code from family name + random number
            base_code = self.family_name.upper().replace(' ', '')[:8]
            random_num = random.randint(100, 999)
            self.access_code = f"{base_code}{random_num}"
        super().save(*args, **kwargs)
