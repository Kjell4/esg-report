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


class ScoreFormula(models.TextChoices):
    """
    Правило расчёта балла за ответ на вопрос.
    LINEAR_DESC  — первый вариант = max, последний = 0 (по умолчанию для choice)
    LINEAR_ASC   — первый вариант = 0, последний = max
    BINARY       — любой ответ = max (для boolean/text: есть ответ → max)
    PROPORTIONAL — доля выбранных вариантов * max (для multi_choice)
    SCALE_LINEAR — (value / scale_max) * max_score (для scale)
    NUMERIC_CAP  — min(number_value, max_score) (для number)
    MANUAL       — балл задаётся вручную при заполнении
    """
    LINEAR_DESC  = 'linear_desc',  'Убывающий (лучший = первый вариант)'
    LINEAR_ASC   = 'linear_asc',   'Возрастающий (лучший = последний вариант)'
    BINARY       = 'binary',       'Бинарный (ответ есть → макс. балл)'
    PROPORTIONAL = 'proportional', 'Пропорциональный (доля выбранных)'
    SCALE_LINEAR = 'scale_linear', 'Шкала линейная (value / max_scale)'
    NUMERIC_CAP  = 'numeric_cap',  'Числовой с потолком (min(value, max_score))'
    MANUAL       = 'manual',       'Ручной ввод балла'


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
    weight_e = models.FloatField(default=1.0, verbose_name='Вес блока Environmental')
    weight_s = models.FloatField(default=1.0, verbose_name='Вес блока Social')
    weight_g = models.FloatField(default=1.0, verbose_name='Вес блока Governance')

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

    score_formula = models.CharField(
        max_length=20,
        choices=ScoreFormula.choices,
        blank=True,
        default='',
        verbose_name='Правило расчёта балла',
        help_text='Оставьте пустым — будет выбрано автоматически по типу вопроса'
    )

    scale_max = models.PositiveIntegerField(
        default=5,
        verbose_name='Максимум шкалы',
        help_text='Только для типа «шкала»'
    )

    class Meta:
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'
        ordering = ['questionnaire', 'category', 'order']

    def __str__(self):
        return f'[{self.category}] {self.text[:60]}'
    
    def get_effective_formula(self):
        """Возвращает реально применяемое правило расчёта."""
        if self.score_formula:
            return self.score_formula
        
        defaults = {
            QuestionType.CHOICE:       ScoreFormula.LINEAR_DESC,
            QuestionType.MULTI_CHOICE: ScoreFormula.PROPORTIONAL,
            QuestionType.SCALE:        ScoreFormula.SCALE_LINEAR,
            QuestionType.NUMBER:       ScoreFormula.NUMERIC_CAP,
            QuestionType.BOOLEAN:      ScoreFormula.BINARY,
            QuestionType.TEXT:         ScoreFormula.BINARY,
        }
        return defaults.get(self.question_type, ScoreFormula.BINARY)

    def calculate_answer_score(self, text_value='', number_value=None, choice_value=None):
        formula = self.get_effective_formula()
        max_s = self.max_score
        options = self.options or []

        if formula == ScoreFormula.SCALE_LINEAR:
            if number_value is not None:
                return round((float(number_value) / self.scale_max) * max_s, 2)

        elif formula == ScoreFormula.LINEAR_DESC:
            if options and text_value in options:
                idx = options.index(text_value)
                if len(options) == 1:
                    return max_s
                return round(max_s * (1 - idx / (len(options) - 1)), 2)

        elif formula == ScoreFormula.LINEAR_ASC:
            if options and text_value in options:
                idx = options.index(text_value)
                if len(options) == 1:
                    return max_s
                return round(max_s * (idx / (len(options) - 1)), 2)

        elif formula == ScoreFormula.BINARY:
            if self.question_type == QuestionType.BOOLEAN:
                return max_s if text_value.lower() in ('yes', 'да', 'true', '1') else 0.0
            return max_s if (text_value or '').strip() else 0.0

        elif formula == ScoreFormula.PROPORTIONAL:
            chosen = choice_value or []
            if options and chosen:
                return round((len(chosen) / len(options)) * max_s, 2)
            return 0.0

        elif formula == ScoreFormula.NUMERIC_CAP:
            if number_value is not None:
                return round(min(float(number_value), max_s), 2)

        elif formula == ScoreFormula.MANUAL:
            return None  # балл задаётся вручную

        return None


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
        answers = self.answers.select_related('question').all()
        scores = {cat: {'total': 0.0, 'max': 0.0} for cat in ['E', 'S', 'G']}

        for answer in answers:
            q = answer.question
            if answer.score is not None:
                scores[q.category]['total'] += answer.score * q.weight
                scores[q.category]['max']   += q.max_score * q.weight

        block_scores = {}
        for cat, data in scores.items():
            if data['max'] > 0:
                block_scores[cat] = round((data['total'] / data['max']) * 100, 2)
            else:
                block_scores[cat] = None

        self.score_e = block_scores.get('E')
        self.score_s = block_scores.get('S')
        self.score_g = block_scores.get('G')

        # Итоговый балл с весами блоков из опросника
        q = self.questionnaire
        weighted_sum = 0.0
        weight_sum = 0.0
        for cat, attr_score, attr_weight in [
            ('E', self.score_e, q.weight_e),
            ('S', self.score_s, q.weight_s),
            ('G', self.score_g, q.weight_g),
        ]:
            if attr_score is not None:
                weighted_sum += attr_score * attr_weight
                weight_sum   += attr_weight

        self.total_score = round(weighted_sum / weight_sum, 2) if weight_sum > 0 else None
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
