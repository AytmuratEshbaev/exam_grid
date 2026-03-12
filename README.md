# 📝 ExamGrid — Imtihon O'rindiqlarini Taqsimlash Tizimi

**ExamGrid** — ta'lim muassasalarida imtihon paytida o'quvchilarni xonalarga **tasodifiy va adolatli** taqsimlash tizimi. Asosiy maqsad — **ko'chirmachilikni oldini olish**: bitta sinfdagi o'quvchilarni turli xonalarga proporsional tarqatish.

---

## ✨ Asosiy Xususiyatlar

- 🎲 **Anti-Cheating Algoritm** — sinfdoshlarni turli xonalarga proporsional taqsimlaydi
- 👨‍💼 **Superadmin Panel** — sinflar, o'quvchilar, xonalar, imtihonlar, foydalanuvchilarni boshqarish
- 👁️ **Nazoratchi (Invigilator) Panel** — faqat o'qish rejimida imtihon ma'lumotlarini ko'rish
- 🌐 **Ommaviy sahifa** — o'quvchilar o'z joyini qidirishi mumkin
- 📥 **Excel import** — o'quvchilarni Excel fayldan yuklash
- 📄 **PDF eksport** — imtihon taqsimotini PDF formatda yuklab olish
- 🔐 **JWT autentifikatsiya** — role-based access control (superadmin / invigilator)

---

## 🛠️ Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens), bcrypt |
| **Boshqa** | Axios, xlsx, jsPDF, html2canvas, Lucide Icons |

---

## 📂 Loyiha Strukturasi

```
exam_grid/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/         # Admin panel komponentlari
│   │   │   │   ├── Admins/    # Foydalanuvchilar boshqaruvi
│   │   │   │   ├── Classes/   # Sinflar boshqaruvi
│   │   │   │   ├── Exams/     # Imtihonlar boshqaruvi
│   │   │   │   ├── Layout/    # Admin layout
│   │   │   │   └── Rooms/     # Xonalar boshqaruvi
│   │   │   └── invigilator/   # Nazoratchi panel
│   │   ├── context/           # Auth context (React Context API)
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Bosh sahifa (ommaviy)
│   │   │   ├── PublicExamDetails.jsx # Imtihon natijalari (ommaviy)
│   │   │   ├── AdminLogin.jsx        # Login sahifa
│   │   │   ├── AdminDashboard.jsx    # Admin bosh sahifa
│   │   │   ├── InvigilatorDashboard.jsx    # Nazoratchi bosh sahifa
│   │   │   └── InvigilatorExamDetails.jsx  # Nazoratchi imtihon tafsilotlari
│   │   └── services/          # API service (axios)
│   └── vite.config.js
│
├── server/                    # Backend (Express.js)
│   ├── controllers/
│   │   ├── authController.js         # Login / autentifikatsiya
│   │   ├── classesController.js      # Sinflar CRUD
│   │   ├── studentsController.js     # O'quvchilar CRUD + import
│   │   ├── roomsController.js        # Xonalar CRUD
│   │   ├── examsController.js        # Imtihonlar CRUD
│   │   ├── assignmentsController.js  # Taqsimot generatsiya / reset
│   │   ├── adminsController.js       # Foydalanuvchilar CRUD
│   │   └── publicController.js       # Ommaviy API (qidirish)
│   ├── database/
│   │   ├── db.js              # PostgreSQL connection pool
│   │   └── schema.sql         # Database schema
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT tekshirish
│   │   └── roleMiddleware.js  # Role-based access
│   ├── routes/
│   │   ├── adminRoutes.js     # Admin API routes
│   │   ├── authRoutes.js      # Auth routes
│   │   └── publicRoutes.js    # Ommaviy routes
│   ├── services/
│   │   └── assignmentEngine.js # Anti-cheating taqsimot algoritmi
│   ├── server.js              # Express app entry point
│   └── .env                   # Environment variables
│
└── README.md
```

---

## 🚀 O'rnatish va Ishga Tushirish

### Talablar

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** (Node.js bilan birga keladi)

### 1. Repozitoriyani klonlash

```bash
git clone https://github.com/AytmuratEshbaev/exam_grid.git
cd exam_grid
```

### 2. Database yaratish

PostgreSQL da yangi database yarating:

```sql
CREATE DATABASE examshuffle_db;
```

Keyin sxemani yuklang:

```bash
psql -U postgres -d examshuffle_db -f server/database/schema.sql
```

### 3. Server sozlamalari

`server/.env` faylini yarating yoki tahrirlang:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=examshuffle_db
JWT_SECRET=your_super_secret_key
```

### 4. Bog'liqliklarni o'rnatish

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 5. Loyihani ishga tushirish

```bash
# Terminal 1 — Server (port 5000)
cd server
node server.js

