#!/bin/sh
# Entrypoint untuk container frontend.
# Men-generate /usr/share/nginx/html/js/env.js dari environment variable
# sehingga BASE_URL tidak perlu hardcode di source code.

BACKEND_URL="${BACKEND_URL:-}"

cat > /usr/share/nginx/html/js/env.js <<EOF
window.__ENV__ = {
  BACKEND_URL: "${BACKEND_URL}"
};
EOF

echo "[entrypoint] env.js generated: BACKEND_URL=${BACKEND_URL}"

# Jalankan Nginx
exec nginx -g 'daemon off;'
