# ExamGrid

Imtihonlarda o'quvchilarni xonalarga taqsimlash tizimi. React 18 + Vite + Tailwind frontend, Express API, PostgreSQL, JWT va superadmin/nazoratchi rollari.

## Neon + Vercel deploy

### 1. Neon bazasini tayyorlash

1. Neon Console'da PostgreSQL loyiha yarating. Vercel funksiyasi `fra1` (Frankfurt) hududida ishlaydi; Neon uchun ham yaqin hudud tanlang yoki `vercel.json` dagi regionni moslang.
2. **Connect** oynasidan pooled connection string oling (`-pooler` hostname). Uni `DATABASE_URL` sifatida ishlating.
3. Schema yaratish uchun direct connection stringni ham oling (`-pooler` bo'lmagan hostname): `DATABASE_URL_UNPOOLED`.

### 2. Bazani bir marta yaratish

Node.js 24 va npm kerak. Repozitoriya ildizida:

```powershell
npm run install:all
Copy-Item server/.env.example server/.env
```

`server/.env` qiymatlarini to'ldiring:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@ep-EXAMPLE-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@ep-EXAMPLE.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
ADMIN_USERNAME=admin
ADMIN_PASSWORD=REPLACE_WITH_YOUR_ADMIN_PASSWORD
PORT=5000
```

Tasodifiy JWT kalit yaratish:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

So'ng:

```powershell
npm run db:init
```

Bu buyruq schema va superadminni bitta tranzaksiyada yaratadi. Takror ishlatilganda mavjud adminning paroli va roli yangilanadi. `ADMIN_PASSWORD` kamida 8 belgidan iborat bo'lishi kerak. `DATABASE_URL_UNPOOLED` berilmasa, `DATABASE_URL` ishlatiladi. Schema build yoki har bir API so'rovida avtomatik bajarilmaydi. Schema yangi baza uchun mo'ljallangan; eski bazalardagi mavjud jadvallar tuzilishini avtomatik yangilamaydi.

### 3. Vercel sozlamalari

Vercel'da Git repozitoriyani import qiling:

| Sozlama | Qiymat |
| --- | --- |
| Root Directory | repozitoriya ildizi (`.`), `client` emas |
| Framework Preset | Other |
| Node.js | 24.x |
| Install Command | `vercel.json` orqali avtomatik |
| Build Command | `npm run build --prefix client` |
| Output Directory | `client/dist` |

**Settings → Environment Variables** bo'limida:

| O'zgaruvchi | Qayerda kerak |
| --- | --- |
| `DATABASE_URL` | Production: Neon pooled ulanishi |
| `JWT_SECRET` | Production: kamida 32 belgili tasodifiy kalit |

Preview deploymentlar uchun alohida Neon branch bazasi va alohida JWT kalitidan foydalaning. Preview bazasini ham `db:init` bilan tayyorlang. `ADMIN_PASSWORD` va direct ulanish Vercel runtime uchun kerak emas; ular faqat bazani lokal tayyorlashda ishlatiladi. Sirlarni `VITE_*` o'zgaruvchilariga yozmang: ular frontend bundle ichiga tushadi.

**Deploy** bosing. Environment variables o'zgarsa, qayta deploy qiling.

### 4. Deploydan keyin tekshirish

- `/` — ommaviy bosh sahifa.
- `/login` — o'zingiz belgilagan admin login/paroli bilan kirish.
- `/admin/classes` — kirgandan keyin sahifani yangilash SPA routingni saqlashi kerak.
- `/api/health` — API ishlayotgan bo'lsa HTTP 200.
- `/api/health/db` — baza ulanishi va `admins` jadvali mavjud bo'lsa HTTP 200; aks holda HTTP 503.
- `/api/public/today-exams` — tayyor, bo'sh bazada `[]` qaytishi normal.

## Lokal ishlatish

`server/.env` ni yuqoridagidek sozlang, paketlarni o'rnating va bazani tayyorlang. Ikki terminalda:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Frontend: http://localhost:3000. API: http://localhost:5000. Vite `/api` so'rovlarini backendga uzatadi. Lokal PostgreSQL ham ishlaydi: `DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/examgrid_db`.

Production buildni lokal tekshirish:

```powershell
npm run build
npm start
```

Bu rejimda frontend va API http://localhost:5000 da ishlaydi.

## Tuzilishi va tekshiruvlar

- `client/src/` — ommaviy sahifalar, admin va nazoratchi panellari, Excel import va PDF eksport.
- `api/index.js` — Vercel serverless kirish fayli; `listen()` chaqirmaydi.
- `server/app.js` — Express routing, JSON xatolar va health endpointlar.
- `server/database/db.js` — Neon TLS tekshiruvi, cheklangan connection pool, Vercel Fluid pool lifecycle.
- `server/database/init.js` va `schema.sql` — bazani va adminni tayyorlash.
- `server/services/assignmentEngine.js` — o'quvchilarni xonalarga va o'rinlarga taqsimlash.

```powershell
npm test
npm run build
```

Testlar serverless entry, API xatolari, autentifikatsiya himoyasi va vaqt zonasi SQL'ini tekshiradi; haqiqiy Neon ulanishi uchun deploydan keyingi DB health tekshiruvi kerak.

Import JSON hajmi 4 MB bilan cheklangan; katta Excel fayllarni bo'lib yuklang. API javoblari keshlanmaydi. Sana taqqoslashlari `Asia/Tashkent` vaqtida hisoblanadi. Mahalliy `.env` fayllari Git va Vercel uploadidan chiqarilgan.

Rasmiy manbalar: [Vercel rewrites](https://vercel.com/docs/routing/rewrites), [Vercel database pools](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package), [Neon connection pooling](https://neon.com/docs/connect/connection-pooling).
