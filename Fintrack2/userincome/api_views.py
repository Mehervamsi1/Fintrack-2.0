from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import UserIncome, Source
from .serializers import UserIncomeSerializer, SourceSerializer


class NoPagination(PageNumberPagination):
    page_size = None


class SourceViewSet(viewsets.ModelViewSet):
    serializer_class = SourceSerializer
    pagination_class = NoPagination

    def get_queryset(self):
        return Source.objects.filter(
            Q(owner=self.request.user) | Q(owner__isnull=True)
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class UserIncomeViewSet(viewsets.ModelViewSet):
    serializer_class = UserIncomeSerializer

    def get_queryset(self):
        queryset = UserIncome.objects.filter(owner=self.request.user).order_by('-date')
        search = self.request.query_params.get('search', None)
        source = self.request.query_params.get('source', None)
        if search:
            queryset = queryset.filter(description__icontains=search)
        if source:
            queryset = queryset.filter(source=source)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        six_months_ago = timezone.now().date() - timedelta(days=180)
        income = UserIncome.objects.filter(
            owner=request.user,
            date__gte=six_months_ago
        )

        by_source = income.values('source').annotate(
            total=Sum('amount')
        ).order_by('-total')

        monthly = income.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')

        total = income.aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'total': float(total),
            'by_source': list(by_source),
            'monthly': [
                {'month': item['month'].strftime('%Y-%m'), 'total': float(item['total'])}
                for item in monthly
            ],
        })
