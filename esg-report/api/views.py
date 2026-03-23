from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from companies.models import Company
from reports.models import (
    Questionnaire, Question, Report, Answer,
    ReportingPeriod, ReportStatus
)
from .serializers import (
    UserSerializer, UserListSerializer, RegisterSerializer,
    CompanySerializer, CompanyWriteSerializer,
    QuestionnaireSerializer, QuestionnaireListSerializer, QuestionSerializer,
    ReportSerializer, ReportCreateSerializer, AnswerSerializer,
    ReportingPeriodSerializer,
)

User = get_user_model()


# ─── Permissions ─────────────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_admin


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Email and password required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=401)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=401)

        if not user.is_active:
            return Response({'detail': 'Account is blocked.'}, status=403)

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=201)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'})


# ─── Users ───────────────────────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.select_related('company').order_by('-date_joined')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsAdmin]


class UserToggleBlockView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'id': user.id, 'isBlocked': not user.is_active})


class UserResetPasswordView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        new_password = request.data.get('password')
        if not new_password or len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password reset successfully.'})


# ─── Companies ───────────────────────────────────────────────────────────────

class CompanyListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CompanyWriteSerializer
        return CompanySerializer

    def get_queryset(self):
        return Company.objects.filter(is_active=True).order_by('name')

    def create(self, request, *args, **kwargs):
        serializer = CompanyWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.save()
        return Response(CompanySerializer(company).data, status=201)


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CompanyWriteSerializer
        return CompanySerializer


# ─── Questionnaires ───────────────────────────────────────────────────────────

class QuestionnaireListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Questionnaire.objects.filter(is_active=True).order_by('-year')
        serializer = QuestionnaireListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        data = request.data
        questions_data = data.pop('questions', [])
        questionnaire = Questionnaire.objects.create(**{
            k: v for k, v in data.items()
            if k in ['title', 'description', 'year', 'is_active']
        })
        for i, q in enumerate(questions_data):
            Question.objects.create(questionnaire=questionnaire, order=i, **{
                k: v for k, v in q.items()
                if k in ['category', 'text', 'question_type', 'options', 'max_score', 'weight', 'is_required']
            })
        return Response(QuestionnaireSerializer(questionnaire).data, status=201)


class QuestionnaireDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            q = Questionnaire.objects.prefetch_related('questions').get(pk=pk)
        except Questionnaire.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(QuestionnaireSerializer(q).data)


# ─── Reports ─────────────────────────────────────────────────────────────────

class ReportListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_admin:
            reports = Report.objects.select_related('company', 'respondent', 'period', 'questionnaire').order_by('-created_at')
        elif user.is_respondent:
            reports = Report.objects.filter(respondent=user).select_related('company', 'period', 'questionnaire').order_by('-created_at')
        else:  # viewer
            reports = Report.objects.filter(status='submitted').select_related('company', 'respondent', 'period', 'questionnaire').order_by('-submitted_at')

        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_respondent and not request.user.is_admin:
            return Response({'detail': 'Only respondents can create reports.'}, status=403)
        serializer = ReportCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        return Response(ReportSerializer(report).data, status=201)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Report.objects.all()
        elif user.is_respondent:
            return Report.objects.filter(respondent=user)
        return Report.objects.filter(status='submitted')


class ReportSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk, respondent=request.user)
        except Report.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if report.status != 'draft':
            return Response({'detail': 'Only draft reports can be submitted.'}, status=400)

        report.status = ReportStatus.SUBMITTED
        report.submitted_at = timezone.now()
        report.save(update_fields=['status', 'submitted_at'])
        report.calculate_scores()
        return Response(ReportSerializer(report).data)


class ReportAnswersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        answers = report.answers.all()
        return Response(AnswerSerializer(answers, many=True).data)

    def post(self, request, pk):
        """Save/update answers for a report (bulk upsert)"""
        try:
            report = Report.objects.get(pk=pk, respondent=request.user)
        except Report.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if report.status != 'draft':
            return Response({'detail': 'Cannot edit a submitted report.'}, status=400)

        answers_data = request.data if isinstance(request.data, list) else [request.data]
        saved = []
        for item in answers_data:
            question_id = item.get('question')
            answer, _ = Answer.objects.update_or_create(
                report=report,
                question_id=question_id,
                defaults={
                    'text_value': item.get('text_value', ''),
                    'number_value': item.get('number_value'),
                    'choice_value': item.get('choice_value', []),
                    'score': item.get('score'),
                }
            )
            saved.append(answer)

        report.updated_at = timezone.now()
        report.save(update_fields=['updated_at'])
        return Response(AnswerSerializer(saved, many=True).data)


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_admin:
            total_reports = Report.objects.count()
            submitted_reports = Report.objects.filter(status='submitted').count()
            scores = list(Report.objects.filter(total_score__isnull=False).values_list('total_score', flat=True))
            avg_score = round(sum(scores) / len(scores), 1) if scores else None

            return Response({
                'totalUsers': User.objects.count(),
                'totalCompanies': Company.objects.filter(is_active=True).count(),
                'totalReports': total_reports,
                'submittedReports': submitted_reports,
                'avgEsgScore': avg_score,
            })

        elif user.is_respondent:
            my_reports = Report.objects.filter(respondent=user)
            submitted = my_reports.filter(status='submitted')
            latest = submitted.order_by('-submitted_at').first()

            return Response({
                'totalReports': my_reports.count(),
                'submittedReports': submitted.count(),
                'draftReports': my_reports.filter(status='draft').count(),
                'latestScore': latest.total_score if latest else None,
                'latestEScore': latest.score_e if latest else None,
                'latestSScore': latest.score_s if latest else None,
                'latestGScore': latest.score_g if latest else None,
            })

        else:  # viewer
            submitted = Report.objects.filter(status='submitted')
            scores = list(submitted.filter(total_score__isnull=False).values_list('total_score', flat=True))
            avg_score = round(sum(scores) / len(scores), 1) if scores else None

            return Response({
                'totalSubmittedReports': submitted.count(),
                'avgEsgScore': avg_score,
                'totalCompanies': Company.objects.filter(is_active=True).count(),
            })


# ─── Reporting Periods ────────────────────────────────────────────────────────

class ReportingPeriodListView(generics.ListCreateAPIView):
    serializer_class = ReportingPeriodSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return ReportingPeriod.objects.filter(is_active=True).order_by('-year', '-quarter')
