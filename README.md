# 🤖 PilahPilih - AI Trash Sorting Game for Kids

PilahPilih adalah prototipe aplikasi web edukatif berbasis kecerdasan buatan (AI) yang dirancang khusus untuk anak usia dini. Aplikasi ini membantu anak-anak belajar memilah sampah ke dalam tiga kategori utama (Plastik, Kertas, dan Organik) dengan cara yang menyenangkan, interaktif, dan imersif.

Aplikasi ini mendukung **Sustainable Development Goals (SDGs)**:
- 📚 **SDG 4**: Pendidikan Berkualitas (*Quality Education*)
- ♻️ **SDG 12**: Konsumsi dan Produksi yang Bertanggung Jawab (*Responsible Consumption and Production*)

---

## ✨ Fitur Utama

- **Antarmuka Ramah Anak**: Menggunakan desain *Soft Neo-brutalism* dengan warna-warna cerah, bentuk membulat, dan elemen antarmuka berukuran besar yang sangat mudah dibaca dan ditekan oleh anak-anak.
- **Kamera Layar Penuh (*Fullscreen*)**: Memanfaatkan integrasi Webcam secara *real-time* yang memenuhi layar untuk memberikan pengalaman pemindaian barang yang imersif.
- **Animasi Ceria**: Animasi *pop-in*, bintang yang bergoyang (*wiggle*), dan transisi *fade-out* kamera yang mulus membuat pengalaman belajar tidak membosankan.
- **Simulasi State Management**: Telah mengimplementasikan 6 *state* layar secara mandiri dalam satu halaman (*Single Page Application*):
  1. Layar Sambutan (Welcome)
  2. Kamera Pemindaian (Scanning)
  3. Hasil: Tong Kuning (Plastik)
  4. Hasil: Tong Biru (Kertas)
  5. Hasil: Tong Hijau (Organik)
  6. Hasil: Ragu-ragu (Uncertain/Confidence Rendah)

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan teknologi web standar yang dioptimalkan untuk integrasi Machine Learning (TensorFlow.js) di masa mendatang:
- **HTML5**: Struktur semantik aplikasi.
- **CSS3 (Vanilla)**: *Styling* khusus dengan variabel dinamis, animasi *keyframes*, dan *Flexbox/Grid layout*.
- **JavaScript (Vanilla)**: Logika *state management*, manipulasi DOM, dan penanganan akses `getUserMedia` API untuk kamera.
- **Vite**: *Build tool* lokal yang sangat cepat untuk pengalaman pengembangan yang optimal.

## 🚀 Cara Menjalankan Secara Lokal

1. Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) di komputer Anda.
2. *Clone* repositori ini atau buka folder proyek di terminal Anda.
3. Instal dependensi (*Vite*):
   ```bash
   npm install
   ```
4. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Buka tautan lokal yang disediakan (biasanya `http://localhost:5173/`) di browser Anda. **Pastikan untuk mengizinkan akses kamera** saat diminta.

## 🎨 UI/UX Highlights

- **Efisiensi Kamera**: Aliran video dari Webcam secara cerdas dimatikan (kamera ditutup) saat pengguna berada di layar sambutan atau saat aplikasi berhenti, menghemat baterai dan menjaga privasi.
- **Hover Interaktif**: Tong sampah memberikan respons instan saat disorot kursor, mengganti labelnya (misal: `PLASTIK` menjadi `TONG KUNING!`) untuk memudahkan anak-anak mengasosiasikan warna dengan jenis sampah.
- **Responsif (*Scaling*)**: Menggunakan pendekatan *Viewport Width/Height* dipadu dengan properti CSS Modern yang menyesuaikan dengan mulus di layar monitor laptop tanpa membuat konten terlihat terlalu kecil.

## 🔮 Rencana Pengembangan Selanjutnya

- **Integrasi Model AI**: Menghubungkan *event trigger* manual saat ini dengan model Computer Vision menggunakan *Teachable Machine* atau *TensorFlow.js* untuk melakukan inferensi secara langsung di sisi klien (*Client-side*).
- **Efek Suara (Audio)**: Menambahkan *Voice-over* (VO) maskot Robi untuk membacakan teks dan memberikan *feedback* suara yang riang.
---

*Dibuat untuk menginspirasi generasi hijau masa depan.* 🌍🌱
