import ApiKey from '../models/ApiKey';
import User from '../models/User';
import { Op } from 'sequelize';

export class ApiKeyService {
  // Create API key
  static async createApiKey(
    userId: string,
    name: string,
    permissions: string = 'read'
  ): Promise<any> {
    // Check if an active API key with the same name already exists for this user
    const existingKey = await ApiKey.findOne({
      where: {
        user_id: userId,
        name: name,
        is_active: true,
        expires_at: {
          [Op.gt]: new Date() 
        }
      }
    });

    if (existingKey) {
      throw new Error('An active API key with this name already exists');
    }

    // Calculate expiration date
    const expiresInDays = parseInt(process.env.API_KEY_EXPIRES_DAYS || '30');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const apiKey = await ApiKey.create({
      user_id: userId,
      name,
      permissions: permissions || 'read',
      expires_at: expiresAt,
    });

    return apiKey;
  }

  // Revoke API key
  static async revokeApiKey(apiKeyId: string, userId: string): Promise<boolean> {
    const [affectedCount] = await ApiKey.update(
      { is_active: false },
      {
        where: {
          id: apiKeyId,
          user_id: userId,
        },
      }
    );

    return affectedCount > 0;
  }

  // Get user's API keys
  static async getUserApiKeys(userId: string, activeOnly: boolean = false): Promise<any[]> {
    const whereClause: any = { user_id: userId };
    
    if (activeOnly) {
      whereClause.is_active = true;
    }
    
    const apiKeys = await ApiKey.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });

    return apiKeys.map(key => key.toJSON());
  }

  static async getUserActiveApiKeys(userId: string): Promise<any[]> {
    return this.getUserApiKeys(userId, true);
  }

  // Validate API key
  static async validateApiKey(apiKey: string): Promise<boolean> {
    const key = await ApiKey.findOne({
      where: {
        key: apiKey,
        is_active: true,
      },
    });

    if (!key) return false;
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(key.expires_at);
    if (now > expiresAt) {
      return false;
    }

    return true;
  }

  // Get API key details
  static async getApiKeyDetails(apiKey: string): Promise<any> {
    const key = await ApiKey.findOne({
      where: { key: apiKey }
    });

    if (!key) return null;
    
    const user = await User.findByPk(key.user_id);
    const keyData = key.toJSON() as any;
    
    if (user) {
      const userData = user.toJSON() as any;
      const { password: _, ...userWithoutPassword } = userData;
      keyData.user = userWithoutPassword;
    }
    
    return keyData;
  }

  static async getApiKeyById(apiKeyId: string, userId?: string): Promise<any> {
    const where: any = { id: apiKeyId };
    if (userId) {
      where.user_id = userId;
    }

    const apiKey = await ApiKey.findOne({ where });
    return apiKey ? apiKey.toJSON() : null;
  }

  // Update API key
  static async updateApiKey(
    apiKeyId: string,
    userId: string,
    updates: { name?: string; permissions?: string; is_active?: boolean }
  ): Promise<boolean> {
    const [affectedCount] = await ApiKey.update(
      updates,
      {
        where: {
          id: apiKeyId,
          user_id: userId,
        },
      }
    );

    return affectedCount > 0;
  }

  static async isApiKeyNameExists(userId: string, name: string): Promise<boolean> {
    const existingKey = await ApiKey.findOne({
      where: {
        user_id: userId,
        name: name,
        is_active: true,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });

    return !!existingKey;
  }
}