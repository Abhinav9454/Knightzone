# ========================================
# RENDER FRONTEND DEPLOYMENT
# Simple Nginx + React app
# Backend connects separately via API calls
# ========================================

FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend-new/package*.json ./
RUN npm install --no-audit --no-fund

COPY frontend-new/ ./
RUN npm run build

# Serve Frontend
FROM nginx:alpine

# Use Render-specific runtime-templated config so backend URL can be injected via env vars.
ENV API_UPSTREAM_URL=http://127.0.0.1:65535
COPY frontend-new/nginx-render.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
