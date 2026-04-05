RFID jewelry middleware (Express + PostgreSQL + Prisma)

1) Copy .env.example to .env and set DATABASE_URL.
2) npm install
3) npm run db:migrate:dev   (or: npm run db:migrate after first deploy)
4) npm run db:seed
5) npm run dev              → http://localhost:3000/api/health

Optional: apply scripts/init-db.sql manually if you prefer raw SQL instead of Prisma migrate.
