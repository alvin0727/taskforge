# Backend FastAPI

Struktur folder backend ini mengikuti standar industri:

- `app/` : Source code utama FastAPI
- `app/api/` : Routers/endpoints
- `app/models/` : Database models/schema
- `app/services/` : Business logic/service layer
- `app/utils/` : Helper/utilitas
- `tests/` : Unit/integration tests
- `requirements.txt` : Dependencies Python

## Menjalankan Backend

1. Buat dan aktifkan virtual environment (opsional tapi direkomendasikan):
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Jalankan aplikasi:
   ```powershell
   python app/main.py
   # atau
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
