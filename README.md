# Dashboard PBM – PT. Lagaligo Logistik (v2)

Halaman: Executive Summary · Lagaligo Makassar · Lagaligo Barru · Input Data (khusus admin).
Frontend statis (`public/`) + API serverless (`api/`) + database Postgres (Neon).

## Re-deploy
Ganti seluruh isi repository GitHub dengan isi folder ini (atau jalankan `vercel --prod` dari folder ini). Database Neon yang sudah terhubung tetap dipakai.

## Login admin
- Username: `admin` · Password: `admin123`
- Untuk mengganti, tambahkan Environment Variables di Vercel: `LOGIN_USER` dan `LOGIN_PASSWORD`, lalu Redeploy.
- Variabel `ADMIN_PASSWORD` dari versi lama sudah tidak dipakai.

## Mengosongkan data lama
Data awal sudah tidak ikut dalam paket ini, tetapi data lama masih tersimpan di database Neon.
Login → Input Data → Upload Excel → klik **Hapus Semua Data**, atau pilih **Ganti seluruh data** saat mengunggah file yang sudah diperbaiki.

## Format Excel
Sama dengan Data-PBM2026.xlsx. Lokasi dibaca dari kode Nomor: `RBM-MKS…` = Makassar, `RBM-BRU…` = Barru.
