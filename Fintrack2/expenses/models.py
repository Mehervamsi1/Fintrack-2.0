from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now


class Expense(models.Model):
    amount = models.FloatField()
    date = models.DateField(default=now)
    description = models.TextField()
    owner = models.ForeignKey(to=User, on_delete=models.CASCADE)
    category = models.CharField(max_length=266)

    def __str__(self):
        return self.category

    class Meta:
        ordering = ['-date']


class Category(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='expense_categories')

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name
