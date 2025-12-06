import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: User already exists
 */
router.post('/signup', AuthController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile with active API keys
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully with active API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *                     last_login_at:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 api_keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       key:
 *                         type: string
 *                         description: Masked API key (first 8 characters)
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                       is_active:
 *                         type: boolean
 *                       last_used_at:
 *                         type: string
 *                         format: date-time
 *                       usage_count:
 *                         type: integer
 *                       permissions:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       is_expired:
 *                         type: boolean
 *                 api_key_count:
 *                   type: integer
 *                 api_key_message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', authenticate, AuthController.getProfile);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *                 minLength: 6
 *               newPassword:
 *                 type: string
 *                 description: New password to set
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Current password is incorrect
 *       500:
 *         description: Internal server error
 */
router.post('/change-password', authenticate, validateBody, AuthController.changePassword);

export default router;