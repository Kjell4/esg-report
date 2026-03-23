from django.db import models


class OrganizationType(models.TextChoices):
    TOO = 'TOO', 'ТОО (Товарищество с ограниченной ответственностью)'
    AO = 'AO', 'АО (Акционерное общество)'
    NAO = 'NAO', 'НАО (Непубличное акционерное общество)'
    IP = 'IP', 'ИП (Индивидуальный предприниматель)'
    GP = 'GP', 'ГП (Государственное предприятие)'
    OTHER = 'OTHER', 'Иное'


class Region(models.TextChoices):
    AKMOLA = 'akmola', 'Акмолинская область'
    AKTOBE = 'aktobe', 'Актюбинская область'
    ALMATY_REG = 'almaty_reg', 'Алматинская область'
    ATYRAU = 'atyrau', 'Атырауская область'
    EAST_KAZ = 'east_kaz', 'Восточно-Казахстанская область'
    ZHAMBYL = 'zhambyl', 'Жамбылская область'
    ZHETYSU = 'zhetysu', 'Жетысуская область'
    WEST_KAZ = 'west_kaz', 'Западно-Казахстанская область'
    KARAGANDA = 'karaganda', 'Карагандинская область'
    KOSTANAY = 'kostanay', 'Костанайская область'
    KYZYLORDA = 'kyzylorda', 'Кызылординская область'
    MANGISTAU = 'mangistau', 'Мангистауская область'
    PAVLODAR = 'pavlodar', 'Павлодарская область'
    NORTH_KAZ = 'north_kaz', 'Северо-Казахстанская область'
    TURKESTAN = 'turkestan', 'Туркестанская область'
    ULYTAU = 'ulytau', 'Улытауская область'
    ALMATY_CITY = 'almaty_city', 'г. Алматы'
    ASTANA = 'astana', 'г. Астана'
    SHYMKENT = 'shymkent', 'г. Шымкент'


class Industry(models.TextChoices):
    EDUCATION = 'education', 'Образование'
    CONSTRUCTION = 'construction', 'Строительная'
    CHEMICAL = 'chemical', 'Химическая'
    FOOD = 'food', 'Пищевая'
    METALLURGY = 'metallurgy', 'Металлургия'
    LIGHT_INDUSTRY = 'light_industry', 'Лёгкая промышленность'
    IT_AI = 'it_ai', 'ИИ / IT'
    ENERGY = 'energy', 'Энергетика'
    AGRICULTURE = 'agriculture', 'Сельское хозяйство'
    TRANSPORT = 'transport', 'Транспорт и логистика'
    FINANCE = 'finance', 'Финансы и банки'
    OTHER = 'other', 'Иное'


class Company(models.Model):
    name = models.CharField(max_length=255, verbose_name='Наименование компании')
    org_type = models.CharField(
        max_length=10,
        choices=OrganizationType.choices,
        verbose_name='Тип организации'
    )
    region = models.CharField(
        max_length=50,
        choices=Region.choices,
        verbose_name='Область / регион'
    )
    industry = models.CharField(
        max_length=50,
        choices=Industry.choices,
        verbose_name='Отрасль'
    )
    description = models.TextField(blank=True, verbose_name='Описание')
    website = models.URLField(blank=True, verbose_name='Сайт')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Компания'
        verbose_name_plural = 'Компании'
        ordering = ['name']

    def __str__(self):
        return f'{self.org_type} "{self.name}"'
