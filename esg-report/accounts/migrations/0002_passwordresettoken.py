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
        migrations.CreateModel(
            name='PasswordResetToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token',      models.UUIDField(default=uuid.uuid4, unique=True, verbose_name='Токен')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создан')),
                ('used',       models.BooleanField(default=False, verbose_name='Использован')),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='password_reset_tokens',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Пользователь',
                )),
            ],
            options={
                'verbose_name': 'Токен сброса пароля',
                'verbose_name_plural': 'Токены сброса пароля',
                'ordering': ['-created_at'],
            },
        ),
    ]
