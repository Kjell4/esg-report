from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

User = get_user_model()


@login_required
def dashboard(request):
    user = request.user
    context = {'user': user}

    if user.is_admin:
        from reports.models import Report
        from companies.models import Company
        context.update({
            'total_users': User.objects.count(),
            'total_reports': Report.objects.count(),
            'total_companies': Company.objects.count(),
            'recent_reports': Report.objects.select_related('company', 'respondent').order_by('-created_at')[:5],
        })
        return render(request, 'core/dashboard_admin.html', context)

    elif user.is_respondent:
        from reports.models import Report
        context.update({
            'my_reports': Report.objects.filter(respondent=user).select_related('company', 'period').order_by('-created_at')[:5],
        })
        return render(request, 'core/dashboard_respondent.html', context)

    else:  # viewer
        from reports.models import Report
        context.update({
            'recent_reports': Report.objects.filter(
                status='submitted'
            ).select_related('company', 'period').order_by('-submitted_at')[:10],
        })
        return render(request, 'core/dashboard_viewer.html', context)
