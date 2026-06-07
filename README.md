# Pothole Detection Web App — Setup Tutorial

Full-stack app dengan backend Flask + frontend React (Vite + TypeScript + Tailwind) + database PostgreSQL.

## Tech Stack

| Component  | Tech                                                |
| ---------- | --------------------------------------------------- |
| Frontend   | Vite + React + TypeScript + Tailwind CSS + Recharts |
| Backend    | Flask + SQLAlchemy + scikit-learn + scikit-image    |
| Database   | PostgreSQL                                          |
| Model      | SVM + HOG + LBP (dari notebook training Anda)       |

## Struktur Folder

```
pothole-app/
├── backend/
│   ├── app.py              # Flask routes
│   ├── detector.py         # ML inference (HOG + LBP + SVM)
│   ├── models.py           # SQLAlchemy models
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/             # <- taruh pothole_svm_model.pkl di sini
│   ├── uploads/            # input videos
│   └── outputs/            # annotated videos
└── frontend/
    ├── src/
    │   ├── components/     # UploadPanel, ResultViewer, HistoryList, StatsBar
    │   ├── lib/api.ts      # API client
    │   ├── types/          # TypeScript interfaces
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## Step 1 — Install PostgreSQL

### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download installer dari https://www.postgresql.org/download/windows/ — saat install, set password untuk user `postgres` (catat password ini).

### Verifikasi
```bash
psql --version
```

## Step 2 — Buat Database

```bash
# Login sebagai user postgres
sudo -u postgres psql      # Linux
psql -U postgres           # macOS / Windows

# Di dalam psql:
CREATE DATABASE pothole_db;
CREATE USER pothole_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE pothole_db TO pothole_user;

# Penting untuk PostgreSQL 15+: berikan akses ke schema public
\c pothole_db
GRANT ALL ON SCHEMA public TO pothole_user;
\q
```

Test koneksi:
```bash
psql -U pothole_user -d pothole_db -h localhost
# Masukkan password — kalau berhasil masuk, koneksi OK
\q
```

---

## Step 3 — Setup Backend

```bash
cd pothole-app/backend

# Buat virtual environment
python -m venv venv

# Aktifkan
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Letakkan Model File

Copy `pothole_svm_model.pkl` dan `pothole_scaler.pkl` dari notebook training Anda ke folder `backend/models/`:

```bash
mkdir -p models
# Copy 2 file .pkl dari Colab/local notebook ke sini
```

Kalau model masih di Colab:
```python
# Di notebook training, jalankan ini untuk download:
from google.colab import files
files.download("pothole_svm_model.pkl")
files.download("pothole_scaler.pkl")
```

Pindahkan keduanya ke `backend/models/`.

