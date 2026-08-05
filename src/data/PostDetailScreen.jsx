import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react';
import { fetchPostById, togglePostLike, addCommentToPost } from '../data/api';
import { translations } from '../data/translations';
import StatusBar from '../components/StatusBar';
import toast, { Toaster } from 'react-hot-toast';

const PostDetailScreen = ({ postId, onBack, userLanguage, onUserSelect }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const t = translations[userLanguage] || translations.English;

  const fetchPost = async () => {
    setLoading(true);
    try {
      const data = await fetchPostById(postId);
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error(t.socialMedia.fetchError);
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
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleToggleLike = async () => {
    if (!post) return;
    const originalPost = { ...post };
    setPost(prev => ({ ...prev, isLiked: !prev.isLiked, likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1 }));

    try {
      await togglePostLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t.socialMedia.likeError);
      setPost(originalPost);
    }
  };

  const handleAddComment = async () => {
    if (!commentText) return;
    if (!post) return;

    const originalPost = { ...post };
    const tempCommentId = Date.now();
    const userName = localStorage.getItem("pune_user_name") || "You";

    setPost(prev => ({
      ...prev,
      comments: [...prev.comments, { id: tempCommentId, text: commentText, user: { name: userName } }]
    }));
    setCommentText('');

    try {
      await addCommentToPost(postId, commentText);
      fetchPost(); // Re-fetch to get actual comment ID and timestamp
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t.socialMedia.commentError);
      setPost(originalPost);
    }
  };

  if (loading || !post) {
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
        <h1 className="text-xl font-bold text-gray-800">{t.socialMedia.postDetailTitle}</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-16">
        <div className="bg-white shadow-sm rounded-lg mx-4 my-3 p-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full mr-2 flex items-center justify-center text-sm font-bold text-gray-600">
              {post.user.name ? post.user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="font-semibold text-gray-800 cursor-pointer" onClick={() => onUserSelect && onUserSelect(post.user.id)}>{post.user.name}</span>
            <span className="text-gray-500 text-xs ml-auto">
              {new Date(post.createdAt).toLocaleDateString(userLanguage === 'Marathi' ? 'mr-IN' : 'en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {post.imageUrl && (
            <img src={post.imageUrl} alt={post.caption} className="w-full h-64 object-cover rounded-lg mb-3" />
          )}
          {post.caption && <p className="text-gray-700 mb-3">{post.caption}</p>}

          <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
            <button onClick={handleToggleLike} className="flex items-center gap-1">
              <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} stroke={post.isLiked ? '#EF4444' : '#6B7280'} />
              <span>{post.likesCount} {t.socialMedia.likes}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageCircle size={18} />
              <span>{post.comments.length} {t.socialMedia.comments}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="text-sm mb-2">
                <span className="font-semibold text-gray-800 cursor-pointer" onClick={() => onUserSelect && onUserSelect(comment.user.id)}>{comment.user.name}:</span>{' '}
                <span className="text-gray-700">{comment.text}</span>
              </div>
            ))}
            <div className="flex mt-3">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#8B3A2A] text-sm"
                placeholder={t.socialMedia.addCommentPlaceholder}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                onClick={handleAddComment}
                className="bg-[#8B3A2A] text-white px-4 rounded-r-lg flex items-center justify-center hover:bg-opacity-90"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailScreen;