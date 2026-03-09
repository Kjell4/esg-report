from django.contrib import admin
from .models import Questionnaire, Question, Report, Answer, Score, Recommendation, ReportingPeriod

admin.site.register(Questionnaire)
admin.site.register(Question)
admin.site.register(Report)
admin.site.register(ReportingPeriod)
admin.site.register(Recommendation)
