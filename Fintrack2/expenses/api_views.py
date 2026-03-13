from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import Expense, Category
from .serializers import ExpenseSerializer, CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        queryset = Expense.objects.filter(owner=self.request.user).order_by('-date')
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        if search:
            queryset = queryset.filter(description__icontains=search)
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        six_months_ago = timezone.now().date() - timedelta(days=180)
        expenses = Expense.objects.filter(
            owner=request.user,
            date__gte=six_months_ago
        )

        by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')

        monthly = expenses.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')

        total = expenses.aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'total': float(total),
            'by_category': list(by_category),
            'monthly': [
                {'month': item['month'].strftime('%Y-%m'), 'total': float(item['total'])}
                for item in monthly
            ],
        })
