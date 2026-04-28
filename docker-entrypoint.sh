#!/bin/sh
set -e

# Run database migrations on every startup
echo "Running database migrations..."
npx prisma migrate deploy

# Start the app
exec npm start
