from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid
from django.utils import timezone
from django.conf import settings


class Role(models.TextChoices):
    ADMIN = 'admin', 'Администратор'
    RESPONDENT = 'respondent', 'Респондент'
    VIEWER = 'viewer', 'Пользователь'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name='Email')
    first_name = models.CharField(max_length=100, verbose_name='Имя')
    last_name = models.CharField(max_length=100, verbose_name='Фамилия')
    middle_name = models.CharField(max_length=100, blank=True, verbose_name='Отчество')
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
        verbose_name='Роль'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_staff = models.BooleanField(default=False, verbose_name='Сотрудник')
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='Дата регистрации')
    last_login = models.DateTimeField(null=True, blank=True, verbose_name='Последний вход')

    # Link to company (for respondents)
    company = models.ForeignKey(
        'companies.Company',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        verbose_name='Компания',
        related_name='users'
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name()} ({self.email})'

    def get_full_name(self):
        return f'{self.last_name} {self.first_name} {self.middle_name}'.strip()

    def get_short_name(self):
        return self.first_name

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_respondent(self):
        return self.role == Role.RESPONDENT

    @property
    def is_viewer(self):
        return self.role == Role.VIEWER


class AuditLog(models.Model):
    """Логирование всех действий пользователей"""
    user = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        verbose_name='Пользователь'
    )
    action = models.CharField(max_length=255, verbose_name='Действие')
    path = models.CharField(max_length=500, verbose_name='URL путь')
    method = models.CharField(max_length=10, verbose_name='HTTP метод')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP адрес')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Время')
    extra_data = models.JSONField(default=dict, blank=True, verbose_name='Доп. данные')

    class Meta:
        verbose_name = 'Журнал действий'
        verbose_name_plural = 'Журнал действий'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.user} | {self.action} | {self.timestamp}'

class PasswordResetToken(models.Model):
    """Токен для восстановления пароля по email."""
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='password_reset_tokens', verbose_name='Пользователь'
    )
    token      = models.UUIDField(default=uuid.uuid4, unique=True, verbose_name='Токен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    used       = models.BooleanField(default=False, verbose_name='Использован')

    EXPIRY_HOURS = 24

    class Meta:
        verbose_name = 'Токен сброса пароля'
        verbose_name_plural = 'Токены сброса пароля'
        ordering = ['-created_at']

    def is_valid(self):
        if self.used:
            return False
        expiry = self.created_at + timezone.timedelta(hours=self.EXPIRY_HOURS)
        return timezone.now() < expiry

    def __str__(self):
        return f'{self.user.email} — {self.token}'