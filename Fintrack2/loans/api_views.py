from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Loan, LoanPayment
from .serializers import LoanSerializer, LoanPaymentSerializer


class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer

    def get_queryset(self):
        return Loan.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        loans = self.get_queryset()
        total_principal = loans.aggregate(
            total=Sum('principal_amount')
        )['total'] or 0
        total_outstanding = loans.aggregate(
            total=Sum('outstanding_balance')
        )['total'] or 0
        total_emi = loans.aggregate(
            total=Sum('emi_amount')
        )['total'] or 0

        by_type = {}
        for loan in loans:
            lt = loan.get_loan_type_display()
            if lt not in by_type:
                by_type[lt] = {'balance': 0, 'count': 0}
            by_type[lt]['balance'] += float(loan.outstanding_balance)
            by_type[lt]['count'] += 1

        breakdown = [
            {'type': lt, 'balance': round(data['balance'], 2), 'count': data['count']}
            for lt, data in by_type.items()
        ]

        return Response({
            'total_principal': float(total_principal),
            'total_outstanding': float(total_outstanding),
            'total_paid': float(total_principal) - float(total_outstanding),
            'monthly_emi': float(total_emi),
            'loan_count': loans.count(),
            'breakdown': breakdown,
        })

    @action(detail=True, methods=['get', 'post'])
    def payments(self, request, pk=None):
        loan = self.get_object()

        if request.method == 'GET':
            payments = loan.payments.all()
            serializer = LoanPaymentSerializer(payments, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            serializer = LoanPaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(loan=loan)

            # Update outstanding balance
            payment_amount = serializer.validated_data.get('principal_component') or serializer.validated_data['amount']
            loan.outstanding_balance = max(0, float(loan.outstanding_balance) - float(payment_amount))
            loan.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
