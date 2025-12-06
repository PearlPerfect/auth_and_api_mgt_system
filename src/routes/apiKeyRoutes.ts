import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKeyController';
import { authenticate, requirePermission } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

// All API key routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /keys/create:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name for the API key (cannot be the same as an existing active key for the user)
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: ["read"]
 *               expiresInDays:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       201:
 *         description: API key created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: An active API key with this name already exists
 *       401:
 *         description: Not authenticated
 */
router.post('/create', validateBody, ApiKeyController.createApiKey);

/**
 * @swagger
 * /keys:
 *   get:
 *     summary: List user's API keys
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Not authenticated
 */
router.get('/', ApiKeyController.listApiKeys);

/**
 * @swagger
 * /keys/{apiKeyId}/revoke:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apiKeyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *       404:
 *         description: API key not found
 */
router.delete('/:apiKeyId/revoke', ApiKeyController.revokeApiKey);

/**
 * @swagger
 * /keys/validate:
 *   post:
 *     summary: Validate an API key
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/validate', ApiKeyController.validateKey);

export default router;