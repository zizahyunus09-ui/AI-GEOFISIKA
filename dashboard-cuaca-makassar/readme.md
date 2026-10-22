
# Makassar Weather Dashboard

Dashboard visualisasi data cuaca Kota Makassar untuk pembelajaran
Geofisika, analisis cuaca, dan pengenalan informasi kebencanaan.

## Fitur

- Filter berdasarkan kecamatan.
- Filter tanggal dan periode waktu.
- Grafik tren suhu, kelembapan, angin, dan curah hujan.
- Grafik komposisi kondisi cuaca.
- Kartu statistik ringkasan.
- Peta interaktif dengan penanda lokasi.
- Tabel ringkasan per kecamatan dan rincian data.

## Teknologi

- HTML untuk struktur website.
- CSS untuk desain responsif pastel pink.
- JavaScript untuk pengolahan data dan interaksi.
- Chart.js untuk grafik.
- Papa Parse untuk membaca CSV.
- Leaflet dan OpenStreetMap untuk peta.

## Sumber Data

Website menggunakan file `Data_Cuaca_Makassar_Simulasi.csv`.

Data yang tersedia merupakan data simulasi untuk demonstrasi
dashboard. Data ini bukan prakiraan resmi BMKG dan tidak boleh
digunakan sebagai dasar keputusan keselamatan.

Koordinat kecamatan juga bersifat ilustratif.

File Excel disertakan sebagai pendukung pemeriksaan dan
dokumentasi data.

## Cara Menjalankan

1. Unduh atau clone repository.
2. Pastikan seluruh file proyek berada pada folder yang sama.
3. Buka folder proyek di Visual Studio Code.
4. Pasang ekstensi Live Server.
5. Klik kanan `index.html`.
6. Pilih `Open with Live Server`.
7. Website akan terbuka di browser.

Koneksi internet diperlukan untuk memuat pustaka grafik dan peta.

## Publikasi GitHub Pages

1. Unggah seluruh file proyek ke repository GitHub.
2. Buka Settings pada repository.
3. Pilih Pages.
4. Pada bagian Build and deployment, pilih Deploy from a branch.
5. Pilih branch `main` dan folder `/ (root)`.
6. Klik Save.
7. Tunggu proses publikasi, lalu buka URL yang ditampilkan pada halaman Pages.

## Pengembangan Selanjutnya

Data simulasi dapat diganti dengan data resmi BMKG setelah
format, waktu, dan sumber datanya diverifikasi.
