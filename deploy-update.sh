#!/bin/bash

# Deployment Script - Upload Changed Files Only
# Untuk update backend tanpa menimpa data existing

echo "🚀 Starting deployment of updated backend files to VPS..."

# VPS Credentials
VPS_IP="72.61.140.193"
VPS_USER="root"
VPS_PATH="/var/www/surat-desa-backend"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Connecting to VPS: ${VPS_USER}@${VPS_IP}${NC}"

# Create directories if not exist
echo -e "${YELLOW}📁 Creating directories...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
mkdir -p /var/www/surat-desa-backend/controllers
mkdir -p /var/www/surat-desa-backend/routes
mkdir -p /var/www/surat-desa-backend/uploads/formulir
EOF

# Upload file yang baru/berubah saja
echo -e "${BLUE}📤 Uploading NEW files...${NC}"

# 1. Upload controllers/formulirController.js
echo "  → Uploading controllers/formulirController.js"
scp controllers/formulirController.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/controllers/

# 2. Upload routes/formulir.js
echo "  → Uploading routes/formulir.js"
scp routes/formulir.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/routes/

# 3. Upload server.js (modified)
echo "  → Uploading server.js (modified)"
scp server.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

# 4. Upload generate-hash.js (modified)
echo "  → Uploading generate-hash.js (modified)"
scp generate-hash.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

# 5. Upload .env.production
echo "  → Uploading .env.production"
scp .env.production ${VPS_USER}@${VPS_IP}:${VPS_PATH}/.env

# Optional: Upload file formulir (jika diperlukan)
echo -e "${YELLOW}📄 Uploading sample formulir files (optional)...${NC}"
scp uploads/formulir/*.PDF ${VPS_USER}@${VPS_IP}:${VPS_PATH}/uploads/formulir/ 2>/dev/null || true
scp uploads/formulir/*.docx ${VPS_USER}@${VPS_IP}:${VPS_PATH}/uploads/formulir/ 2>/dev/null || true

# Restart PM2
echo -e "${BLUE}🔄 Restarting backend service...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
cd /var/www/surat-desa-backend
pm2 restart surat-desa-backend || pm2 start server.js --name surat-desa-backend
pm2 save
EOF

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Check logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs surat-desa-backend'${NC}"
