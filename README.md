# ExamGrid Loyihasi

ExamGrid - bu maqbul tasodifiy imtihon o'rinlari ajratish tizimi.

## Ishga tushirish

Hozirgi vaqtda loyalarning barcha backend marshrutlari va DB tuzilmalari yaratildi.

**Serverni ishga tushirish:**
1. `server/.env` dagi `DB_PASSWORD` va `DB_NAME` ma'lumotlarini o'zingizning PostgreSQL dagi saqlangan parolingizga o'zgartiring.
2. Windows cmd/terminalingizda `server` papkasiga kiring:
   ```cmd
   cd d:\project\exam_grid\server
   npm install
   npm run dev
   ```
3. Ma'lumotlar bazasi sifatida PostgreSQLda `examgrid_db` deya baza yarating va `server/database/schema.sql` skriptlarini ishga tushirib jadvallarni pre-load qiling.

**Clientni (React/Vite) ishga tushirish:**
1. Yangi terminal ochib `client` papkasiga kiring:
   ```cmd
   cd d:\project\exam_grid\client
   npm install
   npm run dev
   ```
2. Loyiha `http://localhost:3000` manzilida ishga tushadi. API lar esa `http://localhost:5000` band bo'ladi.
