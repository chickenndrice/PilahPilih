# 🤖 PilahPilih - Game Pemilahan Sampah Berbasis AI untuk Anak-Anak

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)]([TARUH_LINK_DEPLOYMENT_VERCEL_DISINI])
[![SDGs 4](https://img.shields.io/badge/SDGs-Goal_4-blue?style=for-the-badge)](https://sdgs.un.org/goals/goal4)
[![SDGs 12](https://img.shields.io/badge/SDGs-Goal_12-green?style=for-the-badge)](https://sdgs.un.org/goals/goal12)

**PilahPilih** adalah sebuah aplikasi web edukatif berbasis kecerdasan buatan (*AI*) yang dirancang khusus untuk mengenalkan konsep pemilahan sampah kepada anak-anak usia dini di Indonesia. Melalui antarmuka yang ceria dan interaktif, anak-anak diajak untuk memilah sampah langsung di depan kamera webcam ke dalam tiga kategori tong sampah utama: **Organik (Tong Hijau)**, **Plastik (Tong Kuning)**, dan **Kertas (Tong Biru)**.

Aplikasi ini berkontribusi langsung pada pencapaian Tujuan Pembangunan Berkelanjutan PBB (**Sustainable Development Goals / SDGs**):
*   📚 **SDG 4: Pendidikan Berkualitas** (*Quality Education*) — Menyediakan sarana edukasi interaktif gratis untuk anak-anak mengenai lingkungan.
*   ♻️ **SDG 12: Konsumsi dan Produksi yang Bertanggung Jawab** (*Responsible Consumption and Production*) — Menanamkan kesadaran memilah sampah sejak usia dini.

> [!NOTE]  
> **Link Website Live**: [[TARUH_LINK_DEPLOYMENT_VERCEL_DISINI]] (Tempel link deploy Vercel Anda di sini setelah proses deploy selesai!)

---

## ✨ Fitur Utama & Keunggulan

### 1. Klasifikasi AI Real-Time Cerdas
*   **Dataset Controllable**: Sistem menggunakan model gambar Teachable Machine (*TensorFlow.js*) yang telah diuji dengan dataset terkontrol untuk klasifikasi sampah yang akurat.
*   **Skor Keyakinan Akurat**: Persentase keyakinan deteksi (contoh: `Yakin 95%`) dihitung langsung dari output probabilitas model klasifikasi.

### 2. Audio Interaktif Terintegrasi (Voice of Robi)
*   **Greeting Sambutan Sekali Putar**: Suara sambutan Robi (`1-pembuka.mp3`) hanya diputar satu kali saat pertama kali menekan tombol main. Jika user menjeda game dan bermain lagi, audio pembuka tidak akan mengulang demi kenyamanan UX.
*   **Variasi VO Robi Acak**: Agar permainan tidak monoton, transisi ke setiap kategori sampah memutar variasi pengisi suara Robi secara acak (*randomized*):
    *   **Plastik**: `2-plastik-v1.mp3` atau `3-plastik-v2.mp3`
    *   **Kertas**: `4-kertas-v1.mp3` atau `5-kertas-v2.mp3`
    *   **Organik**: `6-organik-v1.mp3` atau `7-organik-v2.mp3`
    *   **Ragu (<80% confidence)**: `8-ragu-v1.mp3`, `9-ragu-v2.mp3`, atau `10-ragu-v3.mp3`
*   **Efek Suara Lengkap (SFX)**: Pemutaran SFX transisi sukses (`sound-fx-complete-v1.mp3`) berjalan sebelum suara Robi berbunyi.
*   **Slider Volume Interaktif**: Volume audio disesuaikan secara real-time melalui widget pengatur volume yang intuitif.

### 3. Proteksi Navigasi (Audio Interlock)
*   Tombol kontrol hasil scan ("LANJUT MAIN" dan "COBA LAGI") dinonaktifkan secara otomatis (dengan penanda visual abu-abu `:disabled` pada tombol) ketika rangkaian audio transisi sedang berjalan. Hal ini mencegah pengguna mempercepat transisi sebelum audio selesai diputar.

### 4. Animasi & Transisi Premium
*   **Hujan Partikel Transisi**: Transisi interaktif visual saat scan selesai menggunakan sistem partikel hujan gambar sampah (berupa variasi botol, kertas, kulit pisang, atau dedaunan) yang jatuh secara acak dari atas layar.
*   **Desain Soft Neo-Brutalism**: Gaya desain modern ramah anak dengan *border* tegas, bayangan solid (*hard shadows*), tombol bertipe dinamis, dan fontasi ramah anak (*Fredoka* & *Caveat*).

---

## ⚡ Optimalisasi Kinerja & Efisiensi Codebase

Proyek ini telah melalui proses optimasi menyeluruh untuk memastikan aplikasi dapat berjalan mulus di perangkat dengan spesifikasi rendah sekalipun:

1.  **AI Inference Throttling (Optimasi CPU/GPU)**:
    Loop deteksi kamera Teachable Machine dibatasi secara cerdas (*throttled*) agar hanya mendeteksi setiap **120ms** (sekitar 8-9 FPS) daripada berjalan 60 kali per detik. Langkah ini menghemat konsumsi CPU/GPU hingga **85%**, mencegah perangkat panas, dan membuat jalannya animasi scan-line tetap berada di 60fps.
2.  **Sinkronisasi Kesiapan Kamera (Zero Camera Delay)**:
    Hitung mundur (countdown) "SIAP -> 3 -> 2 -> 1" diatur hanya akan berjalan setelah *feed* video kamera benar-benar memancarkan frame visual aktif (`videoWidth > 0` dan `readyState >= 2`). Ini melenyapkan masalah bug layar hitam/stuck pada angka "1" saat menunggu inisialisasi hardware kamera.
3.  **Aset Gambar Lossless WebP**:
    Seluruh berkas aset gambar di `public/assets/images/` telah dikompresi ke format **WebP Lossless** untuk kualitas piksel yang 100% sempurna tanpa degradasi visual, sekaligus mengurangi total ukuran direktori dari **10.72 MB menjadi 8.44 MB** (reduksi ~21.3%).
4.  **Arsitektur Berbasis Kelas Modular**:
    Struktur kode Javascript di [src/main.js](src/main.js) ditulis secara modular berbasis Object-Oriented Programming (OOP):
    *   `AudioManager`: Mengendalikan seluruh jalannya musik, volume, antrean SFX, dan pembersihan audio (`stopAll()`).
    *   `CameraManager`: Mengatur kesiapan *hardware*, *play/stop* stream, dan visual transisi kamera.
    *   `ModelManager`: Mengurus pengunduhan model dan loop prediksi AI dengan *throttle*.
    *   `TransitionManager`: Membuat visual animasi hujan partikel dan mencegah kebocoran memori DOM.
    *   `AppController`: Bertindak sebagai koordinator interaksi antarmuka dan *state management*.

---

## 🛠️ Stack Teknologi
*   **Core**: HTML5, Vanilla JavaScript, CSS3
*   **AI Engine**: TensorFlow.js, Teachable Machine Image Classifier API
*   **Bundler & Dev Server**: Vite (v5)
*   **Aset**: Lossless WebP (Gambar) & MP3 (Audio)

---

## 🚀 Cara Menjalankan Secara Lokal

### Prasyarat
*   Sudah menginstal [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan).

### Langkah-langkah
1.  Unduh (*clone*) repositori ini ke komputer Anda.
2.  Buka terminal pada folder proyek, lalu pasang dependensi Vite:
    ```bash
    npm install
    ```
3.  Jalankan server lokal dalam mode pengembangan:
    ```bash
    npm run dev
    ```
4.  Buka peramban (*browser*) Anda ke alamat `http://localhost:5173/`.
5.  Berikan izin akses kamera/webcam saat peramban memunculkan prompt izin.

---

## 🌐 Panduan Deploy ke Vercel

Proyek ini menggunakan Vite, sehingga sangat mudah di-deploy ke Vercel:

1.  Pasang Vercel CLI secara global (opsional):
    ```bash
    npm install -g vercel
    ```
2.  Jalankan perintah deploy di root direktori proyek:
    ```bash
    vercel
    ```
3.  Ikuti petunjuk konfigurasi proyek pada terminal:
    *   *Set up and deploy?* **Yes**
    *   *Link to existing project?* **No**
    *   *Project name?* **pilahpilih**
    *   *In which directory is your code located?* **./**
    *   *Want to modify settings?* **No** (Vite akan terdeteksi secara otomatis dan mengatur perintah build ke `vite build` dan direktori output ke `dist`).
4.  Setelah proses selesai, Vercel akan memberikan tautan *live* URL proyek Anda. Ganti tulisan `[TARUH_LINK_DEPLOYMENT_VERCEL_DISINI]` di baris atas dan baris ke-21 README ini dengan tautan tersebut.

---
*Dibuat dengan cinta untuk menginspirasi generasi hijau masa depan Indonesia.* 🌍🌱
