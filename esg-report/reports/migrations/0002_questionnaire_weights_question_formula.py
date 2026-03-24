from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='questionnaire',
            name='weight_e',
            field=models.FloatField(default=1.0, verbose_name='Вес блока Environmental'),
        ),
        migrations.AddField(
            model_name='questionnaire',
            name='weight_s',
            field=models.FloatField(default=1.0, verbose_name='Вес блока Social'),
        ),
        migrations.AddField(
            model_name='questionnaire',
            name='weight_g',
            field=models.FloatField(default=1.0, verbose_name='Вес блока Governance'),
        ),

        # ── Правило расчёта балла и max шкалы на вопросе ─────────────────
        migrations.AddField(
            model_name='question',
            name='score_formula',
            field=models.CharField(
                blank=True, default='', max_length=20,
                verbose_name='Правило расчёта балла',
                choices=[
                    ('linear_desc',  'Убывающий (лучший = первый вариант)'),
                    ('linear_asc',   'Возрастающий (лучший = последний вариант)'),
                    ('binary',       'Бинарный (ответ есть → макс. балл)'),
                    ('proportional', 'Пропорциональный (доля выбранных)'),
                    ('scale_linear', 'Шкала линейная (value / max_scale)'),
                    ('numeric_cap',  'Числовой с потолком (min(value, max_score))'),
                    ('manual',       'Ручной ввод балла'),
                ],
            ),
        ),
        migrations.AddField(
            model_name='question',
            name='scale_max',
            field=models.PositiveIntegerField(
                default=5, verbose_name='Максимум шкалы',
                help_text='Только для типа «шкала»'
            ),
        ),
    ]
