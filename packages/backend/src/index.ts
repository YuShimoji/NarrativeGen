import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { loadModel, startSession, getAvailableChoices, applyChoice } from '@narrativegen/engine-ts'
import { createAIProvider, type AIConfig } from '@narrativegen/engine-ts/browser'

const app = express()
const PORT = process.env.PORT || 3001
const upload = multer({ storage: multer.memoryStorage() })

// Middleware
app.use(cors())
app.use(express.json())

// Simple in-memory logger
type LogEntry = { level: 'info' | 'warn' | 'error'; message: string; meta?: any; timestamp: string }
const logs: LogEntry[] = []
function log(level: LogEntry['level'], message: string, meta?: any) {
  const entry: LogEntry = { level, message, meta, timestamp: new Date().toISOString() }
  logs.push(entry)
  if (logs.length > 500) logs.shift()
  if (level === 'error') console.error(message, meta)
  else if (level === 'warn') console.warn(message, meta)
  else console.info(message, meta)
}

// In-memory storage
const models = new Map<string, any>()
const sessions = new Map<string, any>()

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Health check under /api
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Models
app.get('/models', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0
  const modelList = Array.from(models.values()).slice(offset, offset + limit)

  res.json({
    models: modelList,
    total: models.size,
    limit,
    offset
  })
})

app.post('/models', (req, res) => {
  try {
    const modelData = req.body
    const model = loadModel(modelData)
    const id = modelData.id || `model_${Date.now()}`
    models.set(id, { ...model, id })
    res.status(201).json({ ...model, id })
  } catch (error) {
    res.status(400).json({
      message: 'Invalid model data',
      code: 'INVALID_MODEL',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

app.get('/models/:id', (req, res) => {
  const model = models.get(req.params.id)
  if (!model) {
    return res.status(404).json({
      message: 'Model not found',
      code: 'MODEL_NOT_FOUND'
    })
  }
  res.json(model)
})

// /api model endpoints (duplicate for spec compatibility)
app.get('/api/models', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0
  const modelList = Array.from(models.values()).slice(offset, offset + limit)

  res.json({
    models: modelList,
    total: models.size,
    limit,
    offset
  })
})

app.post('/api/models', (req, res) => {
  try {
    const modelData = req.body
    const model = loadModel(modelData)
    const id = modelData.id || `model_${Date.now()}`
    models.set(id, { ...model, id })
    log('info', 'Model created', { id })
    res.status(201).json({ ...model, id })
  } catch (error) {
    log('error', 'Invalid model data', { error: error instanceof Error ? error.message : String(error) })
    res.status(400).json({
      message: 'Invalid model data',
      code: 'INVALID_MODEL',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

app.get('/api/models/:id', (req, res) => {
  const model = models.get(req.params.id)
  if (!model) {
    return res.status(404).json({
      message: 'Model not found',
      code: 'MODEL_NOT_FOUND'
    })
  }
  res.json(model)
})

// Update model
app.put('/api/models/:id', (req, res) => {
  try {
    const id = req.params.id
    if (!models.has(id)) {
      return res.status(404).json({ message: 'Model not found', code: 'MODEL_NOT_FOUND' })
    }
    const updated = loadModel(req.body)
    models.set(id, { ...updated, id })
    log('info', 'Model updated', { id })
    res.json(models.get(id))
  } catch (error) {
    log('error', 'Invalid model update', { error: error instanceof Error ? error.message : String(error) })
    res.status(400).json({ message: 'Invalid model data', code: 'INVALID_MODEL', details: error instanceof Error ? error.message : String(error) })
  }
})

// Delete model
app.delete('/api/models/:id', (req, res) => {
  const id = req.params.id
  if (!models.has(id)) {
    return res.status(404).json({ message: 'Model not found', code: 'MODEL_NOT_FOUND' })
  }
  models.delete(id)
  log('info', 'Model deleted', { id })
  res.status(204).send()
})

// Import model (JSON only)
app.post('/api/models/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required', code: 'FILE_REQUIRED' })
    }
    const content = req.file.buffer.toString('utf-8')
    let data: any
    try {
      data = JSON.parse(content)
    } catch {
      return res.status(400).json({ message: 'Invalid file or unsupported format (expected JSON)', code: 'INVALID_FILE' })
    }
    const model = loadModel(data)
    const id = (req.body?.name as string) || data.id || `model_${Date.now()}`
    models.set(id, { ...model, id })
    log('info', 'Model imported', { id })
    res.status(201).json(models.get(id))
  } catch (error) {
    log('error', 'Model import failed', { error: error instanceof Error ? error.message : String(error) })
    res.status(400).json({ message: 'Invalid file or data', code: 'INVALID_FILE', details: error instanceof Error ? error.message : String(error) })
  }
})

// Export model (JSON only)
app.get('/api/models/:id/export', (req, res) => {
  const model = models.get(req.params.id)
  if (!model) {
    return res.status(404).json({ message: 'Model not found', code: 'MODEL_NOT_FOUND' })
  }
  const format = (req.query.format as string) || 'json'
  if (format !== 'json') {
    return res.status(400).json({ message: 'Only json export is supported at this time', code: 'UNSUPPORTED_FORMAT' })
  }
  res.json(model)
})

// Sessions
app.post('/sessions', (req, res) => {
  try {
    const { modelId, initialFlags, initialResources } = req.body
    const model = models.get(modelId)
    if (!model) {
      return res.status(404).json({
        message: 'Model not found',
        code: 'MODEL_NOT_FOUND'
      })
    }

    const session = startSession(model, { flags: initialFlags ?? {}, resources: initialResources ?? {} })
    const sessionId = `session_${Date.now()}`
    sessions.set(sessionId, {
      id: sessionId,
      modelId,
      ...session,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    res.status(201).json(sessions.get(sessionId))
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create session',
      code: 'SESSION_CREATION_FAILED',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

app.get('/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    return res.status(404).json({
      message: 'Session not found',
      code: 'SESSION_NOT_FOUND'
    })
  }
  res.json(session)
})

app.post('/sessions/:id/choice', (req, res) => {
  try {
    const session = sessions.get(req.params.id)
    if (!session) {
      return res.status(404).json({
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      })
    }

    const { choiceId } = req.body
    const model = models.get(session.modelId)
    if (!model) {
      return res.status(404).json({
        message: 'Model not found',
        code: 'MODEL_NOT_FOUND'
      })
    }

    const newSession = applyChoice(session, model, choiceId)
    const step = { nodeId: newSession.nodeId, choiceId, timestamp: new Date().toISOString() }
    sessions.set(req.params.id, {
      ...newSession,
      history: [...(session.history ?? []), step],
      updatedAt: new Date().toISOString()
    })

    res.json(sessions.get(req.params.id))
  } catch (error) {
    res.status(400).json({
      message: 'Failed to apply choice',
      code: 'CHOICE_APPLICATION_FAILED',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

// Get available choices
app.get('/sessions/:id/choices', (req, res) => {
  try {
    const session = sessions.get(req.params.id)
    if (!session) {
      return res.status(404).json({
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      })
    }

    const model = models.get(session.modelId)
    if (!model) {
      return res.status(404).json({
        message: 'Model not found',
        code: 'MODEL_NOT_FOUND'
      })
    }

    const choices = getAvailableChoices(session, model)
    res.json({ choices })
  } catch (error) {
    res.status(400).json({
      message: 'Failed to get choices',
      code: 'CHOICES_RETRIEVAL_FAILED',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

// --- Duplicated endpoints under /api for spec compatibility ---
// Create session
app.post('/api/sessions', (req, res) => {
  try {
    const { modelId, initialFlags, initialResources } = req.body
    log('info', 'Create session requested', { modelId })
    const model = models.get(modelId)
    if (!model) {
      log('warn', 'Model not found for session creation', { modelId })
      return res.status(404).json({ message: 'Model not found', code: 'MODEL_NOT_FOUND' })
    }
    const session = startSession(model, { flags: initialFlags ?? {}, resources: initialResources ?? {} })
    const sessionId = `session_${Date.now()}`
    sessions.set(sessionId, {
      id: sessionId,
      modelId,
      ...session,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    log('info', 'Session created', { sessionId, modelId })
    res.status(201).json(sessions.get(sessionId))
  } catch (error) {
    log('error', 'Session creation failed', { error: error instanceof Error ? error.message : String(error) })
    res.status(400).json({ message: 'Failed to create session', code: 'SESSION_CREATION_FAILED', details: error instanceof Error ? error.message : String(error) })
  }
})

// Get session
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ message: 'Session not found', code: 'SESSION_NOT_FOUND' })
  res.json(session)
})

// Apply choice
app.post('/api/sessions/:id/choice', (req, res) => {
  try {
    const session = sessions.get(req.params.id)
    if (!session) return res.status(404).json({ message: 'Session not found', code: 'SESSION_NOT_FOUND' })
    const { choiceId } = req.body
    const model = models.get(session.modelId)
    if (!model) return res.status(404).json({ message: 'Model not found', code: 'MODEL_NOT_FOUND' })
    const newSession = applyChoice(session, model, choiceId)
    const step = { nodeId: newSession.nodeId, choiceId, timestamp: new Date().toISOString() }
    sessions.set(req.params.id, { ...newSession, history: [...(session.history ?? []), step], updatedAt: new Date().toISOString() })
    res.json(sessions.get(req.params.id))
  } catch (error) {
    res.status(400).json({ message: 'Failed to apply choice', code: 'CHOICE_APPLICATION_FAILED', details: error instanceof Error ? error.message : String(error) })
  }
})

// Get available choices
app.get('/api/sessions/:id/choices', (req, res) => {
  try {
    const session = sessions.get(req.params.id)
    if (!session) return res.status(404).json({ message: 'Session not found', code: 'SESSION_NOT_FOUND' })
    const model = models.get(session.modelId)
    if (!model) return res.status(404).json({ message: 'Model not found', code: 'MODEL_NOT_FOUND' })
    const choices = getAvailableChoices(session, model)
    res.json({ choices })
  } catch (error) {
    res.status(400).json({ message: 'Failed to get choices', code: 'CHOICES_RETRIEVAL_FAILED', details: error instanceof Error ? error.message : String(error) })
  }
})

// Session history
app.get('/api/sessions/:id/history', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ message: 'Session not found', code: 'SESSION_NOT_FOUND' })
  const limit = Math.max(1, Math.min(1000, parseInt((req.query.limit as string) || '100')))
  const history = (session.history ?? []).slice(-limit)
  res.json({ history })
})

// Delete session
app.delete('/api/sessions/:id', (req, res) => {
  if (!sessions.has(req.params.id)) return res.status(404).json({ message: 'Session not found', code: 'SESSION_NOT_FOUND' })
  sessions.delete(req.params.id)
  res.status(204).send()
})

// AI endpoints
app.get('/api/ai/providers', (req, res) => {
  res.json({ providers: ['mock', 'openai', 'ollama'] })
})

app.post('/api/ai/generate', async (req, res) => {
  try {
    const body = req.body as any
    const provider = (body.provider as AIConfig['provider']) || 'mock'
    const apiKeyHeader = (req.header('X-API-Key') || req.header('Authorization') || '').toString()
    const apiKey = apiKeyHeader.startsWith('Bearer ') ? apiKeyHeader.slice(7) : apiKeyHeader
    const config: AIConfig = provider === 'openai' ? { provider, openai: { apiKey } } : provider === 'ollama' ? { provider, ollama: { baseUrl: process.env.OLLAMA_BASE_URL } } : { provider: 'mock' }
    if (config.provider === 'openai' && !config.openai?.apiKey) {
      return res.status(400).json({ message: 'OpenAI API key required', code: 'API_KEY_REQUIRED' })
    }
    const ai = createAIProvider(config)
    const ctx = body.context || {}
    const previousNodes: { id: string; text: string }[] = Array.isArray(ctx.previousNodes)
      ? ctx.previousNodes.map((t: any, i: number) => (typeof t === 'string' ? { id: `p${i + 1}`, text: t } : t))
      : []
    const currentNodeText = String(ctx.currentNodeText || '')
    const choiceText = ctx.choiceText ? String(ctx.choiceText) : undefined
    const text = await ai.generateNextNode({ previousNodes, currentNodeText, choiceText })
    res.json({ text, metadata: { provider: config.provider, model: config.openai?.model || config.ollama?.model || 'mock' } })
  } catch (error) {
    res.status(400).json({ message: 'AI generation failed', code: 'AI_GENERATION_FAILED', details: error instanceof Error ? error.message : String(error) })
  }
})

app.post('/api/ai/paraphrase', async (req, res) => {
  try {
    const body = req.body as any
    const text: string = body.text
    if (!text || typeof text !== 'string') return res.status(400).json({ message: 'Text is required', code: 'TEXT_REQUIRED' })
    const apiKeyHeader = (req.header('X-API-Key') || req.header('Authorization') || '').toString()
    const apiKey = apiKeyHeader.startsWith('Bearer ') ? apiKeyHeader.slice(7) : apiKeyHeader
    const provider: AIConfig['provider'] = apiKey ? 'openai' : 'mock'
    const config: AIConfig = provider === 'openai' ? { provider: 'openai', openai: { apiKey } } : { provider: 'mock' }
    const ai = createAIProvider(config)
    const variants = await ai.paraphrase(text, { style: body.style, variantCount: body.count ?? 3, tone: body.tone, emotion: body.emotion })
    res.json({ variants })
  } catch (error) {
    res.status(400).json({ message: 'AI paraphrase failed', code: 'AI_PARAPHRASE_FAILED', details: error instanceof Error ? error.message : String(error) })
  }
})

// Analytics & Debug
app.get('/api/analytics/sessions', (req, res) => {
  const start = req.query.startDate ? new Date(String(req.query.startDate)) : null
  const end = req.query.endDate ? new Date(String(req.query.endDate)) : null
  const list = Array.from(sessions.values())
  const filtered = list.filter((s: any) => {
    const t = new Date(s.createdAt).getTime()
    const okStart = start ? t >= start.getTime() : true
    const okEnd = end ? t <= end.getTime() : true
    return okStart && okEnd
  })
  res.json({ totalSessions: filtered.length })
})

app.get('/api/debug/logs', (req, res) => {
  const level = (req.query.level as string) || undefined
  const limit = Math.max(1, Math.min(1000, parseInt((req.query.limit as string) || '100')))
  const data = logs.filter(l => (level ? l.level === level : true)).slice(-limit)
  res.json({ logs: data })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  })
})

app.listen(PORT, () => {
  console.log(`NarrativeGen API server running on port ${PORT}`)
})
