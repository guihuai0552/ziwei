---
description: How to deploy Ziwei Astrolabe to a Linux VPS (Ubuntu)
---

# Deploying to a VPS (Ubuntu 22.04)

This guide assumes you have a fresh Ubuntu 22.04 server with root access (or sudo user).

## 1. Initial Server Setup

SSH into your server:
```bash
ssh root@your_server_ip
```

Update packages:
```bash
apt update && apt upgrade -y
apt install -y curl git unzip nginx certbot python3-certbot-nginx
```

## 2. Install Node.js (v20)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

## 3. Deploy PocketBase

Create directory:
```bash
mkdir -p /var/www/pocketbase
cd /var/www/pocketbase
```

Download PocketBase (Linux amd64):
```bash
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.21/pocketbase_0.22.21_linux_amd64.zip
unzip pocketbase_0.22.21_linux_amd64.zip
rm pocketbase_0.22.21_linux_amd64.zip
```

Start PocketBase with PM2:
```bash
pm2 start ./pocketbase --name "pocketbase" -- serve --http="127.0.0.1:8090"
```

## 4. Deploy Next.js App

Clone your repository (you might need to generate an SSH key and add it to GitHub first, or use HTTPS with token):
```bash
cd /var/www
git clone https://github.com/guihuai0552/ziwei.git
cd ziwei
```

Install dependencies and build:
```bash
npm install
# Create .env.local
echo "NEXT_PUBLIC_POCKETBASE_URL=https://your-domain.com/pb" > .env.local
echo "POCKETBASE_ADMIN_EMAIL=your@email.com" >> .env.local
echo "POCKETBASE_ADMIN_PASSWORD=your_password" >> .env.local
echo "DEEPSEEK_API_KEY=your_key" >> .env.local

npm run build
```

Start Next.js with PM2:
```bash
pm2 start npm --name "ziwei" -- start -- -p 3000
pm2 save
pm2 startup
```

## 5. Configure Nginx (Reverse Proxy)

Create config file:
```bash
nano /etc/nginx/sites-available/ziwei
```

Paste the following (replace `your-domain.com`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Next.js App
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # PocketBase API (under /pb/ or separate subdomain)
    # Here we use a separate path /api/ for PB to avoid conflict, 
    # BUT PocketBase expects root. 
    # EASIER STRATEGY: Use a subdomain like pb.your-domain.com for PocketBase
    # OR proxy specific paths.
    
    # Let's assume you use the same domain and route /pb/ to PocketBase? 
    # PocketBase isn't designed for subpath easily.
    # RECOMMENDATION: Use two domains: ziwei.com and api.ziwei.com
}
```

**Better Nginx Config (Single Domain Strategy):**

If you only have one domain, you can route `/api/` to Next.js (it handles it) and maybe `/pb/` to PocketBase, but PocketBase UI might break.
**Simplest:** Run PocketBase on port 8090 directly (open firewall) OR use a subdomain `db.your-domain.com`.

Let's assume **Subdomain Strategy** (cleanest):

**File 1: Frontend (`/etc/nginx/sites-available/ziwei`)**
```nginx
server {
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... headers ...
    }
}
```

**File 2: Backend (`/etc/nginx/sites-available/pocketbase`)**
```nginx
server {
    server_name db.your-domain.com;
    client_max_body_size 10M;
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable sites:
```bash
ln -s /etc/nginx/sites-available/ziwei /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/pocketbase /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## 6. SSL (HTTPS)

```bash
certbot --nginx -d your-domain.com -d db.your-domain.com
```

Done!
