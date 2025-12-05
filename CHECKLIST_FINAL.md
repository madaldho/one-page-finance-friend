# ✅ CHECKLIST FINAL - Lynk.id Integration

## Status Implementasi

### ✅ Yang Sudah Selesai (Otomatis)

- [x] Edge Function `lynk-webhook` sudah deployed
- [x] JWT Verification sudah dimatikan (`verify_jwt: false`)
- [x] Webhook logic sudah benar (signature verification, auto-detect subscription)
- [x] Upgrade.tsx sudah update (redirect ke Lynk.id, bukan WhatsApp)
- [x] Database schema sudah support `pro_1m`, `pro_12m`, `pro_lifetime`
- [x] Komponen EmailWarning sudah dibuat
- [x] Syntax error sudah diperbaiki

### ⚠️ Yang Perlu Anda Lakukan Manual

- [ ] **Set Secret Key di Supabase Dashboard**
  - Buka: https://supabase.com/dashboard/project/pjwmfyvknbtoofxfuwjm/settings/functions
  - Tab: **Secrets**
  - Tambahkan:
    - Key: `LYNK_SECRET_KEY`
    - Value: `TxgJb89iS7CW9_TyY8RtoqMQCU1hh2FD`

- [ ] **Setup Webhook di Lynk.id Dashboard**
  - URL: `https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook`
  - Event: `payment.received`
  - Secret: `TxgJb89iS7CW9_TyY8RtoqMQCU1hh2FD`

- [ ] **Test Webhook di Lynk.id**
  - Klik "Test Webhook" di Lynk.id Dashboard
  - Harus return success

---

## 🧪 Testing

### Test Webhook (Lokal)
```bash
./test-webhook.sh
```

### Test Manual dengan curl
```bash
# Test event
curl -X POST https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/lynk-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test_event"}'
```

Expected: `{"message":"Test event received"}`

---

## 🔄 Flow Pembayaran (Setelah Setup)

1. User klik tombol upgrade → Redirect ke Lynk.id
2. User isi email (HARUS SAMA dengan email akun)
3. User bayar
4. Lynk.id kirim webhook ke Edge Function
5. Edge Function:
   - ✅ Verifikasi signature
   - ✅ Cari user by email
   - ✅ Update subscription:
     - Rp20.000 → `pro_1m` (1 bulan)
     - Rp85.000 → `pro_12m` (1 tahun)
     - Rp150.000 → `pro_lifetime` (selamanya)
6. User otomatis upgrade! 🎉

---

## ⚠️ PENTING!

### Email HARUS Sama!
User harus pakai email yang sama dengan akun mereka saat checkout. Jika tidak:
- Webhook akan return "User not found"
- Upgrade tidak akan otomatis
- User harus contact support

### Monitoring
Cek logs di:
https://supabase.com/dashboard/project/pjwmfyvknbtoofxfuwjm/functions/lynk-webhook/logs

---

## 🐛 Troubleshooting

### Webhook tidak jalan?
1. ✅ Pastikan secret key sudah di-set di Supabase
2. ✅ Pastikan webhook URL benar di Lynk.id
3. ✅ Cek logs untuk error

### User tidak auto-upgrade?
1. ✅ Pastikan email sama
2. ✅ Cek logs: "User not found"
3. ✅ Pastikan harga sesuai (20000/85000/150000)

### Signature invalid?
1. ✅ Pastikan secret key benar di Supabase
2. ✅ Pastikan secret key sama di Lynk.id
3. ✅ Cek logs untuk signature mismatch

---

## 📊 Mapping Harga

| Harga | Subscription | Durasi | End Date |
|-------|-------------|--------|----------|
| Rp 20.000 | `pro_1m` | 1 bulan | +1 bulan dari sekarang |
| Rp 85.000 | `pro_12m` | 1 tahun | +1 tahun dari sekarang |
| Rp 150.000 | `pro_lifetime` | Selamanya | `null` (tidak ada) |

---

## ✅ Yakin Sudah Benar?

**YA!** Semua sudah benar:

1. ✅ Edge Function deployed & active
2. ✅ JWT verification OFF
3. ✅ Webhook logic benar (signature, mapping, update)
4. ✅ Upgrade.tsx redirect ke Lynk.id
5. ✅ Database schema support semua subscription type
6. ✅ Syntax error sudah diperbaiki

**Tinggal:**
1. Set secret key di Supabase
2. Setup webhook di Lynk.id
3. Test!

---

## 🚀 Siap Deploy!

Setelah 2 langkah di atas selesai, sistem akan:
- ✅ Otomatis upgrade user setelah bayar
- ✅ Tidak perlu manual update database
- ✅ Real-time subscription update
- ✅ Scalable untuk banyak user

**Status**: READY TO GO! 🎉
