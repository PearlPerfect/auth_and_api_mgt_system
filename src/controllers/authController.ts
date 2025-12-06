import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  // Signup
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
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
        res.status(409).json({ error: error.message });
      } else {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        user,
        token,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
        res.status(401).json({ error: error.message });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      const success = await AuthService.changePassword(userId, currentPassword, newPassword);

      if (!success) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}