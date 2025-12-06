import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import { setupSwagger } from './config/swagger';

// Load environment variables
dotenv.config();

// Import models and associations
import './models/associations';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));
    
    // JSON parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/auth', authRoutes);
    this.app.use('/keys', apiKeyRoutes);
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Authentication & API Key System API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health'
      });
    });
  }

  private initializeSwagger(): void {
    if (process.env.NODE_ENV === 'development') {
      setupSwagger(this.app);
    }
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`,
      });
    });

    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', err);
      
      const status = err.status || 500;
      const message = err.message || 'Internal Server Error';
      
      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    });
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      // Test database connection
      await sequelize.authenticate();
      console.log('Database connection established successfully.');

      // Sync database (create tables if they don't exist)
      // Use alter: true to update tables without dropping data
      await sequelize.sync({ alter: true });
      console.log('Database synced successfully.');

      // Start server
      this.app.listen(port, () => {
        console.log(`✅ Server is running on http://localhost:${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
        console.log(`🏥 Health check: http://localhost:${port}/health`);
        console.log(`🎯 Test API: http://localhost:${port}/`);
      });
    } catch (error) {
      console.error('Unable to start server:', error);
      process.exit(1);
    }
  }
}

export default App;