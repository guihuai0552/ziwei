---
description: How to deploy Ziwei Astrolabe using Docker Compose
---

# Deploying with Docker Compose

This is the recommended way to deploy to your Alibaba Cloud VPS. It encapsulates the Frontend, Backend, and Database into containers.

## 1. Prerequisites (On Server)

SSH into your server:
```bash
ssh root@your_server_ip
```

Install Docker & Docker Compose (Ubuntu):
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages:
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. Deploy Application

Clone your repository:
```bash
cd /var/www
git clone https://github.com/guihuai0552/ziwei.git
cd ziwei
```

**Configure Environment Variables:**
Create `.env.local` file on the server:
```bash
nano .env.local
```
Paste the following (replace with your real values):
```env
DEEPSEEK_API_KEY=your_deepseek_key
# IMPORTANT: For the server-side container to talk to PocketBase, we use the internal URL (handled in docker-compose)
# But for the BROWSER to talk to PocketBase, we need the public IP or Domain
NEXT_PUBLIC_POCKETBASE_URL=http://<YOUR_SERVER_IP>:8090
POCKETBASE_ADMIN_EMAIL=your@email.com
POCKETBASE_ADMIN_PASSWORD=your_password
```

**Start Services:**
```bash
docker compose up -d --build
```

## 3. Initialize Data

Since this is a fresh PocketBase instance, you need to import your redemption codes.

1.  **Access Admin UI**: Open `http://<YOUR_SERVER_IP>:8090/_/` in your browser.
2.  **Login**: Use the email/password you set in `.env.local`.
3.  **Create Collection**: Create `redemption_codes` collection (if not auto-created, but usually you might need to sync schema or just create it manually).
    *   Fields: `is_used` (bool), `note` (text, optional).
    *   **Important**: The ID is system generated, but we want to import our own IDs.
4.  **Import Data**:
    *   Go to Settings -> Import collections (if you have schema) OR just go to the collection and click "Import".
    *   Paste the content of `pocketbase/codes.json` (you can generate this locally with `node pocketbase/generate_codes.js` and copy the content).

## 4. (Optional) Nginx Reverse Proxy

If you want to use a domain (e.g., `ziwei.com`) and HTTPS:

1.  Install Nginx: `apt install nginx`
2.  Configure Nginx to proxy port 3000 (App) and 8090 (DB).

Example Config (`/etc/nginx/sites-available/ziwei`):
```nginx
server {
    server_name ziwei.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

server {
    server_name db.ziwei.com;
    location / {
        proxy_pass http://127.0.0.1:8090;
    }
}
```
3.  Update `.env.local` to use `https://db.ziwei.com`.
4.  Restart Docker: `docker compose down && docker compose up -d`.
