# API Endpoints — LIGAT Mobile App

Base URL: `https://ligat.my.id/api`

## Public (No Auth)

| Method | Endpoint | Need | Status |
|--------|----------|------|--------|
| GET | `/app-settings` | App name, logo, tagline, **theme** (header_image, bg_image) | ✅ |
| GET | `/quick-menus` | Dynamic menu items (Bayar Tagihan, GoKlin, dll) | ✅ |
| GET | `/check-update` | APK version & download URL | ✅ |
| GET | `/artikel` | **PUBLIC** — daftar berita (sekarang tanpa auth) | ✅ |
| GET | `/artikel/{slug}` | **PUBLIC** — detail berita | ✅ |
| GET | `/goklin/prices` | Harga layanan GoKlin (2/4/6/8 jam) | ✅ **BARU** |
| GET | `/goklin/bank-info` | Info rekening GoKlin (bank, no_rek, atas_nama) | ✅ **BARU** |
| POST | `/login` | Login with whatsapp + password | ✅ |
| POST | `/registrasi/check-whatsapp` | Cek ketersediaan WA | ✅ |
| POST | `/registrasi/send-otp` | Kirim OTP (dev: 000000) | ✅ |
| POST | `/registrasi/verify-otp` | Verifikasi OTP | ✅ |
| GET | `/registrasi/packages` | Daftar paket internet | ✅ |
| POST | `/registrasi` | Daftar baru (**foto opsional**) | ✅ |
| POST | `/forgot-password/send-otp` | Kirim OTP lupa password | ✅ |
| POST | `/forgot-password/reset` | Reset password | ✅ |

## Protected (Bearer Token)

| Method | Endpoint | Need | Status |
|--------|----------|------|--------|
| GET | `/home` | Data home (slides, promo, berita, tagihan) | ✅ |
| GET | `/profil` | Data profil pelanggan | ✅ |
| POST | `/profil/foto` | Upload foto profil | ✅ |
| GET | `/tagihan` | Daftar tagihan | ✅ |
| POST | `/tagihan/{id}/bayar` | Upload bukti bayar tagihan | ✅ |
| GET | `/tiket` | Daftar tiket keluhan | ✅ |
| POST | `/tiket` | Buat tiket baru | ✅ |
| POST | `/tiket/{id}` | Update tiket | ✅ |
| POST | `/update-password` | Ganti password | ✅ |
| POST | `/fcm-token` | Update FCM token | ✅ |
| DELETE | `/fcm-token` | Hapus FCM token | ✅ |
| GET | `/speedtest/ping` | Speed test ping | ✅ |
| GET | `/speedtest/download` | Speed test download | ✅ |
| POST | `/speedtest/upload` | Speed test upload | ✅ |
| GET | `/goklin/orders` | Daftar pesanan GoKlin user | ✅ **BARU** |
| POST | `/goklin/order` | Buat pesanan GoKlin baru | ✅ **BARU** |
| POST | `/goklin/order/{id}/bayar` | Upload bukti bayar GoKlin | ✅ **BARU** |
| POST | `/goklin/order/{id}/cancel` | Batalkan pesanan GoKlin | ✅ **BARU** |
| GET | `/goklin/notifications` | Polling notifikasi (since=timestamp) | ✅ **BARU** |

## CMS Admin (Web Panel)

Base: `https://ligat.my.id/`

| Route | Need | Status |
|-------|------|--------|
| `/goklin/prices` | Kelola harga GoKlin | ✅ **BARU** |
| `/goklin/mitras` | Kelola mitra kebersihan | ✅ **BARU** |
| `/goklin/orders` | Kelola pesanan + update status + assign mitra | ✅ **BARU** |
| `/profil-aplikasi` | Theme images, quick menus, bank info Goklin | ✅ **BARU** |

## Catatan

- **Theme**: `GET /app-settings` sekarang return `theme` object dengan `header_image` dan `bg_image`
- **Artikel**: route dipindah ke **luar** auth middleware — bisa diakses tanpa login
- **Registrasi**: foto KTP, rumah, selfie jadi **opsional** (nullable)
- **GoKlin**: semua endpoint baru untuk fitur order jasa kebersihan
- **Polling**: `GET /goklin/notifications?since=2026-05-22 00:00:00` untuk cek update order
