from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseForbidden
from .forms import LoginForm, RegisterForm, AdminCreateUserForm, AdminResetPasswordForm
from .models import Role

User = get_user_model()


def require_admin(view_func):
    """Decorator: only admins can access"""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('accounts:login')
        if not request.user.is_admin:
            return HttpResponseForbidden('Доступ запрещён. Требуются права администратора.')
        return view_func(request, *args, **kwargs)
    wrapper.__name__ = view_func.__name__
    return wrapper


def login_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    
    form = LoginForm(request, data=request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.get_user()
        login(request, user)
        messages.success(request, f'Добро пожаловать, {user.get_short_name()}!')
        next_url = request.GET.get('next', 'core:dashboard')
        return redirect(next_url)
    
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    logout(request)
    messages.info(request, 'Вы вышли из системы.')
    return redirect('accounts:login')


def register_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    
    form = RegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, 'Регистрация прошла успешно! Добро пожаловать.')
        return redirect('core:dashboard')
    
    return render(request, 'accounts/register.html', {'form': form})


# ─── Admin: User Management ──────────────────────────────────────────────────

@require_admin
def user_list(request):
    users = User.objects.select_related('company').order_by('-date_joined')
    return render(request, 'accounts/user_list.html', {'users': users})


@require_admin
def user_create(request):
    form = AdminCreateUserForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save()
        messages.success(request, f'Пользователь {user.email} успешно создан.')
        return redirect('accounts:user_list')
    return render(request, 'accounts/user_form.html', {'form': form, 'title': 'Создать пользователя'})


@require_admin
def user_delete(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == 'POST':
        email = user.email
        user.delete()
        messages.success(request, f'Пользователь {email} удалён.')
        return redirect('accounts:user_list')
    return render(request, 'accounts/user_confirm_delete.html', {'user': user})


@require_admin
def user_toggle_block(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == 'POST':
        user.is_active = not user.is_active
        user.save()
        status = 'разблокирован' if user.is_active else 'заблокирован'
        messages.success(request, f'Пользователь {user.email} {status}.')
    return redirect('accounts:user_list')


@require_admin
def user_reset_password(request, pk):
    user = get_object_or_404(User, pk=pk)
    form = AdminResetPasswordForm(user=user, data=request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, f'Пароль пользователя {user.email} сброшен.')
        return redirect('accounts:user_list')
    return render(request, 'accounts/reset_password.html', {'form': form, 'target_user': user})


@login_required
def profile_view(request):
    return render(request, 'accounts/profile.html', {'profile_user': request.user})
