# Ligat APK — Current Situation

> File ini adalah **source of truth** untuk agent AI yang membaca project ini.
> Dibuat: 2026-05-25
> Tujuan: Agent lain yang baca ini langsung paham situasi, masalah, dan apa yang sudah & belum dilakukan.

---

## 📋 Overview

**Ligat** (Manejemen Tiket, Akses & Respons Internet) — Aplikasi manajemen ISP.
- **Backend**: Laravel 12 CMS (admin panel) — path: `source cms/`
- **Frontend**: Expo / React Native App (Android) — path: `source apk/`
- **Domain live**: https://ligat.my.id (API: https://ligat.my.id/api)
- **Dev API**: `http://157.15.40.90/ligat-api/api` (via symlink, IP publik)

---

## 🗂️ Directory Structure

```
C:\laragon\www\ligat\
├── CURRENTSITUATION.md          ← File ini (source of truth untuk agent)
├── AGENTS.md                    ← Source of truth sebelumnya
├── run-expo-web.bat             ← Script untuk running Expo Web
├── Database/
│   └── n1602585_mentari.sql     ← Database dump (db_ligat)
├── source cms/                  ← Laravel CMS Backend
│   ├── .env                     ← DB: mentari, APP_URL: http://157.15.40.90:8080
│   ├── app/Http/Controllers/
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
│   ├── routes/web.php           ← CMS routes
│   ├── routes/api.php           ← API routes
│   ├── public/                  ← Laravel entry point + symlink target
│   └── composer.json            ← Laravel 12 + Sanctum + DomPDF
│
├── source apk/                  ← Expo / React Native App ← **FOKUS UTAMA**
│   ├── App.js                   ← Root component + navigation
│   ├── app.json                 ← Expo config (package: com.ligat)
│   ├── package.json             ← SDK 54, React Native 0.81.5
│   ├── src/
│   │   ├── api.js               ← Axios instance (BASE URL di sini)
│   │   ├── theme.js             ← Dark theme (kuning + hitam)
│   │   ├── context/AuthContext.js
│   │   ├── screens/             ← 12 screens
│   │   ├── components/
│   │   │   ├── LoginModal.js
│   │   │   ├── Toast.js         ← BARU (commit terakhir)
│   │   │   └── ...
│   │   ├── hooks/useUpdateChecker.js
│   │   └── services/NotificationService.js
│   ├── android/                 ← Bare React Native Android project
│   │   ├── app/
│   │   │   ├── build.gradle     ← versionCode 129, versionName 1.2.9
│   │   │   └── debug.keystore   ← Pass: android
│   │   ├── build.gradle
│   │   ├── gradle.properties
│   │   └── local.properties
│   ├── dist/                    ← Output Expo export (Hermes bundle)
│   │   └── _expo/static/js/android/
│   │       └── index-<hash>.hbc ← Hermes bytecode (~3.3 MB)
│   └── node_modules/
│
├── apk sudah build/             ← Output APK files
│   ├── Ligat-1.2.9.apk         ← APK terbaru (yang gagal install)
│   ├── Ligat-1.2.9-orig-test.apk  ← Original test APK (base untuk inject)
│   ├── Ligat-1.2.9-test.apk       ← Test APK lain
│   ├── Ligat-1.2.9-aligned.apk    ← Hasil zipalign
│   ├── Ligat-1.2.9-unsigned.apk   ← Tanpa signature
│   ├── Ligat-1.2.9-fixed.apk      ← Hasil zip injection
│   ├── artifact.zip               ← Download dari GitHub Actions
│   └── github-build/
│       └── app-debug.apk          ← APK dari GitHub Actions (143 MB)
│
├── .github/workflows/
│   ├── build.yml               ← Release build (butuh keystore di repo)
│   └── build-apk-test.yml      ← Debug/Release build (siap pakai)
│
├── ligat-release.keystore      ← Release keystore (password: ligat2026, alias: ligat)
├── ligat-keystore-base64.txt   ← Base64 encoded keystore
├── build_apk.py                ← Script build APK local (hacky: zip inject)
└── Ligat-1.2.9.apk            ← Copy APK di root
```

---

## 🌐 API Endpoints

