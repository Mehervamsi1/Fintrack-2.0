from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from expenses.api_views import ExpenseViewSet, CategoryViewSet
from userincome.api_views import UserIncomeViewSet, SourceViewSet
from assets.api_views import AssetViewSet, AssetCategoryViewSet
from loans.api_views import LoanViewSet
from authentication.api_views import RegisterAPIView, UserProfileView
from userpreferences.api_views import UserPreferenceView
from dashboard.views import NetWorthView
from dashboard.api_views import MarketQuoteView

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'expenses-categories', CategoryViewSet, basename='expense-category')
router.register(r'income', UserIncomeViewSet, basename='income')
router.register(r'income-sources', SourceViewSet, basename='income-source')
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'asset-categories', AssetCategoryViewSet, basename='asset-category')
router.register(r'loans', LoanViewSet, basename='loan')

urlpatterns = [
    path('', include(router.urls)),

    # Auth
    path('auth/register/', RegisterAPIView.as_view(), name='api-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='api-token-obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('auth/user/', UserProfileView.as_view(), name='api-user-profile'),

    # Dashboard
    path('dashboard/summary/', NetWorthView.as_view(), name='api-dashboard-summary'),

    # Market data
    path('market/quote/', MarketQuoteView.as_view(), name='api-market-quote'),

    # Preferences
    path('preferences/', UserPreferenceView.as_view(), name='api-preferences'),
]
