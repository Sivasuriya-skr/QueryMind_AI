# QueryMind AI

A full-stack application that converts natural language into SQL queries.

## Project Structure

```
querymind-ai/
├── backend/          # Spring Boot 3 (Java 21, Maven)
│   └── src/
│       ├── main/
│       │   ├── java/com/querymind/querymind_ai/
│       │   │   ├── config/
│       │   │   ├── controller/
│       │   │   ├── service/
│       │   │   ├── repository/
│       │   │   ├── entity/
│       │   │   ├── dto/
│       │   │   ├── security/
│       │   │   ├── exception/
│       │   │   └── util/
│       │   └── resources/
│       │       └── application.yml
│       └── test/
├── frontend/         # React (Vite, JavaScript, Tailwind CSS)
│   └── src/
│       ├── api/
│       ├── components/
│       │   └── Navbar/        # (Navbar.jsx + Navbar.css)
│       ├── pages/
│       │   ├── Login/         # (Login.jsx + Login.css)
│       │   ├── Register/      # (Register.jsx + Register.css)
│       │   ├── Dashboard/     # (Dashboard.jsx + Dashboard.css)
│       │   ├── SchemaExplorer/
│       │   ├── QueryWorkspace/
│       │   ├── History/
│       │   ├── SavedQueries/
│       │   └── NotFound/
│       ├── App.jsx
│       ├── App.css
│       └── index.css
└── README.md
```

**`backend/`** and **`frontend/`** are completely independent projects sharing only this repo root. Each has its own `package.json` (frontend) or `pom.xml` (backend), its own dependencies, and its own build configuration.

## CSS Convention

Every page and component gets its own dedicated `.css` file placed in the same folder as its `.jsx` component:

```
src/pages/Login/Login.jsx
src/pages/Login/Login.css
src/components/Navbar/Navbar.jsx
src/components/Navbar/Navbar.css
```

Each component imports **only its own CSS** file. Global resets and Tailwind directives live in `src/index.css`. Shared theme-level styles belong in `src/App.css`. This keeps styling easy to locate and edit per screen.

## Running Locally

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 18+
- MySQL (optional for boot, required once DB logic is added)

### Backend

```bash
cd backend
mvn spring-boot:run
```

The API starts at **http://localhost:8080**. Verify with:

```bash
curl http://localhost:8080/api/health
# {"status":"UP"}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** (default Vite port). It proxies API calls to `http://localhost:8080/api` via the `VITE_API_BASE_URL` environment variable set in `.env`.

### Combined

Start the backend and frontend in separate terminals. The frontend communicates with the backend through Axios using the configured `VITE_API_BASE_URL`.
