# QueryMind AI — Deployment Checklist

## Prerequisites

- [ ] MySQL database server (e.g., Render MySQL, Railway MySQL, or Aiven)
- [ ] Docker host OR a Java 17 runtime (backend)
- [ ] Node.js 18+ (for frontend build, or deploy via Vercel)

---

## 1. Environment Variables

Copy `backend/.env.example` to `.env` and fill all values. **Required variables:**

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | 256-bit random base64 string for JWT signing | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | 32-byte hex key for AES password encryption | `openssl rand -hex 32` |
| `SPRING_DATASOURCE_URL` | JDBC URL for the app database | `jdbc:mysql://host:3306/querymind_ai` |
| `SPRING_DATASOURCE_USERNAME` | DB user | |
| `SPRING_DATASOURCE_PASSWORD` | DB password | |
| `AI_PROVIDER` | `openai`, `ollama`, or `mock` | |
| `OPENAI_API_KEY` | Required if `AI_PROVIDER=openai` | |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s), comma-separated | `https://app.vercel.app` |

---

## 2. Backend Deployment (Render / Railway / Docker)

### Option A: Docker (Render or any Docker host)

```bash
cd backend
docker build -t querymind-ai-backend .
docker run -p 8080:8080 --env-file .env querymind-ai-backend
```

**Render:** Connect your GitHub repo → Create Web Service → Select Docker → Set env vars.

### Option B: Java JAR (Railway)

```bash
cd backend
./mvnw package -DskipTests
java -jar target/*.jar
```

**Railway:** Add `JAVA_VERSION=17` in build settings, set env vars.

---

## 3. Frontend Deployment (Vercel)

1. Push frontend to GitHub.
2. On Vercel: Import repo → Framework: Vite → Build: `npm run build` → Output: `dist`.
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api`
4. The included `vercel.json` rewrites all routes to `index.html` for SPA support.

---

## 4. Post-Deployment Verification

- [ ] Visit `https://your-backend.onrender.com/swagger-ui.html` — Swagger UI loads
- [ ] Visit `https://your-backend.onrender.com/api/health` — returns `{ "status": "UP" }`
- [ ] Register a new user at `https://your-frontend.vercel.app/register`
- [ ] Log in, create a database connection, test it
- [ ] Run a query: generate SQL → validate → execute → see grid
- [ ] Run analysis: Explain, Optimize, Execution Plan
- [ ] Check History and Saved Queries pages
- [ ] Verify AI rate limiting: send 11 rapid requests → 429 on the 11th
- [ ] Check logs for `RequestLoggingFilter` output

---

## 5. Production Considerations

- [ ] Use a managed MySQL provider (Render, Railway, Aiven, AWS RDS)
- [ ] Set `SPRING_PROFILES_ACTIVE=mysql` (disables H2 auto-setup)
- [ ] Rate limiting: adjust `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` env vars
- [ ] For horizontal scaling, replace in-memory rate limiter with Redis-backed implementation
- [ ] Enable HTTPS on both frontend and backend
- [ ] Rotate `JWT_SECRET` and `ENCRYPTION_KEY` periodically
