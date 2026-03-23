# ESG Reporting Platform — Интегрированный проект

## Структура проекта

```
ESG-integrated/
├── manage.py                  # Django manage
├── requirements.txt           # Python зависимости
├── backend/                   # Django настройки (settings, urls, wsgi)
├── api/                       # REST API (новый слой интеграции)
│   ├── urls.py
│   ├── views.py
│   └── serializers.py
├── accounts/                  # Пользователи и аутентификация
├── companies/                 # Компании
├── reports/                   # Отчёты, вопросники, периоды
├── core/                      # Дашборд (legacy Django views)
└── frontend/                  # React-приложение
    ├── .env                   # REACT_APP_API_URL=http://localhost:8000/api
    └── src/
        ├── services/
        │   └── api.ts         # Весь API-слой (новый файл)
        ├── contexts/
        │   └── AuthContext.tsx  # Обновлён: реальный JWT вместо моков
        └── pages/             # Все страницы обновлены на реальный API
```

---

## Запуск проекта

### 1. Бэкенд (Django)

```bash
# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate          # Linux/Mac
# venv\Scripts\activate           # Windows

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
python manage.py migrate

# Создать суперпользователя-администратора
python manage.py shell -c "
from accounts.models import User, Role
User.objects.create_superuser(
    email='admin@esg.com',
    password='admin123',
    first_name='Admin',
    last_name='User',
    role=Role.ADMIN
)
print('Superuser created!')
"

# (Опционально) Создать тестовые периоды
python manage.py shell -c "
from reports.models import ReportingPeriod
from datetime import date
ReportingPeriod.objects.get_or_create(
    name='Q1 2026', year=2026, quarter=1,
    defaults={'start_date': date(2026,1,1), 'end_date': date(2026,3,31), 'is_active': True}
)
ReportingPeriod.objects.get_or_create(
    name='Q4 2025', year=2025, quarter=4,
    defaults={'start_date': date(2025,10,1), 'end_date': date(2025,12,31), 'is_active': True}
)
print('Periods created!')
"

# Запустить сервер
python manage.py runserver
# Бэкенд будет доступен на http://localhost:8000
```

### 2. Фронтенд (React)

```bash
cd frontend

# Установить зависимости
npm install

# Запустить в режиме разработки
npm start
# Фронтенд будет доступен на http://localhost:3000 или http://192.168.1.162:3000/
```

---

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/login/` | Вход (возвращает JWT) |
| POST | `/api/auth/register/` | Регистрация |
| POST | `/api/auth/refresh/` | Обновление токена |
| GET | `/api/auth/me/` | Текущий пользователь |
| POST | `/api/auth/logout/` | Выход |
| GET | `/api/users/` | Список пользователей (admin) |
| POST | `/api/users/{id}/toggle-block/` | Блок/разблок пользователя |
| GET | `/api/companies/` | Список компаний |
| POST | `/api/companies/` | Создать компанию |
| GET | `/api/questionnaires/` | Список опросников |
| GET | `/api/questionnaires/{id}/` | Опросник с вопросами |
| GET | `/api/reports/` | Список отчётов |
| POST | `/api/reports/` | Создать отчёт |
| POST | `/api/reports/{id}/submit/` | Отправить отчёт |
| GET/POST | `/api/reports/{id}/answers/` | Ответы на вопросы |
| GET | `/api/dashboard/stats/` | Статистика для дашборда |
| GET | `/api/periods/` | Отчётные периоды |

---

## Как работает аутентификация

1. Фронтенд отправляет `POST /api/auth/login/` с `{email, password}`
2. Django проверяет credentials, возвращает `{access, refresh, user}`
3. Фронтенд сохраняет токены в `localStorage`
4. Каждый запрос добавляет `Authorization: Bearer <access_token>`
5. При истечении токена (`401`) — автоматически выполняется refresh

---

## Роли пользователей

| Фронтенд | Бэкенд | Доступ |
|----------|--------|--------|
| `administrator` | `admin` | Полный доступ: пользователи, компании, все отчёты |
| `respondent` | `respondent` | Создание/отправка своих отчётов |
| `viewer` | `viewer` | Только просмотр отправленных отчётов |
