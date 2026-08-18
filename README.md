# TaskFlow - AI Workflow Agent

**All Things Agentic Hackathon 2026 by Google** submission.

TaskFlow is an autonomous workflow agent that breaks down a given task into executable steps, simulates execution, and reports a structured plan, execution log and summary - powered by **Gemini 3.5 Flash**.

## Features
- Natural-language task input -> structured plan + execution log + summary
- Powered by Gemini 3.5 Flash via the Google GenAI SDK (`@google/generative-ai`)
- Clean web chat interface
- Graceful mock fallback when no API key is set (for local testing)

## Tech Stack
- Backend: Node.js + Express
- AI: Google Gemini 3.5 Flash (`gemini-3.5-flash`)
- Google SDKs: Google GenAI SDK (google-genai), Agent Development Kit (ADK)
- Frontend: HTML / CSS / JavaScript

## Setup & Run

Requirements: Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Set your Google AI API key
export GEMINI_API_KEY="your-google-ai-api-key"

# 3. Start the server
npm start
```

Open http://localhost:3002

> Get a Gemini API key at https://aistudio.google.com/

## How to use
1. Open the app
2. Type a task (e.g. "Research competitor pricing and summarize")
3. TaskFlow returns a JSON plan, simulated execution log, and summary

## Testing instructions (reproducible)
1. Run `npm install`
2. Run `npm start`
3. Open http://localhost:3002
4. Without `GEMINI_API_KEY` set, the app runs in mock mode and returns a canned plan/execution for any task - this verifies the UI and API flow end-to-end.
5. With `GEMINI_API_KEY` set, real Gemini 3.5 Flash responses are returned.

## API
`POST /api/execute` with JSON body `{"task": "..."}` returns:

```json
{
  "success": true,
  "plan": ["..."],
  "execution": [{"step":"...","action":"...","result":"...","status":"success"}],
  "summary": "...",
  "model": "gemini-3.5-flash"
}
```

## License
MIT
