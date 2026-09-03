# Техническое задание на API — Dinisify

## 1. Общее описание

API — единая точка входа для Web и Mobile клиентов.

### Base URL

| Окружение | URL |
|---|---|
| Пример (заглушка) | `http://0.0.0.0:5000/api/` |

`0.0.0.0` — адрес "слушать все интерфейсы" на самом сервере. Для клиента сюда нужно подставить реальный IP/домен машины, где крутится API (например `http://192.168.1.10:5000/api/` или `http://localhost:5000/api/` при локальной разработке).

---

## 2. Авторизация

- Гость ходит без токена (список ниже, п. 6.1).
- Всё остальное требует токен:
```
Authorization: Bearer <token>
```
- В токене — роль пользователя (`guest` / `user` / `moderator` / `admin`), по ней сервер решает, что разрешено.
- Нет токена или он невалиден → `401 UNAUTHORIZED`.
- Не хватает роли → `403 FORBIDDEN`.
- Токен без срока действия, не истекает. Отключить юзера можно только через `is_blocked = true` в БД. Поэтому на каждый запрос сервер должен проверять не только подпись токена, но и текущий `is_blocked` из базы.

---

## 3. Формат дат и полей

- Даты — ISO 8601, UTC: `2026-09-04T12:00:00Z`
- Поля в JSON — `snake_case`: `{ "user_id": 1, "created_at": "..." }`
- В C#-коде — как обычно, PascalCase, маппинг через `[JsonPropertyName("user_id")]`

---

## 4. Формат ответа

Одна обёртка на все эндпоинты:

```json
{
  "code": "OK",
  "message": "текст сообщения",
  "result": { }
}
```

Ошибка:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "result": {
    "errors": [
      { "field": "email", "reason": "invalid_format" }
    ]
  }
}
```

### Коды ошибок

| `code` | HTTP | Когда |
|---|---|---|
| `OK` | 200/201 | Успех |
| `VALIDATION_ERROR` | 400 | Невалидные данные |
| `UNAUTHORIZED` | 401 | Нет/невалиден токен |
| `FORBIDDEN` | 403 | Не хватает роли |
| `NOT_FOUND` | 404 | Не найдено |
| `CONFLICT` | 409 | Дубликат (email занят и т.п.) |
| `INTERNAL_ERROR` | 500 | Ошибка сервера |

---

## 5. Пагинация

Для списков — треки, плейлисты, чарты:

```
GET /tracks?page=1&limit=20
```
```json
{
  "code": "OK",
  "message": "OK",
  "result": {
    "items": [ ],
    "pagination": { "page": 1, "limit": 20, "total_items": 134, "total_pages": 7 }
  }
}
```

---

## 6. Эндпоинты по ролям

Чарты считаются на лету, без отдельной таблицы-кэша: запрос сортирует треки по количеству лайков (`COUNT` по `user_likes`) и отдаёт список с счётчиком и ссылкой на стрим:
```json
{
  "code": "OK",
  "message": "OK",
  "result": {
    "items": [
      { "track_id": 1, "name": "...", "author": "...", "likes_count": 342, "stream_url": "/tracks/1/stream" }
    ]
  }
}
```

### 6.1 Гость (без токена)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация (почта/телефон) |
| POST | `/auth/login` | Вход |
| POST | `/auth/password-reset` | Восстановление пароля |
| GET | `/tracks` | Список треков |
| GET | `/tracks/{id}/stream` | Прослушивание трека |
| GET | `/search?q=` | Поиск треков/исполнителей/альбомов |
| GET | `/playlists/public` | Публичные плейлисты |
| GET | `/albums/{id}` | Просмотр альбома (список треков по `album_id`) |
| GET | `/charts` | Чарты (топ треков/альбомов/исполнителей) |

### 6.2 Пользователь (роль `user`)

| Метод | Путь | Описание |
|---|---|---|
| GET / PATCH | `/profile` | Просмотр/редактирование профиля (аватар, никнейм, email) |
| PATCH | `/profile/password` | Смена пароля |
| PATCH | `/profile/privacy` | Настройки приватности |
| GET | `/profile/history` | История прослушиваний |
| GET / POST | `/playlists` | Список своих плейлистов / создание |
| PATCH / DELETE | `/playlists/{id}` | Редактирование / удаление плейлиста |
| POST / DELETE | `/playlists/{id}/tracks` | Добавить / удалить трек из плейлиста |
| PATCH | `/playlists/{id}/visibility` | Публичный/приватный доступ |
| POST | `/playlists/{id}/collaborators` | Совместный плейлист (добавить участника) |
| GET | `/recommendations` | Рекомендации (по истории/лайкам/жанрам) |
| POST | `/tracks/upload` | Загрузка своего трека (файл + метаданные) на модерацию |
| GET | `/charts/personal` | Персональные чарты |
| GET | `/charts?genre=&period=` | Чарты по жанру/периоду |
| POST / DELETE | `/users/{id}/follow` | Подписка/отписка на пользователя или исполнителя |
| POST / DELETE | `/tracks/{id}/like` | Лайк/дизлайк трека |
| GET / POST | `/tracks/{id}/comments` | Комментарии под треком |
| POST | `/complaints` | Пожаловаться на трек/пользователя/комментарий |

### 6.3 Модератор (роль `moderator`)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/moderation/tracks` | Треки, ожидающие модерации |
| PATCH | `/moderation/tracks/{id}` | Добавить/отредактировать трек |
| POST | `/moderation/tracks/{id}/reject` | Отклонить трек (с причиной) |
| DELETE | `/moderation/tracks/{id}` | Удалить/заблокировать контент |
| GET | `/moderation/complaints` | Жалобы пользователей |
| GET | `/moderation/stats` | Статистика платформы (опционально) |

