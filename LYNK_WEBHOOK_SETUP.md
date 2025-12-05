# Setup Lynk.id Webhook untuk Auto-Upgrade Subscription

## ✅ Yang Sudah Dikerjakan

### 1. Edge Function Webhook
- **Nama Function**: `lynk-webhook`
- **Status**: ACTIVE ✅
- **URL Webhook**: `https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook`

### 2. Update Upgrade.tsx
- Tombol upgrade sekarang redirect ke Lynk.id checkout
- Link checkout:
  - **Bulanan (Rp20.000)**: http://lynk.id/madaldho/gxo2m9r832ly/checkout
  - **Tahunan (Rp85.000)**: http://lynk.id/madaldho/xz54e6r99p49/checkout
  - **Lifetime (Rp150.000)**: http://lynk.id/madaldho/j7owr273n4zl/checkout

### 3. Komponen EmailWarning
- Komponen baru untuk mengingatkan user gunakan email yang sama
- Menampilkan email user yang sedang login

---

## 🔧 Setup yang Perlu Dilakukan

### 1. Set Secret Key di Supabase Dashboard

1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/pjwmfyvknbtoofxfuwjm
2. Pergi ke **Settings** → **Edge Functions** → **Secrets**
3. Tambahkan secret baru:
   - **Key**: `LYNK_SECRET_KEY`
   - **Value**: `TxgJb89iS7CW9_TyY8RtoqMQCU1hh2FD`

### 2. Matikan JWT Verification

**PENTING**: Webhook dari Lynk.id tidak mengirim JWT token, jadi perlu dimatikan.

Cara matikan JWT verification:
1. Buka Supabase Dashboard
2. Pergi ke **Edge Functions** → **lynk-webhook**
3. Klik **Settings**
4. Matikan toggle **"Verify JWT"** atau set `verify_jwt: false`

**ATAU** jalankan command ini:
```bash
supabase functions deploy lynk-webhook --no-verify-jwt
```

### 3. Setup Webhook di Lynk.id Dashboard

1. Login ke Lynk.id Dashboard
2. Pergi ke **Settings** → **Webhooks**
3. Tambahkan webhook baru:
   - **URL**: `https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook`
   - **Events**: Pilih `payment.received`
   - **Secret Key**: `TxgJb89iS7CW9_TyY8RtoqMQCU1hh2FD`

### 4. Test Webhook

Setelah setup, test webhook dengan:
1. Klik tombol **"Test Webhook"** di Lynk.id Dashboard
2. Cek logs di Supabase: **Edge Functions** → **lynk-webhook** → **Logs**
3. Harus muncul: `"Test event received"`

---

## 🔄 Cara Kerja Sistem

### Flow Pembayaran:

1. **User klik upgrade** → Redirect ke Lynk.id checkout
2. **User bayar** → Lynk.id proses pembayaran
3. **Pembayaran berhasil** → Lynk.id kirim webhook ke Edge Function
4. **Edge Function**:
   - Verifikasi signature webhook
   - Cari user berdasarkan email
   - Update subscription di database:
     - Rp20.000 → `pro_1m` (1 bulan)
     - Rp85.000 → `pro_12m` (1 tahun)
     - Rp150.000 → `pro_lifetime` (selamanya)
5. **User otomatis upgrade** ✅

### Mapping Harga ke Subscription:

| Harga | Subscription Type | Durasi |
|-------|------------------|--------|
| Rp 20.000 | `pro_1m` | 1 bulan |
| Rp 85.000 | `pro_12m` | 1 tahun |
| Rp 150.000 | `pro_lifetime` | Selamanya |

---

## ⚠️ Penting untuk User

**Email harus sama!** User harus menggunakan email yang sama dengan akun mereka saat checkout di Lynk.id. Jika tidak, upgrade tidak akan otomatis.

Komponen `EmailWarning` sudah dibuat untuk mengingatkan user.

---

## 🧪 Testing

### Test dengan Lynk.id Test Event:
```bash
curl -X POST https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test_event"}'
```

Expected response: `{"message":"Test event received"}`

### Test dengan Payment Event (Manual):
```bash
curl -X POST https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook \
  -H "Content-Type: application/json" \
  -H "x-lynk-signature: YOUR_SIGNATURE" \
  -d '{
    "event": "payment.received",
    "data": {
      "message_id": "test123",
      "message_data": {
        "refId": "REF123",
        "totals": {
          "grandTotal": 20000
        },
        "customer": {
          "email": "user@example.com"
        }
      }
    }
  }'
```

---

## 📝 Logs & Monitoring

Cek logs di:
- **Supabase Dashboard** → **Edge Functions** → **lynk-webhook** → **Logs**

Log akan menampilkan:
- Webhook received
- Signature verification
- User lookup
- Subscription update
- Success/Error messages

---

## 🐛 Troubleshooting

### Webhook tidak jalan:
1. ✅ Pastikan JWT verification dimatikan
2. ✅ Pastikan secret key sudah di-set
3. ✅ Cek logs untuk error messages

### User tidak auto-upgrade:
1. ✅ Pastikan email sama dengan akun
2. ✅ Cek logs untuk error "User not found"
3. ✅ Pastikan harga sesuai (20000/85000/150000)

### Signature invalid:
1. ✅ Pastikan secret key benar
2. ✅ Cek format signature di logs
3. ✅ Pastikan Lynk.id kirim signature header

---

## 📞 Support

Jika ada masalah, cek:
1. Supabase Edge Function Logs
2. Lynk.id Webhook Logs
3. Browser Console untuk error

---

**Status**: ✅ Ready to Deploy
**Last Updated**: 2025-12-05
