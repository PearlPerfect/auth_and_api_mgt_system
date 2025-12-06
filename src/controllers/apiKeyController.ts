import { Request, Response } from 'express';
import { ApiKeyService } from '../services/apiKeyService';

export class ApiKeyController {
  // Create API key
  static async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { name, permissions } = req.body || {}

      if (!name) {
        res.status(400).json({ error: 'API key name is required' });
        return;
      }

      const isNameExists = await ApiKeyService.isApiKeyNameExists(userId, name);
      if (isNameExists) {
        res.status(409).json({ 
          error: 'An active API key with this name already exists. Please use a different name or revoke the existing key.' 
        });
        return;
      }

      const apiKey = await ApiKeyService.createApiKey(userId, name, permissions);

      res.status(201).json({
        message: 'API key created successfully',
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key,
          expires_at: apiKey.expires_at,
          permissions: apiKey.permissions,
          created_at: apiKey.created_at
        },
        warning: 'Save this key now. It will not be shown again in full.'
      });
    } catch (error: any) {
      console.error('Create API key error details:', {
        error: error.message,
        stack: error.stack,
        errors: error.errors
      });
      
      // Handle duplicate name error
      if (error.message === 'An active API key with this name already exists') {
        res.status(409).json({ 
          error: error.message,
          suggestion: 'Please use a different name or revoke the existing key.'
        });
        return;
      }
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map((err: any) => err.message);
        res.status(400).json({ 
          error: 'Validation error', 
          details: messages 
        });
        return;
      }
      
      if (!req.body) {
        res.status(400).json({ error: 'Request body is required' });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // List user's API keys
  static async listApiKeys(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const apiKeys = await ApiKeyService.getUserApiKeys(userId);

      // Mask the key for security (show only first 8 chars)
      const maskedApiKeys = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key.substring(0, 8) + '...',
        expires_at: key.expires_at,
        is_active: key.is_active,
        last_used_at: key.last_used_at,
        usage_count: key.usage_count,
        permissions: key.permissions,
        created_at: key.created_at,
        is_expired: new Date() > new Date(key.expires_at)
      }));

      const message = apiKeys.length === 0 
        ? 'You do not currently have any API keys. Create one to get started.'
        : `Found ${apiKeys.length} API key${apiKeys.length === 1 ? '' : 's'}`;

      res.status(200).json({ 
        message,
        apiKeys: maskedApiKeys,
        count: apiKeys.length
      });
    } catch (error) {
      console.error('List API keys error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Revoke API key
  static async revokeApiKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { apiKeyId } = req.params;
      const apiKey = await ApiKeyService.getApiKeyById(apiKeyId, userId);
      
      if (!apiKey) {
        const anyApiKey = await ApiKeyService.getApiKeyById(apiKeyId);
        if (!anyApiKey) {
          res.status(404).json({ 
            error: 'API key not found',
            message: 'The API key you are trying to revoke does not exist.'
          });
        } else {
          res.status(403).json({ 
            error: 'Forbidden',
            message: 'You do not have permission to revoke this API key.',
            details: 'This API key belongs to another user account.'
          });
        }
        return;
      }


      // Check if already revoked
      if (!apiKey.is_active) {
        res.status(400).json({ 
          error: 'API key already revoked',
          message: 'This API key has already been revoked and is inactive.',
          details: {
            id: apiKey.id,
            name: apiKey.name,
            revoked_at: apiKey.updated_at
          }
        });
        return;
      }

      const revoked = await ApiKeyService.revokeApiKey(apiKeyId, userId);

      if (!revoked) {
        console.log('Failed to revoke API key:', apiKeyId);
        res.status(500).json({ 
          error: 'Failed to revoke API key',
          message: 'An unexpected error occurred while trying to revoke the API key.'
        });
        return;
      }

      res.status(200).json({ 
        message: 'API key revoked successfully',
        details: {
          id: apiKey.id,
          name: apiKey.name,
          status: 'revoked',
          revoked_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Revoke API key error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.'
      });
    }
  }

  // Validate API key
  static async validateKey(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        res.status(400).json({ 
          error: 'API key is required',
          message: 'Please provide an API key to validate.'
        });
        return;
      }

      const isValid = await ApiKeyService.validateApiKey(apiKey);
      
      if (!isValid) {
        res.status(401).json({ 
          valid: false, 
          message: 'Invalid or expired API key',
          error: 'The provided API key is either invalid, expired, or has been revoked.'
        });
        return;
      }

      const keyDetails = await ApiKeyService.getApiKeyDetails(apiKey);
      
      res.status(200).json({
        valid: true,
        message: 'API key is valid and active',
        details: {
          id: keyDetails.id,
          name: keyDetails.name,
          user: keyDetails.user,
          expires_at: keyDetails.expires_at,
          permissions: keyDetails.permissions
        }
      });
    } catch (error) {
      console.error('Validate API key error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while validating the API key.'
      });
    }
  }

  // Test API key authentication
  static async testApiKey(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        message: 'API key authentication successful',
        authType: req.authType,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email
        },
        apiKey: req.apiKey ? {
          id: req.apiKey.id,
          name: req.apiKey.name,
          permissions: req.apiKey.permissions
        } : null
      });
    } catch (error) {
      console.error('Test API key error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while testing API key authentication.'
      });
    }
  }
}