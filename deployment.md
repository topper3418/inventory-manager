# Linux Deployment Guide

This document describes a baseline deployment approach for a Linux server.

## 1. Prerequisites
- Linux server with sudo access
- Python 3.11+
- Node.js 20+
- nginx
- systemd
- git

## 2. Clone and Prepare
1. Clone repository to a deployment path, for example `/opt/inventory-manager`.
2. Create a Python virtual environment: `python -m venv venv && source venv/bin/activate`
3. Install backend dependencies: `pip install -r requirements.txt`
4. Build frontend assets: `cd frontend && npm install && npm run build`

## 3. Environment and Config
- Create `.env` for runtime secrets (e.g. `INV_CONFIG_PATH=production.config.yaml`).
- Create production config from `example.config.yaml`; set database URL and MCP permissions.
- Ensure `data/` exists and is writable by the service user.

## 4. Seed Sample Data (Optional)
```bash
bash scripts/seed.sh
```
Loads `sample_data/sample_db.json` into the local SQLite database.

## 5. systemd Setup
- Use template in `server/inventory-manager.service`.
- Update paths, user/group, and environment values.
- Install and enable service:
  ```bash
  sudo cp server/inventory-manager.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable inventory-manager
  sudo systemctl start inventory-manager
  ```

## 6. nginx Setup
- Use template in `server/inventory-manager.nginx.conf`.
- Copy to nginx sites config and enable it.
- Test and reload nginx.

## 7. Deployment Script
- Use `scripts/deploy_linux.sh` as the deployment entry point.
- Customize this script for your infrastructure and CI/CD flow.

## 8. Verification
- Confirm API health endpoint: `GET /health` → `{"status": "ok"}`
- Confirm frontend loads at the configured public URL.
- Confirm MCP routes respond at `/mcp/*`.
- Confirm service restarts cleanly after reboot.

