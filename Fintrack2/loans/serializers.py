from rest_framework import serializers
from .models import Loan, LoanPayment


class LoanPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanPayment
        fields = [
            'id', 'loan', 'amount', 'principal_component',
            'interest_component', 'payment_date', 'notes', 'created_at',
        ]
        read_only_fields = ['created_at']


class LoanSerializer(serializers.ModelSerializer):
    loan_type_display = serializers.CharField(source='get_loan_type_display', read_only=True)
    amount_paid = serializers.FloatField(read_only=True)
    completion_percentage = serializers.FloatField(read_only=True)
    total_payments = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            'id', 'name', 'loan_type', 'loan_type_display',
            'principal_amount', 'outstanding_balance', 'interest_rate',
            'emi_amount', 'start_date', 'end_date', 'lender', 'notes',
            'amount_paid', 'completion_percentage', 'total_payments',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_payments(self, obj):
        return obj.payments.count()