# Terminal 2 — Client (port 3000)
cd client
npx vite
```

Brauzerda oching: **http://localhost:3000**

---

## 🔑 Kirish Ma'lumotlari

| Rol | Login | Parol |
|-----|-------|-------|
| **Superadmin** | `admin` | `admin123` |

> ⚠️ Parolni o'zgartirish uchun `server/update-admin.js` faylida yangi parolni yozing va `node update-admin.js` buyrug'ini ishga tushiring.

---

## 🧠 Anti-Cheating Algoritm

ExamGrid'ning asosiy kuchi — **Global Shuffle + Least-Class-Representation** algoritmi.

### Muammo

Agar o'quvchilar oddiy tasodifiy taqsimlansa, bitta sinfdagi ko'p o'quvchi bitta xonaga tushib qolishi mumkin → **ko'chirmachilik xavfi**.

### Yechim

```
1. Barcha o'quvchilarni GLOBAL shuffle qilish (tartib ta'sirini yo'qotish)
2. Har bir o'quvchi uchun — shu sinfdagi eng KAM vakil bo'lgan xonaga joylashtirish
3. Teng bo'lsa — eng ko'p bo'sh joy bo'lgan xonani tanlash
4. Xona ichida — turli sinflardan o'quvchilarni navbatma-navbat o'tqazish
```

### Natija (5 sinf × 30 o'quvchi, xonalar: 60/40/30/20)

| Xona (sig'im) | Sinf-1 | Sinf-2 | Sinf-3 | Sinf-4 | Sinf-5 |
|---------------|--------|--------|--------|--------|--------|
| Xona 1 (60)  | 12     | 12     | 12     | 12     | 12     |
| Xona 2 (40)  | 8      | 8      | 8      | 8      | 8      |
| Xona 3 (30)  | 6      | 6      | 6      | 6      | 6      |
| Xona 4 (20)  | 4      | 4      | 4      | 4      | 4      |

✅ Har bir xonada barcha sinflardan **proporsional** taqsimlangan!

---

## 📡 API Endpointlari

### Ommaviy (autentifikatsiyasiz)

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/api/public/today-exams` | Bugungi imtihonlar |
| `GET` | `/api/public/search?q=...` | O'quvchi qidirish |
| `GET` | `/api/public/exam/:examId` | Imtihon tafsilotlari |
| `GET` | `/api/public/exam/:examId/rooms` | Imtihon xonalari |

### Autentifikatsiya

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `POST` | `/api/auth/login` | Admin/Invigilator login |

### Admin Panel (JWT talab qilinadi)

| Method | Endpoint | Tavsif | Ruxsat |
|--------|----------|--------|--------|
| `GET` | `/api/admin/classes` | Sinflar ro'yxati | Hammaga |
| `POST` | `/api/admin/classes` | Sinf qo'shish | Superadmin |
| `PUT` | `/api/admin/classes/:id` | Sinf tahrirlash | Superadmin |
| `DELETE` | `/api/admin/classes/:id` | Sinf o'chirish | Superadmin |
| `GET` | `/api/admin/students` | O'quvchilar ro'yxati | Hammaga |
| `POST` | `/api/admin/students` | O'quvchi qo'shish | Superadmin |
| `POST` | `/api/admin/students/import` | Excel dan import | Superadmin |
| `POST` | `/api/admin/students/import-ids` | Student ID import | Superadmin |
| `POST` | `/api/admin/students/update-logins` | Loginlar yangilash | Superadmin |
| `POST` | `/api/admin/students/bulk-transfer` | Ommaviy ko'chirish | Superadmin |
| `PUT` | `/api/admin/students/:id` | O'quvchi tahrirlash | Superadmin |
| `DELETE` | `/api/admin/students/:id` | O'quvchi o'chirish | Superadmin |
| `GET` | `/api/admin/rooms` | Xonalar ro'yxati | Hammaga |
| `POST` | `/api/admin/rooms` | Xona qo'shish | Superadmin |
| `PUT` | `/api/admin/rooms/:id` | Xona tahrirlash | Superadmin |
| `DELETE` | `/api/admin/rooms/:id` | Xona o'chirish | Superadmin |
| `GET` | `/api/admin/exams` | Imtihonlar ro'yxati | Hammaga |
| `POST` | `/api/admin/exams` | Imtihon yaratish | Superadmin |
| `PUT` | `/api/admin/exams/:id` | Imtihon tahrirlash | Superadmin |
| `DELETE` | `/api/admin/exams/:id` | Imtihon o'chirish | Superadmin |
| `GET` | `/api/admin/assignments/:examId` | Taqsimot ko'rish | Hammaga |
| `POST` | `/api/admin/assignments/generate/:examId` | Taqsimot generatsiya | Superadmin |
| `POST` | `/api/admin/assignments/:examId/regenerate` | Qayta taqsimlash | Superadmin |
| `DELETE` | `/api/admin/assignments/:examId/reset` | Taqsimotni tozalash | Superadmin |
| `GET` | `/api/admin/admins` | Adminlar ro'yxati | Superadmin |
| `POST` | `/api/admin/admins` | Admin qo'shish | Superadmin |
| `DELETE` | `/api/admin/admins/:id` | Admin o'chirish | Superadmin |

---

## 🗄️ Database Schema

```sql
classes       → id, name, grade_level, student_count
students      → id, full_name, class_id, student_code, student_id, is_active
rooms         → id, room_number, capacity, rows_count, seats_per_row, building
exams         → id, name, exam_date, exam_time, class_id, quarter, academic_year, status
assignments   → id, exam_id, student_id, room_id, seat_row, seat_number, assigned_at
admins        → id, username, password_hash, full_name, role, created_at
```

---

## 👥 Rollar

| Rol | Imkoniyatlar |
|-----|-------------|
| **superadmin** | To'liq boshqaruv: yaratish, tahrirlash, o'chirish, taqsimot |
| **invigilator** | Faqat ko'rish: sinflar, o'quvchilar, xonalar, imtihonlar, taqsimotlar |

---

## 📜 Litsenziya

MIT License

---

## 👨‍💻 Muallif

**Aytmurat Eshbayev**

---

> 🎓 ExamGrid — adolatli imtihon, halol natija!
