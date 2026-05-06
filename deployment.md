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
2. Create a Python virtual environment.
3. Install backend dependencies.
4. Build frontend assets.

## 3. Environment and Config
- Create `.env` for runtime secrets.
- Create runtime config from `example.config.yaml`.
- Ensure `data/` exists and is writable by service user.

## 4. systemd Setup
- Use template in `server/inventory-manager.service`.
- Update paths, user/group, and environment values.
- Install and enable service:
  - `sudo cp server/inventory-manager.service /etc/systemd/system/`
  - `sudo systemctl daemon-reload`
  - `sudo systemctl enable inventory-manager`
  - `sudo systemctl start inventory-manager`

## 5. nginx Setup
- Use template in `server/inventory-manager.nginx.conf`.
- Copy to nginx sites config and enable it.
- Test and reload nginx.

## 6. Deployment Script
- Use `scripts/deploy_linux.sh` as the deployment entry point.
- Customize this script for your infrastructure and CI/CD flow.

## 7. Verification
- Confirm API health endpoint.
- Confirm frontend loads.
- Confirm service restarts cleanly.
