from django.db import models
from django.contrib.auth.models import User


class Loan(models.Model):
    LOAN_TYPES = [
        ('home', 'Home Loan'),
        ('car', 'Car Loan'),
        ('personal', 'Personal Loan'),
        ('education', 'Education Loan'),
        ('credit_card', 'Credit Card'),
        ('business', 'Business Loan'),
        ('other', 'Other'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    name = models.CharField(max_length=255)
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    principal_amount = models.DecimalField(max_digits=15, decimal_places=2)
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    emi_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    lender = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.get_loan_type_display()}"

    @property
    def amount_paid(self):
        return float(self.principal_amount) - float(self.outstanding_balance)

    @property
    def completion_percentage(self):
        if float(self.principal_amount) == 0:
            return 0
        return (self.amount_paid / float(self.principal_amount)) * 100

    class Meta:
        ordering = ['-updated_at']


class LoanPayment(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    principal_component = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    interest_component = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payment_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.loan.name} - {self.amount} on {self.payment_date}"
