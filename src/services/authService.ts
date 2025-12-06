import jwt from 'jsonwebtoken';
import User from '../models/User';
import ApiKey from '../models/ApiKey';

export class AuthService {
  // Generate JWT token - FIXED
  static generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET as string;
    
    // Use expiresIn as a string (it accepts string values like '24h')
    const expiresIn = process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] || '24h';
    
    return jwt.sign(
      { userId },
      secret,
      { expiresIn }
    );
  }

  // Register new user
  static async register(
    name: string,
    email: string,
    password: string,
    role?: string
  ): Promise<{ user: any; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Generate token
    const token = this.generateToken(user.id);

    // Update last login
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toJSON() as any;
    const { password: _, ...userWithoutPassword } = userResponse;

    return { user: userWithoutPassword, token };
  }

  // Login user
  static async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Update last login
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toJSON() as any;
    const { password: _, ...userWithoutPassword } = userResponse;

    return { user: userWithoutPassword, token };
  }

  // Create API key
  static async createApiKey(
    userId: string,
    name: string,
    permissions: string = 'read'
  ): Promise<any> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.API_KEY_EXPIRES_DAYS || '30'));

    const apiKey = await ApiKey.create({
      user_id: userId,
      name,
      permissions,
      expires_at: expiresAt,
    });

    return apiKey.toJSON();
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
  static async getUserApiKeys(userId: string): Promise<any[]> {
    const apiKeys = await ApiKey.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });

    return apiKeys.map(key => key.toJSON());
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

  // Change user password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) return false;

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return false;

    await user.update({ password: newPassword });
    return true;
  }
}