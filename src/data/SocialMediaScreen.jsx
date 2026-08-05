import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, PlusCircle, Image as ImageIcon, X } from 'lucide-react';
import { getSocialFeed, addCommentToPost, togglePostLike, toggleFollowUser, getPopularPosts } from '../data/api';
import { translations } from '../data/translations';
import StatusBar from '../components/StatusBar';
import toast, { Toaster } from 'react-hot-toast';

const SocialMediaScreen = ({ userLanguage, onUserSelect, onPostSelect }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImageFile, setNewPostImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10); // Number of posts to load per page
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [commentTexts, setCommentTexts] = useState({}); // { postId: commentText }
  const [currentUserId, setCurrentUserId] = useState(null);

  const t = translations[userLanguage] || translations.English;

  const fetchPosts = async (page) => {
    setLoading(true);
    try {
      const data = await getSocialFeed(page, postsPerPage);
      setPosts(prevPosts => page === 1 ? data : [...prevPosts, ...data]);
      setHasMorePosts(data.length === postsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching social feed:', error);
      toast.error(t.socialMedia.fetchError);
      setHasMorePosts(false); // Stop trying to load more if there's an error
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
    fetchPosts(1); // Load initial posts on component mount
  }, []);

  const handleCreatePost = async () => {
    if (!newPostCaption && !newPostImageFile) {
      toast.error(t.socialMedia.emptyPostError);
      return;
    }

    setIsUploading(true);
    let imageUrl = null;

    try {
      if (newPostImageFile) {
        imageUrl = await uploadImage(newPostImageFile);
      }

      await createPost(newPostCaption, imageUrl);

      setNewPostCaption('');
      setNewPostImageFile(null);
      toast.success(t.socialMedia.postSuccess);
      fetchPosts(1); // Refresh feed from the beginning after creating a new post
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(t.socialMedia.postError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleLike = async (postId) => {
    const originalPosts = [...posts];

    // Optimistically update the UI
    const newPosts = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }
      return p;
    });
    setPosts(newPosts);

    try {
      await togglePostLike(postId);
      // On success, we don't need to do anything since the UI is already updated.
      // A full refetch is avoided for a snappier feel.
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t.socialMedia.likeError);
      // On error, revert to the original state.
      setPosts(originalPosts);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text) return;

    const originalPosts = [...posts];
    const tempCommentId = Date.now();
    const userName = localStorage.getItem("pune_user_name") || "You";

    // Optimistically update the UI
    const newPosts = posts.map(p => {
      if (p.id === postId) {
        const newComment = { id: tempCommentId, text, user: { name: userName } };
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    });
    setPosts(newPosts);
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));

    try {
      // After the UI is updated, send the request and then refresh with server data.
      await addCommentToPost(postId, text);
      fetchPosts(); // Refresh to get final comment ID and timestamp from server.
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t.socialMedia.commentError);
      // On error, revert to the original state.
      setPosts(originalPosts);
    }
  };

  const handleToggleFollow = async (userIdToFollow) => {
    const originalPosts = [...posts];

    // Optimistically update the UI for all posts by this user
    const newPosts = posts.map(p => {
      if (p.user.id === userIdToFollow) {
        return {
          ...p,
          isFollowing: !p.isFollowing,
        };
      }
      return p;
    });
    setPosts(newPosts);

    try {
      await toggleFollowUser(userIdToFollow);
      toast.success(t.socialMedia.followSuccess);
      fetchPosts(1); // Refresh feed to update follow status across all posts by that user
    } catch (error) { // Revert on error
      console.error('Error toggling follow:', error);
      toast.error(t.socialMedia.followError);
      setPosts(originalPosts); // Revert on error
    }
  };

  if (loading) {
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
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-800">{t.socialMedia.title}</h1>
      </div>

      {/* New Post Section */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B3A2A]"
          placeholder={t.socialMedia.newPostPlaceholder}
          value={newPostCaption}
          onChange={(e) => setNewPostCaption(e.target.value)}
          rows="2"
        ></textarea>
        <div className="mt-2 flex items-center justify-between">
          <label htmlFor="file-upload" className="cursor-pointer text-gray-500 hover:text-[#8B3A2A]">
            <ImageIcon size={24} />
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setNewPostImageFile(e.target.files[0])} />
          </label>
          {newPostImageFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{newPostImageFile.name}</span>
              <button onClick={() => setNewPostImageFile(null)} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        {newPostImageFile && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(newPostImageFile)}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}
        <button
          onClick={handleCreatePost}
          disabled={isUploading}
          className="mt-3 w-full bg-[#8B3A2A] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:bg-gray-400"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PlusCircle size={20} />
          )}
          {isUploading ? (userLanguage === 'Marathi' ? 'पोस्ट करत आहे...' : 'Posting...') : t.socialMedia.postButton}
        </button>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto pb-16"> {/* Added pb-16 for bottom nav spacing */}
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">{t.socialMedia.noPosts}</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white shadow-sm rounded-lg mx-4 my-3 p-4">
              <div className="flex items-center mb-3" >
                <div className="w-8 h-8 bg-gray-300 rounded-full mr-2 flex items-center justify-center text-sm font-bold text-gray-600">
                  {post.user.name ? post.user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="font-semibold text-gray-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); onUserSelect && onUserSelect(post.user.id); }}>{post.user.name}</span>
                {currentUserId && post.user.id !== currentUserId && (
                  <>
                    <span className="mx-2 text-gray-400">·</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFollow(post.user.id); }} // Stop propagation to prevent navigating to user profile
                      className="text-xs font-bold text-[#8B3A2A] hover:underline"
                    >
                      {post.isFollowing ? t.socialMedia.unfollow : t.socialMedia.follow}
                    </button>
                  </>
                )}
                <span className="text-gray-500 text-xs ml-auto">
                  {new Date(post.createdAt).toLocaleDateString(userLanguage === 'Marathi' ? 'mr-IN' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {post.imageUrl && ( // Make image clickable for detail view
                <img src={post.imageUrl} alt={post.caption} className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onPostSelect && onPostSelect(post.id); }} />
              )}
              {post.caption && <p className="text-gray-700 mb-3">{post.caption}</p>}

              <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                <button onClick={(e) => { e.stopPropagation(); handleToggleLike(post.id); }} className="flex items-center gap-1">
                  <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} stroke={post.isLiked ? '#EF4444' : '#6B7280'} />
                  <span>{post.likesCount} {t.socialMedia.likes}</span>
                </button>
                <div className="flex items-center gap-1">
                  <MessageCircle size={18} />
                  <span>{post.comments.length} {t.socialMedia.comments}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="text-sm mb-2">
                    <span className="font-semibold text-gray-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); onUserSelect && onUserSelect(comment.user.id); }}>{comment.user.name}:</span>{' '}
                    <span className="text-gray-700">{comment.text}</span>
                  </div>
                ))}
                <div className="flex mt-3">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#8B3A2A] text-sm"
                    placeholder={t.socialMedia.addCommentPlaceholder}
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()} // Prevent navigating to user profile when typing comment
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddComment(post.id); }}
                    className="bg-[#8B3A2A] text-white px-4 rounded-r-lg flex items-center justify-center hover:bg-opacity-90"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {hasMorePosts && (
          <div className="flex justify-center my-4">
            <button
              onClick={() => fetchPosts(currentPage + 1)}
              disabled={loading}
              className="bg-[#8B3A2A] text-white py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {loading ? t.socialMedia.loading : t.socialMedia.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaScreen;