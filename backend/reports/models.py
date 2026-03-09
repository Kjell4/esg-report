from django.db import models
from django.conf import settings


class ESGCategory(models.TextChoices):
    ENVIRONMENTAL = 'E', 'Environmental (Экология)'
    SOCIAL = 'S', 'Social (Социальная)'
    GOVERNANCE = 'G', 'Governance (Управление)'


class QuestionType(models.TextChoices):
    TEXT = 'text', 'Текстовый ответ'
    NUMBER = 'number', 'Числовой ответ'
    CHOICE = 'choice', 'Один из вариантов'
    MULTI_CHOICE = 'multi_choice', 'Несколько вариантов'
    SCALE = 'scale', 'Шкала (1–5)'
    BOOLEAN = 'boolean', 'Да / Нет'


class ReportStatus(models.TextChoices):
    DRAFT = 'draft', 'Черновик'
    SUBMITTED = 'submitted', 'Отправлен'
    REVIEWED = 'reviewed', 'Проверен'


# ─── Questionnaire ────────────────────────────────────────────────────────────

class Questionnaire(models.Model):
    title = models.CharField(max_length=255, verbose_name='Название опросника')
    description = models.TextField(blank=True, verbose_name='Описание')
    year = models.PositiveIntegerField(verbose_name='Год')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Опросник'
        verbose_name_plural = 'Опросники'
        ordering = ['-year']

    def __str__(self):
        return f'{self.title} ({self.year})'


class Question(models.Model):
    questionnaire = models.ForeignKey(
        Questionnaire, on_delete=models.CASCADE,
        related_name='questions', verbose_name='Опросник'
    )
    category = models.CharField(
        max_length=1, choices=ESGCategory.choices, verbose_name='ESG категория'
    )
    text = models.TextField(verbose_name='Текст вопроса')
    question_type = models.CharField(
        max_length=20, choices=QuestionType.choices,
        default=QuestionType.TEXT, verbose_name='Тип вопроса'
    )
    options = models.JSONField(
        default=list, blank=True,
        verbose_name='Варианты ответов (для choice/multi_choice)'
    )
    max_score = models.FloatField(default=10.0, verbose_name='Максимальный балл')
    weight = models.FloatField(default=1.0, verbose_name='Весовой коэффициент')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    is_required = models.BooleanField(default=True, verbose_name='Обязательный')

    class Meta:
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'
        ordering = ['questionnaire', 'category', 'order']

    def __str__(self):
        return f'[{self.category}] {self.text[:60]}'


# ─── Reporting Period ─────────────────────────────────────────────────────────

class ReportingPeriod(models.Model):
    name = models.CharField(max_length=100, verbose_name='Название периода')
    year = models.PositiveIntegerField(verbose_name='Год')
    quarter = models.PositiveIntegerField(null=True, blank=True, verbose_name='Квартал (1–4)')
    start_date = models.DateField(verbose_name='Начало периода')
    end_date = models.DateField(verbose_name='Конец периода')
    is_active = models.BooleanField(default=True, verbose_name='Активен')

    class Meta:
        verbose_name = 'Отчётный период'
        verbose_name_plural = 'Отчётные периоды'
        ordering = ['-year', '-quarter']

    def __str__(self):
        return self.name


# ─── Report ───────────────────────────────────────────────────────────────────

class Report(models.Model):
    respondent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reports', verbose_name='Респондент'
    )
    company = models.ForeignKey(
        'companies.Company', on_delete=models.CASCADE,
        related_name='reports', verbose_name='Компания'
    )
    questionnaire = models.ForeignKey(
        Questionnaire, on_delete=models.PROTECT,
        verbose_name='Опросник'
    )
    period = models.ForeignKey(
        ReportingPeriod, on_delete=models.PROTECT,
        verbose_name='Отчётный период'
    )
    status = models.CharField(
        max_length=20, choices=ReportStatus.choices,
        default=ReportStatus.DRAFT, verbose_name='Статус'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='Отправлен')

    # Calculated scores
    score_e = models.FloatField(null=True, blank=True, verbose_name='Балл E (экология)')
    score_s = models.FloatField(null=True, blank=True, verbose_name='Балл S (социальный)')
    score_g = models.FloatField(null=True, blank=True, verbose_name='Балл G (управление)')
    total_score = models.FloatField(null=True, blank=True, verbose_name='Итоговый балл')

    class Meta:
        verbose_name = 'Отчёт'
        verbose_name_plural = 'Отчёты'
        ordering = ['-created_at']
        unique_together = ['company', 'questionnaire', 'period']

    def __str__(self):
        return f'{self.company} | {self.period} | {self.get_status_display()}'

    def calculate_scores(self):
        """Calculate ESG scores based on answers"""
        answers = self.answers.select_related('question')
        scores = {cat: {'total': 0, 'weight': 0} for cat in ['E', 'S', 'G']}

        for answer in answers:
            cat = answer.question.category
            if answer.score is not None:
                scores[cat]['total'] += answer.score * answer.question.weight
                scores[cat]['weight'] += answer.question.max_score * answer.question.weight

        for cat, data in scores.items():
            if data['weight'] > 0:
                normalized = (data['total'] / data['weight']) * 100
            else:
                normalized = 0
            if cat == 'E':
                self.score_e = round(normalized, 2)
            elif cat == 'S':
                self.score_s = round(normalized, 2)
            elif cat == 'G':
                self.score_g = round(normalized, 2)

        e = self.score_e or 0
        s = self.score_s or 0
        g = self.score_g or 0
        self.total_score = round((e + s + g) / 3, 2)
        self.save(update_fields=['score_e', 'score_s', 'score_g', 'total_score'])


# ─── Answer ───────────────────────────────────────────────────────────────────

class Answer(models.Model):
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE,
        related_name='answers', verbose_name='Отчёт'
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE,
        verbose_name='Вопрос'
    )
    text_value = models.TextField(blank=True, verbose_name='Текстовый ответ')
    number_value = models.FloatField(null=True, blank=True, verbose_name='Числовой ответ')
    choice_value = models.JSONField(default=list, blank=True, verbose_name='Выбранные варианты')
    score = models.FloatField(null=True, blank=True, verbose_name='Балл за ответ')

    class Meta:
        verbose_name = 'Ответ'
        verbose_name_plural = 'Ответы'
        unique_together = ['report', 'question']

    def __str__(self):
        return f'Ответ на: {self.question}'


# ─── Recommendation ───────────────────────────────────────────────────────────

class Recommendation(models.Model):
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE,
        related_name='recommendations', verbose_name='Отчёт'
    )
    category = models.CharField(
        max_length=1, choices=ESGCategory.choices, verbose_name='Категория'
    )
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    description = models.TextField(verbose_name='Описание рекомендации')
    priority = models.PositiveIntegerField(default=1, verbose_name='Приоритет (1=высокий)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Рекомендация'
        verbose_name_plural = 'Рекомендации'
        ordering = ['report', 'priority']

    def __str__(self):
        return f'[{self.category}] {self.title}'


# ─── Score ────────────────────────────────────────────────────────────────────

class Score(models.Model):
    """Detailed score breakdown per question"""
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE,
        related_name='scores', verbose_name='Отчёт'
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE,
        verbose_name='Вопрос'
    )
    raw_score = models.FloatField(verbose_name='Сырой балл')
    weighted_score = models.FloatField(verbose_name='Взвешенный балл')
    max_possible = models.FloatField(verbose_name='Максимально возможный балл')

    class Meta:
        verbose_name = 'Балл'
        verbose_name_plural = 'Баллы'
        unique_together = ['report', 'question']
