# Panduan Update Server — LIGAT CMS (Laravel)

## 1. Upload File ke Server

Gunakan WinSCP atau SCP. Upload folder `source cms/` isinya ke `/var/www/ligat/` (atau path sesuai server).

### File/Folder yang Berubah:
| Path | Keterangan |
|------|-----------|
| `routes/api.php` | Artikel public, Goklin routes, cancel/notif endpoint |
| `app/Http/Controllers/Api/GoklinApiController.php` | **BARU** — Full Goklin API |
| `app/Http/Controllers/Api/RegistrasiApiController.php` | Foto jadi nullable (dev) |
| `app/Http/Controllers/Api/ArtikelApiController.php` | Tidak berubah |
| `app/Http/Controllers/AppSettingController.php` | Theme images, goklin bank info |
| `app/Http/Controllers/GoklinController.php` | **BARU** — CMS admin untuk Goklin |
| `app/Models/GoklinPrice.php` | **BARU** |
| `app/Models/GoklinMitra.php` | **BARU** |
| `app/Models/GoklinOrder.php` | **BARU** |
| `app/Helpers/WhatsappHelper.php` | OTP bypass 000000 untuk dev |
| `resources/views/goklin/*` | **BARU** — 3 view files (prices, mitras, orders) |
| `resources/views/profil-aplikasi/index.blade.php` | Quick menu JSON + Goklin bank info + Theme |
| `resources/views/layouts/sidebar.blade.php` | Tambah menu Goklin |
| `database/migrations/2026_05_19_*.php` | **BARU** — 3 migration untuk goklin |
| `database/migrations/2026_05_21_125558_make_registrasi_photos_nullable.php` | **BARU** |

### Cara Upload Cepat (SCP)
```bash
# Upload folder tertentu (contoh dari lokal Windows via PowerShell)
scp -r routes root@SERVER_IP:/var/www/ligat/
scp -r app root@SERVER_IP:/var/www/ligat/
scp -r resources/views root@SERVER_IP:/var/www/ligat/resources/
scp -r database/migrations/20*goklin* root@SERVER_IP:/var/www/ligat/database/migrations/
scp -r database/migrations/2026_05_21_125558* root@SERVER_IP:/var/www/ligat/database/migrations/
```

---

## 2. Jalankan Migration (via SSH)

```bash
ssh root@SERVER_IP
cd /var/www/ligat
php artisan migrate
```

Ini akan membuat 3 tabel baru:
- `goklin_prices`
- `goklin_mitras`
- `goklin_orders`
- Serta mengubah kolom foto registrasi jadi nullable

---

## 3. Seed Data Awal

```bash
php artisan tinker --execute="
// Harga Goklin
\App\Models\GoklinPrice::insert([
    ['durasi' => 2, 'harga' => 250000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
    ['durasi' => 4, 'harga' => 450000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
    ['durasi' => 6, 'harga' => 600000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
    ['durasi' => 8, 'harga' => 750000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
]);

// Quick Menu (default)
\App\Models\AppSetting::setValue('quick_menus', json_encode([
    ['id' => 1, 'icon' => 'receipt', 'label' => 'Bayar Tagihan', 'type' => 'navigation', 'target' => 'Tagihan', 'require_auth' => true, 'active' => true],
    ['id' => 2, 'icon' => 'chatbubble-ellipses', 'label' => 'Minta Bantuan', 'type' => 'navigation', 'target' => 'Tiket', 'require_auth' => true, 'active' => true],
    ['id' => 3, 'icon' => 'newspaper', 'label' => 'Berita Terbaru', 'type' => 'navigation', 'target' => 'BeritaList', 'require_auth' => false, 'active' => true],
    ['id' => 4, 'icon' => 'key', 'label' => 'Rubah Password', 'type' => 'navigation', 'target' => 'RubahPassword', 'require_auth' => true, 'active' => true],
    ['id' => 10, 'icon' => 'sparkles', 'label' => 'GoKlin', 'type' => 'navigation', 'target' => 'Goklin', 'require_auth' => true, 'active' => true],
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// Bank info Goklin (default)
\App\Models\AppSetting::setValue('goklin_bank_info', json_encode([
    'nama_bank' => 'BCA',
    'no_rekening' => '1234567890',
    'atas_nama' => 'LIGAT Goklin',
], JSON_UNESCAPED_UNICODE));

echo 'Seed data selesai';
"
```

---

## 4. Setup Goklin Admin WA Notification

Buat setting `goklin_admin_wa` dan `fonnte_token` di CMS:
1. Login ke panel admin → **Pengaturan**
2. Tambah key `fonnte_token` dengan value token Fonnte
3. Tambah key `goklin_admin_wa` dengan nomor WA admin (format: 628xxx)

Atau via tinker:
```bash
php artisan tinker --execute="
\App\Models\Pengaturan::updateOrCreate(['key' => 'fonnte_token'], ['value' => 'TOKEN_FONNTE_ANDA']);
\App\Models\Pengaturan::updateOrCreate(['key' => 'goklin_admin_wa'], ['value' => '628117774884']);
"
```

---

## 5. Bersihkan Cache

```bash
php artisan optimize:clear
php artisan view:clear
php artisan cache:clear
```

---

## 6. Verifikasi

Cek endpoint public berikut harus berfungsi:
- `GET /api/artikel` — tanpa token
- `GET /api/quick-menus` — tanpa token
- `GET /api/goklin/prices` — tanpa token
- `GET /api/goklin/bank-info` — tanpa token
- `POST /api/goklin/order` — dengan token
- `POST /api/goklin/order/{id}/bayar` — dengan token
- `POST /api/goklin/order/{id}/cancel` — dengan token

---

## Catatan

- **Storage link**: Pastikan `php artisan storage:link` sudah jalan
- **.env**: Jangan lupa set `APP_ENV=local` untuk development, `production` untuk live
- **Fonnte**: Token harus diisi di CMS agar notifikasi WA Goklin berfungsi
