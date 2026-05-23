# LIGAT - Source of Truth

## 📋 Overview
**LIGAT** (Manejemen Tiket, Akses & Respons Internet) — Aplikasi manajemen ISP dengan CMS backend + Mobile App.
- **Backend**: Laravel 12 CMS (admin panel)
- **Frontend**: Expo / React Native App (Android)

---

## 🗂️ Directory Structure

```
C:\laragon\www\ligat\
├── AGENTS.md                    ← This file (source of truth)
├── run-expo-web.bat             ← Script untuk running Expo Web
├── Database/
│   └── n1602585_mentari.sql     ← Database dump (db_ligat)
├── source cms/                  ← Laravel CMS Backend
│   ├── .env                     ← DB: mentari, APP_URL: http://157.15.40.90:8080
│   ├── app/Http/Controllers/   ← Web controllers
│   │   ├── Api/                 ← API controllers (mobile endpoints)
│   │   │   ├── AuthController.php
│   │   │   ├── HomeController.php
│   │   │   ├── TagihanApiController.php
│   │   │   ├── TiketApiController.php
│   │   │   ├── UpdateController.php
│   │   │   ├── ArtikelApiController.php
│   │   │   ├── SpeedTestController.php
│   │   │   └── RegistrasiApiController.php
│   │   ├── LoginController.php
│   │   ├── DashboardController.php
│   │   ├── PelangganController.php
│   │   ├── TagihanController.php
│   │   ├── TiketController.php
│   │   └── ... (Paket, Artikel, Informasi, etc.)
│   ├── routes/
│   │   ├── web.php              ← CMS routes (admin panel)
│   │   └── api.php              ← API routes (mobile app endpoints)
│   ├── public/                  ← Laravel entry point
│   └── composer.json            ← Laravel 12 + Sanctum + DomPDF
│
├── source apk/                  ← Expo / React Native App
│   ├── App.js                   ← Root component + navigation
│   ├── app.json                 ← Expo config (package: com.ligat)
│   ├── package.json             ← SDK 54, React Native 0.81.5
│   ├── src/
│   │   ├── api.js               ← Axios instance (BASE URL di sini)
│   │   ├── theme.js             ← Dark theme (kuning + hitam)
│   │   ├── context/AuthContext.js  ← Auth state management
│   │   ├── screens/             ← 12 screens (Login, Home, Tagihan, etc.)
│   │   ├── hooks/useUpdateChecker.js ← Auto APK update checker
│   │   └── services/NotificationService.js ← FCM push notifications
│   └── android/                 ← Bare React Native Android project
│       ├── app/build.gradle     ← versionCode 129, versionName 1.2.9
│       └── app/debug.keystore   ← Signing key (pass: android)
│
├── apk sudah build/             ← Output APK files
│   └── Ligat-1.2.9.apk         ← APK terbaru (updated 19 May 2026)
│
└── Ligat-1.2.9.apk             ← APK final (copy di root)
```

---

## 🌐 API Endpoints

### Base URL: `http://157.15.40.90/ligat-api/api`

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/app-settings` | App name, logo, tagline |
| POST | `/login` | Login with whatsapp + password |
| GET | `/check-update` | Check APK version & download URL |
| POST | `/registrasi/check-whatsapp` | Check WA number availability |
| POST | `/registrasi/send-otp` | Send OTP for registration |
| POST | `/registrasi/verify-otp` | Verify OTP |
| GET | `/registrasi/packages` | Get internet package list |
| POST | `/registrasi` | Complete registration |
| POST | `/forgot-password/send-otp` | Send OTP for password reset |
| POST | `/forgot-password/reset` | Reset password |

### Protected (Bearer token via Sanctum)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/home` | Home screen data |
| GET | `/tagihan` | Billing list |
| POST | `/tagihan/{id}/bayar` | Pay bill |
| GET | `/tiket` | Ticket list |
| POST | `/tiket` | Create ticket |
| PUT/POST | `/tiket/{id}` | Update ticket |
| GET | `/artikel` | News/articles list |
| GET | `/artikel/{slug}` | Article detail |
| GET | `/profil` | User profile |
| POST | `/profil/foto` | Upload profile photo |
| GET | `/speedtest/ping` | Speed test ping |
| GET | `/speedtest/download` | Speed test download |
| POST | `/speedtest/upload` | Speed test upload |
| POST | `/fcm-token` | Update FCM push token |
| DELETE | `/fcm-token` | Remove FCM token |
| POST | `/update-password` | Change password |

---

## 📡 Server Configuration

### Public IP: `157.15.40.90`

### Access URLs
| URL | Description | Status |
|-----|-------------|--------|
| `http://localhost/ligat-api/api/` | Local API (via symlink) | ✅ Active |
| `http://157.15.40.90/ligat-api/api/` | External API | ✅ Active |
| `http://ligat.test/` | Vhost (butuh fix path) | ⚠️ Spasi di path |

### Symlink
```
C:\laragon\www\ligat-api → C:\laragon\www\ligat\source cms\public
```
Dibuat agar akses ke Laravel clean tanpa spasi di URL.

