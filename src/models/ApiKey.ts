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
      type: DataTypes.STRING(128), 
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
      beforeCreate: (apiKey: ApiKey) => {
        // Generate key if not provided
        if (!apiKey.key) {
          apiKey.key = ApiKey.generateApiKey();
        }
      },
      beforeValidate: (apiKey: ApiKey) => {
        if (!apiKey.key) {
          apiKey.key = ApiKey.generateApiKey();
        }
      }
    },
  }
);

export default ApiKey;