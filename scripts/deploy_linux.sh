#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/inventory-manager"
APP_USER="inventory"

if [[ "${EUID}" -ne 0 ]]; then
	echo "Run this deployment script with sudo or as root."
	exit 1
fi

if ! id -u "$APP_USER" >/dev/null 2>&1; then
	useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

mkdir -p "$APP_DIR"
rsync -a --delete --exclude '.git' ./ "$APP_DIR/"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

sudo -u "$APP_USER" python3 -m venv "$APP_DIR/venv"
sudo -u "$APP_USER" "$APP_DIR/venv/bin/pip" install --upgrade pip
sudo -u "$APP_USER" "$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"

if [[ -f "$APP_DIR/frontend/package.json" ]]; then
	pushd "$APP_DIR/frontend" >/dev/null
	sudo -u "$APP_USER" npm ci
	sudo -u "$APP_USER" npm run build
	popd >/dev/null
fi

cp "$APP_DIR/server/inventory-manager.service" /etc/systemd/system/inventory-manager.service
cp "$APP_DIR/server/inventory-manager.nginx.conf" /etc/nginx/conf.d/inventory-manager.conf

systemctl daemon-reload
systemctl enable inventory-manager
systemctl restart inventory-manager
nginx -t
systemctl reload nginx

echo "Deployment completed."