### 6.4 Администратор (роль `admin`)

| Метод | Путь | Описание |
|---|---|---|
| GET / PATCH | `/admin/users` | Управление пользователями (блокировка, роли) |
| GET / PATCH | `/admin/moderators` | Управление модераторами |
| GET | `/admin/analytics` | Общая аналитика сервиса |
| GET / POST / PATCH / DELETE | `/admin/genres` | Управление жанрами/категориями |

---

## 7. Примеры эндпоинтов (шаблон — копировать под новые методы)

### `POST /tracks/upload` — Загрузка трека

Заголовки:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Тело запроса:
```
file: audio.mp3
title: "string"
artist: "string"
genre: "string"
cover: image.jpg (опционально)
```

Успешный ответ `201`:
```json
{
  "code": "OK",
  "message": "Track sent for moderation",
  "result": {
    "track_id": 1,
    "status": "pending_moderation"
  }
}
```

Ошибки:

| Код | HTTP | Причина |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Не хватает обязательных полей / неподдерживаемый формат файла |
| `UNAUTHORIZED` | 401 | Нет токена |

---

### `GET /tracks/{id}/stream` — Прослушивание (исключение из общего формата)

Единственный эндпоинт, который не оборачивается в `{ code, message, result }` — он отдаёт сырой файл, а не JSON.

Заголовки ответа:
```
Content-Type: audio/mpeg
Accept-Ranges: bytes
Content-Length: 4500000
```

- Доступен и гостю, и авторизованному пользователю, без разницы в каталоге
- Клиент делает обычный `GET`, плеер начинает проигрывание по мере загрузки
- При перемотке плеер сам шлёт повторный запрос с заголовком `Range: bytes=2000000-`, сервер отвечает `206 Partial Content` с нужным куском файла
- В ASP.NET Core: `return PhysicalFile(path, "audio/mpeg", enableRangeProcessing: true);` — Range-логику писать вручную не нужно

---

## 8. Вопросы что могут выйти по пути чтения

- Загрузка файлов — `multipart/form-data`
- Максимальный размер файла — без лимита
- Срок жизни токена — бессрочный, блокировка только через `is_blocked`
- Артисты — текстовое поле `music.author`, не аккаунт. Подписка на "исполнителя" технически = подписка на `music.owner_id` (того, кто загрузил трек)
- Чарты — считаются на лету по количеству лайков, без кэш-таблицы
- Альбомы — readonly-плейлист (группировка треков по `album_id`)
- Гость может слушать музыку без ограничений

---

## 9. Соответствие таблиц БД и ресурсов API

| Таблица БД | Ресурс API | Комментарий |
|---|---|---|
| `user` | `/profile`, `/admin/users` | — |
| `music` | `/tracks` | В коде модель `Music`, в путях — `tracks` |
| `music_genre` | `/admin/genres` | — |
| `album` | `/albums` | Только чтение |
| `playlist` | `/playlists` | — |
| `user_likes` | `/tracks/{id}/like` | — |
| `user_listened` | `/profile/history` | — |
| `follows` | `/users/{id}/follow` | — |
| `comments` | `/tracks/{id}/comments` | — |
| `complaints` | `/complaints`, `/moderation/complaints` | Пользователь создаёт, модератор смотрит |
| `password_reset_tokens` | `/auth/password-reset` | — |

---

## 10. Изменения в схеме БД

- `music.owner_id` (FK → user) — новое поле, обязательное, заполняется при загрузке трека текущим юзером. `author` остаётся как было — свободный текст, не привязан к `owner_id`
- `album` — остаётся как в схеме, отдельный CRUD не нужен, доступ только на чтение через `/albums/{id}`
