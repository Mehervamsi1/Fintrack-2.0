from rest_framework import serializers
from .models import Asset, AssetCategory, AssetPriceHistory


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = ['id', 'name', 'icon']


class AssetPriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetPriceHistory
        fields = ['id', 'price', 'recorded_at']


class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_value = serializers.FloatField(read_only=True)
    cost_basis = serializers.FloatField(read_only=True)
    gain_loss = serializers.FloatField(read_only=True)
    gain_loss_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'category', 'category_name', 'ticker_symbol',
            'quantity', 'purchase_price', 'current_price',
            'manual_current_value', 'currency', 'purchase_date', 'notes',
            'current_value', 'cost_basis', 'gain_loss', 'gain_loss_percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
