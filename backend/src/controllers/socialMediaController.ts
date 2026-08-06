import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { invalidateCache } from '../services/cacheService';
import { prisma } from '../app';

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { caption, imageUrl } = req.body;
    let userId = req.user.id;

    if (!caption && !imageUrl) {
      return res.status(400).json({ error: 'Post must have a caption or an image.' });
    }

    // Verify author exists in database to prevent foreign key violation
    let authorExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!authorExists) {
      const guest = await prisma.user.upsert({
        where: { email: 'guest@punetourguide.com' },
        update: {},
        create: {
          name: 'Pune Explorer',
          email: 'guest@punetourguide.com',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PuneExplorer',
          xp: 150,
        },
      });
      userId = guest.id;
    }

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        caption: caption || '',
        imageUrl: imageUrl || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        comments: true,
        likes: true,
      },
    });

    try {
      await invalidateCache('social:feed');
    } catch (e) {
      console.warn('Cache invalidation skipped:', e);
    }

    res.status(201).json(post);
  } catch (error: any) {
    console.error('Failed to create post:', error);
    res.status(500).json({ error: error?.message || 'Failed to create post' });
  }
};

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const followingRelations = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });
    const followingUserIds = new Set(followingRelations.map((f) => f.followingId));

    const postsWithInteractionStatus = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((like) => like.userId === userId),
      likesCount: post.likes.length,
      isFollowing: followingUserIds.has(post.author.id),
    }));

    res.json(postsWithInteractionStatus);
  } catch (error: any) {
    console.error('Failed to fetch social feed:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch feed' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const comment = await prisma.comment.create({
      data: {
        postId: Number(postId),
        userId,
        text,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await invalidateCache('social:feed');
    res.status(201).json(comment);
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { postId } = req.params;
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: Number(postId),
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { userId_postId: { userId, postId: Number(postId) } } });
      await invalidateCache('social:feed');
      return res.json({ liked: false });
    }

    await prisma.like.create({ data: { postId: Number(postId), userId } });
    await invalidateCache('social:feed');
    return res.json({ liked: true });
  } catch (error) {
    console.error('Failed to toggle like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const postId = Number(req.params.id);
    const currentUserId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        likes: { select: { userId: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ ...post, isLiked: post.likes.some((like) => like.userId === currentUserId), likesCount: post.likes.length });
  } catch (error) {
    console.error('Failed to fetch post by ID:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const toggleFollow = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const followerId = req.user.id;
    const { userId: followingId } = req.params;

    if (followerId === Number(followingId)) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: Number(followingId),
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: Number(followingId),
          },
        },
      });
      await invalidateCache(`user:profile:${followingId}`);
      await invalidateCache(`user:stats:${followerId}`);
      await invalidateCache(`user:stats:${followingId}`);
      return res.json({ following: false });
    }

    await prisma.follow.create({
      data: { followerId, followingId: Number(followingId) },
    });
    await invalidateCache(`user:profile:${followingId}`);
    await invalidateCache(`user:stats:${followerId}`);
    await invalidateCache(`user:stats:${followingId}`);
    return res.json({ following: true });
  } catch (error) {
    console.error('Failed to toggle follow:', error);
    res.status(500).json({ error: 'Failed to toggle follow status' });
  }
};

export const getPopularPosts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    const popularPosts = posts
      .map((post) => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        popularityScore: post._count.likes + post._count.comments * 2,
      }))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5);

    res.json(popularPosts);
  } catch (error) {
    console.error('Failed to fetch popular posts:', error);
    res.status(500).json({ error: 'Failed to fetch popular posts' });
  }
};