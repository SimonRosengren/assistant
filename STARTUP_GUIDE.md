# Daily Debrief - Startup Guide

## First Time Setup

### 1. Install All Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment

Make sure your `.env` file exists with these variables:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Authenticate with Google

Before you can view your calendar, you need to authenticate:

```bash
npm start
```

When the CLI starts, type:
```
auth google
```

A browser window will open. Log in with your Google account and grant calendar access.

Once authenticated, you can exit the CLI (Ctrl+C or Ctrl+D).

## Running the Application

You need **two terminal windows** running simultaneously:

### Terminal 1: Backend API Server

```bash
npm run server
```

You should see:
```
╔════════════════════════════════════════════════════╗
║   Daily Debrief API Server                         ║
║   Running on http://localhost:3000                 ║
║                                                    ║
║   Endpoints:                                       ║
║   GET /api/health              Health check        ║
║   GET /api/debrief             Daily debrief       ║
║   GET /api/debrief/events      Raw events          ║
╚════════════════════════════════════════════════════╝
```

**Keep this terminal running!**

### Terminal 2: Frontend Dev Server

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal running!**

### 3. Open in Browser

Visit: **http://localhost:5173**

You should see your daily debrief with:
- AI-generated summary at the top (in a beautiful gradient card)
- Your calendar events listed below
- Clean, modern UI

## What You'll See

### If Everything Works:

1. **AI Summary Card** (top):
   - Overview of your day
   - Time analysis
   - Key events highlighted
   - Smart recommendations

2. **Calendar Events** (below):
   - Each event in a card
   - Time, location, title
   - Link to view in Google Calendar

### If You See an Error:

**"Not authenticated with Google Calendar"**

→ You need to authenticate first. Go back to step 3 in "First Time Setup"

**"Failed to load debrief"**

→ Make sure the backend server is running (Terminal 1)

**Blank page / Connection error**

→ Make sure both servers are running and check the URLs:
  - Backend: http://localhost:3000/api/health
  - Frontend: http://localhost:5173

## Testing the API Directly

You can test the backend API with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Get today's debrief
curl http://localhost:3000/api/debrief

# Get events for a specific date
curl "http://localhost:3000/api/debrief?date=2026-02-24"
```

## Common Issues

### Port Already in Use

**Backend (3000):**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

**Frontend (5173):**
Vite will automatically use the next available port if 5173 is busy.

### Authentication Expired

If you get authentication errors after some time:

```bash
npm start
# Type: logout google
# Then: auth google
```

### Changes Not Appearing

**Backend changes:**
- Stop the server (Ctrl+C)
- Restart: `npm run server`

**Frontend changes:**
- Vite hot-reloads automatically
- If not working, refresh the browser

## Development Tips

### Backend Development

For auto-reload during backend development:
```bash
npm run dev:server
```

### Frontend Development

The Vite dev server has:
- Hot Module Replacement (instant updates)
- TypeScript type checking
- TailwindCSS JIT compilation

### Viewing Network Requests

Open browser DevTools (F12):
- **Network tab**: See API requests
- **Console tab**: See any JavaScript errors

## Next Steps

Once the basic daily debrief is working, you can:

1. Add more features to the UI
2. Add date picker to view other days
3. Add task integration
4. Add conflict detection highlighting
5. Add preparation suggestions
6. Implement real-time updates

Enjoy your AI-powered daily debrief!
