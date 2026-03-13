from django.db import models
from django.contrib.auth.models import User


class NetWorthSnapshot(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='networth_snapshots')
    date = models.DateField()
    total_assets = models.DecimalField(max_digits=15, decimal_places=2)
    total_liabilities = models.DecimalField(max_digits=15, decimal_places=2)
    net_worth = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        unique_together = ('owner', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.owner.username} - {self.date} - {self.net_worth}"
