# Panduan Autentikasi / Authentication Guide

## Bahasa Indonesia

### Masalah yang Telah Diperbaiki:
1. **Layar putih kosong saat mengakses aplikasi** - Ditambahkan error boundary dan diperbaiki logika inisialisasi
2. **Login email tidak bisa setelah login Google + ubah password** - Diperbaiki sinkronisasi email antara Google OAuth dan email/password
3. **Sinkronisasi antara Google login dan email** - Ditingkatkan logika sinkronisasi profil pengguna

### Cara Menggunakan Autentikasi:

#### Login dengan Google:
1. Klik tombol "Google" di halaman login
2. Pilih akun Google Anda
3. Anda akan otomatis masuk ke aplikasi

#### Mengatur Password untuk Akun Google:
1. Setelah login dengan Google, pergi ke Profil
2. Klik "Atur Password Akun" 
3. Masukkan password baru (minimal 6 karakter)
4. Konfirmasi password
5. Klik "Atur Password"
6. Sekarang Anda bisa login dengan email dan password

#### Login dengan Email/Password:
1. Masukkan email yang terdaftar
2. Masukkan password
3. Klik "Masuk"

#### Lupa Password:
1. Klik "Lupa Password?" di halaman login
2. Masukkan email Anda
3. Periksa email untuk link reset password
4. Ikuti instruksi di email untuk reset password

#### Tips:
- Jika Anda pernah login dengan Google dan sudah mengatur password, gunakan email yang sama dengan akun Google
- Jika ada masalah login, coba reset password
- Centang "Ingat perangkat ini" untuk login otomatis di perangkat ini

---

## English

### Issues Fixed:
1. **White blank screen when accessing app** - Added error boundary and fixed initialization logic
2. **Email login not working after Google login + password change** - Fixed email synchronization between Google OAuth and email/password
3. **Synchronization between Google login and email** - Enhanced user profile synchronization logic

### How to Use Authentication:

#### Login with Google:
1. Click "Google" button on login page
2. Select your Google account
3. You'll be automatically logged into the app

#### Set Password for Google Account:
1. After logging in with Google, go to Profile
2. Click "Set Account Password"
3. Enter new password (minimum 6 characters)
4. Confirm password
5. Click "Set Password"
6. Now you can login with email and password

#### Login with Email/Password:
1. Enter your registered email
2. Enter password
3. Click "Sign In"

#### Forgot Password:
1. Click "Forgot Password?" on login page
2. Enter your email
3. Check email for password reset link
4. Follow instructions in email to reset password

#### Tips:
- If you previously logged in with Google and set a password, use the same email as your Google account
- If you have login issues, try resetting your password
- Check "Remember this device" for automatic login on this device