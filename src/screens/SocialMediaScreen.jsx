import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, PlusCircle, Home, Sparkles, Filter } from 'lucide-react';
import { getSocialFeed, addCommentToPost, togglePostLike, toggleFollowUser } from '../data/api';
import { translations } from '../data/translations';
import StatusBar from '../components/StatusBar';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORY_CHIPS = [
  { id: "All", label: "All ✨" },
  { id: "Heritage", label: "Heritage 🏰" },
  { id: "Food", label: "Food ☕" },
  { id: "Events", label: "Events 🎉" },
  { id: "Nature", label: "Nature 🌿" },
];

const SocialMediaScreen = ({ userLanguage, onUserSelect, onPostSelect, onNavigateToCreatePost, onNavigateHome }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [commentTexts, setCommentTexts] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const feedRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const t = translations[userLanguage] || translations.English;
  const sm = t.socialMedia || translations.English.socialMedia || {};

  const fetchPosts = useCallback(async (page) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getSocialFeed(page, postsPerPage);
      setPosts(prevPosts => (page === 1 ? data : [...prevPosts, ...data]));
      setHasMorePosts(data.length === postsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching social feed:', error);
      toast.error(sm.fetchError || 'Unable to load feed.');
      setHasMorePosts(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postsPerPage, sm.fetchError]);

  useEffect(() => {
    const token = localStorage.getItem('pune_auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (e) {
        console.warn("Token payload decode error:", e);
      }
    }
    fetchPosts(1);
  }, [fetchPosts]);

  // --- Infinite Scroll Logic ---
  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMorePosts) {
        fetchPosts(currentPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMorePosts, fetchPosts, currentPage]);

  const handleToggleLike = async (postId) => {
    const originalPosts = [...posts];
    const newPosts = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1
        };
      }
      return p;
    });
    setPosts(newPosts);

    try {
      await togglePostLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(sm.likeError || "Couldn't update like.");
      setPosts(originalPosts);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text || text.trim() === '') return;

    const originalPosts = [...posts];
    const tempCommentId = Date.now();
    const userName = localStorage.getItem("pune_user_name") || "You";

    const newPosts = posts.map(p => {
      if (p.id === postId) {
        const newComment = { id: tempCommentId, text, user: { name: userName } };
        return { ...p, comments: [...(p.comments || []), newComment] };
      }
      return p;
    });
    setPosts(newPosts);
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));

    try {
      await addCommentToPost(postId, text);
      fetchPosts(1);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(sm.commentError || "Couldn't add comment.");
      setPosts(originalPosts);
    }
  };

  const handleToggleFollow = async (userIdToFollow) => {
    const originalPosts = [...posts];
    const newPosts = posts.map(p => {
      if (p.user?.id === userIdToFollow) {
        return { ...p, isFollowing: !p.isFollowing };
      }
      return p;
    });
    setPosts(newPosts);

    try {
      await toggleFollowUser(userIdToFollow);
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(sm.followError || "Couldn't update follow state.");
      setPosts(originalPosts);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchPosts(1);
    } catch (error) {
      console.error('Error refreshing feed:', error);
      toast.error(sm.fetchError || "Couldn't refresh feed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => { currentY.current = e.touches[0].clientY; };
  const handleTouchEnd = async () => {
    if (feedRef.current && feedRef.current.scrollTop === 0 && currentY.current - startY.current > 100 && !isRefreshing) {
      await handleRefresh();
    }
    startY.current = 0;
    currentY.current = 0;
  };

  const filteredPosts = activeCategory === "All"
    ? posts
    : posts.filter(p => (p.caption || "").toLowerCase().includes(activeCategory.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#FBF8F3]">
        <StatusBar />
        <p className="text-gray-600 font-bold">{userLanguage === 'Marathi' ? 'पुणे क्षण लोड होत आहेत...' : 'Loading Pune Moments...'}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FBF8F3] flex flex-col">
      <Toaster />
      <StatusBar />
      
      {/* Top Navigation Bar */}
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title={t.home || "Home"}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#8B3A2A] text-white hover:bg-opacity-90 transition-all shadow-sm"
            >
              <Home size={18} />
            </button>
          )}
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-1.5">
            <span>{userLanguage === 'Marathi' ? 'पुणे क्षण' : userLanguage === 'Hindi' ? 'पुणे पल' : 'Pune Moments'}</span>
            <Sparkles size={18} className="text-[#8B3A2A]" />
          </h1>
        </div>
        <button
          onClick={onNavigateToCreatePost}
          className="bg-[#8B3A2A] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle size={16} />
          <span>{userLanguage === 'Marathi' ? 'नवीन क्षण' : 'New Moment'}</span>
        </button>
      </div>

      {/* Upload Banner */}
      <div className="bg-gradient-to-r from-[#FAF6F0] to-[#F5EFE6] px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-700">
          {userLanguage === 'Marathi' ? 'तुमचे फोन फोटो शेअर करा 📷' : 'Share moments directly from your phone 📷'}
        </span>
        <button
          onClick={onNavigateToCreatePost}
          className="text-xs font-extrabold text-[#8B3A2A] underline hover:text-opacity-80"
        >
          {userLanguage === 'Marathi' ? 'फोटो निवडा' : 'Pick Photo'}
        </button>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto bg-white border-b border-gray-200 no-scrollbar">
        {CATEGORY_CHIPS.map(chip => (
          <button
            key={chip.id}
            onClick={() => setActiveCategory(chip.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === chip.id
                ? 'bg-[#8B3A2A] text-white border-[#8B3A2A] shadow-sm'
                : 'bg-[#FAF6F0] text-gray-700 border-gray-200 hover:bg-[#F2EAE7]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Feed Container */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto pb-16"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isRefreshing && (
          <div className="flex justify-center py-2 text-gray-500 text-sm font-semibold">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B3A2A] mr-2"></div>
            {sm.refreshing || "Refreshing feed..."}
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-3xl mb-2">✨</p>
            <p className="text-sm font-bold text-gray-700">No moments found in this category.</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to share a moment!</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white shadow-sm rounded-2xl mx-4 my-3 p-4 border border-gray-100 transition-all hover:shadow-md"
              onClick={() => onPostSelect && onPostSelect(post.id)}
            >
              {/* Author Header */}
              <div className="flex items-center mb-3">
                <div className="w-9 h-9 bg-[#F2EAE7] rounded-full mr-2.5 flex items-center justify-center text-sm font-extrabold text-[#8B3A2A] border border-[#DCD5C8]">
                  {post.user?.name ? post.user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <span
                    className="font-extrabold text-sm text-gray-900 hover:underline cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onUserSelect && onUserSelect(post.user?.id); }}
                  >
                    {post.user?.name || "Explorer"}
                  </span>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString(userLanguage === 'Marathi' ? 'mr-IN' : 'en-US', { month: 'short', day: 'numeric' }) : "Just now"}
                  </p>
                </div>

                {currentUserId && post.user?.id !== currentUserId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFollow(post.user?.id); }}
                    className="ml-auto text-xs font-bold text-[#8B3A2A] bg-[#FAF6F0] px-3 py-1 rounded-xl border border-[#EDE8DF] hover:bg-[#F2EAE7]"
                  >
                    {post.isFollowing ? (sm.unfollow || "Following") : (sm.follow || "Follow")}
                  </button>
                )}
              </div>

              {/* Photo View */}
              {post.imageUrl && (
                <div className="relative rounded-xl overflow-hidden mb-3 bg-gray-100 border border-gray-100">
                  <img
                    src={post.imageUrl}
                    alt={post.caption || "Pune Moment"}
                    className="w-full h-56 object-cover rounded-xl transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(post.id);
                    }}
                    onClick={(e) => { e.stopPropagation(); onPostSelect && onPostSelect(post.id); }}
                  />
                </div>
              )}

              {/* Caption */}
              {post.caption && (
                <p className="text-xs text-gray-800 font-medium mb-3 leading-relaxed">
                  {post.caption}
                </p>
              )}

              {/* Action Bar */}
              <div className="flex items-center gap-4 text-gray-600 text-xs mb-3 pt-2 border-t border-gray-100">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleLike(post.id); }}
                  className="flex items-center gap-1.5 font-bold hover:text-rose-600 transition-colors"
                >
                  <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} stroke={post.isLiked ? '#EF4444' : '#6B7280'} />
                  <span>{post.likesCount || 0}</span>
                </button>
                <div className="flex items-center gap-1.5 font-bold text-gray-600">
                  <MessageCircle size={18} />
                  <span>{post.comments ? post.comments.length : 0}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-100 pt-2.5">
                {Array.isArray(post.comments) && post.comments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="text-xs mb-1.5">
                    <span className="font-bold text-gray-900 cursor-pointer" onClick={(e) => { e.stopPropagation(); onUserSelect && comment.user && onUserSelect(comment.user.id); }}>
                      {comment.user?.name || "User"}:
                    </span>{' '}
                    <span className="text-gray-700">{comment.text}</span>
                  </div>
                ))}
                
                <div className="flex mt-2.5">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-1 focus:ring-[#8B3A2A] text-xs bg-[#FBF8F3]"
                    placeholder={sm.addCommentPlaceholder || "Add a comment..."}
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddComment(post.id); }}
                    className="bg-[#8B3A2A] text-white px-3.5 rounded-r-xl flex items-center justify-center hover:bg-opacity-90"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={lastPostElementRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="flex items-center text-gray-500 text-xs font-bold">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B3A2A] mr-2"></div>
              {sm.loading || "Loading more moments..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialMediaScreen;