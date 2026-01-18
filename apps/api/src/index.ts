/**
 * UAE Work Hub API Server
 * Main entry point for Express.js backend with GCC compliance
 */

import express from 'express';
import type { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import './otel.js';
import client from 'prom-client';
import { env } from './config/env.js';

// Import database connection
import { connectDatabase, getDatabaseHealth } from './services/database.js';
import { connectRedis, getRedisHealth } from './services/redis-client.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/auth.js';
import { complianceMiddleware } from './middleware/compliance.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import meetingRoutes from './routes/meetings.js';
import projectRoutes from './routes/projects.js';
import culturalRoutes from './routes/cultural-complex.js';
import culturalDemoRoutes from './routes/cultural-demo.js';
import organizationRoutes from './routes/organizations.js';

// Import socket handlers
import { configureSocketHandlers } from './services/socket.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Environment flags
const isProd = env.IS_PROD;

// Trust proxy configuration (needed when behind reverse proxies/ingress)
const trustProxyEnv = process.env.TRUST_PROXY ?? (isProd ? '1' : '0');
let trustProxyVal: any;
if (trustProxyEnv === 'true') trustProxyVal = true;
else if (trustProxyEnv === 'false') trustProxyVal = false;
else if (!Number.isNaN(Number(trustProxyEnv))) trustProxyVal = Number(trustProxyEnv);
else trustProxyVal = true;
if (trustProxyVal) {
  app.set('trust proxy', trustProxyVal);
}

// Security header hardening
app.disable('x-powered-by');

// Define allowed origins once for reuse in Socket.IO and CORS
const allowedOrigins = env.ALLOWED_ORIGINS_ARRAY;

// Create HTTP server for Socket.IO
const server = createServer(app);

// Optional Prometheus metrics
const enableMetrics = process.env.ENABLE_PROMETHEUS_METRICS === 'true';
let register: client.Registry | null = null;
let corsRejectCounter: client.Counter<any> | null = null;
let rateLimitRejectCounter: client.Counter<any> | null = null;
if (enableMetrics) {
  register = new client.Registry();
  register.setDefaultLabels({ service: 'uae-work-hub-api' });
  client.collectDefaultMetrics({ register });

  // Custom metric: CORS rejections
  corsRejectCounter = new client.Counter({
    name: 'cors_rejections_total',
    help: 'Total number of CORS rejections by reason',
    labelNames: ['reason'],
  });
  register.registerMetric(corsRejectCounter);

  // Custom metric: Rate limit rejections
  rateLimitRejectCounter = new client.Counter({
    name: 'rate_limit_rejections_total',
    help: 'Total number of requests rejected by rate limiting',
    labelNames: ['path'],
  });
  register.registerMetric(rateLimitRejectCounter);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register!.contentType);
    res.end(await register!.metrics());
  });
}

// Configure Socket.IO with GCC compliance
const io = new Server(server, {
  cors: {
origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  // Enhanced security for UAE compliance
  allowEIO3: false,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Security headers for GCC compliance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "*.uaeworkhub.ae"],
      scriptSrc: ["'self'", "*.uaeworkhub.ae"],
      imgSrc: ["'self'", "data:", "*.uaeworkhub.ae", "*.dubai.ae"],
      connectSrc: ["'self'", "*.uaeworkhub.ae", "ws://localhost:*", "wss://localhost:*"],
      fontSrc: ["'self'", "*.uaeworkhub.ae"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "*.uaeworkhub.ae"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Development-only configuration endpoint for quick inspection
if ((process.env.NODE_ENV || 'development') !== 'production') {
  app.get('/config', (_req, res) => {
    res.json({
      cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) || [],
        requireOriginInProd: (process.env.REQUIRE_ORIGIN_IN_PROD || '').toLowerCase() === 'true' || ((process.env.NODE_ENV || 'development') === 'production'),
      },
      csp: {
        // Note: This is the static CSP configured above. If you later switch to dynamic CSP, surface it here.
        configured: true,
      },
      env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        service: 'uae-work-hub-api',
      }
    });
  });

  // Development-only: echo request headers for debugging CORS, cookies, etc.
  app.get('/debug/headers', (req, res) => {
    res.json({
      requestId: (req as any).requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      headers: req.headers,
    });
  });
}

