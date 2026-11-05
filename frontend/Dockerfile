FROM nginx:alpine

# Copy semua file frontend ke nginx
COPY . /usr/share/nginx/html

# Copy konfigurasi Nginx custom (reverse proxy ke backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy & beri izin eksekusi ke entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Entrypoint: generate env.js dari env variable, lalu jalankan Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
