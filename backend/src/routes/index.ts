import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import skillRoutes from './skills';
import sessionRoutes from './sessions';
import messageRoutes from './messages';
import creditRoutes from './credits';
import notificationRoutes from './notifications';
import matchRoutes from './matches';

const router = Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/skills', skillRoutes);
router.use('/sessions', sessionRoutes);
router.use('/messages', messageRoutes);
router.use('/conversations', messageRoutes); // Alias for messages
router.use('/credits', creditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/matches', matchRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SkillSync API',
      version: '1.0.0',
      description: 'Peer-to-peer learning exchange platform API',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        skills: '/api/v1/skills',
        sessions: '/api/v1/sessions',
        messages: '/api/v1/messages',
        credits: '/api/v1/credits',
        notifications: '/api/v1/notifications',
        matches: '/api/v1/matches',
      },
      documentation: 'https://docs.skillsync.com/api',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;