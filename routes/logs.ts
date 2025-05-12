import { Router, Request, Response } from 'express';
import { RequestLog } from '../entities/RequestLog';
import { EntityManager } from '@mikro-orm/core';
import { body, query, param, validationResult } from 'express-validator';

const router = Router();

// POST /log — Save a new log or update existing based on clientId
router.post(
  '/log',
  [
    body('clientId')
      .isString().withMessage('Client ID must be a string')
      .notEmpty().withMessage('Client ID is required'),
    body('method')
      .isString().withMessage('Method must be a string')
      .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Invalid HTTP method'),
    body('url')
      .isURL().withMessage('Invalid URL format'),
    body('headers')
      .optional().isObject().withMessage('Headers must be an object'),
    body('requestBody')
      .optional().isObject().withMessage('Request body must be an object'),
    body('responseBody')
      .optional().isObject().withMessage('Response body must be an object'),
    body('statusCode')
      .isInt({ min: 100, max: 599 }).withMessage('Invalid status code'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array().map((err: any) => ({
          field: err.path,
          message: err.msg,
        })),
      });
      return;
    }

    const em = req.app.get('em') as EntityManager;

    const {
      clientId,
      method,
      url,
      headers,
      requestBody,
      responseBody,
      statusCode,
    } = req.body;

    try {
      // Store clientId in a custom field or use id if specified
      const id = clientId ? parseInt(clientId, 10) : undefined;
      
      // Try to find existing log with the same id if valid
      let log: RequestLog | null = null;
      
      if (id && !isNaN(id)) {
        log = await em.findOne(RequestLog, { id });
      }
      
      if (log) {
        // Update existing log
        Object.assign(log, {
          method,
          url,
          headers,
          requestBody,
          responseBody,
          statusCode,
          timestamp: new Date() // Update timestamp
        });
        
        await em.flush();
        res.status(200).json({ message: 'Log updated', log });
      } else {
        // Create new log
        log = new RequestLog();
        Object.assign(log, {
          method,
          url,
          headers,
          requestBody,
          responseBody,
          statusCode,
        });
        
        await em.persistAndFlush(log);
        res.status(201).json({ 
          message: 'Log saved', 
          log,
          // Return the ID that should be used for future updates
          clientId: log.id.toString()
        });
      }
    } catch (error) {
      res.status(500).json({ 
        message: 'Error saving log', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
);

// GET /log — Paginated log listing with optional clientId (which is really the id) filtering
router.get(
  '/log',
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array().map((err: any) => ({
          field: err.path,
          message: err.msg,
          location: err.location,
        })),
      });
      return;
    }

    const em = req.app.get('em') as EntityManager;
    const page: number = req.query.page as unknown as number || 1;
    const limit: number = req.query.limit as unknown as number || 10;
    
    // Filter by id if clientId provided (clientId is actually the id)

    const [logs, total] = await em.findAndCount(
      RequestLog,
      {},
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { timestamp: 'desc' },
      }
    );

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }
);

// GET /log/:id — Get a specific log by ID (keep this for backward compatibility)
router.get(
  '/log/:id',
  [
    param('id')
      .isInt().withMessage('ID must be a string')
      .notEmpty().withMessage('ID is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array().map((err: any) => ({
          field: err.path,
          message: err.msg,
          location: err.location,
        })),
      });
      return;
    }

    const em = req.app.get('em') as EntityManager;
    const { id } = req.params;

    try {
      const log = await em.findOne(RequestLog, { id: Number(id) });

      if (!log) {
        res.status(404).json({ message: 'Log not found' });
        return;
      }

      res.json({
        log,
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching log', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
);

// DELETE /log/all — Delete all logs from the database
router.delete(
  '/log/all',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const em = req.app.get('em') as EntityManager;
      
      // Get the total count before deletion
      const totalCount = await em.count(RequestLog);
      
      // Delete all logs
      await em.nativeDelete(RequestLog, {});
      
      res.status(200).json({
        message: 'All logs deleted successfully',
        deletedCount: totalCount
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error deleting logs', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
);

export default router;