// CORS configuration for UAE domains
const corsDelegate = (req: Request, callback: (err: Error | null, options: cors.CorsOptions) => void) => {
  const origin = req.header('Origin') || '';
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  const requireOrigin = (process.env.REQUIRE_ORIGIN_IN_PROD || '').toLowerCase() === 'true' || isProd;

  let optOrigin = true;

  if (!isDev) {
    if (!origin) {
      if (requireOrigin) {
        optOrigin = false;
        console.warn('CORS: blocked request without Origin', { requestId: (req as any).requestId, ip: req.ip });
        try { corsRejectCounter?.inc({ reason: 'no_origin' }); } catch {}
      }
    } else if (!allowedOrigins.includes(origin)) {
      optOrigin = false;
      console.warn('CORS: blocked origin', { origin, requestId: (req as any).requestId, ip: req.ip });
      try { corsRejectCounter?.inc({ reason: 'blocked_origin' }); } catch {}
    }
  }

  callback(null, { origin: optOrigin, credentials: true, optionsSuccessStatus: 200 });
};

app.use(cors(corsDelegate));

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    messageAr: 'عدد كبير جداً من الطلبات من هذا العنوان، يرجى المحاولة لاحقاً.'
  },
  standardHeaders: true,
  legacyHeaders: false,
handler: (req, res /*, next */) => {
    try { rateLimitRejectCounter?.inc({ path: req.path || 'unknown' }); } catch {}
    try { console.warn('RATE_LIMIT', { requestId: (req as any).requestId, path: req.path, ip: req.ip }); } catch {}
    return res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      messageAr: 'عدد كبير جداً من الطلبات من هذا العنوان، يرجى المحاولة لاحقاً.'
    });
  },
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// GCC compliance middleware
app.use(complianceMiddleware);

