# Knights Battle Zone Complete Deployment Guide

## ðŸŽ¯ Architecture

```
FRONTEND (React)
    â†“ deploys on Render
    â†“
Nginx (Port 80) - serves static files
    â†“ 
API calls go through nginx runtime proxy to external Backend URL

BACKEND (Spring Boot)
    â†“ deploys on Railway/GCP/Your VPS
    â†“
Port 8080 - REST API
    â†“
MySQL (PlanetScale/Railway)
```

---

## ðŸš€ Quick Start - Local Development

```bash
cd Knights Battle Zone
docker-compose up
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PgAdmin: http://localhost:15672 (RabbitMQ)

All services auto-connect. âœ…

---

## â˜ï¸ Render Deployment (Frontend)

### Settings in Render Dashboard

| Field | Value |
|-------|-------|
| **Repository** | Your GitHub repo |
| **Branch** | `main` |
| **Root Directory** | `Knights Battle Zone` |
| **Build Command** | (use default) |
| **Dockerfile Path** | `Dockerfile` |
| **Port** | `80` |
| **Auto-deploy** | On |

### Deploy

Just press **Deploy** button. âœ…

Frontend will be live at: `https://your-service.onrender.com`

---

## ðŸ”— Connect Backend to Frontend

### Option 1: Railway Backend (Recommended)

1. Deploy Backend on Railway:
   - **GitHub Repo:** Same repo (Knights Battle Zone)
   - **Dockerfile:** (none, use `docker-compose`)
   - **Service:** Create from GitHub > Select Dockerfile.backend (if created)
   - Or use standard Spring Boot deployment

2. Get Backend URL from Railway: `https://your-backend-railway.app`

3. **Add Frontend Environment Variable** on Render:
   ```
   API_UPSTREAM_URL=https://your-backend-railway.app
   ```

### Option 2: GCP/AWS Backend

Similar approach - deploy backend separately, get URL, add to Render env vars.

---

## ðŸ“ Environment Variables

### Render Frontend
```env
API_UPSTREAM_URL=https://backend-url.railway.app
```

### Railway Backend
```env
SPRING_DATASOURCE_URL=mysql://user:pass@db.planetscale.com/dbname
SPRING_DATASOURCE_USERNAME=user
SPRING_DATASOURCE_PASSWORD=password
JWT_SECRET=<random-secret>
TRACKER_TOKEN_SECRET=<random-secret>
JUDGE_INTERNAL_TOKEN=<random-secret>
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

---

## ðŸ› ï¸ Local Testing

### Docker Compose (All Services)

```bash
# From Knights Battle Zone directory
docker-compose up

# Logs follow
docker-compose logs -f

# Stop everything
docker-compose down

# Full cleanup
docker-compose down -v
```

Services:
- âœ… MySQL (3306)
- âœ… Redis (6379)
- âœ… RabbitMQ (5672, admin: 15672)
- âœ… Backend (8080)
- âœ… Frontend (3000)

---

## ðŸ“ Project Structure

```
Knights Battle Zone/
â”œâ”€â”€ docker-compose.yml          â† Local dev
â”œâ”€â”€ Dockerfile                  â† Render frontend
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ Dockerfile              â† Backend build
â”‚   â”œâ”€â”€ pom.xml
â”‚   â””â”€â”€ src/
â”œâ”€â”€ frontend-new/
â”‚   â”œâ”€â”€ Dockerfile              â† Frontend build
â”‚   â”œâ”€â”€ nginx-render.conf       â† Render config (no proxy)
â”‚   â”œâ”€â”€ nginx-docker.conf       â† Docker config (with proxy)
â”‚   â”œâ”€â”€ nginx-site.conf         â† Default (Render)
â”‚   â””â”€â”€ src/
â””â”€â”€ .env.example
```

---

## âœ… Verification Checklist

- [ ] Frontend builds locally: `docker-compose up` â†’ http://localhost:3000
- [ ] Backend API running: `http://localhost:8080/api/health`
- [ ] MySQL connected: data in tables
- [ ] Render deployment: Frontend live, no nginx errors
- [ ] Backend deployed separately with env vars set
- [ ] Frontend environment var: `API_UPSTREAM_URL` set correctly

---

## ðŸ› Troubleshooting

### "host not found in upstream 'backend'"
**Cause:** Using docker-config.conf in local-only setup  
**Fix:** Use `docker-compose up` - it handles config

### "Failed to connect to backend"
**Cause:** API_UPSTREAM_URL not set correctly  
**Fix:** Check Render environment variables

### "React app shows 404"
**Cause:** Wrong Dockerfile path  
**Fix:** Verify `Dockerfile` in root of Knights Battle Zone

### "Docker-compose won't start"
```bash
# Clean everything
docker-compose down -v
docker system prune

# Rebuild
docker-compose build --no-cache
docker-compose up
```

---

## ðŸ“ž Support

- **Docker issues:** Check logs: `docker-compose logs backend`
- **Render issues:** Check Render dashboard logs
- **Backend issues:** SSH into Railway and check logs

---

**Ready to deploy? Let's go!** ðŸŽ‰

