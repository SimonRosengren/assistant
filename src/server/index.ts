import express from 'express'
import cors from 'cors'
import debriefRoutes from './routes/debrief.js'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

// ============================================================================
// Middleware
// ============================================================================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))
app.use(express.json())
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// ============================================================================
// Routes
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'daily-debrief-api',
  })
})
app.use('/api', debriefRoutes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  })
})
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  })
})

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   Daily Debrief API Server                         ║
║   Running on http://localhost:${PORT}              ║
║                                                    ║
║   Endpoints:                                       ║
║   GET /api/health              Health check        ║
║   GET /api/debrief             Daily debrief       ║
║   GET /api/debrief/events      Raw events          ║
╚════════════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  process.exit(0)
})
