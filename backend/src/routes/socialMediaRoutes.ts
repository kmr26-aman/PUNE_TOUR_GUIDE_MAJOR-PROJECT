import { Router } from 'express';
import { createPost, getFeed, addComment, toggleLike, getPostById, toggleFollow, getPopularPosts } from '../controllers/socialMediaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/posts', authenticateToken, createPost);
router.get('/feed', authenticateToken, getFeed);
router.get('/posts/popular', authenticateToken, getPopularPosts);
router.get('/posts/:id', authenticateToken, getPostById);
router.post('/posts/:postId/comments', authenticateToken, addComment);
router.post('/posts/:postId/like', authenticateToken, toggleLike);
router.post('/users/:userId/toggle-follow', authenticateToken, toggleFollow);

export default router;
