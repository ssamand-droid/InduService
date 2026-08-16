#!/bin/sh

# منتظر ماندن برای PostgreSQL
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# منتظر ماندن برای Redis
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "Redis started"

# اجرای migrations
echo "Running migrations..."
python manage.py migrate --noinput

# اجرای دستور اصلی
exec "$@"