### Database: `mentari`
- **Host**: 127.0.0.1:3306
- **User**: root
- **Pass**: (empty)
- **Tables**: 23 tables (users, pelanggans, tagihans, tikets, artikels, etc.)

### Key Database Records (pengaturans)
| Key | Value |
|-----|-------|
| `app_version` | 1.2.9 |
| `app_download_url` | https://gofile.io/d/dDiS4A |
| `hari_generate_tagihan` | 3 |

---

## 📱 Mobile App (Expo)

### API URL Config
File: `source apk/src/api.js`
```javascript
const API_URL = 'http://157.15.40.90/ligat-api/api';
```

### Build APK
APK sudah di **`apk sudah build/Ligat-1.2.9.apk`** (76.7 MB)
- Bundle: Hermes bytecode dengan URL public IP
- Signed: Debug keystore (android/android)

### Expo Web
```bash
run-expo-web.bat    # atau:
cd source apk && npx expo start --web
```

### Dependencies
- Expo SDK 54
- React Native 0.81.5
- React Navigation (native-stack + bottom-tabs)
- Axios, AsyncStorage
- expo-notifications (FCM)

---

## 🔄 Update Flow
1. App cek `/api/check-update` → dapat `version` + `download_url`
2. Jika version > local version → prompt download
3. Download APK via `expo-file-system`
4. Buka installer via `expo-intent-launcher`

---

## 🚀 Quick Start

### Laravel CMS
```
http://localhost/ligat-api/      ← CMS
http://localhost/ligat-api/api/  ← API
```

### DB Import
```sql
CREATE DATABASE mentari;
-- Import from Database/n1602585_mentari.sql
```

### Environment
```bash
# source cms/.env sudah diisi:
DB_DATABASE=mentari
APP_URL=http://157.15.40.90:8080
```

---

## ⚠️ Known Issues
1. **ligat.test vhost**: Path `source cms/public` mengandung spasi, bikin Apache vhost bermasalah. Solusi: pakai symlink `ligat-api`.
2. **Android NDK build**: CMake/Ninja crash di Windows. Build APK via inject bundle ke existing APK, bukan full Gradle build.
3. **FCM**: Firebase credentials file (`firebase-credentials.json`) belum ada di repo.

---

## 🚀 Deploy Guide — Laravel CMS ke Server

### 1. Persiapan File

```
ligat-cms-deploy.tar      ← file archive sudah siap (git archive output)
```

File ini berisi semua source code Laravel **tanpa** vendor, .env, node_modules, storage/cache.

### 2. Upload ke Server

Upload via SCP/SFTP ke server:

```bash
scp ligat-cms-deploy.tar user@157.15.40.90:/var/www/ligat-cms/
```

Atau upload via panel hosting (cPanel → File Manager).

### 3. Ekstrak di Server

```bash
cd /var/www/ligat-cms
tar -xf ligat-cms-deploy.tar
mv ligat-cms/* .
rmdir ligat-cms
rm ligat-cms-deploy.tar
```

### 4. Install Dependencies

```bash
composer install --no-dev --optimize-autoloader
```

### 5. Konfigurasi .env

Buat `.env` dari `.env.example` dan sesuaikan:

```bash
cp .env.example .env
php artisan key:generate
```

**Wajib diisi:**
| Variable | Contoh Value | Keterangan |
|----------|-------------|-----------|
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `APP_URL` | `http://157.15.40.90:8080` | URL server |
| `DB_DATABASE` | `mentari` | |
| `DB_USERNAME` | `root` | |
| `DB_PASSWORD` | `your_password` | |
| `FIREBASE_PROJECT_ID` | `app-ligat` | Firebase project |
| `FIREBASE_CREDENTIALS` | `firebase-credentials.json` | Simpan di `storage/app/` |

### 6. Storage & Cache

```bash
# Storage link
php artisan storage:link

# Cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permission
chmod -R 775 storage bootstrap/cache
chmod -R 775 public/storage
```

### 7. Firebase Credentials

Upload file `firebase-credentials.json` (service account key JSON dari Firebase Console):
```bash
# Simpan di storage/app/
nano storage/app/firebase-credentials.json
# Paste isi JSON, Ctrl+X, Y, Enter
```

### 8. Migrate & Seed (Jika DB Baru)

```bash
php artisan migrate
php artisan db:seed --class=DatabaseSeeder
```

### 9. Web Server (Apache/Nginx)

**Apache** — arahkan DocumentRoot ke `ligat-cms/public`:

```apache
<VirtualHost *:8080>
    DocumentRoot "/var/www/ligat-cms/public"
    ServerName 157.15.40.90
    <Directory "/var/www/ligat-cms/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Symlink** (jika path ada spasi atau perlu alias):
```bash
ln -s /var/www/ligat-cms/public /var/www/html/ligat-api
```

### 10. Verify

```
http://157.15.40.90:8080/        ← CMS Login
http://157.15.40.90/ligat-api/   ← Via symlink (alternatif)
http://157.15.40.90/ligat-api/api/ ← API Endpoints
```
