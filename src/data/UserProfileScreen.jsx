import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import { fetchUserProfile, toggleFollowUser, togglePostLike, addCommentToPost } from '../data/api';
import { translations } from '../data/translations';
import StatusBar from '../components/StatusBar';
import toast, { Toaster } from 'react-hot-toast';

const UserProfileScreen = ({ userId, onBack, userLanguage }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null); // To check if it's the current user's profile

  const t = translations[userLanguage] || translations.English;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('pune_auth_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.id);
    }
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleToggleFollow = async () => {
    if (!profile) return;

    // Optimistic update
    const originalProfile = { ...profile };
    setProfile(prev => ({ ...prev, isFollowing: !prev.isFollowing, _count: { ...prev._count, followers: prev.isFollowing ? prev._count.followers - 1 : prev._count.followers + 1 } }));

    try {
      await toggleFollowUser(profile.id);
      toast.success(t.socialMedia.followSuccess);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast.error(t.socialMedia.followError);
      setProfile(originalProfile); // Revert on error
    }
  };

  const handleToggleLike = async (postId) => {
    if (!profile) return;

    const originalPosts = [...profile.posts];
    // Optimistically update the UI
    const newPosts = profile.posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }
      return p;
    });
    setProfile(prev => ({ ...prev, posts: newPosts }));

    try {
      await togglePostLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t.socialMedia.likeError);
      setProfile(prev => ({ ...prev, posts: originalPosts })); // Revert on error
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!text) return;
    if (!profile) return;

    const originalPosts = [...profile.posts];
    const tempCommentId = Date.now();
    const userName = localStorage.getItem("pune_user_name") || "You";

    // Optimistically update the UI
    const newPosts = profile.posts.map(p => {
      if (p.id === postId) {
        const newComment = { id: tempCommentId, text, user: { name: userName } };
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    });
    setProfile(prev => ({ ...prev, posts: newPosts }));

    try {
      await addCommentToPost(postId, text);
      fetchProfile(); // Re-fetch to get actual comment ID and timestamp
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t.socialMedia.commentError);
      setProfile(prev => ({ ...prev, posts: originalPosts })); // Revert on error
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#FBF8F3]">
        <StatusBar />
        <p className="text-gray-600">{t.socialMedia.loading}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FBF8F3] flex flex-col">
      <Toaster />
      <StatusBar />
      <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <button onClick={onBack} className="text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{profile.name}</h1>
      </div>

      {/* User Info Section */}
      <div className="p-4 bg-white flex flex-col items-center border-b border-gray-200">
        <div className="w-20 h-20 bg-gray-300 rounded-full mb-3 flex items-center justify-center text-3xl font-bold text-gray-600">
          {profile.name ? profile.name[0].toUpperCase() : 'U'}
        </div>
        <h2 className="text-lg font-bold text-gray-800">{profile.name}</h2>
        <div className="flex gap-6 my-4">
          <div className="text-center">
            <p className="font-bold text-lg">{profile._count.followers}</p>
            <p className="text-sm text-gray-500">{t.profile.followers}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{profile._count.following}</p>
            <p className="text-sm text-gray-500">{t.profile.following}</p>
          </div>
        </div>
        {currentUserId !== profile.id && ( // Only show follow button if not viewing own profile
        <button
          onClick={handleToggleFollow}
          className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            profile.isFollowing
              ? 'bg-gray-200 text-gray-800'
              : 'bg-[#8B3A2A] text-white'
          }`}
        >
          {profile.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
          {profile.isFollowing ? t.socialMedia.unfollow : t.socialMedia.follow}
        </button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="flex-1 overflow-y-auto p-1">
        {profile.posts.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">{t.socialMedia.noPosts}</p>
        ) : (
          <div className="grid grid-cols-3 gap-1"> {/* Changed to grid for image display */}
            {profile.posts.map(post => (
              <div key={post.id} className="relative aspect-square bg-gray-200" onClick={() => { /* Implement post detail view navigation here */ }}>
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-gray-500">
                    {post.caption}
                  </div>
                )}
                {/* Overlay for likes/comments count */}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-4 text-white text-sm font-bold opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center gap-1">
                    <Heart size={16} fill="white" /> {post.likesCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={16} /> {post.comments.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileScreen;