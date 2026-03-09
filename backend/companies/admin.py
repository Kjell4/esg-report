from django.contrib import admin
from .models import Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'org_type', 'region', 'industry', 'is_active']
    list_filter = ['org_type', 'region', 'industry', 'is_active']
    search_fields = ['name']
