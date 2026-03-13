import requests
import logging

logger = logging.getLogger(__name__)

YAHOO_FINANCE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"


def get_stock_price(symbol):
    """Fetch current price for a stock/ETF ticker symbol using Yahoo Finance."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        params = {'interval': '1d', 'range': '1d'}
        response = requests.get(
            YAHOO_FINANCE_URL.format(symbol=symbol),
            headers=headers,
            params=params,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        result = data['chart']['result'][0]
        price = result['meta']['regularMarketPrice']
        return {
            'symbol': symbol,
            'price': price,
            'currency': result['meta'].get('currency', 'USD'),
            'name': result['meta'].get('shortName', symbol),
        }
    except Exception as e:
        logger.error(f"Failed to fetch price for {symbol}: {e}")
        return None


def get_multiple_quotes(symbols):
    """Fetch prices for multiple symbols."""
    results = {}
    for symbol in symbols:
        data = get_stock_price(symbol)
        if data:
            results[symbol] = data
    return results
