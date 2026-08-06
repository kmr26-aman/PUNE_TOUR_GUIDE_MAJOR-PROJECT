import { Router } from 'express';
import { 
  createPost, getFeed, addComment, toggleLike, getPostById, toggleFollow, 
  getPopularPosts, deletePost, updateCaption, deleteComment, updateComment 
} from '../controllers/socialMediaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/posts', authenticateToken, createPost);
router.get('/feed', authenticateToken, getFeed);
router.get('/posts/popular', authenticateToken, getPopularPosts);
router.get('/posts/:id', authenticateToken, getPostById);
router.delete('/posts/:id', authenticateToken, deletePost);
router.put('/posts/:id/caption', authenticateToken, updateCaption);
router.post('/posts/:postId/comments', authenticateToken, addComment);
router.put('/comments/:id', authenticateToken, updateComment);
router.delete('/comments/:id', authenticateToken, deleteComment);
router.post('/posts/:postId/like', authenticateToken, toggleLike);
router.post('/users/:userId/toggle-follow', authenticateToken, toggleFollow);

export default router;
