# Daily Debrief Frontend

A beautiful Vue 3 + TailwindCSS frontend for your personal assistant's daily debrief feature.

## Features

- **AI-Powered Summaries**: Claude analyzes your calendar and provides intelligent insights
- **Clean UI**: Modern, responsive design with TailwindCSS
- **Real-time Data**: Fetches your Google Calendar events and displays them beautifully
- **Loading States**: Smooth loading animations while data is being fetched
- **Error Handling**: Clear error messages with helpful troubleshooting tips

## Prerequisites

1. Make sure you've authenticated with Google Calendar:
   ```bash
   cd ..
   npm start
   # Then type: auth google
   ```

2. Ensure your `.env` file has the required credentials:
   ```
   ANTHROPIC_API_KEY=your_key_here
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend API

In the root directory, start the Express server:

```bash
cd ..
npm run server
```

The API will run on `http://localhost:3000`

### 3. Start the Frontend

In this directory, start the Vite dev server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Open in Browser

Visit `http://localhost:5173` to see your daily debrief!

## Development

- **Frontend Dev Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Preview Production Build**: `npm run preview`

## Project Structure

```
src/
├── api/              # API client for backend
├── assets/           # CSS and static assets
├── components/       # Vue components
│   ├── DailyDebrief.vue    # Main container
│   ├── AISummary.vue       # AI insights card
│   ├── EventCard.vue       # Individual event display
│   └── LoadingState.vue    # Loading skeleton
├── composables/      # Vue composables
│   └── useDebrief.ts       # Debrief data management
├── types/            # TypeScript type definitions
└── main.ts           # App entry point
```

## Tech Stack

- **Vue 3**: Progressive JavaScript framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls

## Troubleshooting

### "Not authenticated" Error

If you see this error, you need to authenticate with Google first:

1. Stop the frontend
2. Go to the root directory: `cd ..`
3. Run: `npm start`
4. Type: `auth google`
5. Follow the authentication flow
6. Restart the backend and frontend servers

### Backend Not Running

Make sure the Express API server is running on port 3000:

```bash
cd ..
npm run server
```

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port.
