# 🛠️ Enhanced Asset Management System Migration

Untuk memperbaiki masalah sistem aset yang tidak fleksibel dan transaksi yang tidak bisa dihapus dengan benar, Anda perlu menjalankan migration berikut di **Supabase Dashboard**.

## ⚠️ Masalah yang Diperbaiki:
- ❌ Sistem penjualan aset tidak membedakan antara aset yang bisa dijual sebagian vs utuh
- ❌ Transaksi penjualan aset muncul kembali setelah dihapus
- ❌ Tidak ada field untuk mengelola quantity/shares untuk aset seperti saham
- ❌ Sistem tidak mendukung penjualan partial untuk aset tertentu

## 📋 Langkah-langkah:

### 1. Buka Supabase Dashboard
- Login ke [supabase.com](https://supabase.com)
- Pilih project: **one-page-finance-friend**
- Masuk ke tab **SQL Editor**

### 2. Jalankan Migration SQL
Copy dan paste script dari file `src/migrations/enhance_asset_management.sql` ke SQL Editor, lalu klik **Run**.

### 3. Verifikasi Hasil
Setelah migration berhasil, verifikasi dengan query berikut:

```sql
-- Check new columns in assets table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND column_name IN ('quantity', 'unit_type', 'is_divisible');

-- Check asset_transactions table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'asset_transactions' 
AND column_name IN ('quantity_sold', 'remaining_quantity');

-- Check if functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('handle_asset_sale', 'delete_asset_transaction');
```

### 4. Test Asset Management
1. **Buat aset baru**:
   - Aset saham/emas akan otomatis set `is_divisible = true`
   - Aset properti/kendaraan akan set `is_divisible = false`

2. **Test penjualan**:
   - Untuk aset divisible: bisa jual sebagian
   - Untuk aset non-divisible: jual keseluruhan

3. **Test penghapusan transaksi**:
   - Transaksi aset sale sekarang bisa dihapus dengan benar
   - Quantity aset akan dikembalikan jika transaksi dihapus

## ✅ Hasil yang Diharapkan:
- ✅ Saham dan emas dapat dijual sebagian (partial sales)
- ✅ Properti dan kendaraan dijual keseluruhan
- ✅ Transaksi aset dapat dihapus tanpa muncul kembali
- ✅ Sistem quantity management yang akurat
- ✅ Relasi yang benar antara tabel transactions dan asset_transactions

## 🚨 Troubleshooting:
Jika masih ada error setelah migration:

1. **Restart development server**:
   ```bash
   npm run dev
   # atau
   bun run dev
   ```

2. **Clear browser cache** dan refresh aplikasi

3. **Check console logs** untuk error detail

4. **Verify di Supabase** bahwa semua perubahan sudah applied:
   ```sql
   -- Check if trigger exists
   SELECT trigger_name, event_manipulation, action_statement 
   FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_delete_asset_transactions';
   ```

## 🎯 Fitur Baru Setelah Migration:

### 1. Kategori Aset Otomatis
- **Saham** → `is_divisible: true`, `unit_type: shares`
- **Emas** → `is_divisible: true`, `unit_type: grams`  
- **Properti/Kendaraan** → `is_divisible: false`, `unit_type: unit`

### 2. Penjualan Fleksibel
- Aset divisible dapat dijual per lembar/gram
- Aset non-divisible dijual keseluruhan
- Validasi quantity tidak boleh melebihi yang dimiliki

### 3. Penghapusan Transaksi yang Benar
- Menggunakan RPC function khusus untuk asset transactions
- Otomatis mengembalikan quantity aset jika transaksi dihapus
- Relasi data tetap konsisten

## 📞 Support:
Jika mengalami masalah, pastikan:
- Menggunakan PostgreSQL syntax (bukan SQL Server)
- Memiliki permission admin di Supabase
- Backup data sebelum menjalankan migration