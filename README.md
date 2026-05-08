# 🤖 PilahPilih - AI Trash Sorting Game for Kids

PilahPilih adalah prototipe aplikasi web edukatif berbasis kecerdasan buatan (AI) yang dirancang khusus untuk anak usia dini. Aplikasi ini membantu anak-anak belajar memilah sampah ke dalam tiga kategori utama (Plastik, Kertas, dan Organik) dengan cara yang menyenangkan, interaktif, dan imersif.

Aplikasi ini mendukung **Sustainable Development Goals (SDGs)**:
- 📚 **SDG 4**: Pendidikan Berkualitas (*Quality Education*)
- ♻️ **SDG 12**: Konsumsi dan Produksi yang Bertanggung Jawab (*Responsible Consumption and Production*)

---

## ✨ Fitur Utama

- **Integrasi AI Real-time**: Menggunakan model *Teachable Machine* (*TensorFlow.js*) untuk memindai dan mendeteksi sampah (Plastik, Kertas, Organik) secara langsung melalui kamera *webcam*.
- **Antarmuka Ramah Anak**: Menggunakan desain *Soft Neo-brutalism* dengan warna-warna cerah, bentuk membulat, dan elemen antarmuka berukuran besar yang sangat mudah dibaca dan ditekan oleh anak-anak.
- **Kamera Layar Penuh (*Fullscreen*)**: Memanfaatkan integrasi Webcam secara *real-time* yang memenuhi layar untuk memberikan pengalaman pemindaian barang yang imersif.
- **Animasi Ceria**: Animasi *pop-in*, bintang yang bergoyang (*wiggle*), dan transisi dinamis membuat pengalaman belajar tidak membosankan.
- **State Management Mulus**: Telah mengimplementasikan 6 *state* layar secara terpadu dalam satu halaman (*Single Page Application*):
  1. Layar Sambutan (Welcome)
  2. Kamera Pemindaian (Scanning) dengan Hitung Mundur
  3. Hasil: Tong Kuning (Plastik)
  4. Hasil: Tong Biru (Kertas)
  5. Hasil: Tong Hijau (Organik)
  6. Hasil: Ragu-ragu (Uncertain/Confidence Rendah)

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan teknologi web standar yang dioptimalkan untuk performa tinggi:
- **HTML5**: Struktur semantik aplikasi.
- **CSS3 (Vanilla)**: *Styling* khusus dengan variabel dinamis, animasi *keyframes*, dan *Flexbox/Grid layout*.
- **JavaScript (Vanilla)**: Logika *state management*, manipulasi DOM, pengolahan AI, dan penanganan akses `getUserMedia` API untuk kamera.
- **TensorFlow.js & Teachable Machine**: Digunakan untuk inferensi model pendeteksi objek cerdas langsung di sisi klien (*Client-side*).
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
- **Transisi Hujan Sampah**: Transisi spektakuler saat hasil deteksi AI muncul! Menggunakan sistem partikel CSS untuk menghasilkan puluhan objek sampah berjatuhan secara acak dari atas layar (menggunakan variasi gambar botol, kertas, daun, kulit pisang) secara organik.
- **Jeda & Hitung Mundur Visual**: AI tidak mendadak memindai! Terdapat fase layar meredup elegan dilengkapi tulisan "SIAP?" dan hitungan "3, 2, 1" agar anak-anak memiliki waktu menempatkan sampah di depan kamera.
- **Skor Keyakinan Dinamis**: Angka persentase keyakinan di layar hasil (misal: `Yakin 96%`) bukanlah teks palsu, melainkan angka probabilitas presisi hasil kalkulasi model *Machine Learning* yang sesungguhnya.

## 🔮 Rencana Pengembangan Selanjutnya

- **Efek Suara dan Audio**: Menghubungkan *slider volume* di UI dengan Audio Engine. Menambahkan *Voice-over* (VO) maskot Robi untuk membacakan teks, memberi hitung mundur, dan memberikan *feedback* suara riang saat sampah terdeteksi.

---

*Dibuat untuk menginspirasi generasi hijau masa depan.* 🌍🌱
