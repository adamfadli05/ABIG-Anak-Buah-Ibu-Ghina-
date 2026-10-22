FROM php:8.2-apache

# Install ekstensi PostgreSQL dan dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    && docker-php-ext-install pgsql pdo pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files dulu (untuk cache layer)
COPY composer.json composer.lock ./

# Install dependencies PHP (Google Client, dll)
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy semua file backend
COPY . .

# Jalankan composer scripts setelah semua file ada
RUN composer dump-autoload --optimize

# Izin folder
RUN chown -R www-data:www-data /var/www/html

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Expose port
EXPOSE 80
