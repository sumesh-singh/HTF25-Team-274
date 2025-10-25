import { Router } from 'express';

const router = Router();

// GET /api/docs - API Documentation
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api/v1`;
  
  res.json({
    success: true,
    data: {
      name: 'SkillSync API Documentation',
      version: '1.0.0',
      description: 'Comprehensive peer-to-peer learning exchange platform API',
      baseUrl,
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
        endpoints: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          refresh: 'POST /auth/refresh',
          logout: 'POST /auth/logout',
        },
      },
      endpoints: {
        authentication: {
          'POST /auth/register': 'Register new user account',
          'POST /auth/login': 'Login with email and password',
          'POST /auth/refresh': 'Refresh access token',
          'POST /auth/logout': 'Logout and invalidate tokens',
          'POST /auth/forgot-password': 'Request password reset',
          'POST /auth/reset-password': 'Reset password with token',
        },
        users: {
          'GET /users/profile': 'Get current user profile',
          'PUT /users/profile': 'Update current user profile',
          'GET /users/:id': 'Get user profile by ID',
          'DELETE /users/account': 'Delete user account',
          'PUT /users/preferences': 'Update user preferences',
        },
        skills: {
          'GET /skills': 'Get all available skills',
          'GET /skills/categories': 'Get skill categories',
          'POST /skills/request': 'Request new skill to be added',
          'GET /skills/users/:id': 'Get user skills',
          'POST /skills/users/skills': 'Add skill to user profile',
          'PUT /skills/users/skills/:id': 'Update user skill',
          'DELETE /skills/users/skills/:id': 'Remove user skill',
          'POST /skills/users/skills/:id/verify': 'Verify user skill',
        },
        sessions: {
          'GET /sessions': 'Get user sessions',
          'POST /sessions': 'Create new session',
          'GET /sessions/upcoming': 'Get upcoming sessions',
          'GET /sessions/history': 'Get session history',
          'GET /sessions/:id': 'Get session details',
          'PUT /sessions/:id': 'Update session',
          'DELETE /sessions/:id': 'Cancel session',
          'POST /sessions/:id/join': 'Join session',
          'POST /sessions/:id/rate': 'Rate completed session',
        },
        messaging: {
          'GET /conversations': 'Get user conversations',
          'POST /conversations': 'Create new conversation',
          'GET /conversations/:id': 'Get conversation details',
          'GET /conversations/:id/messages': 'Get conversation messages',
          'POST /conversations/:id/messages': 'Send message',
          'PUT /messages/:id': 'Update message',
          'DELETE /messages/:id': 'Delete message',
          'POST /conversations/:id/files': 'Upload file to conversation',
        },
        credits: {
          'GET /credits/balance': 'Get credit balance',
          'GET /credits/transactions': 'Get transaction history',
          'POST /credits/purchase': 'Purchase credits',
          'POST /credits/transfer': 'Transfer credits',
          'GET /credits/payments/methods': 'Get payment methods',
          'POST /credits/payments/methods': 'Add payment method',
          'DELETE /credits/payments/methods/:id': 'Remove payment method',
        },
        notifications: {
          'GET /notifications': 'Get user notifications',
          'PUT /notifications/:id/read': 'Mark notification as read',
          'PUT /notifications/read-all': 'Mark all notifications as read',
          'GET /notifications/preferences': 'Get notification preferences',
          'PUT /notifications/preferences': 'Update notification preferences',
        },
        matching: {
          'GET /matches/suggestions': 'Get AI-powered match suggestions',
          'POST /matches/filter': 'Filter matches with criteria',
          'POST /matches/:id/favorite': 'Favorite a match',
          'POST /matches/:id/pass': 'Pass on a match',
          'POST /matches/:id/block': 'Block a match',
          'GET /matches/favorites': 'Get favorited matches',
        },
      },
      responseFormat: {
        success: {
          success: true,
          data: '{ ... }',
          meta: {
            timestamp: 'ISO 8601 timestamp',
            requestId: 'unique request identifier',
            pagination: 'pagination info (if applicable)',
          },
        },
        error: {
          success: false,
          error: {
            code: 'ERROR_CODE',
            message: 'Human readable error message',
            details: 'Additional error details (optional)',
            timestamp: 'ISO 8601 timestamp',
            requestId: 'unique request identifier',
          },
        },
      },
      rateLimiting: {
        general: '100 requests per 15 minutes per IP',
        authentication: '5 requests per minute per IP',
      },
      websocket: {
        url: 'ws://localhost:3001',
        events: {
          client: [
            'join_conversation',
            'leave_conversation',
            'send_message',
            'typing_start',
            'typing_stop',
            'join_session',
            'session_update',
          ],
          server: [
            'message_received',
            'message_updated',
            'typing_indicator',
            'user_online',
            'user_offline',
            'notification',
            'session_reminder',
            'match_suggestion',
          ],
        },
      },
      examples: {
        register: {
          url: `${baseUrl}/auth/register`,
          method: 'POST',
          body: {
            email: 'user@example.com',
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        login: {
          url: `${baseUrl}/auth/login`,
          method: 'POST',
          body: {
            email: 'user@example.com',
            password: 'SecurePass123!',
          },
        },
        createSession: {
          url: `${baseUrl}/sessions`,
          method: 'POST',
          headers: {
            Authorization: 'Bearer <token>',
          },
          body: {
            teacherId: 'uuid-of-teacher',
            skillId: 'uuid-of-skill',
            title: 'Learn React Fundamentals',
            description: 'Introduction to React components and hooks',
            scheduledAt: '2024-01-15T14:00:00Z',
            duration: 60,
            type: 'one_time',
          },
        },
      },
      support: {
        documentation: 'https://docs.skillsync.com',
        email: 'support@skillsync.com',
        github: 'https://github.com/skillsync/api',
      },
    },
  });
});

export default router;