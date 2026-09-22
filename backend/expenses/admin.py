from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'date', 'event', 'recorded_by', 'created_at']
    list_filter = ['event', 'date']
    search_fields = ['description']