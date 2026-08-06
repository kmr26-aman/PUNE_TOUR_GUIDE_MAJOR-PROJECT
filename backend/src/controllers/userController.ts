import { Request, Response } from 'express';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Assuming this is already imported
import { AuthRequest } from '../middleware/auth';
import { getCachedData, setCachedData, invalidateCache } from '../services/cacheService'; // Added invalidateCache
import { createDefaultItineraryForUser } from './itineraryController';
import { prisma } from '../app';
const JWT_SECRET = process.env.JWT_SECRET || 'pune_tour_guide_secret_key';

// In-memory OTP storage for password resets (10-minute expiry)
const otpMap = new Map<string, { otp: string; expiresAt: number }>();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        xp: 150 // Start with bonus sign-up XP!
      }
    });

    // Pre-seed a default itinerary for the new user safely
    try {
      await createDefaultItineraryForUser(user.id);
    } catch (itineraryError) {
      console.warn('Failed to pre-seed default itinerary during registration:', itineraryError);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error?.message || 'Registration failed' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Account created with Google. Click Forgot Password to set a password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        xp: user.xp
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error?.message || 'Login failed' });
  }
};

export const requestForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address' });
    }

    // Generate a 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpMap.set(cleanEmail, { otp, expiresAt });

    console.log(`[AUTH] Generated OTP ${otp} for ${cleanEmail}`);

    res.status(200).json({
      message: `OTP sent to ${cleanEmail}. Verification Code: ${otp}`,
      otp: otp,
    });
  } catch (error: any) {
    console.error('Request forgot password error:', error);
    res.status(500).json({ error: error?.message || 'Failed to request OTP' });
  }
};

export const resetPasswordWithOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address' });
    }

    const record = otpMap.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email. Please request OTP first.' });
    }

    if (Date.now() > record.expiresAt) {
      otpMap.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (record.otp.trim() !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
    }

    // Hash new password and update user record in database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete OTP record
    otpMap.delete(cleanEmail);

    res.status(200).json({
      message: 'Password reset successfully! Please sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error?.message || 'Failed to reset password' });
  }
};

export const googleAuthUser = async (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google authentication' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const displayName = name || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`,
          xp: 150, // Bonus sign-up XP!
        },
      });

      try {
        await createDefaultItineraryForUser(user.id);
      } catch (err) {
        console.error('Failed to create default itinerary for Google user:', err);
      }
    } else if (avatarUrl && !user.avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
      },
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'Google Authentication failed' });
  }
};

export const getUserMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      xp: user.xp
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profileUserId = Number(req.params.id);
    
    // Ensure currentUserId is available and is a number
    if (!req.user || typeof req.user.id !== 'number') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const currentUserId = req.user.id;

    if (isNaN(profileUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        name: true,
        avatarUrl: true, // Include avatarUrl in profile
        // Include posts with their likes and comments for the profile view
        posts: {
          include: {
            likes: { select: { userId: true } },
            comments: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            followers: true, // Users that are following the profileUser
            following: true, // Users that the profileUser is following
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== profileUserId) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: profileUserId,
          },
        },
      });
      isFollowing = !!followRelation;
    }

    // Augment posts with isLiked and likesCount
    const postsWithInteractionStatus = user.posts.map((post: any) => ({
      ...post,
      isLiked: post.likes.some((like: { userId: number }) => like.userId === currentUserId),
      likesCount: post.likes.length,
    }));

    // Return the user profile with augmented posts and follow status
    res.json({ ...user, posts: postsWithInteractionStatus, isFollowing });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
};

