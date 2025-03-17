#!/bin/bash

echo "Checking if container is running..."
if [ "$(docker ps -q -f name=eclairum-backend)" ]; then
    echo "✅ Container is running"
else
    echo "❌ Container is NOT running"
    echo "Try starting it with: docker-compose --env-file .env.production -f docker-compose.prod.yaml up -d"
    exit 1
fi

echo "Checking container network settings..."
docker inspect eclairum-backend -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
echo ""

echo "Checking if server is listening inside container..."
docker exec eclairum-backend sh -c "netstat -tulpn | grep LISTEN" || docker exec eclairum-backend sh -c "ps aux | grep node"

echo "Checking port mapping..."
docker port eclairum-backend

echo "Testing connection from inside the container..."
docker exec eclairum-backend sh -c "wget -q -O- http://localhost:3000/health || echo 'Failed to connect internally'"

echo "Testing connection from host machine..."
curl -v http://localhost:3000/health

echo "If you're still having issues, try these troubleshooting steps:"
echo "1. Make sure no other service is using port 3000 on your host machine"
echo "2. Try restarting the container: docker-compose restart backend"
echo "3. Check the logs: docker logs eclairum-backend"
