# Assistant

A personal assistant agent built with TypeScript and Anthropic Claude, featuring both CLI and web interfaces.

## Features

- **CLI Interface**: Interactive command-line assistant for task management and calendar access
- **Web Dashboard**: Beautiful daily debrief with AI-powered insights (Vue 3 + TailwindCSS)
- **Google Calendar Integration**: Read and analyze your calendar events
- **AI Summaries**: Claude generates intelligent insights about your day
- **Task Management**: Create, update, and track tasks
- **Conversation History**: Persistent conversation storage

## Quick Start

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install
cd ..
```

### 2. Setup Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your credentials:
```
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Authenticate with Google Calendar

```bash
npm start
# Then type: auth google
```

Follow the browser prompts to authenticate.

### 4. Run the Web Dashboard

**Terminal 1 - Backend API:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see your daily debrief!

### 5. Use the CLI

```bash
npm start
```

Then interact naturally:
- "What's on my calendar today?"
- "Add a task to review the proposal"
- "Show me tomorrow's schedule"

## Available Commands

### Backend/CLI
- `npm start` - Run the CLI assistant
- `npm run dev` - Run CLI with hot reload
- `npm run server` - Start the Express API server
- `npm run dev:server` - Start API server with watch mode
- `npm run build` - Build TypeScript

### Frontend
- `cd frontend && npm run dev` - Start Vite dev server
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm run preview` - Preview production build

## Project Structure

```
/src
  /core           - Agent logic and conversation management
  /tools          - Tool definitions and handlers
  /storage        - File-based persistence
  /prompts        - System prompts
  /types          - TypeScript type definitions
  /auth           - Google OAuth authentication
  /server         - Express API server
    /routes       - API endpoints
    /services     - Business logic (debrief generation)
  main.ts         - CLI entry point

/frontend         - Vue 3 web dashboard
  /src
    /components   - Vue components
    /composables  - Reusable composition functions
    /api          - API client
    /types        - TypeScript types
    /assets       - CSS and static files

/data
  /conversations  - Saved conversations
  /tokens         - OAuth tokens (secure storage)
  todos.json      - Task storage
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Vue 3 Frontend (Port 5173)      │
│         - Daily Debrief UI               │
│         - TailwindCSS Styling            │
└────────────────┬────────────────────────┘
                 │ HTTP/JSON
                 ↓
┌─────────────────────────────────────────┐
│      Express API Server (Port 3000)     │
│      - REST Endpoints                    │
│      - Debrief Generation                │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ↓                     ↓
┌──────────────┐   ┌────────────────────┐
│ Google Cal   │   │  Claude Agent      │
│ API          │   │  - AI Summaries    │
└──────────────┘   └────────────────────┘
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/debrief?date=YYYY-MM-DD` - Get daily debrief with AI summary
- `GET /api/debrief/events?date=YYYY-MM-DD` - Get raw calendar events

## Tech Stack

**Backend:**
- TypeScript
- Node.js
- Express.js
- Anthropic Claude API
- Google Calendar API

**Frontend:**
- Vue 3 (Composition API)
- TypeScript
- Vite
- TailwindCSS
- Axios

## Development

The project supports both CLI and web interfaces:

1. **CLI Mode**: Direct interaction with the assistant via terminal
2. **Web Mode**: Visual dashboard with AI-powered daily debriefs

Both modes share the same backend infrastructure (authentication, calendar access, task management).

## License

MIT
