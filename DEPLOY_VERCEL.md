# Как выложить Civilization Idle в интернет (Vercel + Render + Neon)

Игра состоит из **трёх частей**. Vercel публикует только **интерфейс** (то, что вы видите в браузере).  
Чтобы игра **работала** (сохранения, добыча, покупки), нужны ещё **сервер (API)** и **база данных**.

| Часть | Где размещаем | Зачем |
|-------|---------------|--------|
| Frontend (React) | **Vercel** | Публичная ссылка на игру |
| Backend (API) | **Render** | Логика игры, расчёты |
| PostgreSQL | **Neon** | Хранение прогресса игроков |

Все три сервиса имеют **бесплатные** тарифы для старта.

---

## Что понадобится

1. Аккаунт на [GitHub](https://github.com) (бесплатно)
2. Аккаунт на [Vercel](https://vercel.com) (бесплатно)
3. Аккаунт на [Render](https://render.com) (бесплатно)
4. Аккаунт на [Neon](https://neon.tech) (бесплатно)
5. [Git](https://git-scm.com/) на компьютере (или загрузка ZIP через GitHub)

Ориентировочное время: **30–45 минут** при первом разе.

---

## Часть 0. Загрузить код на GitHub

Vercel и Render подключаются к репозиторию на GitHub.

### Шаг 0.1 — Создайте репозиторий на GitHub

1. Откройте https://github.com/new  
2. Имя, например: `civilization-idle`  
3. Выберите **Private** или **Public**  
4. Нажмите **Create repository**

### Шаг 0.2 — Загрузите проект с компьютера

Откройте **Терминал** (на Mac: Terminal) и выполните (замените `ВАШ_ЛОГИН` и путь при необходимости):

```bash
cd "/Users/alexfox/TG APP2"

git init
git add .
git commit -m "Initial commit: Civilization Idle"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/civilization-idle.git
git push -u origin main
```

GitHub может попросить логин и **Personal Access Token** вместо пароля.  
Создать токен: GitHub → Settings → Developer settings → Personal access tokens.

> **Важно:** файлы `.env` с секретами в `.gitignore` и **не попадут** в GitHub — это правильно.

---

## Часть 1. База данных (Neon)

### Шаг 1.1 — Регистрация

1. Зайдите на https://neon.tech  
2. Войдите через GitHub  

### Шаг 1.2 — Создайте проект

1. **New Project**  
2. Имя: `civilization-idle`  
3. Регион: ближайший к вам (например `Frankfurt`)  
4. **Create project**

### Шаг 1.3 — Скопируйте строку подключения

1. На главной странице проекта найдите **Connection string**  
2. Выберите вкладку с паролем (не "pooled" для первого раза тоже подойдёт)  
3. Скопируйте строку вида:

```
postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Сохраните её в блокнот — это ваш **`DATABASE_URL`**.

---

## Часть 2. Backend API (Render)

### Шаг 2.1 — Регистрация

1. https://render.com → **Get Started** → войдите через GitHub  

### Шаг 2.2 — Новый Web Service

1. Dashboard → **New +** → **Web Service**  
2. Подключите репозиторий `civilization-idle` (если не видно — **Configure account** и дайте доступ к GitHub)  
3. Выберите ваш репозиторий  

### Шаг 2.3 — Настройки сервиса

| Поле | Значение |
|------|----------|
| **Name** | `civilization-idle-api` |
| **Region** | тот же, что у Neon (по возможности) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npx prisma migrate deploy && npm start` |
| **Instance Type** | Free |

### Шаг 2.4 — Переменные окружения (Environment)

Нажмите **Advanced** → **Add Environment Variable**:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | вставьте строку из Neon |
| `NODE_ENV` | `production` |
| `BOT_TOKEN` | токен от [@BotFather](https://t.me/BotFather) (или временно `dev_bot_token_change_me` для теста) |
| `BOT_USERNAME` | имя бота без `@`, например `MyCivIdleBot` |
| `JWT_SECRET` | любая длинная случайная строка |
| `FRONTEND_URL` | пока оставьте пустым — заполните после Vercel |
| `ALLOW_BROWSER_PLAY` | `true` — чтобы игра открывалась в обычном браузере (для теста) |

### Шаг 2.5 — Деплой

1. **Create Web Service**  
2. Дождитесь статуса **Live** (5–10 минут)  
3. Скопируйте URL вида: `https://civilization-idle-api.onrender.com`

### Шаг 2.6 — Проверка API

Откройте в браузере:

```
https://ВАШ-API.onrender.com/health
```

Должно появиться: `{"status":"ok","game":"Civilization Idle"}`

Запомните адрес API для фронтенда:

```
https://ВАШ-API.onrender.com/api
```

> На бесплатном Render сервер «засыпает» после 15 мин без запросов. Первый заход может занять **30–60 секунд**.

---

## Часть 3. Frontend (Vercel) — публичная ссылка

### Шаг 3.1 — Регистрация

1. https://vercel.com → **Sign Up** → **Continue with GitHub**  

### Шаг 3.2 — Импорт проекта

1. **Add New…** → **Project**  
2. Найдите репозиторий `civilization-idle` → **Import**  

### Шаг 3.3 — Настройки сборки

В репозитории есть **корневой** `vercel.json` — он говорит Vercel деплоить только **frontend** (backend идёт на Render).

Если Vercel пишет *«vercel.json required to deploy projects with multiple services»* — сделайте `git pull` (чтобы подтянуть корневой `vercel.json`) и импортируйте проект снова.

| Поле | Значение |
|------|----------|
| **Framework Preset** | Vite (или Other) |
| **Root Directory** | оставьте **пустым** (корень репо) — сборка идёт через `vercel.json` |
| **Build Command** | можно оставить пустым (уже в `vercel.json`) |
| **Output Directory** | можно оставить пустым (уже в `vercel.json`) |

**Альтернатива:** Root Directory = `frontend`, Build = `npm run build`, Output = `dist` — тогда корневой `vercel.json` не обязателен.

### Шаг 3.4 — Переменная для API

Раскройте **Environment Variables** и добавьте:

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://ВАШ-API.onrender.com/api` |
| `VITE_BOT_USERNAME` | имя бота без `@` (для ссылки «Открыть в Telegram») |

(подставьте **ваш** URL из Render, обязательно с `/api` в конце)

### Шаг 3.5 — Деплой

1. **Deploy**  
2. Подождите 1–3 минуты  
3. Vercel покажет ссылку, например: `https://civilization-idle.vercel.app`

**Это и есть ваша публичная ссылка на игру.**

### Шаг 3.6 — Связать frontend и backend (CORS)

1. Вернитесь на **Render** → ваш Web Service → **Environment**  
2. Добавьте или обновите:

```
FRONTEND_URL=https://ваш-проект.vercel.app
```

(без слэша в конце, точный URL из Vercel)

3. **Save Changes** — Render перезапустит сервис  

### Шаг 3.7 — Проверка в браузере

1. Откройте ссылку Vercel  
2. Должен загрузиться экран игры  
3. Нажмите «Добыть» — ресурсы должны расти  
4. Зайдите в «Стройка» — покупки должны работать  

Если видите ошибку сети — проверьте `VITE_API_URL` и что API в статусе Live.

---

## Часть 4. Telegram Mini App (опционально)

Чтобы игра открывалась **внутри Telegram**, а не только в браузере:

### Шаг 4.1 — BotFather

1. Откройте [@BotFather](https://t.me/BotFather)  
2. `/newbot` — создайте бота, сохраните **токен**  
3. `/newapp` — выберите бота, название приложения  
4. Укажите **Web App URL**: ваша ссылка Vercel, например `https://civilization-idle.vercel.app`

### Шаг 4.2 — Обновите Render

В Environment на Render обновите:

- `BOT_TOKEN` — настоящий токен от BotFather  
- `BOT_USERNAME` — username бота  

Перезапустите сервис.

### Шаг 4.3 — Меню бота

В BotFather: `/setmenubutton` → выберите бота → укажите текст кнопки и тот же URL Vercel.

---

## Обновление игры после изменений в коде

1. На компьютере:

```bash
cd "/Users/alexfox/TG APP2"
git add .
git commit -m "Описание изменений"
git push
```

2. **Vercel** и **Render** автоматически пересоберут проект (если включён Auto-Deploy).  
3. Подождите 2–5 минут и обновите страницу.

---

## Частые проблемы

### «Failed to fetch» / игра не загружается

- Проверьте `VITE_API_URL` на Vercel (должен быть `https://...onrender.com/api`)  
- Откройте `/health` на Render — работает ли API?  
- Подождите минуту — free Render мог «проснуться»

### Покупки не работают, ресурсы сбрасываются

- Убедитесь, что `DATABASE_URL` на Render указан верно  
- В логах Render (вкладка **Logs**) не должно быть ошибок Prisma

### Страница 404 при обновлении (/buildings и т.д.)

- В проекте уже есть `frontend/vercel.json` — пересоберите деплой на Vercel

### «vercel.json required to deploy projects with multiple services»

- В корне репозитория должен быть файл **`vercel.json`** (уже добавлен в проект)
- Закоммитьте и запушьте: `git add vercel.json .vercelignore && git commit -m "add root vercel.json" && git push`
- На Vercel: **Redeploy** или импортируйте репозиторий заново

### «Missing Telegram init data»

**Причина:** игра открыта в Chrome/Safari, а не внутри Telegram. В production API требует данные Telegram.

**Решение A (для игроков):** открывайте через бота: Menu → Mini App, или ссылка `https://t.me/ВАШ_БОТ/app`

**Решение B (тест в браузере):** на Render добавьте переменную:
```
ALLOW_BROWSER_PLAY=true
```
Сохраните и дождитесь перезапуска. Обновите страницу Vercel.

**Важно:** `BOT_TOKEN` на Render должен быть **тот же токен**, что у бота в BotFather, через которого открываете приложение.

### CORS error в консоли браузера (F12)

- На Render задайте `FRONTEND_URL` точно как URL Vercel (https, без `/` в конце)

---

## Краткая шпаргалка

```
Neon     → DATABASE_URL
Render   → API: https://xxx.onrender.com
Vercel   → Игра: https://xxx.vercel.app
         → VITE_API_URL = https://xxx.onrender.com/api
         → FRONTEND_URL на Render = https://xxx.vercel.app
Telegram → Web App URL = https://xxx.vercel.app
```

Удачи! Если застрянете на конкретном шаге — напишите, на каком именно и что показывает экран.
