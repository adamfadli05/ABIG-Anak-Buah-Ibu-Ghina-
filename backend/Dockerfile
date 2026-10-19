FROM php:8.2-apache

# Install ekstensi PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pgsql \
    && apt-get clean

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set working directory
WORKDIR /var/www/html

# Copy semua file backend
COPY . .

# Install dependencies PHP (Google Client, dll)
RUN composer install --no-dev --optimize-autoloader

# Izin folder
RUN chown -R www-data:www-data /var/www/html

# Expose port
EXPOSE 80
