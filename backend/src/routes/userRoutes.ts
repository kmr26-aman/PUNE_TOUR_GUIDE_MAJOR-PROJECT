import { Router } from 'express';
import {
  getUserStats, registerUser, loginUser, googleAuthUser,
  getUserMe, getUserProfile, getUserActivity, updateUserAvatar,
  requestForgotPassword, resetPasswordWithOTP
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-auth', googleAuthUser);
router.post('/forgot-password', requestForgotPassword);
router.post('/reset-password', resetPasswordWithOTP);
router.get('/me', authMiddleware, getUserMe);
router.put('/avatar', authMiddleware, updateUserAvatar);
router.get('/stats', authMiddleware, getUserStats);
router.get('/:id/activity', authMiddleware, getUserActivity);
router.get('/:id', authMiddleware, getUserProfile);

export default router;