### Base URL: `http://157.15.40.90/ligat-api/api` (dev) / `https://ligat.my.id/api` (production)

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/app-settings` | App name, logo, tagline |
| POST | `/login` | Login with whatsapp + password |
| GET | `/check-update` | APK version check & download URL |
| POST | `/registrasi/*` | Registration flow (check WA, OTP, verify, packages, submit) |
| POST | `/forgot-password/*` | Password reset flow (send OTP, reset) |

### Protected (Bearer token via Sanctum)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/home` | Dashboard data |
| GET/POST | `/tagihan` | Billing list & payment |
| GET/POST/PUT | `/tiket` | Ticket CRUD |
| GET | `/artikel` | News/articles |
| GET/POST | `/profil` | Profile & photo upload |
| GET/POST | `/speedtest/*` | Network speed test (ping, download, upload) |
| POST/DELETE | `/fcm-token` | Firebase push notification token |
| POST | `/update-password` | Change password |

---

## 🚧 BUILD APK — Masalah Utama

### ❌ Problem: Android NDK/CMake Crash di Windows

Gradle build (`./gradlew assembleDebug`) di Windows **timeout/gagal** karena:
1. CMake/Ninja crash saat compile native libraries (Hermes, RN packages)
2. WSL2 tidak available (butuh restart VPS — hosting admin slow)
3. Tidak ada KVM/QEMU acceleration

**Hasil test build lokal:**
- ✅ `npx expo export --platform android` — sukses (Hermes bundle .hbc ~3.3 MB)
- ❌ `npx expo run:android` — gagal (butuh device/emulator)
- ❌ `./gradlew assembleDebug` — **timeout >600 detik**
- ❌ `./gradlew assembleDebug` dengan `--no-daemon` — **timeout**

### Approach 1 — Hacky: Inject Bundle via Apktool (GAGAL ❌)

1. `apktool d base.apk` — decompile APK
2. Ganti `assets/index.android.bundle` dengan Hermes baru
3. `apktool b` — rebuild APK
4. Zipalign + sign debug key
5. **Hasil: APK tidak bisa diinstall** — struktur APK rusak

### Approach 2 — Zip Injection (GAGAL ❌)

1. Ambil APK yang tau berfungsi (`Ligat-1.2.9-orig-test.apk`)
2. Buka sebagai ZIP dengan Python `zipfile`
3. Ganti `assets/index.android.bundle` dengan Hermes baru
4. Hapus META-INF signature lama
5. Zipalign + sign (debug key & release key)
6. **Hasil: APK tidak bisa diinstall** — kemungkinan:
   - Base APK (`orig-test`) gak pernah di-test dari awal
   - Signature mismatch dengan versi yang terinstall di HP

### Approach 3 — GitHub Actions (BERHASIL ✅)

1. **Trigger**: Via GitHub API (token dari git remote URL)
2. **Workflow**: `build-apk-test.yml` — build debug
3. **Runner**: Ubuntu latest (no NDK crash)
4. **Hasil**: **SUCCESS** 🎉
5. **Artifact**: `app-debug.apk` — 143 MB
6. **Download**: https://gofile.io/d/wCMjTA

---

## 🔑 Release Keystore

- **File**: `C:\laragon\www\ligat\ligat-release.keystore`
- **Password**: `ligat2026`
- **Alias**: `ligat`
- **Key Password**: `ligat2026`
- **Type**: PKCS12
- **TIDAK di git** (hanya lokal)
- **Base64 copy**: `ligat-keystore-base64.txt`

---

## 🧪 Code Changes Terakhir

Commit `a1b751f` — "Add Toast notifications + GitHub Actions build APK workflow"

### Files changed:
```
source apk/App.js                        ← Tambah ToastProvider wrapper
source apk/src/api.js                    ← API URL: http://157.15.40.90/... (dev)
source apk/src/components/LoginModal.js  ← Ganti Alert.alert → showToast()
source apk/src/components/Toast.js       ← NEW: Toast component (baru)
source apk/src/screens/LoginScreen.js    ← Toast instead of Alert
source apk/src/screens/GoklinScreen.js   ← Toast for validation
source apk/src/screens/BeritaScreen.js   ← Minor updates
source apk/src/screens/RegisterScreen.js ← Minor updates
.github/workflows/build-apk-test.yml     ← NEW: GitHub Actions workflow
.gitignore                               ← Updated
AGENTS.md                                ← Updated
API_ENDPOINTS.md                         ← NEW
```

### Package.json — TIDAK BERUBAH
Semua dependencies sama. Tidak ada native module baru.

### API URL aktif di APK
`http://157.15.40.90/ligat-api/api` — pake IP publik (bukan domain ligat.my.id)

---

## 📦 File Kendali APK

| File | Size | Source | Status |
|------|------|--------|--------|
| `apk sudah build/app-debug.apk` | 143 MB | GitHub Actions (Ubuntu) | ✅ **Proven working** |
|| `apk sudah build/Ligat-1.2.9.apk` | 76.7 MB | Zip injection local | ❌ Gagal install |
|| `apk sudah build/Ligat-1.2.9-orig-test.apk` | 76.7 MB | Build sebelumnya | ❌ Gak jelas tested? |
|| `apk sudah build/app-debug-build-2.apk` | 140 MB | GitHub Actions (export+inject) | ✅ **APK fix: API HTTPS + cleartext + bundle** |
| | **GoFile download**: https://gofile.io/d/UhA2RR | | |

---

## 💡 Build Options ke Depan

### Option A: GitHub Actions (RECOMMENDED ✅)
```bash
# Trigger via API:
curl -X POST \
  -H "Authorization: token <GITHUB_TOKEN>" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/tungtungtungsahuranomali/masboro/actions/workflows/build-apk-test.yml/dispatches" \
  -d '{"ref":"main","inputs":{"build-type":"debug"}}'

# Download artifact:
# Dari URL: https://github.com/.../actions/runs/<RUN_ID>
```
- **Pro**: Build di Ubuntu, proper, reliable
- **Con**: Butuh ~10 menit + 2 menit download
- **Keystore**: Release build butuh `ligat-release.keystore` di-git dulu

### Option B: Fix Local Build
Belum ada progress. Root cause: CMake/Ninja crash. Kemungkinan solusi:
- Install ulang NDK versi tertentu
- Pake `--init` script buat Windows native build
- Upgrade ke Expo SDK 55+ (mungkin fix NDK issue)

### Option C: EAS Build (Expo Cloud)
```bash
npx eas build --platform android --profile preview
```
- **Pro**: Proper build, gak perlu repo di-push
- **Con**: Butuh login Expo + free tier limited

---

## 🚦 Quick Start untuk Agent Baru

1. **Baca file ini** — paham situasi ☝️
2. **Pull source**: `cd source apk && npm ci`
3. **Export bundle**: `npx expo export --platform android`
4. **Build APK**: Trigger GitHub Actions (lihat Option A di atas)
5. **Download APK**: Dari artifact workflow
6. **Upload ke GoFile**: `curl -F "file=@app-debug.apk" https://gofile.io/uploadFile`
7. **Ubah API URL**: Edit `src/api.js` sebelum export

---

## ⚠️ Known Issues

1. **ligat.test vhost**: Path `source cms/public` mengandung spasi, bikin Apache vhost error. Solusi: pakai symlink `ligat-api` → `source cms/public`.
2. **Android NDK build**: CMake/Ninja crash di Windows. Jangan coba build Gradle lokal.
3. **FCM**: Firebase credentials file (`firebase-credentials.json`) belum ada di repo. Push notification gabisa jalan.
4. **Git remote**: Pake HTTPS token di URL (`ghp_...`). Kurang secure. Saran: ganti ke SSH.
5. **ligat-release.keystore**: Ada di lokal tapi **TIDAK di git**. Release build via GitHub Actions butuh ini dimasukkan ke repo atau GitHub Secrets.

---

## 📞 Informasi Penting

- **Git remote**: `https://<token>@github.com/tungtungtungsahuranomali/masboro.git`
- **Branch**: `main`
- **Developer**: Angga (Indonesia)
- **Platform**: Windows 10 VPS (RDP), Laragon
- **User home**: `C:\Users\Administrator`
- **Android SDK**: `C:\Users\Administrator\AppData\Local\Android\Sdk`
- **NDK**: 27.1.12297006
- **Build Tools**: 35.0.0, 34.0.0, 36.0.0

---

*— End of CURRENTSITUATION.md —*
