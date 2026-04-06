RFID jewelry middleware (Express + PostgreSQL + Prisma)

1) Copy .env.example to .env and set DATABASE_URL.
2) npm install
3) npm run db:migrate:dev   (or: npm run db:migrate after first deploy)
4) npm run db:seed
5) npm run dev              → http://localhost:3000/api/health

Optional: apply scripts/init-db.sql manually if you prefer raw SQL instead of Prisma migrate.

Expo mobile app (Android / Expo Go):
- cd mobile
- npm install
- Backend must expose GET /api/inventory/summary (added for dashboard totals).
- Android emulator uses http://10.0.2.2:3000/api by default (see mobile/src/config/api.ts).
- Physical device: set EXPO_PUBLIC_API_BASE_URL to http://<your-pc-lan-ip>:3000/api in mobile/.env
- npm run android   (or npm start, then scan QR in Expo Go)


npm run dev
cd mobile
npm install
npx expo start
