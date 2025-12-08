import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import crypto from 'crypto';

interface ApiKeyAttributes {
  id: string;
  key: string;
  name: string;
  user_id: string;
  expires_at: Date;
  is_active: boolean;
  last_used_at: Date | null;
  usage_count: number;
  permissions: string;
  created_at: Date;
  updated_at: Date;
}

interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'id' | 'key' | 'is_active' | 'last_used_at' | 'usage_count' | 'created_at' | 'updated_at'> {}

class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
  public id!: string;
  public key!: string;
  public name!: string;
  public user_id!: string;
  public expires_at!: Date;
  public is_active!: boolean;
  public last_used_at!: Date | null;
  public usage_count!: number;
  public permissions!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Static method to generate API key
  public static generateApiKey(): string {
    const prefix = process.env.API_KEY_PREFIX || 'sk_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }

  // Static method to encrypt key
  public static encryptKey(plainKey: string): string {
    const secret = process.env.ENCRYPTION_SECRET || 'your-default-secret-change-this-in-production';
    
    // If no secret or secret is empty, return plain text (for backward compatibility)
    if (!secret || secret === 'your-default-secret-change-this-in-production') {
      console.warn('⚠️  WARNING: Using plain text API keys. Set ENCRYPTION_SECRET in .env for encryption.');
      return plainKey;
    }
    
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(secret).digest('base64').slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(plainKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  // Static method to decrypt key
  public static decryptKey(encryptedKey: string): string {
    try {
      const secret = process.env.ENCRYPTION_SECRET || 'your-default-secret-change-this-in-production';
      
      // If no secret or key doesn't look encrypted (no colon), return as-is
      if (!secret || secret === 'your-default-secret-change-this-in-production' || !encryptedKey.includes(':')) {
        return encryptedKey;
      }
      
      const textParts = encryptedKey.split(':');
      if (textParts.length !== 2) {
        throw new Error('Invalid encrypted key format');
      }
      
      const iv = Buffer.from(textParts[0], 'hex');
      const encryptedText = Buffer.from(textParts[1], 'hex');
      const key = crypto.createHash('sha256').update(secret).digest('base64').slice(0, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      console.error('Decryption error:', error);
      // If decryption fails, return the original (might be plain text)
      return encryptedKey;
    }
  }

  // Instance method to get decrypted key
  public getDecryptedKey(): string {
    return ApiKey.decryptKey(this.key);
  }

  // Instance method to check if key is expired
  public isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  // Instance method to update last used
  public async updateLastUsed(): Promise<void> {
    this.last_used_at = new Date();
    this.usage_count += 1;
    await this.save();
  }

  // Instance method to check permission
  public hasPermission(requiredPermission: string): boolean {
    const permissions = this.permissions.split(',').map(p => p.trim());
    return permissions.includes(requiredPermission) || permissions.includes('*');
  }
}

ApiKey.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_used_at'
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'usage_count'
    },
    permissions: {
      type: DataTypes.TEXT,
      defaultValue: 'read',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
  },
  {
    sequelize,
    tableName: 'api_keys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (apiKey: ApiKey) => {
        // Generate key if not provided
        if (!apiKey.key) {
          apiKey.key = ApiKey.generateApiKey();
        }
        
        // Store plain key temporarily
        const plainKey = apiKey.key;
        
        // Encrypt before saving
        apiKey.key = ApiKey.encryptKey(plainKey);
        
        console.log('API Key Creation:', {
          id: apiKey.id,
          plainKeyLength: plainKey.length,
          encryptedKeyLength: apiKey.key.length,
          isEncrypted: apiKey.key.includes(':')
        });
      }
    },
  }
);

export default ApiKey;