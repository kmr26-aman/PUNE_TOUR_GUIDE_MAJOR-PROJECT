import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, MessageCircle, Send, PlusCircle, Home, Sparkles, Filter, Share2, 
  MoreVertical, Bookmark, Trash2, Edit3, Archive, Check, X, ShieldAlert, CornerDownRight 
} from 'lucide-react';
import { 
  getSocialFeed, addCommentToPost, togglePostLike, toggleFollowUser,
  deletePostApi, updatePostCaptionApi, deleteCommentApi, updateCommentApi 
} from '../data/api';
import { translations } from '../data/translations';
import StatusBar from '../components/StatusBar';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORY_CHIPS = [
  { id: "All", label: "All ✨" },
  { id: "Saved", label: "Favorites ⭐" },
  { id: "MyPosts", label: "My Posts 👤" },
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
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem("pune_user_name") || "Explorer");
  const [activeCategory, setActiveCategory] = useState("All");

  // Options & Editing State
  const [activeOptionsPostId, setActiveOptionsPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingCaptionText, setEditingCaptionText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Favorites & Archive State stored locally & synced
  const [savedPostIds, setSavedPostIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pune_saved_posts") || "[]");
    } catch {
      return [];
    }
  });

  const [archivedPostIds, setArchivedPostIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pune_archived_posts") || "[]");
    } catch {
      return [];
    }
  });

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
    const name = localStorage.getItem("pune_user_name");
    if (name) setCurrentUserName(name);

    fetchPosts(1);
  }, [fetchPosts]);

  // Persist Saved & Archive lists
  useEffect(() => {
    localStorage.setItem("pune_saved_posts", JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    localStorage.setItem("pune_archived_posts", JSON.stringify(archivedPostIds));
  }, [archivedPostIds]);

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

  const handleToggleSavePost = (postId) => {
    if (savedPostIds.includes(postId)) {
      setSavedPostIds(prev => prev.filter(id => id !== postId));
      toast("Removed from Favorites ⭐", { icon: "🗑️" });
    } else {
      setSavedPostIds(prev => [...prev, postId]);
      toast.success("Saved to Favorites ⭐!");
    }
  };

  const handleToggleArchivePost = (postId) => {
    if (archivedPostIds.includes(postId)) {
      setArchivedPostIds(prev => prev.filter(id => id !== postId));
      toast.success("Post un-archived & restored to public feed!");
    } else {
      setArchivedPostIds(prev => [...prev, postId]);
      toast.success("Post archived! Hidden from main feed.");
    }
    setActiveOptionsPostId(null);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this moment permanently?")) return;

    const originalPosts = [...posts];
    setPosts(prev => prev.filter(p => p.id !== postId));
    setActiveOptionsPostId(null);

    try {
      await deletePostApi(postId);
      toast.success("Moment deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete moment.");
      setPosts(originalPosts);
    }
  };

  const handleStartEditCaption = (post) => {
    setEditingPostId(post.id);
    setEditingCaptionText(post.caption || "");
    setActiveOptionsPostId(null);
  };

  const handleSaveEditedCaption = async (postId) => {
    if (!editingCaptionText.trim()) {
      toast.error("Caption cannot be empty!");
      return;
    }
    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: editingCaptionText } : p));
    setEditingPostId(null);

    try {
      await updatePostCaptionApi(postId, editingCaptionText);
      toast.success("Caption updated!");
    } catch (error) {
      console.error("Error updating caption:", error);
      toast.error("Failed to update caption.");
      setPosts(originalPosts);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text || text.trim() === '') return;

    const originalPosts = [...posts];
    const tempCommentId = Date.now();
    const userName = currentUserName;

    const newPosts = posts.map(p => {
      if (p.id === postId) {
        const newComment = { id: tempCommentId, text, user: { id: currentUserId, name: userName } };
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

  const handleDeleteComment = async (postId, commentId) => {
    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: (p.comments || []).filter(c => c.id !== commentId) };
      }
      return p;
    }));

    try {
      await deleteCommentApi(commentId);
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment.");
      setPosts(originalPosts);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleSaveEditedComment = async (postId, commentId) => {
    if (!editingCommentText.trim()) return;

    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: (p.comments || []).map(c => c.id === commentId ? { ...c, text: editingCommentText } : c)
        };
      }
      return p;
    }));
    setEditingCommentId(null);

    try {
      await updateCommentApi(commentId, editingCommentText);
      toast.success("Comment updated!");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment.");
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

  // Filter Posts Logic
  const unarchivedPosts = posts.filter(p => !archivedPostIds.includes(p.id));

  const filteredPosts = activeCategory === "Saved"
    ? unarchivedPosts.filter(p => savedPostIds.includes(p.id))
    : activeCategory === "MyPosts"
    ? unarchivedPosts.filter(p => p.user?.id === currentUserId || p.author?.id === currentUserId || p.user?.name === currentUserName)
    : activeCategory === "All"
    ? unarchivedPosts
    : unarchivedPosts.filter(p => (p.caption || "").toLowerCase().includes(activeCategory.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#FBF8F3]">
        <StatusBar />
        <p className="text-gray-600 font-bold">{userLanguage === 'Marathi' ? 'पुणे क्षण लोड होत आहेत...' : 'Loading Pune Moments...'}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-0 bg-[#FBF8F3] flex flex-col overflow-y-auto pb-28 transition-colors duration-200" style={{ height: "100%", overflowY: "auto" }}>
      <Toaster />
      <StatusBar />
      
      {/* Top Navigation Bar */}
      <div className="p-3.5 border-b border-gray-200 bg-white flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title={t.home || "Home"}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#8B3A2A] text-white hover:bg-opacity-90 transition-all shadow-xs"
            >
              <Home size={16} />
            </button>
          )}
          <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-1.5">
            <span>{userLanguage === 'Marathi' ? 'पुणे क्षण' : userLanguage === 'Hindi' ? 'पुणे पल' : 'Pune Moments'}</span>
            <Sparkles size={16} className="text-[#8B3A2A]" />
          </h1>
        </div>

        {/* Compact & Small New Moment Button */}
        <button
          onClick={onNavigateToCreatePost}
          className="bg-[#8B3A2A] hover:bg-[#742E20] text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 active:scale-95 flex-shrink-0"
          title={userLanguage === 'Marathi' ? 'नवीन क्षण' : 'New Moment'}
        >
          <PlusCircle size={13} />
          <span className="whitespace-nowrap">{userLanguage === 'Marathi' ? 'नवीन' : 'New Moment'}</span>
        </button>
      </div>

      {/* Upload Banner with Logged-in User Badge */}
      <div className="bg-gradient-to-r from-[#FAF6F0] to-[#F5EFE6] px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-xs font-black text-[#8B3A2A] bg-[#8B3A2A]/10 px-2 py-0.5 rounded-lg truncate">
            {currentUserName}
          </span>
          <span className="text-xs font-bold text-gray-700 truncate">
            · {userLanguage === 'Marathi' ? 'फोटो पोस्ट करा 📷' : 'Share moments 📷'}
          </span>
        </div>
        <button
          onClick={onNavigateToCreatePost}
          className="text-xs font-extrabold text-[#8B3A2A] underline hover:text-opacity-80 flex-shrink-0"
        >
          {userLanguage === 'Marathi' ? 'फोटो निवडा' : 'Pick Photo'}
        </button>
      </div>

      {/* Category & Filter Chips Bar */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-white border-b border-gray-200 no-scrollbar shadow-xs">
        {CATEGORY_CHIPS.map(chip => (
          <button
            key={chip.id}
            onClick={() => setActiveCategory(chip.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === chip.id
                ? 'bg-[#8B3A2A] text-white border-[#8B3A2A] shadow-xs'
                : 'bg-[#FAF6F0] text-gray-700 border-gray-200 hover:bg-[#F2EAE7]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main Feed Container (unified scroll with whole page) */}
      <div
        ref={feedRef}
        className="w-full pb-16"
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
            <p className="text-sm font-bold text-gray-700">No moments found in this filter.</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to share a moment or try another category!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const authorName = post.author?.name || post.user?.name || "Explorer";
            const authorId = post.author?.id || post.user?.id;
            const isMyPost = authorId === currentUserId || authorName === currentUserName;
            const isSaved = savedPostIds.includes(post.id);
            const isArchived = archivedPostIds.includes(post.id);

            return (
              <div
                key={post.id}
                className="bg-white shadow-sm rounded-2xl mx-4 my-3 p-4 border border-gray-100 transition-all hover:shadow-md relative"
              >
                {/* Author Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onUserSelect && authorId && onUserSelect(authorId)}>
                    <div className="w-9 h-9 bg-gradient-to-tr from-[#8B3A2A] to-amber-600 text-white rounded-full flex items-center justify-center text-sm font-black border border-[#DCD5C8] shadow-xs">
                      {authorName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-gray-900 hover:underline">
                          {authorName}
                        </span>
                        {isMyPost && (
                          <span className="text-[9px] font-black bg-amber-500/10 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString(userLanguage === 'Marathi' ? 'mr-IN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isMyPost && currentUserId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFollow(authorId); }}
                        className="text-xs font-bold text-[#8B3A2A] bg-[#FAF6F0] px-3 py-1 rounded-xl border border-[#EDE8DF] hover:bg-[#F2EAE7]"
                      >
                        {post.isFollowing ? (sm.unfollow || "Following") : (sm.follow || "Follow")}
                      </button>
                    )}

                    {/* 3-Dots Post Action Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOptionsPostId(activeOptionsPostId === post.id ? null : post.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        title="Options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Options */}
                      {activeOptionsPostId === post.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-100">
                          <button
                            onClick={() => handleToggleSavePost(post.id)}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-[#FAF6F0] flex items-center gap-2"
                          >
                            <Bookmark size={15} className={isSaved ? "text-amber-500 fill-amber-500" : "text-gray-500"} />
                            <span>{isSaved ? "Remove Favorite" : "Save as Favorite"}</span>
                          </button>

                          {isMyPost && (
                            <>
                              <button
                                onClick={() => handleStartEditCaption(post)}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-[#FAF6F0] flex items-center gap-2 border-t border-gray-100"
                              >
                                <Edit3 size={15} className="text-blue-600" />
                                <span>Edit Caption</span>
                              </button>

                              <button
                                onClick={() => handleToggleArchivePost(post.id)}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-[#FAF6F0] flex items-center gap-2"
                              >
                                <Archive size={15} className="text-purple-600" />
                                <span>{isArchived ? "Un-Archive Post" : "Archive Post"}</span>
                              </button>

                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-100"
                              >
                                <Trash2 size={15} />
                                <span>Delete Post</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo View with Double Tap Like */}
                {post.imageUrl && (
                  <div className="relative rounded-xl overflow-hidden mb-3 bg-gray-100 border border-gray-100 group">
                    <img
                      src={post.imageUrl}
                      alt={post.caption || "Pune Moment"}
                      className="w-full h-64 object-cover rounded-xl transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(post.id);
                      }}
                      onClick={() => onPostSelect && onPostSelect(post.id)}
                    />
                  </div>
                )}

                {/* Inline Caption Editor OR Caption Text */}
                {editingPostId === post.id ? (
                  <div className="mb-3 bg-[#FAF6F0] p-2.5 rounded-xl border border-amber-200 space-y-2">
                    <textarea
                      rows={2}
                      className="w-full p-2 text-xs border rounded-lg outline-none bg-white text-gray-900"
                      value={editingCaptionText}
                      onChange={(e) => setEditingCaptionText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingPostId(null)}
                        className="px-2.5 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEditedCaption(post.id)}
                        className="px-2.5 py-1 text-xs font-bold bg-[#8B3A2A] text-white rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  post.caption && (
                    <p className="text-xs text-gray-800 font-medium mb-3 leading-relaxed">
                      {post.caption}
                    </p>
                  )
                )}

                {/* Action Bar (Like Counter, Comment Counter, Favorite & Share) */}
                <div className="flex items-center gap-5 text-gray-600 text-xs mb-3 pt-2.5 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleLike(post.id); }}
                    className="flex items-center gap-1.5 font-extrabold hover:text-rose-600 transition-colors"
                  >
                    <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} stroke={post.isLiked ? '#EF4444' : '#6B7280'} />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  <div className="flex items-center gap-1.5 font-extrabold text-gray-700">
                    <MessageCircle size={18} />
                    <span>{post.comments ? post.comments.length : 0}</span>
                  </div>

                  <button
                    onClick={() => handleToggleSavePost(post.id)}
                    className="flex items-center gap-1 font-bold hover:text-amber-600 transition-colors ml-auto"
                    title="Bookmark / Favorite"
                  >
                    <Bookmark size={18} fill={isSaved ? '#F59E0B' : 'none'} stroke={isSaved ? '#F59E0B' : '#6B7280'} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({
                          title: "Pune Moment",
                          text: post.caption || "Check out this Pune moment!",
                          url: window.location.href,
                        }).catch(console.error);
                      } else {
                        toast.success("Moment link copied!");
                      }
                    }}
                    className="flex items-center gap-1.5 font-bold text-gray-600 hover:text-[#8B3A2A] transition-colors"
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Section with Edit & Delete Comment Options */}
                <div className="border-t border-gray-100 pt-2.5 space-y-2">
                  {Array.isArray(post.comments) && post.comments.map((comment) => {
                    const cAuthorName = comment.user?.name || "User";
                    const cAuthorId = comment.user?.id;
                    const canManageComment = cAuthorId === currentUserId || cAuthorName === currentUserName || isMyPost;

                    return (
                      <div key={comment.id} className="text-xs bg-[#FAF6F0]/60 p-2 rounded-xl border border-gray-100 flex justify-between items-start group">
                        {editingCommentId === comment.id ? (
                          <div className="flex-1 space-y-1.5 mr-2">
                            <input
                              type="text"
                              className="w-full p-1.5 text-xs border rounded-lg outline-none bg-white"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                            />
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setEditingCommentId(null)} className="px-2 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-md">Cancel</button>
                              <button onClick={() => handleSaveEditedComment(post.id, comment.id)} className="px-2 py-0.5 text-[10px] font-bold bg-[#8B3A2A] text-white rounded-md">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <span className="font-extrabold text-gray-900 cursor-pointer hover:underline" onClick={() => onUserSelect && cAuthorId && onUserSelect(cAuthorId)}>
                              {cAuthorName}:
                            </span>{' '}
                            <span className="text-gray-700 leading-normal">{comment.text}</span>
                          </div>
                        )}

                        {canManageComment && editingCommentId !== comment.id && (
                          <div className="flex items-center gap-1 ml-2 opacity-80 group-hover:opacity-100">
                            {cAuthorId === currentUserId && (
                              <button
                                onClick={() => handleStartEditComment(comment)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded-md"
                                title="Edit Comment"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(post.id, comment.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-md"
                              title="Delete Comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Add Comment Input Form */}
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
            );
          })
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