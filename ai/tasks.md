# План реализации: Self-Hosted Markdown Blog CMS

Источник требований: ai/requirements.md
Правила взаимодействия: ai/rules.md, ai/intro.md
Отложенные пункты фиксируются в: ai/tech-dep.md

Замечания к плану:
- Структура из ai/requirements.md:428-510 применяется к корню текущего проекта (oxygen-blog уже является каркасом Fresh 2.3.3), подкаталог blog/ не создается.
- Комментарии и идентификаторы в коде - только на английском (ai/requirements.md:74-76).
- Ограничения качества кода на каждый шаг: цикломатическая сложность функции <= 5, когнитивная <= 7, файл < 200 строк, один модуль - одна ответственность (ai/requirements.md:78-93).
- После каждого этапа прогонять `deno task check` (fmt + lint + type check) и заполнять блок «Итог».

---

## Этап 1. Каркас проекта, конфигурация, типы, KV-слой

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md (и .agents/skills/deno-frontend/references/FRESH.md при работе с Fresh) и использовать их.
- Перечитать ai/requirements.md:74-93 (стандарты кода) и ai/rules.md.

**Шаги:**
1. Очистить демо-код каркаса: удалить `islands/Counter.tsx`, `components/Button.tsx`, `routes/api/`, демо-мидлварь и демо-роут `/api2/:name` из `main.ts:8-27`; привести `routes/index.tsx` к заглушке блога.
2. Установить зависимости через `deno add` согласно стеку (ai/requirements.md:411-425): `marked`, `highlight.js`, bcrypt-модуль, `lucide-preact`. Использовать npm/JSR по правилам скилла deno.
3. Создать `.env.example` с переменными `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `PORT`, `KV_PATH`, `UPLOAD_DIR`, `SITE_URL` (ai/requirements.md:60-70).
4. Создать `types/index.ts` со всеми интерфейсами: Post, PostSnapshot, Page, Tag, MenuItem, Settings, User, Session (ai/requirements.md:159-247).
5. Создать `lib/kv.ts`: открытие KV по `KV_PATH`, именованные константы ключевых паттернов, хелперы атомарных операций (ai/requirements.md:119-157, 89-90).
6. Создать `utils/slugify.ts`, `utils/date.ts`, `utils/validate.ts` (ai/requirements.md:506-509).
7. Создать каталоги `data/`, `static/uploads/` и добавить их в `.gitignore` (ai/requirements.md:40-44).

**Итог:**
- Что сделано: удален демо-код каркаса (islands/Counter.tsx, components/Button.tsx, routes/api/, демо-мидлварь и роут /api2/:name в main.ts, routes/index.tsx заменен на заглушку); установлены зависимости marked@18, highlight.js@11, bcryptjs@3, lucide-preact@1; созданы .env.example, types/index.ts (все интерфейсы), lib/kv.ts (KvKeys + incrementCounter), utils/slugify.ts (с транслитерацией кириллицы), utils/date.ts, utils/validate.ts; созданы data/ и static/uploads/ с .gitkeep; .gitignore обновлен.
- Что отложено: ничего.
- Принятые решения: bcryptjs вместо нативного bcrypt (pure JS, без postinstall-скриптов); Deno KV включен через поле "unstable": ["kv"] в deno.json (runtime требует --unstable-kv); "deno.unstable" добавлен в compilerOptions.lib; каталоги ai/ и .agents/ исключены из deno fmt/lint/check, чтобы не переформатировать документацию и скиллы; State в utils.ts стал пустым типом-заготовкой object.
- Описание: каркас приведен в чистое состояние, базовый слой данных и утилиты готовы. Проверки: deno task check - зеленый; smoke-тесты slugify/validate/kv - успешны (тестовая kv.sqlite3 после проверки удалена).
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 2. Аутентификация и базовая безопасность (F9)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md (middleware - references/FRESH.md) и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:318-324 (F9), ai/requirements.md:514-522 (security checklist).

**Шаги:**
1. `lib/auth.ts`: хеширование/проверка пароля (bcrypt), создание и валидация сессий в KV `["sessions", token]`, срок жизни сессии (ai/requirements.md:318-324, 155-156, 242-246).
2. Скрипт/утилита первичной настройки admin-пользователя: чтение `ADMIN_PASSWORD_HASH` из env, создание `["users", "admin"]` (ai/requirements.md:63-66, 235-240, 319).
3. `routes/_middleware.ts`: security-заголовки CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ai/requirements.md:514-522).
4. Страница логина `routes/admin/login.tsx` + обработчик: opaque-токен в `httpOnly`, `Secure`, `SameSite=Strict` cookie; rate limiting на логин (in-memory sliding window) (ai/requirements.md:321-322, 516, 520).
5. `routes/admin/_middleware.ts`: guard по сессии, редирект на логин (ai/requirements.md:323).
6. Logout: очистка cookie и удаление сессии из KV (ai/requirements.md:324).

**Итог:**
- Что сделано: созданы lib/auth.ts (bcrypt-хеширование через bcryptjs, сессии в KV с expireIn 7 дней, ensureAdminUser из ADMIN_PASSWORD_HASH, cookie-хелперы readSessionToken/setSessionCookie/clearSessionCookie), lib/rate-limit.ts (SlidingWindowRateLimiter), routes/_middleware.ts (CSP, nosniff, DENY, Referrer-Policy), routes/admin/login.tsx (форма + POST с rate limit 5/5мин), routes/admin/_middleware.ts (guard, редирект на /admin/login), routes/admin/logout.tsx (POST, удаление сессии и cookie), routes/admin/index.tsx (временная заглушка дашборда для проверки потока); State в utils.ts получил поле user?: User.
- Что отложено: ничего. Заглушка routes/admin/index.tsx будет заменена настоящим дашбордом на этапе 7 (не долг, а плановая работа).
- Принятые решения: отказ от @std/http - jsr.io висел при скачивании (два таймаута подряд), cookie-хелперы (~30 строк) написаны в lib/auth.ts; admin-пользователь создается лениво при первом логине из ADMIN_PASSWORD_HASH вместо отдельного setup-скрипта (проще, меньше кода, F9 допускает); Secure-флаг cookie ставится только когда SITE_URL начинается с https:// (иначе логин не работает на localhost); logout только через POST.
- Описание: аутентификация и базовая безопасность работают end-to-end. Smoke-тест на dev-сервере: заголовки CSP/nosniff/DENY/Referrer-Policy есть; /admin без сессии -> 302 на логин; неверный пароль -> ошибка; верный пароль -> 303 + httpOnly SameSite=Strict cookie; /admin с cookie -> 200; logout -> 303, cookie обнулена, /admin снова 302; rate limiter блокирует с 6-й попытки. deno task check - зеленый. Тестовая kv.sqlite3 удалена.
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 3. Markdown, SEO, RSS - серверные библиотеки

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:326-337 (F10, F11), ai/requirements.md:419-420 (markdown, highlight.js).

**Шаги:**
1. `lib/markdown.ts`: `renderMarkdown()` на `marked` + `highlight.js`, санитизация HTML на выходе (ai/requirements.md:419-420, 518).
2. `lib/seo.ts`: генерация OpenGraph и Twitter Card тегов, canonical URL, JSON-LD BlogPosting (ai/requirements.md:329-332); компоненты `components/SeoMeta.tsx`, `components/JsonLd.tsx` (ai/requirements.md:489-490).
3. `lib/rss.ts`: генерация валидного RSS 2.0 с полным контентом (ai/requirements.md:334-337).
4. Ресурсные роуты `routes/rss.xml.ts` (с фильтром `?tag=`), `routes/sitemap.xml.ts`, `routes/robots.txt.ts` (ai/requirements.md:327-328, 334-337, 451-453).
5. Endpoint `routes/api/preview.ts`: серверный рендер Markdown для живого превью редактора (ai/requirements.md:279).

**Итог:**
- Что сделано: созданы lib/markdown.ts (marked GFM + highlight.js через marked-highlight + sanitize-html, плюс plainText для excerpt), lib/seo.ts (siteUrl/absoluteUrl/canonicalUrl, SeoMetaData, postJsonLd BlogPosting), components/SeoMeta.tsx, components/JsonLd.tsx, lib/rss.ts (RSS 2.0 с content:encoded), routes/rss.xml.ts (с фильтром ?tag=), routes/sitemap.xml.ts, routes/robots.txt.ts, routes/api/preview.ts (только для авторизованных). В lib/posts.ts и lib/pages.ts добавлены read-хелперы listPublishedPosts/listPages (полный CRUD - на этапах 4-5). Установлены marked-highlight, sanitize-html, @types/sanitize-html.
- Что отложено: привязка канала RSS к настройкам сайта (сейчас заглушка "oxygen-blog", будет заменена на F12 settings на этапе 9); риск блокировки JSON-LD строгим CSP - занесен в ai/tech-dep.md.
- Принятые решения: sanitize-html (npm) как зрелый санитайзер вместо самописного; marked-highlight как официальное расширение marked для highlight.js; /api/preview закрыт сессией, чтобы не быть открытым рендер-эндпоинтом; вынос escapeXml в lib/rss.ts (переиспользуется в sitemap).
- Описание: проверки пройдены. deno task check - зеленый. Юнит-smoke renderMarkdown: <script> вырезается, javascript: ссылки обезврежены, hljs-подсветка работает, plainText декодирует сущности. Серверный smoke: rss.xml отдает опубликованный пост с полным контентом, фильтр ?tag= работает; sitemap.xml включает индекс, пост и страницу; robots.txt корректен; /api/preview -> 401 без сессии и валидный HTML с сессией. Тестовая kv.sqlite3 удалена. Инцидент: после этапа 2 остался осиротевший vite-процесс на порту 5173, часть проверок пошла против него; процесс убит, проверки повторены на правильном сервере.
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 4. Посты: CRUD, статусы, версии (F1, F8)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:255-263 (F1), ai/requirements.md:307-316 (F8), ai/requirements.md:119-157 (KV-схема).

**Шаги:**
1. `lib/posts.ts`: CRUD постов, авто-генерация slug из title, проверка уникальности slug перед записью, авто-excerpt (первые 200 символов) (ai/requirements.md:256-259).
2. Машина статусов: `draft -> published` (снапшот + `publishedAt`), `published -> draft`, `scheduled` (ai/requirements.md:260-263).
3. Снапшоты при публикации: запись `["post_versions", postId, timestamp]` + `["post_version_meta", postId]`; черновые правки не создают снапшотов (ai/requirements.md:137-138, 308, 316).
4. Вторичные индексы: `posts_by_tag`, `post_ids` - атомарная запись вместе с постом (ai/requirements.md:125-126).
5. Админ-роуты постов: `routes/admin/posts/index.tsx` (список с click-to-sort, ai/requirements.md:104), `routes/admin/posts/[id].tsx` (редактор).
6. Вкладка «History» в редакторе: список версий (дата, title, tags), просмотр версии read-only с бейджем даты, «Restore to draft» как копия в новый черновик (ai/requirements.md:310-315).
7. Inline-валидация: уникальность slug on blur, пустой title при сохранении (ai/requirements.md:105).
8. Удаление поста: красная кнопка + confirm-модал с именем (ai/requirements.md:102).

**Итог:**
- Что сделано: lib/posts.ts (чтение: listPublishedPosts/listDrafts/listAllPosts/getPostById/getPublishedBySlug/isSlugTaken/uniqueSlug) и lib/post-mutations.ts (запись: createPost/updatePost/publishPost/unpublishPost/deletePost, атомарная запись с индексами posts_by_tag/post_ids, снапшоты post_versions + post_version_meta); lib/versions.ts (listVersions/getVersion/restoreVersionToDraft); kv.ts: addToList/removeFromList; роуты routes/admin/posts/index.tsx (список с click-to-sort + New post), routes/admin/posts/[id].tsx (редактор, вкладки Edit/History), routes/admin/posts/[id]/versions/[versionId].tsx (read-only просмотр + Restore to draft), routes/admin/api/slug-check.ts; островки islands/SlugField.tsx (проверка slug on blur) и islands/ConfirmDelete.tsx (модал с именем); components/PostForm.tsx (все поля на экране).
- Что отложено: ничего. Таб «History» переключается через ?tab= (без JS) - так задумано. Авто-публикация scheduled-постов - это F20 (этап 12), в этом этапе только хранение статуса и publishedAt.
- Принятые решения: lib/posts.ts разделен на чтение (posts.ts) и запись (post-mutations.ts) из-за лимита 200 строк на файл; scheduled-посты хранятся в draft-пространстве ключей, чтобы не попадать на публичный сайт до срока; publish из редактора сначала сохраняет поля формы, потом публикует; восстановление версии создает новый черновик с новым id и суффиксом slug; удаление поста стирает и историю версий; смена статуса draft/scheduled недоступна для опубликованных (select disabled, статус меняется через Unpublish).
- Описание: deno task check - зеленый. Smoke-тест на dev-сервере прошел полный цикл: логин -> создание черновика -> сохранение (валидация пустого title работает) -> публикация (снапшот создан, publishedAt выставлен) -> републикация (второй снапшот) -> вкладка History (2 версии) -> просмотр версии с бейджем -> Restore to draft (новый черновик) -> Unpublish (пост исчез из rss.xml) -> удаление обоих постов (post_ids, post_versions, posts_by_tag очищены). Отдельно проверен UTF-8 round-trip кириллицы через lib-слой (кракозябры в curl-тестах - артефакт кодировки Git Bash, не приложения). Тестовая kv.sqlite3 удалена.
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 5. Страницы и теги: CRUD (F2, F3)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:265-275 (F2, F3).

**Шаги:**
1. `lib/pages.ts`: CRUD страниц, уникальность slug, поля `showInMenu`, `menuOrder` (ai/requirements.md:265-269, 194-206).
2. `lib/tags.ts`: CRUD тегов, slug как первичный ключ; при удалении тега - атомарное снятие ссылки со всех постов (ai/requirements.md:271-274).
3. Админ-роуты: `routes/admin/pages/index.tsx`, `routes/admin/pages/[id].tsx`, `routes/admin/tags/index.tsx`, `routes/admin/tags/[slug].tsx` (ai/requirements.md:462-467).
4. Архив тега `routes/tag/[slug].tsx`: список постов по тегу (ai/requirements.md:275, 449-450).

**Итог:**
- Что сделано: lib/pages.ts (CRUD страниц: уникальность slug, showInMenu, menuOrder, атомарная смена slug), lib/tags.ts (CRUD тегов; deleteTag атомарно снимает тег со всех постов и чистит posts_by_tag; listPostsByTag по индексу); роуты routes/admin/pages/index.tsx, routes/admin/pages/[id].tsx, routes/admin/tags/index.tsx (с inline-созданием), routes/admin/tags/[slug].tsx (редактор + список постов с тегом); публичный routes/tag/[slug].tsx; SlugField и /admin/api/slug-check поддерживают type=page; ConfirmDelete получил prop actionUrl для удаления из списков.
- Что отложено: ничего.
- Принятые решения: slug тега иммутабелен после создания (он первичный ключ; переименование потребовало бы миграции tags[] во всех постах - выходит за рамки F3); создание тега не суффиксует slug, а возвращает ошибку "Tag already exists" (теги - именованная сущность, в отличие от постов); публичный архив тега отдает 404 для несуществующего тега; дизайн архива минимальный - публичная тема оформляется на этапе 6.
- Описание: deno task check - зеленый. Smoke-тест: страница создана и сохранена (showInMenu, menuOrder, full-width); slug-check для страниц отличает занятый slug от собственного; тег создан (slug из имени), переименован (name/description), пост опубликован с тегом; /tag/tech показал пост и имя тега; удаление тега атомарно очистило tags поста и индекс, /tag/tech стал отдавать 404; после удаления тестовых сущностей post_ids/page_ids/tag_ids и post_versions пусты. kv.sqlite3 удалена, порт освобожден, осиротевших процессов нет.
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 6. Публичный сайт: рендеринг, шаблоны, навигация (F7, F10)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno-frontend/references/FRESH.md и использовать их.
- Перечитать ai/requirements.md:108-112 (принципы публичного сайта), ai/requirements.md:302-305 (F7), ai/requirements.md:326-332 (F10).

**Шаги:**
1. `routes/_app.tsx`: корневой layout, подключение Tailwind, SEO-теги по умолчанию из настроек (ai/requirements.md:223-233, 341).
2. `routes/index.tsx`: список опубликованных постов с пагинацией по `postsPerPage` (ai/requirements.md:232, 445).
3. `routes/[slug].tsx` и `routes/page/[slug].tsx`: рендер поста/страницы, выбор шаблона `default` (с сайдбаром) / `full-width` (ai/requirements.md:302-305, 446-448).
4. Компоненты: `Header.tsx`, `Footer.tsx`, `Sidebar.tsx`, `PostCard.tsx`, `PageCard.tsx`, `TagBadge.tsx`, `Pagination.tsx` (ai/requirements.md:481-488).
5. Навигация из меню KV с in-memory кэшем 60 секунд (ai/requirements.md:300).
6. Подключить SEO-мету и JSON-LD на страницах постов и страниц (ai/requirements.md:329-332).
7. Проверить: ноль клиентского JS на публичных страницах - без островков и гидратации (ai/requirements.md:109, 530); типографика-first дизайн, mobile-first Tailwind (ai/requirements.md:110-111).

**Итог:**
- Что сделано: routes/_app.tsx (lang=ru, favicon, rss alternate, базовые стили body); подключен @tailwindcss/typography (класс prose); lib/menu.ts (getMenuItems с in-memory кэшем 60с, getNavLinks с fallback на страницы showInMenu); lib/settings.ts (getSettings с DEFAULT_SETTINGS - создан раньше этапа 9, т.к. нужен публичным роутам); компоненты Header, Footer, Sidebar (recent posts + теги), PostCard, TagBadge, Pagination; routes/index.tsx (пагинация по postsPerPage); routes/[slug].tsx (пост: шаблоны default/full-width, SeoMeta, JSON-LD BlogPosting); routes/page/[slug].tsx (страница, тот же шаблонный механизм); routes/tag/[slug].tsx переведен на общие компоненты.
- Что отложено: ничего. PageCard.tsx из плана не создан - нет ни одного места, где он нужен (YAGNI, ai/requirements.md:91).
- Принятые решения: lib/settings.ts создан на этом этапе (read-only с дефолтами), чтобы не плодить временные константы siteName/postsPerPage; запись настроек и страница админки - по-прежнему этап 9; при пустом меню навигация строится из страниц с showInMenu (осмысленный дефолт до появления menu builder); счетчики просмотров НЕ добавлены в публичные роуты - это этап 10 (F13).
- Описание: deno task check - зеленый. Smoke-тест (seed: 2 поста, страница about в меню, тег tech, postsPerPage=1): главная отдает один пост и пагинацию (Page 1 of 2, Older posts), ?page=2 - второй пост; страница поста содержит og:type=article, canonical, JSON-LD BlogPosting, сайдбар; единственный script на странице - ld+json (ноль клиентского JS подтверждено); /page/about работает, в шаблоне full-width сайдбар отсутствует; /tag/tech работает; неизвестный slug -> 404; навигация собрана из showInMenu-страницы. Тестовая БД удалена, порт свободен, сирот нет.
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 7. Админка: layout и Markdown-редактор (F4)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno-frontend/references/FRESH.md (islands, signals) и использовать их.
- Перечитать ai/requirements.md:99-107 (UI/UX админки), ai/requirements.md:277-284 (F4).

**Шаги:**
1. `routes/admin/_layout.tsx`: постоянный левый сайдбар, вложенность <= 2 уровней, любой раздел <= 2 кликов (ai/requirements.md:100, 457).
2. `routes/admin/index.tsx`: дашборд-обзор (ai/requirements.md:458).
3. `islands/MarkdownEditor.tsx`: split-pane, левая панель - textarea, правая - живое превью через `/api/preview` с debounce 300 мс (ai/requirements.md:278-280, 284).
4. Тулбар: bold, italic, heading, link, image, code block, quote, list (ai/requirements.md:281).
5. Кнопка «Insert image»: модал медиатеки, вставка `![alt](/uploads/filename.png)` в позицию курсора (ai/requirements.md:282).
6. «Focus mode»: скрытие превью, textarea на всю ширину (ai/requirements.md:283).
7. Редактор как полноэкранный отдельный view; все редактируемые поля видимы, без скрытых «advanced» панелей (ai/requirements.md:101, 103).
8. Тема light/dark для админки: system-aware default, переключатель (ai/requirements.md:106).

**Итог:**
- Что сделано: `routes/admin/_layout.tsx` (постоянный левый сайдбар: Dashboard, Posts, Pages, Tags, Media, Menu, Settings, Analytics; подсветка активного пункта; кнопка Sign out; `/admin/login` рендерится без сайдбара; вложенность 1 уровень, любой раздел в 1 клик); `routes/admin/index.tsx` (дашборд: счётчики постов/страниц/тегов, список недавних постов); `lib/media.ts` (пока только `listMediaFiles`, dotfiles отфильтрованы) и `routes/admin/api/media.ts` (GET -> `{files}`); `islands/MarkdownEditor.tsx` (split-pane: textarea слева, живое превью справа через `/api/preview` с debounce 300 мс; тулбар B/I/H/Link/Code/Quote/List работает с выделением через selection API; Focus mode скрывает превью; кнопка Image открывает модал медиатеки и вставляет `![name](url)` в позицию курсора); модал вынесен в `islands/MediaPicker.tsx` (лимит 200 строк на файл); редактор подключён в `components/PostForm.tsx` и `routes/admin/pages/[id].tsx` вместо plain textarea; тема light/dark system-aware через `prefers-color-scheme` (dark:-классы Tailwind). `deno task check` зелёный; smoke-тест: логин 303, дашборд 200 со сайдбаром, `/admin/login` без сайдбара, страница редактора 200 (тулбар в разметке), `/admin/api/media` -> `{"files":[]}`, `/api/preview` рендерит Markdown.
- Что отложено: ручной переключатель темы (сейчас только system-aware); редактор встроен в форму, а не вынесен в отдельный полноэкранный view; гидратация островков проверена косвенно (код собирается, эндпоинты отвечают, JS через curl не проверить); разделы Media/Menu/Settings/Analytics в сайдбаре ведут на 404 до этапов 8-10 (планово).
- Принятые решения: тема через media-вариант Tailwind `dark:` вместо class-стратегии (ручной переключатель потребует `@custom-variant`, делаем вместе со страницей настроек на этапе 9); текстовые кнопки тулбара вместо lucide-preact (меньше вес островка); редактор оставлен внутри формы (все поля видимы, требование ai/requirements.md:101 соблюдено без отдельного view); `MediaPicker` - отдельный островок-файл ради лимита 200 строк.
- Описание: админка обрела постоянный каркас с навигацией и дашборд, а редактирование контента - полноценный Markdown-редактор с живым превью (рендерится сервером через существующий `/api/preview`, поэтому превью всегда совпадает с публичным выводом), тулбаром и вставкой изображений из медиатеки.
- Отложенные пункты занесены в ai/tech-dep.md

---

## Этап 8. Медиатека (F5)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md (permissions на запись файлов) и использовать их.
- Перечитать ai/requirements.md:286-293 (F5), ai/requirements.md:519 (валидация загрузок).

**Шаги:**
1. `lib/media.ts`: сохранение в `UPLOAD_DIR` (default `./static/uploads`), именование `{timestamp}-{original-name}`, валидация MIME, размера <= 5MB, безопасного имени (ai/requirements.md:288-293, 69).
2. Форматы: PNG, JPG, WebP, GIF, SVG (ai/requirements.md:290).
3. `islands/MediaUploader.tsx`: drag-and-drop + file picker (ai/requirements.md:287, 477).
4. `routes/admin/media.tsx`: сетка превью, выбор/вставка, удаление с подтверждением (ai/requirements.md:292, 468).
5. API-роуты загрузки/удаления под auth-guard админки.

**Итог:**
- Что сделано: lib/media.ts расширен (validateUpload: MIME + размер <= 5MB + соответствие расширения MIME + безопасное имя; sanitizeFileName; saveMediaFile с именованием `{timestamp}-{name}` и записью createNew - без перезаписи чужих файлов; deleteMediaFile с защитой от path traversal); routes/admin/api/media.ts получил POST (multipart, поле file) и DELETE (?name=) рядом с GET; islands/MediaUploader.tsx (drag-and-drop зона + file picker, ранняя клиентская проверка размера, ошибка от сервера показывается под зоной); routes/admin/media.tsx (сетка превью с именем, URL и красным удалением через ConfirmDelete формой, пустое состояние); .env.example - предупреждение об одинарных кавычках вокруг bcrypt-хеша.
- Что отложено: ничего (проверка реальной гидратации островков в браузере по-прежнему покрывается общим пунктом tech-dep «Проверка гидратации островков в браузере»).
- Принятые решения: островок MediaUploader НЕ импортирует lib/media.ts - на верхнем уровне того стоит Deno.env.get(UPLOAD_DIR), который попал бы в клиентский бандл и уронил бы гидратацию (проверено: в клиентских модулях островков после фикса нет ни Deno-ссылок, ни импорта lib/media); лимит 5MB продублирован локальной константой, сервер перепроверяет; удаление из UI идет формой POST на /admin/media (ConfirmDelete), а JSON DELETE /admin/api/media оставлен как программный API (шаг 5 плана); «click to select/insert» из F5 реализован модалом MediaPicker в редакторе (этап 7), на отдельной странице медиатеки цели вставки нет - там показывается готовый URL каждого файла; расширение сохраненного файла всегда каноническое для MIME (из карты MIME_TO_EXT), а не из оригинального имени; найден и задокументирован подводный камень dotenv: bcrypt-хез содержит `$2a$10$...`, и загрузчик .env раскрывает фрагменты `$...` как переменные окружения (в т.ч. `$2`, `$10` - позиционные), поэтому значение обязательно брать в одинарные кавычки (одинарные кавычки отключают подстановку, двойные - нет); заодно исправлен случайно записанный прошлой сессией тестовый хеш в .env.example.
- Описание: deno task check - зеленый. Smoke-тест на dev-сервере: /admin/api/media без сессии -> 302 на логин; загрузка без сессии -> 302; логин -> 303 + cookie; валидный PNG -> 201, на диске {ts}-valid.png; text/plain -> 400 "Unsupported type"; PNG-контент с именем .jpg -> 400 "Extension must match"; 6MB -> 400 по размеру; sanitizeFileName (юнит-прогон): кириллица "Фото тест!.png" -> безопасное имя без обхода, "../../../etc/passwd.png" -> "etc-passwd.png", "my file (1).PNG" через API -> сохранен как {ts}-my-file-1.png (хвостовой дефис обрезается); GET /admin/api/media -> список новые сверху; GET /admin/media -> 200 с именами файлов; форм-удаление -> 302, файл исчез с диска; DELETE API -> 204; DELETE с ?name=../../.env -> 404 отклонен (SAFE_NAME), несуществующий -> 404; отдача /uploads/{name} -> 200 image/png; пустое состояние "No uploaded files yet" рендерится. Тестовая kv.sqlite3 и tmp-файлы удалены, порт свободен, осиротевших процессов нет.
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 9. Меню и настройки (F6, F12)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md (islands) и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:295-300 (F6), ai/requirements.md:339-345 (F12).

**Шаги:**
1. `lib/menu.ts`: чтение/запись `["menu", "items"]` как `MenuItem[]` (ai/requirements.md:141, 299).
2. `islands/MenuBuilder.tsx`: drag-and-drop перестановка с drag-хендлами (ai/requirements.md:104, 296, 478).
3. `routes/admin/menu.tsx`: добавление пунктов (page / post / external + label), удаление с подтверждением (ai/requirements.md:297-298, 469).
4. `lib/settings.ts`: чтение/запись `["settings"]` с дефолтами (ai/requirements.md:144, 345, 503).
5. `routes/admin/settings.tsx`: имя сайта, описание, загрузка лого/фавикона, дефолтные SEO-мета, social links, тема, postsPerPage (ai/requirements.md:340-344, 470).

**Итог:**
- Что сделано: - заполнить после выполнения этапа
- Что отложено: - заполнить после выполнения этапа
- Принятые решения: - заполнить после выполнения этапа
- Описание: - заполнить после выполнения этапа
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 10. Аналитика и экспорт/импорт (F13, F14)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:347-362 (F13, F14), ai/requirements.md:147-149 (счетчики).

**Шаги:**
1. `lib/analytics.ts`: атомарный инкремент `["views", "post"|"page", id]`, дневная агрегация `["analytics", "daily", date]`; вызов из публичных роутов (ai/requirements.md:147-149, 348, 502).
2. `routes/admin/analytics.tsx`: total posts/pages/tags, total views, top-10 постов и страниц, views за 7 дней; графики - server-rendered SVG (ai/requirements.md:350-356, 471).
3. Экспорт: JSON-дамп всех данных в формате `{ version, exportedAt, data }` на скачивание (ai/requirements.md:359, 362).
4. Импорт: загрузка JSON, валидация схемы, атомарная замена всех данных (ai/requirements.md:360).
5. `routes/admin/export-import.tsx` (ai/requirements.md:474).

**Итог:**
- Что сделано: - заполнить после выполнения этапа
- Что отложено: - заполнить после выполнения этапа
- Принятые решения: - заполнить после выполнения этапа
- Описание: - заполнить после выполнения этапа
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 11. Should-Have v2 (F15-F18)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:364-385 (раздел 7.2).

**Шаги:**
1. F15: `routes/admin/performance.tsx` - avg response time (последние 100 запросов), cache hit rate, размер страниц, KV latency (ai/requirements.md:366-369, 472).
2. F16: поиск - server-side инвертированный индекс в KV при публикации; `routes/search.tsx` с `?q=` (ai/requirements.md:371-374, 454).
3. F17: тёмная тема публичного сайта - toggle в футере/хедере, `localStorage`, Tailwind `dark:` (единственный JS на публичном сайте) (ai/requirements.md:376-379).
4. F18: `routes/admin/redirects.tsx` - 301/302, проверка в middleware до роутинга, KV `["redirects", oldSlug]` (ai/requirements.md:152, 381-385, 473).

**Итог:**
- Что сделано: - заполнить после выполнения этапа
- Что отложено: - заполнить после выполнения этапа
- Принятые решения: - заполнить после выполнения этапа
- Описание: - заполнить после выполнения этапа
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 12. Nice-to-Have v3 (F19-F23)

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md и использовать их.
- Перечитать ai/requirements.md:387-407 (раздел 7.3).

**Шаги:**
1. F19: diff-view двух PostSnapshot side-by-side с подсветкой изменений (ai/requirements.md:389-391).
2. F20: авто-публикация scheduled-постов: проверка при старте сервера + раз в час (ai/requirements.md:393-395).
3. F21: related posts по общим тегам внизу страницы поста (ai/requirements.md:397-399).
4. F22: TOC из H2/H3 в сайдбаре шаблона `default` (ai/requirements.md:401-403).
5. F23: импорт из WordPress XML / Ghost JSON как черновики (ai/requirements.md:405-407).

**Итог:**
- Что сделано: - заполнить после выполнения этапа
- Что отложено: - заполнить после выполнения этапа
- Принятые решения: - заполнить после выполнения этапа
- Описание: - заполнить после выполнения этапа
- Отложенные пункты занести в ai/tech-dep.md

---

## Этап 13. Деплой, бэкапы, финальный аудит

**Пререквизиты:**
- Перечитать скиллы .agents/skills/deno-frontend/SKILL.md и .agents/skills/deno/SKILL.md (deno ci, lockfile) и использовать их.
- Перечитать ai/requirements.md:31-70 (раздел 3), ai/requirements.md:514-534 (разделы 10-11).

**Шаги:**
1. `Dockerfile`: single-stage на `denoland/deno:alpine`, volume `/app/data` и `/app/static/uploads` (ai/requirements.md:35-44, 436-439).
2. Документировать backup-скрипт: остановка контейнера, `tar czf backup-$(date +%F).tar.gz data/ static/uploads/`, выгрузка, рестарт (ai/requirements.md:53-58).
3. Пример конфигурации Nginx: TLS через Let's Encrypt, статика напрямую через Nginx, прокси на порт 8000 (ai/requirements.md:46-51).
4. Убедиться, что вся конфигурация - только через env, без конфигов в образе (ai/requirements.md:61).
5. Пройти security-чеклист целиком и отметить пункты (ai/requirements.md:514-522).
6. Замерить performance targets: TTFB < 100ms, вес страницы < 150KB, ноль JS на публичных страницах, KV read < 5ms, admin bundle < 100KB (ai/requirements.md:526-534).
7. Финальный `deno task check` + ручной smoke-тест всех разделов; свериться с out-of-scope списком - ничего лишнего не построено (ai/requirements.md:15-27).

**Итог:**
- Что сделано: - заполнить после выполнения этапа
- Что отложено: - заполнить после выполнения этапа
- Принятые решения: - заполнить после выполнения этапа
- Описание: - заполнить после выполнения этапа
- Отложенные пункты занести в ai/tech-dep.md
