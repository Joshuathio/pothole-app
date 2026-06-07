FROM python:3.12-slim

WORKDIR /app

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV MODEL_PATH=/app/models/pothole_svm_model.pkl
ENV SCALER_PATH=/app/models/pothole_scaler.pkl
ENV UPLOAD_FOLDER=/app/uploads
ENV OUTPUT_FOLDER=/app/outputs

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/uploads /app/outputs

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--timeout", "600", "app:create_app()"]
