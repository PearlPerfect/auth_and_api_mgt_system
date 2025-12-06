import { Request, Response, NextFunction } from 'express';

export const validateBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }
  
  if (req.headers['content-type'] !== 'application/json') {
    res.status(415).json({ error: 'Content-Type must be application/json' });
    return;
  }
  
  next();
};