#!/bin/bash

# Sync local files to the remote server
rsync -avz --no-g --chmod=ugo=rwX --exclude 'node_modules' /mnt/d/github/Client_relationship_management_portal/ crmadmin@139.59.73.56:posspole

# SSH into the remote server and restart the Docker container
ssh crmadmin@139.59.73.56 << 'ENDSSH'
  cd posspole

  # Stop and remove old containers
  docker-compose down

  # Remove unused Docker images
  docker image prune -af

  # Build Docker images without cache
  docker-compose build --no-cache

  # Start containers
  docker-compose up -d

  # Verify containers are running
  docker ps
ENDSSH
