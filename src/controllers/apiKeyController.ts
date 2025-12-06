import { Request, Response } from 'express';
import { ApiKeyService } from '../services/apiKeyService';

export class ApiKeyController {
  // Create API key
  static async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { name, permissions } = req.body;

      if (!name) {
        res.status(400).json({ error: 'API key name is required' });
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
    } catch (error) {
      console.error('Create API key error:', error);
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

      res.status(200).json({ apiKeys: maskedApiKeys });
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

      const revoked = await ApiKeyService.revokeApiKey(apiKeyId, userId);

      if (!revoked) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      res.status(200).json({ message: 'API key revoked successfully' });
    } catch (error) {
      console.error('Revoke API key error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Validate API key
  static async validateKey(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        res.status(400).json({ error: 'API key is required' });
        return;
      }

      const isValid = await ApiKeyService.validateApiKey(apiKey);
      
      if (!isValid) {
        res.status(401).json({ valid: false, message: 'Invalid or expired API key' });
        return;
      }

      const keyDetails = await ApiKeyService.getApiKeyDetails(apiKey);
      
      res.status(200).json({
        valid: true,
        message: 'API key is valid',
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
      res.status(500).json({ error: 'Internal server error' });
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
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}