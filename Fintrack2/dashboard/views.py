from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from expenses.models import Expense
from userincome.models import UserIncome
from assets.models import Asset
from loans.models import Loan


class NetWorthView(APIView):
    def get(self, request):
        user = request.user

        # Calculate total assets
        assets = Asset.objects.filter(owner=user)
        total_assets = sum(a.current_value for a in assets)

        # Assets breakdown by category
        assets_breakdown = {}
        for asset in assets:
            cat = asset.category.name
            if cat not in assets_breakdown:
                assets_breakdown[cat] = 0
            assets_breakdown[cat] += asset.current_value

        # Calculate total liabilities
        loans = Loan.objects.filter(owner=user)
        total_liabilities = float(
            loans.aggregate(total=Sum('outstanding_balance'))['total'] or 0
        )

        # Liabilities breakdown
        liabilities_breakdown = {}
        for loan in loans:
            lt = loan.get_loan_type_display()
            if lt not in liabilities_breakdown:
                liabilities_breakdown[lt] = 0
            liabilities_breakdown[lt] += float(loan.outstanding_balance)

        # Monthly income and expenses (current month)
        now = timezone.now().date()
        month_start = now.replace(day=1)

        monthly_income = float(
            UserIncome.objects.filter(
                owner=user, date__gte=month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
        )

        monthly_expenses = float(
            Expense.objects.filter(
                owner=user, date__gte=month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
        )

        # Income vs Expense monthly trend (last 6 months)
        six_months_ago = now - timedelta(days=180)

        income_monthly = UserIncome.objects.filter(
            owner=user, date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')

        expense_monthly = Expense.objects.filter(
            owner=user, date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')

        # Merge into monthly trend
        monthly_data = {}
        for item in income_monthly:
            key = item['month'].strftime('%Y-%m')
            monthly_data.setdefault(key, {'month': key, 'income': 0, 'expenses': 0})
            monthly_data[key]['income'] = float(item['total'])
        for item in expense_monthly:
            key = item['month'].strftime('%Y-%m')
            monthly_data.setdefault(key, {'month': key, 'income': 0, 'expenses': 0})
            monthly_data[key]['expenses'] = float(item['total'])

        monthly_trend = sorted(monthly_data.values(), key=lambda x: x['month'])

        # Recent transactions
        recent_expenses = list(
            Expense.objects.filter(owner=user).order_by('-date')[:5].values(
                'id', 'amount', 'date', 'description', 'category'
            )
        )
        recent_income = list(
            UserIncome.objects.filter(owner=user).order_by('-date')[:5].values(
                'id', 'amount', 'date', 'description', 'source'
            )
        )

        for e in recent_expenses:
            e['type'] = 'expense'
            e['amount'] = float(e['amount'])
        for i in recent_income:
            i['type'] = 'income'
            i['amount'] = float(i['amount'])

        recent = sorted(
            recent_expenses + recent_income,
            key=lambda x: x['date'],
            reverse=True,
        )[:10]

        net_worth = total_assets - total_liabilities

        return Response({
            'net_worth': round(net_worth, 2),
            'total_assets': round(total_assets, 2),
            'total_liabilities': round(total_liabilities, 2),
            'assets_breakdown': [
                {'category': cat, 'value': round(val, 2)}
                for cat, val in assets_breakdown.items()
            ],
            'liabilities_breakdown': [
                {'type': lt, 'balance': round(bal, 2)}
                for lt, bal in liabilities_breakdown.items()
            ],
            'monthly_income': round(monthly_income, 2),
            'monthly_expenses': round(monthly_expenses, 2),
            'monthly_savings': round(monthly_income - monthly_expenses, 2),
            'monthly_trend': monthly_trend,
            'recent_transactions': recent,
        })
