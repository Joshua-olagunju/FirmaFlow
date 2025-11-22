#!/bin/bash
# build-production.sh - Build script for production deployment

echo "🚀 Building FirmaFlow for Production..."

# 1. Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# 2. Build React frontend
echo "🔨 Building React frontend..."
cd Firma_Flow_React
npm install
npm run build

# 3. Copy built files to public directory
echo "📁 Setting up production file structure..."
cd ..
mkdir -p public
cp -r Firma_Flow_React/dist/* public/

# 4. Copy API files
cp -r api public/
cp -r includes public/
cp -r config public/

# 5. Copy environment file
cp .env.production public/.env

# 6. Set permissions
chmod -R 755 public/
chmod -R 644 public/.env

echo "✅ Production build complete!"
echo "📂 Deploy the 'public' folder to your web server"
echo "🔧 Don't forget to:"
echo "   - Update .env with your production database and email settings"
echo "   - Set up your database using the SQL file in database/"
echo "   - Configure your web server to serve from the public directory"