# Currency Budget Backend

Backend командного проєкту: облік бюджету з автоматичною конвертацією валют (UAH, USD, EUR) за курсом НБУ.

**Стек:** Java 17, Spring Boot 3.3, Spring Data JPA, PostgreSQL 16, Flyway, Maven.

## Запуск

1. Підняти базу даних:
   ```bash
   docker compose up -d
   ```
2. Запустити застосунок:
   ```bash
   mvn spring-boot:run
   ```
   Сервер стартує на `http://localhost:8080`. Міграції Flyway виконуються автоматично, курси НБУ завантажуються при старті.

Змінні середовища (необов'язкові): `DB_URL`, `DB_USER`, `DB_PASSWORD`, `PORT`.

## Архітектура

```
com.example.budget
├── model        # JPA-сутності: Budget, ExchangeRate, PcComponent (каталог), enum Currency, Brand тощо
├── repository   # Spring Data репозиторії
├── service      # BudgetService, ExchangeRateService (+ NbuRateClient), CurrencyConversionService, BuildService
├── build        # алгоритм підбору збірок: BuildGenerator, ComponentFilter, CompatibilityChecker
├── web          # REST-контролери та обробка помилок
└── dto          # запити/відповіді API
```

Міграції БД: `src/main/resources/db/migration` (`V1`/`V2` бюджети й курси, `V3`-`V5` каталог комплектуючих `components`).

## Курси валют

- Джерело: відкрите API НБУ (`bank.gov.ua/NBUStatService`).
- Оновлення: при старті та щодня о 16:30 (Київ), налаштовується в `application.yml` (`nbu.refresh-cron`).
- Конвертація йде через гривню: `amount * rate(from) / rate(to)`.

## API

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/budgets` | створити бюджет |
| GET | `/api/budgets` | список бюджетів |
| GET | `/api/budgets/{id}` | один бюджет |
| PUT | `/api/budgets/{id}` | оновити |
| DELETE | `/api/budgets/{id}` | видалити |
| GET | `/api/budgets/{id}/converted` | бюджет в UAH / USD / EUR |
| GET | `/api/rates` | останні курси USD, EUR |
| POST | `/api/rates/refresh` | оновити курси з НБУ вручну |
| GET | `/api/convert?from=USD&to=UAH&amount=100` | конвертація суми |
| POST | `/api/builds/generate` | підбір 3 збірок ПК під бюджет і бренди |
| GET | `/actuator/health` | стан сервісу |

Приклад створення бюджету:
```bash
curl -X POST localhost:8080/api/budgets \
  -H "Content-Type: application/json" \
  -d '{"name":"Відпустка","amount":1000,"currency":"USD"}'
```

## Тести

```bash
mvn test
```

## Підбір збірок ПК (`POST /api/builds/generate`)

Запит:
```json
{"budget": 40000, "currency": "UAH", "brands": ["NVIDIA", "AMD", "MSI"]}
```
- `currency`: `UAH`, `USD` або `EUR` (бюджет конвертується в гривні за курсом НБУ);
- `brands` (необов'язково): `NVIDIA`, `AMD`, `INTEL`, `MSI`, `GIGABYTE`. Порожній список означає без обмежень.

Відповідь містить до трьох збірок: **Ціна/якість**, **Потужність**, **Технології**. У кожної є список комплектуючих
(назва, бренд, посилання на магазин, ціна в гривнях і у валюті запиту), загальна ціна, бали продуктивності й технологій (0..100).
Якщо сумісної збірки немає, повертається `422`.

**Фільтрація за брендами** (колонка `brand` таблиці `components`):
AMD/Intel обмежують процесори, NVIDIA/AMD відеокарти, MSI/Gigabyte материнські плати, блоки живлення й корпуси.
Якщо для категорії нічого не обрано, обмежень немає.

**Правила сумісності:** сокет CPU = сокет плати; тип пам'яті CPU, плати й ОЗП однаковий;
потужність БЖ ≥ (TDP CPU + TDP GPU + 100 Вт) × 1,3; типорозмір плати підтримується корпусом;
довжина відеокарти не більша за допустиму для корпусу.

**Профілі збірок:** «Потужність» дає максимум ігрової продуктивності, «Технології» максимум tech-оцінки
(DDR5, PCIe 5.0, DLSS/FSR, RT), «Ціна/якість» щонайменше 80% від максимальної продуктивності за найменші гроші.
