import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiKeyService } from '../services/apiKeyService';
import ApiKey from '../models/ApiKey';
import { Op } from 'sequelize';

export class AuthController {
  // Signup
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Name, email, and password are required' 
        });
        return;
      }

      const { user, token } = await AuthService.register(name, email, password, role);

      res.status(201).json({
        message: 'User created successfully',
        user,
        token,
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        res.status(409).json({ 
          error: 'User already exists',
          message: 'A user with this email address already exists. Please use a different email or login instead.'
        });
      } else {
        console.error('Signup error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'An unexpected error occurred while creating your account.'
        });
      }
    }
  }

  // Login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Email and password are required' 
        });
        return;
      }

      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        user,
        token,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ 
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect.'
        });
      } else if (error.message === 'Account is deactivated') {
        res.status(401).json({ 
          error: 'Account deactivated',
          message: 'Your account has been deactivated. Please contact support.'
        });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'An unexpected error occurred while logging in.'
        });
      }
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      // Get user's active API keys directly from the database
      const activeApiKeys = await ApiKey.findAll({
        where: {
          user_id: user.id,
          is_active: true,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        order: [['created_at', 'DESC']],
        attributes: [
          'id', 
          'key',  // ← Include key attribute
          'name', 
          'expires_at', 
          'is_active', 
          'last_used_at', 
          'usage_count', 
          'permissions', 
          'created_at'
        ]
      });

      // Map and mask the keys with safety check
      const maskedApiKeys = activeApiKeys.map(key => {
        const keyValue = key.key;
        let maskedKey = '[ENCRYPTED]';
        
        if (keyValue && typeof keyValue === 'string') {
          if (keyValue.length >= 8) {
            maskedKey = keyValue.substring(0, 8) + '...';
          } else {
            maskedKey = keyValue.substring(0, 4) + '...';
          }
        }
        
        return {
          id: key.id,
          name: key.name,
          key: maskedKey,
          expires_at: key.expires_at,
          is_active: key.is_active,
          last_used_at: key.last_used_at,
          usage_count: key.usage_count,
          permissions: key.permissions,
          created_at: key.created_at,
          is_expired: false
        };
      });

      const apiKeyMessage = activeApiKeys.length === 0
        ? 'You do not currently have any active API keys.'
        : `You have ${activeApiKeys.length} active API key${activeApiKeys.length === 1 ? '' : 's'}.`;

      res.status(200).json({
        message: 'User profile retrieved successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        },
        api_keys: maskedApiKeys,
        api_key_count: activeApiKeys.length,
        api_key_message: apiKeyMessage
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while retrieving your profile.'
      });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Current password and new password are required' 
        });
        return;
      }

      const success = await AuthService.changePassword(userId, currentPassword, newPassword);

      if (!success) {
        res.status(401).json({ 
          error: 'Incorrect current password',
          message: 'The current password you entered is incorrect.'
        });
        return;
      }

      res.status(200).json({ 
        message: 'Password changed successfully',
        details: 'Your password has been updated. You will need to use your new password for future logins.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while changing your password.'
      });
    }
  }
}