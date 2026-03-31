/**
 * {{PROJECT_NAME}} Server
 * {{PROJECT_DESCRIPTION}}
 * 
 * @author {{PROJECT_AUTHOR}}
 * @version {{PROJECT_VERSION}}
 */
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import productsRouter from './routes/products';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/products', productsRouter);// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ready check endpoint
app.get('/ready', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: '{{PROJECT_NAME}} API',
    version: '{{PROJECT_VERSION}}',
    description: '{{PROJECT_DESCRIPTION}}',
    endpoints: {
      health: '/health',
      ready: '/ready',
      api: '/api'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Ready check: http://localhost:${PORT}/ready`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});

export default app;