// Health check endpoint (public)
app.get('/health', (req, res) => {
  console.log('🏥 Health check request received from', { ip: req.ip });
  try {
    const response = {
      status: 'healthy',
      service: 'uae-work-hub-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      region: 'UAE',
      clientIp: req.ip,
    };
    console.log('🏥 Sending health response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Liveness endpoint (process up)
app.get('/live', (_req, res) => {
  res.status(200).json({ status: 'alive', pid: process.pid, uptime: process.uptime() });
});

// Readiness endpoint (checks dependencies)
app.get('/ready', async (_req, res) => {
  try {
    const db = getDatabaseHealth();
    const redis = await getRedisHealth();

    const dbOk = db.status === 'connected';

    const prod = (process.env.NODE_ENV || 'development') === 'production';
    const requireRedis = prod || process.env.REQUIRE_REDIS_READY === 'true';
    const redisOk = requireRedis ? (redis.status === 'healthy') : (redis.status !== 'unhealthy');

    const overallOk = dbOk && redisOk;
    const payload = {
      status: overallOk ? 'ready' : 'not_ready',
      dependencies: {
        database: db,
        redis: redis,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(overallOk ? 200 : 503).json(payload);
  } catch (err) {
    console.error('❌ Readiness check error:', err);
    res.status(503).json({ status: 'not_ready', error: 'Readiness check failed' });
  }
});

// Minimal OpenAPI spec (placeholder)
const openapiSpec: any = {
  openapi: '3.0.3',
  info: {
    title: 'UAE Work Hub API',
    version: process.env.APP_VERSION || '0.1.0',
    description: 'GCC-compliant API with cultural intelligence. Placeholder OpenAPI spec.'
  },
  servers: [
    { url: `http://localhost:${PORT}` }
  ],
  paths: {
    '/health': { get: { summary: 'Health', responses: { '200': { description: 'OK' } } } },
    '/live': { get: { summary: 'Liveness', responses: { '200': { description: 'OK' } } } },
    '/ready': { get: { summary: 'Readiness', responses: { '200': { description: 'Ready' }, '503': { description: 'Not Ready' } } } },
    '/version': { get: { summary: 'Version/Build info', responses: { '200': { description: 'OK' } } } },
    '/docs': { get: { summary: 'Docs placeholder', responses: { '200': { description: 'OK' } } } },
    '/api/auth/login': { post: { summary: 'Login', responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } } },
    '/api/auth/register': { post: { summary: 'Register', responses: { '201': { description: 'Created' }, '409': { description: 'Conflict' } } } },
  }
};

// Serve OpenAPI JSON
app.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

// Development-only Swagger UI for OpenAPI
if ((process.env.NODE_ENV || 'development') !== 'production') {
  (async () => {
    try {
      const { default: swaggerUi } = await import('swagger-ui-express');
      app.use('/docs/ui', swaggerUi.serve, swaggerUi.setup(openapiSpec));
      console.log('📘 Swagger UI available at /docs/ui');
    } catch (e) {
      console.warn('Swagger UI not available:', e);
    }
  })();
}

// API docs placeholder
app.get('/docs', (_req, res) => {
  res.json({
    service: 'uae-work-hub-api',
    version: process.env.APP_VERSION || '0.1.0',
    openapi: '/openapi.json',
    endpoints: {
      public: [
        'GET /',
        'GET /version',
        'GET /health',
        'GET /live',
        'GET /ready',
'GET /docs',
        'GET /openapi.json',
        'GET /metrics',
        'GET /docs/ui'
      ],
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/uae-pass',
        'POST /api/auth/refresh',
        'POST /api/auth/logout',
        'GET  /api/auth/me'
      ],
      protected: [
        'GET  /api/users/profile',
        'PATCH /api/users/profile',
        'PATCH /api/users/cultural-preferences',
        'GET  /api/meetings',
        'POST /api/meetings',
        'GET  /api/cultural/health',
        'GET  /api/cultural/prayer-times',
        'GET  /api/cultural/holidays',
        'POST /api/cultural/check-conflicts'
      ]
    },
    notes: 'OpenAPI spec is a placeholder and will be expanded in a future iteration.',
  });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بكم في واجهة برمجة التطبيقات لمركز العمل الإماراتي',
    messageEn: 'Welcome to UAE Work Hub API',
    version: '0.1.0',
    documentation: '/docs',
    health: '/health',
    clientIp: req.ip,
    features: [
      'GCC-compliant video conferencing',
      'Arabic transcription with dialect support',
      'Cultural intelligence engine',
      'Dubai 2040 project management',
      'UAE Pass integration'
    ]
  });
});

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/demo/cultural', culturalDemoRoutes);

// Protected routes (authentication required)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/meetings', authMiddleware, meetingRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/organizations', authMiddleware, organizationRoutes);
app.use('/api/cultural', authMiddleware, culturalRoutes);

// Socket.IO configuration
configureSocketHandlers(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    errorAr: 'النقطة المطلوبة غير موجودة',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /api/auth/login',
      'GET /api/users/profile',
      'GET /api/meetings',
      'GET /api/projects',
      'GET /api/cultural/prayer-times'
    ]
  });
});

// Initialize database connections and start server
async function startServer() {
  try {
    console.log('🚀 Starting UAE Work Hub API Server...');
    
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');
    
    // Connect to Redis (optional for development)
    try {
      await connectRedis();
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.log('⚠️ Redis not available - running without caching');
    }
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🇦🇪 UAE Work Hub API is ready for requests`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO enabled for real-time features`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Start the server (skip when running tests)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, io };
