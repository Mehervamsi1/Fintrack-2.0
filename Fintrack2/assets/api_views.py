from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .models import Asset, AssetCategory, AssetPriceHistory
from .serializers import AssetSerializer, AssetCategorySerializer, AssetPriceHistorySerializer


class NoPagination(PageNumberPagination):
    page_size = None


class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    pagination_class = NoPagination


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer

    def get_queryset(self):
        return Asset.objects.filter(owner=self.request.user).select_related('category')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        assets = self.get_queryset()
        total_value = 0
        total_cost = 0
        by_category = {}

        for asset in assets:
            val = asset.current_value
            cost = asset.cost_basis
            total_value += val
            total_cost += cost
            cat_name = asset.category.name
            if cat_name not in by_category:
                by_category[cat_name] = {'value': 0, 'cost': 0, 'count': 0}
            by_category[cat_name]['value'] += val
            by_category[cat_name]['cost'] += cost
            by_category[cat_name]['count'] += 1

        breakdown = [
            {
                'category': cat,
                'value': round(data['value'], 2),
                'cost': round(data['cost'], 2),
                'gain_loss': round(data['value'] - data['cost'], 2),
                'count': data['count'],
            }
            for cat, data in by_category.items()
        ]

        return Response({
            'total_value': round(total_value, 2),
            'total_cost': round(total_cost, 2),
            'total_gain_loss': round(total_value - total_cost, 2),
            'total_gain_loss_percentage': round(
                ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0, 2
            ),
            'asset_count': assets.count(),
            'breakdown': breakdown,
        })

    @action(detail=True, methods=['get'], url_path='price-history')
    def price_history(self, request, pk=None):
        asset = self.get_object()
        history = asset.price_history.all()[:100]
        serializer = AssetPriceHistorySerializer(history, many=True)
        return Response(serializer.data)
