# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# نصب وابستگی‌های سیستم
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# کپی فایل requirements و نصب پکیج‌ها
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# کپی کل پروژه
COPY . .

# ایجاد پوشه‌های مورد نیاز
RUN mkdir -p /app/staticfiles /app/media /app/logs

# جمع‌آوری فایل‌های استاتیک (در زمان build انجام می‌شود)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# اسکریپت ورودی
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "InduService.wsgi:application", "--bind", "0.0.0.0:8000"]