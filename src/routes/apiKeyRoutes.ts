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
 *                 description: Unique name for the API key
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
 *     summary: Revoke an API key (mark as inactive)
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
 * /keys/{apiKeyId}/reactivate:
 *   patch:
 *     summary: Reactivate an API key
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
 *         description: API key reactivated successfully
 *       400:
 *         description: API key is expired or already active
 *       404:
 *         description: API key not found
 */
router.patch('/:apiKeyId/reactivate', ApiKeyController.reactivateApiKey);

/**
 * @swagger
 * /keys/{apiKeyId}:
 *   delete:
 *     summary: Delete an API key permanently
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
 *         description: API key deleted permanently
 *       404:
 *         description: API key not found
 */
router.delete('/:apiKeyId', ApiKeyController.deleteApiKey);

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

/**
 * @swagger
 * /keys/test:
 *   get:
 *     summary: Test API key authentication
 *     tags: [API Keys]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication test successful
 *       401:
 *         description: Not authenticated
 */
router.get('/test', ApiKeyController.testApiKey);

export default router;