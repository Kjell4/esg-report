from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.LoginView.as_view(), name='api-login'),
    path('auth/register/', views.RegisterView.as_view(), name='api-register'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('auth/me/', views.MeView.as_view(), name='api-me'),
    path('auth/logout/', views.LogoutView.as_view(), name='api-logout'),

    # Users (admin)
    path('users/', views.UserListView.as_view(), name='api-users'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='api-user-detail'),
    path('users/<int:pk>/toggle-block/', views.UserToggleBlockView.as_view(), name='api-user-toggle-block'),
    path('users/<int:pk>/reset-password/', views.UserResetPasswordView.as_view(), name='api-user-reset-password'),

    # Companies
    path('companies/', views.CompanyListView.as_view(), name='api-companies'),
    path('companies/<int:pk>/', views.CompanyDetailView.as_view(), name='api-company-detail'),

    # Questionnaires
    path('questionnaires/', views.QuestionnaireListView.as_view(), name='api-questionnaires'),
    path('questionnaires/<int:pk>/', views.QuestionnaireDetailView.as_view(), name='api-questionnaire-detail'),

    # Reports
    path('reports/', views.ReportListView.as_view(), name='api-reports'),
    path('reports/<int:pk>/', views.ReportDetailView.as_view(), name='api-report-detail'),
    path('reports/<int:pk>/submit/', views.ReportSubmitView.as_view(), name='api-report-submit'),
    path('reports/<int:pk>/answers/', views.ReportAnswersView.as_view(), name='api-report-answers'),

    # Dashboard stats
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='api-dashboard-stats'),

    # Reporting periods
    path('periods/', views.ReportingPeriodListView.as_view(), name='api-periods'),
]
