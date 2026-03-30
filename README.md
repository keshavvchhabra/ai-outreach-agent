# Outreach Agent

This project includes:

- A FastAPI backend that generates sharper, more human outreach emails with the OpenAI Agents SDK
- Gmail API sending with OAuth and reusable `token.json`
- A React + Vite + Tailwind frontend with an AI-assistant chat experience for generating, editing, and sending emails

## Folder Structure

```text
out-reach-agent/
├── main.py
├── requirements.txt
├── .env
├── credentials.json
├── token.json
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

## Backend Setup

1. Install Python dependencies:

```bash
./venv/bin/pip install -r requirements.txt
```

2. Add environment variables in `.env`:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
```

3. Place your Google OAuth desktop app file at `credentials.json`.

## Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Optional frontend environment:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run

Backend:

```bash
./venv/bin/uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```

## API Endpoints

- `POST /generate-email`
- `POST /send-email`

## Notes

- On the first email send, Gmail OAuth opens in your browser for login and consent.
- After that, the backend reuses `token.json` automatically and refreshes it when needed.
- The frontend now walks the user through a guided chat, applies quick templates, generates a draft, and lets the user edit the subject and body before sending.
# ai-outreach-agent