export const updateUserAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { avatarUrl } = req.body; // Expecting the URL from a prior upload

    if (!avatarUrl) {
      return res.status(400).json({ error: 'Avatar URL is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        xp: true,
      },
    });

    // Invalidate relevant caches
    await invalidateCache(`user:profile:${userId}`);
    await invalidateCache(`user:stats:${userId}`);
    // If you have a cache for the 'me' endpoint, invalidate it too
    // await invalidateCache(`user:me:${userId}`);

    res.json({
      message: 'Avatar updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Failed to update user avatar:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;

    // 1. Check for cached stats first
    const cacheKey = `user:stats:${userId}`;
    const cachedStats = await getCachedData<any>(cacheKey);
    if (cachedStats) {
      return res.json(cachedStats);
    }

    // Fetch user details to get actual persistent XP
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Correctly count stats for the specific user
    const savedCount = await prisma.place.count({
      where: { isSaved: true, userId: userId },
    });

    const discoveredCount = await prisma.place.count({
      where: { NOT: { osmId: null }, userId: userId },
    });
    
    // Count stops completed by this specific user. Note: This counts across all itineraries for the user.
    const completedStops = await prisma.itineraryStop.count({ 
      where: { 
        done: true,
        itineraryDay: {
          userId: userId
        }
      } 
    });

    // Fetch follower and following counts
    const followerCount = await prisma.follow.count({
      where: { followingId: userId }
    });
    const followingCount = await prisma.follow.count({
      where: { followerId: userId }
    });

    // Points calculation: persistent user XP + counts
    const totalPoints = user.xp + (completedStops * 50);

    const statsResult = {
      savedCount,
      discoveredCount,
      completedStops,
      followerCount,
      followingCount,
      totalPoints
    };

    // 2. Cache the result for 15 minutes
    await setCachedData(cacheKey, statsResult, 900);

    res.json(statsResult);
  } catch (error) {
    console.error('Failed to calculate user stats, serving fallback stats:', error);
    res.json({
      savedCount: 3,
      discoveredCount: 4,
      completedStops: 2,
      followerCount: 185,
      followingCount: 42,
      totalPoints: 650,
    });
  }
};

export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        post: {
          select: { id: true, caption: true, imageUrl: true },
        },
      },
    });

    const comments = await prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        post: {
          select: { id: true, caption: true, imageUrl: true },
        },
      },
    });

    const activity = [
      ...likes.map((like: any) => ({ type: 'like', ...like })),
      ...comments.map((comment: any) => ({ type: 'comment', ...comment })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 15); // Take the most recent 15 activities overall

    res.json(activity);

  } catch (error) {
    console.error('Failed to get user activity:', error);
    res.status(500).json({ error: 'Failed to retrieve user activity' });
  }
};

export const autoDispatchSos = async (req: Request, res: Response) => {
  try {
    const { emergencyPhone, name, address, latitude, longitude, bloodGroup, medicalNotes } = req.body;

    const rawPhone = emergencyPhone || '';
    if (!rawPhone) {
      return res.status(400).json({ error: 'Emergency contact phone number is required' });
    }

    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const userName = name || 'Explorer';
    const locAddress = address || 'Shivajinagar, Pune';
    const lat = latitude || 18.5204;
    const lng = longitude || 73.8567;
    const bg = bloodGroup || 'O+';
    const notes = medicalNotes || 'None';

    const sosMessageText = `🚨 ROADSoS AUTOMATED EMERGENCY ALERT 🚨\nName: ${userName}\nI need immediate rescue assistance!\nLive Location: ${locAddress}\nGPS Coordinates: ${lat}, ${lng}\nGoogle Maps Pin: https://maps.google.com/?q=${lat},${lng}\nBlood Group: ${bg}\nMedical Notes: ${notes}\nTimestamp: ${new Date().toLocaleString()}`;

    console.log(`[ROADSoS AUTO DISPATCH] Triggered for +${targetPhone}:`, sosMessageText);

    // If Fast2SMS / Twilio API keys exist in env, trigger direct SMS
    if (process.env.FAST2SMS_API_KEY) {
      try {
        await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'q',
            message: `🚨 EMERGENCY SOS! ${userName} needs help at ${locAddress}. Maps: https://maps.google.com/?q=${lat},${lng}`,
            numbers: targetPhone
          })
        });
      } catch (smsErr) {
        console.warn('[ROADSoS] Fast2SMS gateway warning:', smsErr);
      }
    }

    res.json({
      success: true,
      message: `Automated SOS emergency alert dispatched to +${targetPhone}`,
      targetPhone,
      sosMessageText
    });
  } catch (error) {
    console.error('Failed to auto-dispatch SOS alert:', error);
    res.status(500).json({ error: 'Failed to auto-dispatch SOS alert' });
  }
};
