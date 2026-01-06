# CryptoBill VPS Deployment Guide

## Prerequisites

Your VPS should have:
- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- At least 2GB RAM
- Domain name pointed to your VPS IP (optional but recommended)

## Step 1: Download Your Code

Use the Emergent platform to download your code, or use git/GitHub integration to push and clone.

## Step 2: Install Required Software on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Step 3: Setup Backend

```bash
# Create project directory
sudo mkdir -p /var/www/cryptobill
cd /var/www/cryptobill

# Upload your code here (backend folder)
# Then:

cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create production .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=cryptobill_production
CORS_ORIGINS=https://yourdomain.com
SECRET_KEY=$(openssl rand -hex 32)
INFURA_API_KEY=your_infura_key_here
EOF

# Test the backend
python -c "from server import app; print('Backend loaded successfully')"
```

## Step 4: Setup Frontend

```bash
cd /var/www/cryptobill/frontend

# Install dependencies
npm install
# or
yarn install

# Create production .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF

# Build for production
npm run build
# or
yarn build

# Build output will be in: /var/www/cryptobill/frontend/build/
```

## Step 5: Create Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/cryptobill-backend.service
```

Add this content:

```ini
[Unit]
Description=CryptoBill FastAPI Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/cryptobill/backend
Environment="PATH=/var/www/cryptobill/backend/venv/bin"
ExecStart=/var/www/cryptobill/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl start cryptobill-backend
sudo systemctl enable cryptobill-backend
sudo systemctl status cryptobill-backend
```

## Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/cryptobill
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend - Serve React build
    location / {
        root /var/www/cryptobill/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cryptobill /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure SSL and redirect HTTP to HTTPS.

## Step 8: Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Step 9: Setup Automatic MongoDB Backups (Optional)

```bash
# Create backup script
sudo nano /usr/local/bin/mongodb-backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --db cryptobill_production --out $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/mongodb-backup.sh
sudo crontab -e
# Add this line for daily backups at 2 AM:
0 2 * * * /usr/local/bin/mongodb-backup.sh
```

## Step 10: Monitoring and Logs

```bash
# View backend logs
sudo journalctl -u cryptobill-backend -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## Updating Your Application

### Update Backend:

```bash
cd /var/www/cryptobill/backend
git pull  # if using git
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart cryptobill-backend
```

### Update Frontend:

```bash
cd /var/www/cryptobill/frontend
git pull  # if using git
npm install
npm run build
# No restart needed - Nginx serves static files
```

## Performance Optimization

### Enable Gzip in Nginx:

Add to your nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### PM2 Alternative for Backend (Optional):

If you prefer PM2 instead of systemd:

```bash
npm install -g pm2
cd /var/www/cryptobill/backend
pm2 start "venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001" --name cryptobill-backend
pm2 startup
pm2 save
```

## Security Checklist

- [ ] Change SECRET_KEY in backend/.env
- [ ] Use strong MongoDB password (if exposed)
- [ ] Enable firewall (ufw)
- [ ] Setup SSL certificate
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Setup fail2ban for SSH protection
- [ ] Limit MongoDB to localhost only
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## Troubleshooting

### Backend not starting:
```bash
sudo journalctl -u cryptobill-backend -n 50
# Check for Python errors or missing dependencies
```

### Frontend not loading:
```bash
# Check Nginx config
sudo nginx -t
# Check permissions
sudo chown -R www-data:www-data /var/www/cryptobill/frontend/build
```

### MongoDB connection issues:
```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('ping')"
```

### 502 Bad Gateway:
- Check if backend is running: `sudo systemctl status cryptobill-backend`
- Check if port 8001 is listening: `sudo netstat -tlnp | grep 8001`

## Production Environment Variables

Make sure these are set correctly:

**Backend (.env):**
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Production database name
- `SECRET_KEY` - Strong random key
- `CORS_ORIGINS` - Your domain (https://yourdomain.com)
- `INFURA_API_KEY` - For blockchain integration (optional)

**Frontend (.env):**
- `REACT_APP_BACKEND_URL` - Your domain (https://yourdomain.com)

## Support

For issues specific to the Emergent platform, use the support agent in the chat interface.
For VPS deployment issues, check:
- Nginx documentation
- FastAPI deployment guides
- MongoDB documentation