### Konfigurasi Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://pothole_user:your_strong_password@localhost:5432/pothole_db
SECRET_KEY=ganti_dengan_random_string_panjang
PORT=5000
MODEL_PATH=./models/pothole_svm_model.pkl
SCALER_PATH=./models/pothole_scaler.pkl
UPLOAD_FOLDER=./uploads
OUTPUT_FOLDER=./outputs
FRONTEND_ORIGIN=http://localhost:5173
```

### Jalankan Backend

```bash
python app.py
```

Output:
```
Model loaded from ./models/pothole_svm_model.pkl
* Running on http://0.0.0.0:5000
```

Test endpoint:
```bash
curl http://localhost:5000/api/health
# {"status":"ok","timestamp":"..."}
```

Tabel `predictions` dan `frame_predictions` akan dibuat otomatis saat pertama kali backend start (lewat `db.create_all()`).

---

## Step 4 — Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

### Jalankan Dev Server

```bash
npm run dev
```

Buka http://localhost:5173 di browser.

Vite sudah dikonfigurasi proxy ke backend di `vite.config.ts`:
```ts
proxy: { "/api": { target: "http://localhost:5000" } }
```

Jadi `/api/*` request dari frontend otomatis di-forward ke Flask.

---

## Step 5 — Pakai Aplikasinya

1. Buka http://localhost:5173
2. Drag-drop video pothole (atau klik untuk browse)
3. Adjust threshold kalau perlu (default 0.55)
4. Klik "ANALYZE VIDEO"
5. Tunggu processing (durasi: kira-kira 2x panjang video)
6. Hasil muncul di kanan: video annotated, confidence timeline, stats
7. Riwayat tersimpan di sidebar — klik untuk re-view

---

## Step 6 — Verifikasi Database

Cek data yang tersimpan:

```bash
psql -U pothole_user -d pothole_db -h localhost

# Lihat semua predictions:
SELECT id, original_filename, status, pothole_frame_count, plain_frame_count, avg_confidence
FROM predictions ORDER BY created_at DESC;

# Lihat per-frame predictions untuk prediction ID 1:
SELECT frame_index, timestamp_seconds, confidence, is_pothole
FROM frame_predictions WHERE prediction_id = 1
ORDER BY frame_index LIMIT 20;
```

---

## API Endpoints Reference

| Method   | Endpoint                     | Description                            |
| -------- | ---------------------------- | -------------------------------------- |
| `GET`    | `/api/health`                | Health check                           |
| `POST`   | `/api/predictions`           | Upload video, process, save result     |
| `GET`    | `/api/predictions`           | List all predictions                   |
| `GET`    | `/api/predictions/<id>`      | Get one prediction with frame details  |
| `DELETE` | `/api/predictions/<id>`      | Delete prediction + files              |
| `GET`    | `/api/predictions/stats`     | Aggregated stats                       |
| `GET`    | `/api/videos/<filename>`     | Stream annotated video                 |

### Upload example (curl)
```bash
curl -X POST http://localhost:5000/api/predictions \
  -F "video=@/path/to/your/video.mp4" \
  -F "threshold=0.55" \
  -F "scales=1.0,1.5,2.0"
```

---

## Troubleshooting

### Backend tidak start: "Model file not found"
Pastikan `pothole_svm_model.pkl` dan `pothole_scaler.pkl` ada di `backend/models/`. Cek path di `.env`.

### Database connection error
```
psycopg2.OperationalError: could not connect to server
```
- PostgreSQL belum running: `brew services start postgresql@16` atau `sudo systemctl start postgresql`
- Password salah: cek di `.env` sama dengan yang diset di `CREATE USER`
- Database belum dibuat: ulangi step 2

### Frontend "Network error" saat upload
- Backend belum running di port 5000
- CORS: pastikan `FRONTEND_ORIGIN=http://localhost:5173` di `.env`

### File terlalu besar
Default max 100MB. Naikkan di `.env`:
```
MAX_CONTENT_LENGTH=524288000  # 500MB
```

### Processing terlalu lambat
Edit `backend/detector.py`:
- Kurangi `scales` (misalnya pakai `(1.0, 1.5)` saja)
- Naikkan `frame_skip` (process tiap 4 frame, bukan 2)

### Video annotated tidak bisa diputar di browser
Codec `mp4v` (default) kadang tidak supported di semua browser. Ubah di `detector.py`:
```python
fourcc = cv2.VideoWriter_fourcc(*"avc1")  # H.264
```
Mungkin perlu install `openh264` library.

---

## Architecture Notes

**Mengapa backend wajib?**
Model SVM + HOG + LBP butuh runtime Python (scikit-learn, scikit-image) — tidak bisa jalan di browser. Backend handle inference, frontend handle UI.

**Mengapa simpan per-frame ke DB?**
Untuk visualisasi timeline confidence dan analisis nanti. Kalau cuma butuh summary, bisa skip — cukup simpan di `predictions` table.

**Production considerations (untuk nanti):**
- Async processing dengan Celery + Redis (sekarang sync, frontend menunggu sampai selesai)
- Authentication (Flask-JWT-Extended) kalau multi-user
- Object storage (S3) untuk video (sekarang disimpan lokal)
- Nginx reverse proxy + Gunicorn untuk Flask di production
- HTTPS dengan Let's Encrypt
