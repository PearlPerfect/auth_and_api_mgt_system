import ApiKey from '../models/ApiKey';
import User from '../models/User';
import { Op } from 'sequelize';

export class ApiKeyService {
  // Create API key
  static async createApiKey(
    userId: string,
    name: string,
    permissions: string | string[] = 'read'
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

    // Generate API key
    const apiKeyValue = ApiKey.generateApiKey();
    
    // Use the static method to create with proper permissions handling
    const apiKey = await ApiKey.createApiKey({
      user_id: userId,
      name,
      permissions: permissions,
      expires_at: expiresAt,
      key: apiKeyValue
    });

    // Return the plain text key (only here, it's encrypted in DB)
    const response = apiKey.toJSON() as any;
    response.key = apiKeyValue; // Return the plain key to user
    
    return response;
  }

  // Revoke API key (mark as inactive)
  static async revokeApiKey(apiKeyId: string, userId: string): Promise<boolean> {
    console.log(`Revoking API key ${apiKeyId} for user ${userId}`);
    
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

  // Reactivate API key
  static async reactivateApiKey(apiKeyId: string, userId: string): Promise<boolean> {
    console.log(`Reactivating API key ${apiKeyId} for user ${userId}`);
    
    const [affectedCount] = await ApiKey.update(
      { is_active: true },
      {
        where: {
          id: apiKeyId,
          user_id: userId,
        },
      }
    );

    return affectedCount > 0;
  }

  // Delete API key permanently
  static async deleteApiKey(apiKeyId: string, userId: string): Promise<boolean> {
    console.log(`Deleting API key ${apiKeyId} for user ${userId}`);
    
    const deletedCount = await ApiKey.destroy({
      where: {
        id: apiKeyId,
        user_id: userId,
      },
    });

    return deletedCount > 0;
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
      attributes: [
        'id', 
        'key', 
        'name', 
        'user_id', 
        'expires_at', 
        'is_active', 
        'last_used_at', 
        'usage_count', 
        'permissions', 
        'created_at', 
        'updated_at'
      ]
    });

    return apiKeys.map(key => key.toJSON());
  }

  static async getUserActiveApiKeys(userId: string): Promise<any[]> {
    return this.getUserApiKeys(userId, true);
  }

  // Validate API key
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      if (!apiKey || apiKey.length < 10) {
        return false;
      }

      const keys = await ApiKey.findAll({
        where: {
          is_active: true,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
      });

      for (const key of keys) {
        try {
          const decryptedKey = key.getDecryptedKey();
          if (decryptedKey === apiKey) {
            await key.updateLastUsed();
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }

  // Get API key details
  static async getApiKeyDetails(apiKey: string): Promise<any> {
    try {
      const keys = await ApiKey.findAll({
        where: { 
          is_active: true,
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      for (const key of keys) {
        try {
          const decryptedKey = key.getDecryptedKey();
          if (decryptedKey === apiKey) {
            const user = await User.findByPk(key.user_id, {
              attributes: { exclude: ['password'] }
            });
            
            const keyData = key.toJSON() as any;
            keyData.user = user;
            
            return keyData;
          }
        } catch (error) {
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting API key details:', error);
      return null;
    }
  }

  // Get API key by ID
  static async getApiKeyById(apiKeyId: string, userId?: string): Promise<any> {
    console.log(`Getting API key by ID: ${apiKeyId}, User ID: ${userId || 'not specified'}`);
    
    const where: any = { id: apiKeyId };
    if (userId) {
      where.user_id = userId;
    }

    const apiKey = await ApiKey.findOne({ 
      where,
      attributes: [
        'id', 
        'key', 
        'name', 
        'user_id', 
        'expires_at', 
        'is_active', 
        'last_used_at', 
        'usage_count', 
        'permissions', 
        'created_at', 
        'updated_at'
      ]
    });
    
    if (!apiKey) {
      console.log(`API key not found with ID: ${apiKeyId}`);
      return null;
    }
    
    return apiKey.toJSON();
  }

  // Update API key
  static async updateApiKey(
    apiKeyId: string,
    userId: string,
    updates: { name?: string; permissions?: string | string[]; is_active?: boolean }
  ): Promise<boolean> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.permissions !== undefined) {
      // Convert array to JSON string if needed
      updateData.permissions = Array.isArray(updates.permissions) 
        ? JSON.stringify(updates.permissions)
        : updates.permissions;
    }
    
    const [affectedCount] = await ApiKey.update(
      updateData,
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