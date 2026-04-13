FROM php:8.4-fpm

# 1. Install system dependencies + Node.js v20
RUN apt-get update && apt-get install -y \
    unzip \
    git \
    curl \
    libzip-dev \
    zip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    default-mysql-client \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql zip gd \
    && pecl install redis && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 3. PHP Settings (2GB Limits)
RUN echo "upload_max_filesize=2048M\npost_max_size=2048M\nmemory_limit=2048M\nmax_execution_time=600" > /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www

# 4. Copy Dependencies Files First (Para mabilis ang rebuilds)
COPY composer.json composer.lock package.json package-lock.json ./

# Install dependencies (no scripts muna para iwas error kung wala pang files)
RUN composer install --no-dev --optimize-autoloader --no-scripts --ignore-platform-reqs \
    && npm install

# 5. Kopyahin na ang buong Source Code
COPY . .

# Patakbuhin ang build at finalize composer
RUN npm run build \
    && composer dump-autoload --optimize

# 6. Corrected Permissions
# Isang bagsakan na lang para malinis
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/public \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache /var/www/public
RUN echo "upload_max_filesize=2048M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size=2048M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit=2048M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time=600" >> /usr/local/etc/php/conf.d/uploads.ini
EXPOSE 9000
CMD ["php-fpm"]
