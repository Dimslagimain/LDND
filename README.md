# LDND Carpet Monitor

LDND Carpet Monitor adalah dashboard internal untuk memantau penggantian karpet
pesawat. Nama LDND merupakan singkatan dari **Last Done / Next Due**: sistem
mencatat kapan penggantian terakhir dilakukan dan kapan penggantian berikutnya
harus dilakukan.

Dashboard ini membantu tim memantau status pekerjaan secara terpusat, sehingga
karpet yang sudah melewati jadwal atau yang akan segera jatuh tempo dapat segera
ditindaklanjuti.

## Fitur Utama

- Ringkasan jumlah pesawat yang terdaftar.
- Daftar karpet berstatus **Already Due** atau sudah melewati jadwal penggantian.
- Daftar karpet berstatus **Near Due** atau mendekati jadwal penggantian.
- Monitoring kuantitas raw material berdasarkan airline.
- Pencatatan dan ringkasan premature replacement.
- Pengelolaan data pesawat, item karpet, riwayat penggantian, interval, dan raw material.
- Autentikasi berbasis username dan password dengan role `USER`, `ADMIN`, dan `SUPERADMIN`.
- Manajemen user untuk `SUPERADMIN`.
- Pengaturan profil dan password akun.
- Tampilan responsif serta dukungan light mode dan dark mode.

## Teknologi

- Next.js 16 dengan App Router
- React 19 dan TypeScript
- Prisma ORM 7
- MySQL atau MariaDB
- Tailwind CSS 4 dan Lucide React

## Prasyarat

Pastikan perangkat sudah memiliki:

- Node.js 20.9 atau lebih baru
- npm
- MySQL 8+ atau MariaDB yang sedang berjalan
- Git, jika project diambil dari repository

## Instalasi

### 1. Clone repository

Clone repository project dari GitHub:

```bash
git clone https://github.com/Dimslagimain/LDND.git
```

### 2. Masuk ke folder project

```bash
cd LDND
```

### 3. Install dependency

```bash
npm install
```

Perintah `npm install` juga akan menjalankan `prisma generate` melalui script
`postinstall`.

### 4. Siapkan database

Buat database kosong bernama `ldnd` pada MySQL atau MariaDB. Contoh:

```sql
CREATE DATABASE ldnd;
```

Jika menggunakan nama database atau kredensial yang berbeda, sesuaikan nilai
`DATABASE_URL` pada langkah berikutnya.

### 5. Buat file environment

Buat file `.env` di folder utama project:

```env
DATABASE_URL="mysql://root:password@localhost:3306/ldnd"
JWT_SECRET="ganti-dengan-secret-random-untuk-session"
```

Sesuaikan `root`, `password`, host, port, dan nama database dengan instalasi
MySQL/MariaDB yang digunakan. `JWT_SECRET` sebaiknya diisi dengan nilai acak
yang panjang, terutama ketika aplikasi dijalankan di production.

Jika user MySQL tidak memiliki password, formatnya dapat berupa:

```env
DATABASE_URL="mysql://root@localhost:3306/ldnd"
```

### 6. Buat tabel database

Sinkronkan schema Prisma ke database:

```bash
npx prisma db push
npx prisma generate
```

### 7. Isi user awal

Jalankan seed untuk membuat akun awal:

```bash
npx tsx prisma/seed.ts
```

Akun awal yang tersedia:

| Username | Password | Role |
| --- | --- | --- |
| `superadmin` | `superadmin123` | `SUPERADMIN` |
| `admin` | `admin123` | `ADMIN` |
| `user` | `user123` | `USER` |

Segera ubah password setelah login pertama. Seed tidak mengganti user yang
sudah ada.

## Menjalankan Aplikasi

### Mode development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser.

### Mode production

```bash
npm run build
npm run start
```

Secara default aplikasi berjalan pada [http://localhost:3000](http://localhost:3000).

## Perintah yang Tersedia

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan server development |
| `npm run dev:webpack` | Menjalankan development server dengan webpack |
| `npm run build` | Generate Prisma Client dan membuat build production |
| `npm run start` | Menjalankan build production |
| `npm run lint` | Memeriksa masalah lint pada source code |
| `npx prisma db push` | Menerapkan schema Prisma ke database |
| `npx prisma generate` | Generate Prisma Client |
| `npx tsx prisma/seed.ts` | Membuat user awal |

## Struktur Data

Database utama terdiri dari tabel berikut:

- `aircraft`: data pesawat dan registrasinya.
- `carpet_items`: jenis karpet, interval, tanggal last done, dan next due.
- `replacement_history`: riwayat penggantian karpet.
- `rawmat_qty`: stok raw material per airline.
- `carpet_interval_master`: master interval penggantian karpet.
- `users`: akun pengguna dan role akses.

## Catatan Keamanan

- Jangan commit file `.env` ke repository.
- Ganti `JWT_SECRET` default sebelum deployment.
- Ganti semua password akun seed setelah instalasi.
- Batasi akses database dan aplikasi sesuai kebutuhan jaringan internal.
