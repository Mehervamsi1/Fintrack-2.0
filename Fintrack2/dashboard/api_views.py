from rest_framework.views import APIView
from rest_framework.response import Response
from services.market_data import get_stock_price


class MarketQuoteView(APIView):
    def get(self, request):
        symbol = request.query_params.get('symbol', '')
        if not symbol:
            return Response({'error': 'symbol parameter required'}, status=400)
        data = get_stock_price(symbol)
        if data:
            return Response(data)
        return Response({'error': f'Could not fetch price for {symbol}'}, status=404)
