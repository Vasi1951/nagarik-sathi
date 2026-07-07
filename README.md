# NagarikSathi – AI-Powered Civic Companion 🇮🇳

> **PromptWars x Global Prompt Challenge** — Smart Bharat Track Submission

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-blue)](https://nagarik-sathi-663154056506.us-central1.run.app)
[![AI Engine](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-orange)](https://cloud.google.com/vertex-ai)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

## 🎯 Chosen Vertical

**Smart Bharat – AI-Powered Civic Companion**

NagarikSathi (*Citizen Friend* in Hindi) is a full-stack AI platform that empowers Indian citizens to:
1. Discover personalized government schemes through AI matching
2. Report civic issues using Gemini Vision AI (image → complaint)
3. Ask questions about public services in 7 Indian languages
4. Track complaint resolution with live status timelines

---

## 🏗️ Technical Approach & Architecture

```
Citizen Browser (React + Vite)
       │
       │  /api/* (REST)
       ▼
Express.js Server (Node.js)
  ├── Helmet.js (Security Headers)
  ├── Rate Limiter (Per-IP: 100/15min, AI: 30/15min)
  ├── Input Validation (type, length, whitelist)
  ├── Multer (in-memory image handling)
  └── @google-cloud/vertexai
            │
            ▼
    Vertex AI – Gemini 1.5 Flash
    (Application Default Credentials — no hardcoded keys)
            │
            ▼
    Google Cloud Run (Deployed)
```

---

## ✨ Key Features

| Feature | Technology | Description |
|---------|-----------|-------------|
| **AI Chat** | Gemini 1.5 Flash | Multi-turn civic Q&A in 7 languages |
| **Scheme Finder** | Gemini + Profile Form | Matches 1,200+ Central/State schemes |
| **Issue Reporter** | Gemini Vision | Photo → issue detection → complaint letter |
| **Complaint Tracker** | React | Live step-by-step resolution timeline |
| **Voice Input** | Web Speech API | Speak your query in any Indian language |
| **Text-to-Speech** | SpeechSynthesis API | AI reads responses for low-literacy users |
| **High Contrast Mode** | CSS Custom Properties | Accessible for visually impaired users |
| **Font Scaling** | CSS Variables | 3 sizes: Normal, Large, Extra Large |

---

## 🛡️ Security Implementation

- **No hardcoded credentials**: Uses GCP Application Default Credentials (ADC) + Cloud Run service accounts
- **Helmet.js**: Enforces Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, HSTS
- **Rate Limiting**: 100 req/15min general, 30 req/15min on AI endpoints (prevents cost abuse)
- **Input Validation**: All request fields validated for type, length, and whitelist before AI processing
- **File Validation**: MIME type + size check before any image processing (never trusts client claims)
- **In-memory file handling**: Multer uses memory storage, no temp files written to disk
- **Error sanitization**: Stack traces never exposed to clients in production

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Skip navigation link** (keyboard users bypass nav)
- **ARIA live regions** on chat messages and search results
- **ARIA labels** on all interactive elements
- **Focus-visible styles** for keyboard navigation
- **`prefers-reduced-motion`** media query support
- **High contrast mode** (toggle via sidebar)
- **Font size scaling** (Normal / Large / Extra Large)
- **Text-to-Speech** toggle for AI responses
- **Voice input** via Web Speech API
- **Semantic HTML5** (`<nav>`, `<main>`, `<article>`, `<section>`, `<form>`)

---

## ⚡ Performance & Efficiency

- **Vite + React 19**: Sub-50ms HMR in dev, ~150KB gzipped bundle
- **Chunk splitting**: React vendor chunk separated from app code
- **Compression middleware**: gzip on all server responses
- **Lazy loading**: Components rendered only when the view is active
- **Image preview**: `URL.createObjectURL` for local preview (zero re-upload cost)
- **Debounced inputs**: Search only triggers after typing stops
- **Memory storage**: Images never touch disk (in-memory buffer processing)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

- **27 unit tests** covering all validation functions (edge cases + security attacks)
- **18 integration tests** covering all API routes (mocked Vertex AI)
- **Security header tests** verifying Helmet.js is working
- Tests enforce: input sanitization, file type validation, rate limiting behavior

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js 18+
- Google Cloud account with Vertex AI API enabled
- `gcloud auth application-default login` (for local development)

### Install & Run
```bash
# Install dependencies
npm install

# Development (frontend + backend with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables (optional overrides)
```env
PORT=3000                          # Server port (default: 3000)
GOOGLE_CLOUD_PROJECT=your-project  # GCP project ID
VERTEX_LOCATION=us-central1        # Vertex AI region
NODE_ENV=production                 # Set for production mode
```

---

## 🐳 Docker & Cloud Run Deployment

```bash
# Build container
docker build -t nagarik-sathi .

# Deploy to Cloud Run (uses project's default service account)
gcloud run deploy nagarik-sathi \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

---

## 📁 Project Structure

```
nagarik-sathi/
├── src/                        # React Frontend
│   ├── components/
│   │   ├── AIChat.jsx          # Multi-lingual AI chat
│   │   ├── SchemeFinder.jsx    # Scheme recommendation form
│   │   ├── IssueReporter.jsx   # Vision AI issue analysis
│   │   ├── ComplaintTracker.jsx # Status timeline
│   │   └── Dashboard.jsx       # Landing overview
│   ├── hooks/
│   │   └── useAccessibility.js # TTS, voice, a11y preferences
│   ├── services/
│   │   └── api.js              # Typed API client
│   ├── App.jsx                 # Root component & nav
│   ├── index.css               # Design system
│   └── main.jsx                # React entry point
├── server/
│   ├── routes/
│   │   ├── chat.js             # POST /api/chat
│   │   ├── schemes.js          # POST /api/recommend-schemes
│   │   ├── issues.js           # POST /api/analyze-issue
│   │   └── health.js           # GET /api/health
│   ├── index.js                # Express server + middleware
│   ├── vertexClient.js         # Vertex AI singleton
│   └── validation.js           # Input validation + sanitization
├── tests/
│   ├── validation.test.js      # Unit tests (27 tests)
│   └── api.test.js             # Integration tests (18 tests)
├── Dockerfile                  # Multi-stage container build
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔗 Links

- **Live Demo**: [https://nagarik-sathi-663154056506.us-central1.run.app](https://nagarik-sathi-663154056506.us-central1.run.app)
- **GitHub Repository**: [https://github.com/Vasi1951/nagarik-sathi](https://github.com/Vasi1951/nagarik-sathi)

---

## 📝 Assumptions & Design Decisions

1. **Gemini 1.5 Flash** chosen for speed and cost-efficiency (ideal for real-time civic responses)
2. **No user accounts**: Citizens use the tool without authentication (privacy-first design)
3. **Complaint tracker uses realistic mock data** demonstrating the full resolution lifecycle
4. **Scheme data** is AI-generated based on known government schemes (users advised to verify on official portals)
5. **In-memory multer** chosen over disk storage for stateless Cloud Run deployment compatibility

---

*Built with ❤️ for India's citizens | Powered by Google Cloud & Gemini AI*
