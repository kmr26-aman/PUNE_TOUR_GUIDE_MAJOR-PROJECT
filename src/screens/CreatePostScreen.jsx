import { useState, useRef } from 'react';
import { ArrowLeft, PlusCircle, Image as ImageIcon, X, UploadCloud, CheckCircle } from 'lucide-react';
import { createPost, uploadImage } from '../data/api';
import { translations } from '../data/translations';
import StatusBar from '../components/StatusBar';
import toast, { Toaster } from 'react-hot-toast';

const CreatePostScreen = ({ onPostCreated, onBack, userLanguage }) => {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const t = translations[userLanguage] || translations.English;
  const sm = t.socialMedia || translations.English.socialMedia || {};

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 900;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePost = async () => {
    if (!caption.trim() && !imageFile && !imagePreview) {
      toast.error(sm.emptyPostError || 'Write something or pick a photo before posting.');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = imagePreview;

    try {
      if (imageFile) {
        try {
          finalImageUrl = await compressImage(imageFile);
        } catch (e) {
          finalImageUrl = imagePreview;
        }
      }

      await createPost(caption, finalImageUrl);
      toast.success(sm.postSuccess || 'Photo posted permanently to Moments feed!');
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.message || sm.postError || 'Could not post photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#FBF8F3] flex flex-col overflow-y-auto">
      <Toaster />
      <StatusBar />
      
      {/* Header Bar */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-extrabold text-gray-900">
            {userLanguage === 'Marathi' ? 'नवीन फोटो पोस्ट करा' : userLanguage === 'Hindi' ? 'नई फ़ोटो पोस्ट करें' : 'Post Device Photo'}
          </h1>
        </div>

        <button
          onClick={handleCreatePost}
          disabled={isUploading || (!caption.trim() && !imageFile && !imagePreview)}
          className="px-4 py-2 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <PlusCircle size={16} />
          )}
          <span>{isUploading ? 'Posting...' : (sm.postButton || 'Share Post')}</span>
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Caption Input Box */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          <textarea
            className="w-full p-2 text-sm text-gray-800 outline-none resize-none bg-transparent"
            placeholder={sm.newPostPlaceholder || "Share your Pune experience, food, or heritage moment..."}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows="3"
          ></textarea>
        </div>

        {/* Device Photo Upload Area */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
            {userLanguage === 'Marathi' ? 'तुमच्या डिव्हाइसवरून फोटो निवडा' : 'Select Photo from your Device'}
          </label>

          <input
            ref={fileInputRef}
            id="device-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="border-2 border-dashed border-[#DCD5C8] hover:border-[#8B3A2A] bg-[#FAF6F0] hover:bg-[#F5EFE6] rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-[#F2EAE7] flex items-center justify-center text-[#8B3A2A] group-hover:scale-110 transition-transform">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800">
                  {userLanguage === 'Marathi' ? 'फोटो अपलोड करण्यासाठी येथे क्लिक करा' : 'Click to Upload Photo'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP or GIF format</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
              <img
                src={imagePreview}
                alt="Selected device photo"
                className="w-full h-56 object-cover rounded-2xl"
              />
              
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={handleRemoveImage}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                  title="Remove photo"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-bold flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="truncate max-w-[200px]">{imageFile?.name || 'Photo Ready'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostScreen;