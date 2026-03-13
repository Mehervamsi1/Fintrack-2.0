from django.db import models
from django.contrib.auth.models import User


class AssetCategory(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='briefcase')

    class Meta:
        verbose_name_plural = 'Asset Categories'

    def __str__(self):
        return self.name


class Asset(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    category = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    name = models.CharField(max_length=255)
    ticker_symbol = models.CharField(max_length=20, blank=True, null=True)
    quantity = models.DecimalField(max_digits=15, decimal_places=4, default=1)
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2)
    current_price = models.DecimalField(max_digits=15, decimal_places=2)
    manual_current_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    purchase_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    @property
    def current_value(self):
        if self.manual_current_value:
            return float(self.manual_current_value)
        return float(self.quantity) * float(self.current_price)

    @property
    def cost_basis(self):
        return float(self.quantity) * float(self.purchase_price)

    @property
    def gain_loss(self):
        return self.current_value - self.cost_basis

    @property
    def gain_loss_percentage(self):
        cost = self.cost_basis
        if cost == 0:
            return 0
        return ((self.current_value - cost) / cost) * 100

    class Meta:
        ordering = ['-updated_at']


class AssetPriceHistory(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='price_history')
    price = models.DecimalField(max_digits=15, decimal_places=2)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.asset.name} - {self.price} @ {self.recorded_at}"
