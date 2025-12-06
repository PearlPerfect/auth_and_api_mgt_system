import jwt from 'jsonwebtoken';
import User from '../models/User';

export class AuthService {
  static generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET as string;
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

    await user.updateLastLogin();

    const userResponse = user.toJSON() as any;
    const { password: _, ...userWithoutPassword } = userResponse;

    return { user: userWithoutPassword, token };
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


  static async getUserById(userId: string): Promise<any> {
    const user = await User.findByPk(userId);
    if (!user) return null;

    const userResponse = user.toJSON() as any;
    const { password: _, ...userWithoutPassword } = userResponse;
    return userWithoutPassword;
  }
}