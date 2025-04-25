# Keuangan Pribadi Web App

Aplikasi manajemen keuangan pribadi berbasis web untuk membantu pengguna mengelola uang dengan lebih efektif.

## Fitur Utama

- Dashboard keuangan komprehensif
- Pengelolaan multiple wallet
- Pencatatan transaksi pendapatan dan pengeluaran
- Manajemen anggaran berdasarkan kategori
- Pelacakan tabungan
- Pengelolaan hutang dan piutang
- Manajemen aset
- Analisis keuangan dengan visualisasi

## Sistem Langganan

Aplikasi ini menerapkan model freemium dengan beberapa tingkat langganan:

### Tingkat Langganan

1. **Free**
   - Fitur dasar
   - Maksimum 10 kategori
   - Tidak ada akses ke fitur tabungan, anggaran, hutang-piutang, dan aset

2. **Trial Pro (7 hari)**
   - Semua pengguna baru mendapatkan trial Pro selama 7 hari
   - Akses ke semua fitur tanpa batasan selama masa trial
   - Saat trial berakhir, akan otomatis kembali ke langganan Free

3. **Pro (6 bulan / 12 bulan)**
   - Akses penuh ke semua fitur tanpa batasan
   - Jika mengupgrade dari trial, 7 hari trial akan ditambahkan ke masa langganan

4. **Admin**
   - Akses ke dashboard admin untuk mengelola pengguna
   - Kemampuan untuk melihat statistik platform

### Implementasi UI Status Langganan

Status langganan pengguna ditampilkan secara visual melalui badge di profil pengguna:

1. **Admin**: Badge warna merah dengan ikon mahkota (👑)
2. **Pro**: Badge warna ungu dengan ikon mahkota (👑)
3. **Trial Pro**: Badge warna biru dengan ikon bintang (✨) dan jumlah hari tersisa
4. **Free**: Teks abu-abu tanpa ikon

Status langganan ditampilkan di:
- Header aplikasi
- Halaman Profil
- Halaman Pengaturan

### Manajemen Trial Pro

Saat pengguna baru mendaftar:
1. Status langganan awal diatur sebagai "free"
2. Tanggal mulai trial (trial_start) ditetapkan ke tanggal pendaftaran
3. Tanggal akhir trial (trial_end) ditetapkan ke 7 hari setelah pendaftaran
4. Selama masa trial, pengguna memiliki akses Pro

Saat pengguna mengupgrade ke Pro:
1. Status langganan berubah menjadi "pro_6m" atau "pro_12m"
2. Jika masih dalam masa trial, sisa hari trial ditambahkan ke masa langganan

## Teknologi
- React
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database)
- React Router
- date-fns

## Instalasi dan Pengembangan Lokal

```bash
# Clone repositori
git clone [repo-url]

# Instal dependensi
npm install

# Jalankan dalam mode pengembangan
npm run dev
```

## Environment Variables

Buat file `.env` dengan variabel berikut:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Struktur Basis Data

Basis data menggunakan Supabase dengan tabel utama berikut:
- profiles: Data profil pengguna dan informasi langganan
- wallets: Dompet pengguna
- transactions: Transaksi keuangan
- categories: Kategori transaksi
- budgets: Anggaran pengguna
- savings: Target tabungan
- loans: Hutang dan piutang
- assets: Aset pengguna

## Kontribusi

Kontribusi selalu diterima. Silakan buat pull request atau buka issue untuk diskusi fitur baru atau bug.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c450a90b-b772-491f-a2ab-91e2afcf6afd

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c450a90b-b772-491f-a2ab-91e2afcf6afd) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c450a90b-b772-491f-a2ab-91e2afcf6afd) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
