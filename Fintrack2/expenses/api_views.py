from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import Expense, Category
from .serializers import ExpenseSerializer, CategorySerializer


class NoPagination(PageNumberPagination):
    page_size = None


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    pagination_class = NoPagination

    def get_queryset(self):
        return Category.objects.filter(
            Q(owner=self.request.user) | Q(owner__isnull=True)
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


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
