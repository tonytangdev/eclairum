#!/bin/bash

# Go to the monorepo root directory
cd ../..

# Verify .env.production file exists
if [ ! -f apps/backend/.env.production ]; then
  echo "Error: .env.production file not found!"
  echo "Please create apps/backend/.env.production with your Supabase credentials."
  exit 1
fi

# Print environment variables for debugging (without showing passwords)
echo "Using database:"
grep -v PASSWORD apps/backend/.env.production | grep DATABASE

# Test if the database host is reachable
DB_HOST=$(grep DATABASE_HOST apps/backend/.env.production | cut -d'=' -f2)
DB_PORT=$(grep DATABASE_PORT apps/backend/.env.production | cut -d'=' -f2)
echo "Testing connection to database at $DB_HOST:$DB_PORT"
nc -zv $DB_HOST $DB_PORT || echo "Warning: Unable to connect directly to database, but container might still work"

# Build using docker compose with proper context
docker compose -f apps/backend/docker-compose.prod.yaml build

# Ask if we should run the container
read -p "Do you want to run the container now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Starting container..."
  docker compose --env-file apps/backend/.env.production -f apps/backend/docker-compose.prod.yaml up -d
  
  echo "Checking logs for database connection issues..."
  sleep 5
  docker logs eclairum-backend

  echo "If you still see connection errors, try these troubleshooting steps:"
  echo "1. Make sure your Supabase database allows external connections"
  echo "2. Check if your DATABASE_HOST is correct (should be something like db.xxxxx.supabase.co)"
  echo "3. Try running: docker exec -it eclairum-backend ping \$DATABASE_HOST"
fi
