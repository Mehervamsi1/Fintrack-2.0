from rest_framework import serializers
from .models import UserIncome, Source


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ['id', 'name']


class UserIncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserIncome
        fields = ['id', 'amount', 'date', 'description', 'source']
