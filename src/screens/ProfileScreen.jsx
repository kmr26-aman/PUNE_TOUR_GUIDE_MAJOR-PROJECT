import { useState, useEffect, useRef } from "react";
import { useUserLocation } from "../hooks/useUserLocation";
import { fetchUserStats, fetchUserMe, updateUserProfileApi } from "../data/api.js";
import { translations } from "../data/translations";
import StatusBar from "../components/StatusBar";
import { 
  Home, Edit, Heart, CheckCircle, Award, LogOut, User, Mail, ShieldCheck, 
  Globe, Bell, HardDrive, HelpCircle, FileText, Sparkles, ChevronRight, X, 
  Moon, Sun, QrCode, Share2, MapPin, Bookmark, Camera, Video, Compass, 
  Wallet, Ticket, Users, Lock, AlertTriangle, Trash2, Star, BookOpen, Film,
  ShieldAlert, Activity, Plus, Eye, EyeOff, Bot, RefreshCw, UploadCloud
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const BADGES_LIST = [
  { id: 1, title: "Shaniwar Wada Veteran", category: "Heritage 🚩", icon: "🚩", color: "bg-amber-100 text-amber-800 border-amber-300", xp: 150, unlocked: true, desc: "Explored 5+ iconic historical forts and wadas in Pune." },
  { id: 2, title: "FC Road Foodie", category: "Culinary ☕", icon: "☕", color: "bg-orange-100 text-orange-800 border-orange-300", xp: 100, unlocked: true, desc: "Discovered legendary Misal, Amrittulya, and street delicacies." },
  { id: 3, title: "Sinhagad Trekker", category: "Nature 🌿", icon: "🌿", color: "bg-emerald-100 text-emerald-800 border-emerald-300", xp: 120, unlocked: true, desc: "Conquered scenic fort trails and nature spots around Pune." },
  { id: 4, title: "Pune Storyteller", category: "Community 📷", icon: "📷", color: "bg-purple-100 text-purple-800 border-purple-300", xp: 90, unlocked: true, desc: "Shared memorable moments and photos with the Pune community." },
  { id: 5, title: "Master Navigator", category: "Itinerary 🧭", icon: "🧭", color: "bg-blue-100 text-blue-800 border-blue-300", xp: 200, unlocked: false, progress: "2/3 Itineraries", desc: "Completed 3 full custom travel itineraries in Pune." },
  { id: 6, title: "Pride of Pune", category: "Legend 🏆", icon: "🏆", color: "bg-rose-100 text-rose-800 border-rose-300", xp: 500, unlocked: true, desc: "Reached Punekar Level 3+ and earned 500 total XP points!" },
];

const PRESET_BANNERS = [
  { id: "b1", title: "Shaniwar Wada Heritage", url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80" },
  { id: "b2", title: "Sinhagad Monsoon Trail", url: "https://images.unsplash.com/photo-1626014903708-ecb661d9a26a?auto=format&fit=crop&w=800&q=80" },
  { id: "b3", title: "FC Road Night Glow", url: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80" },
  { id: "b4", title: "Vetal Tekdi Sunset", url: "https://images.unsplash.com/photo-1511497584788-876761c119ef?auto=format&fit=crop&w=800&q=80" },
];

const DEFAULT_STORIES = [
  { id: 1, title: "Shaniwar Wada", icon: "🚩", cover: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=200&q=80" },
  { id: 2, title: "FC Road Eats", icon: "☕", cover: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=200&q=80" },
  { id: 3, title: "Sinhagad Trek", icon: "⛰️", cover: "https://images.unsplash.com/photo-1626014903708-ecb661d9a26a?auto=format&fit=crop&w=200&q=80" },
  { id: 4, title: "Ganpati Utsav", icon: "🌺", cover: "https://images.unsplash.com/photo-1662446736466-9b57d079942a?auto=format&fit=crop&w=200&q=80" },
];

export default function ProfileScreen({ onPlaceSelect, userLocation, userLanguage, setUserLanguage, onLogout, onNavigateHome, isDarkMode, setIsDarkMode }) {
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  
  // Privacy Control: Hide / Mask Email
  const [showEmail, setShowEmail] = useState(false);

  // Active Profile Sub-Tab
  const [activeMenuTab, setActiveMenuTab] = useState("stats"); // 'stats', 'media', 'wallet', 'settings'

  // Dynamic User Profile Identity State
  const [userName, setUserName] = useState(() => localStorage.getItem("pune_user_name") || "Sourav Paul");
  const [userHandle, setUserHandle] = useState(() => localStorage.getItem("pune_user_handle") || "@punekar_explorer");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("pune_user_email") || "explorer@punetourguide.com");
  const [userBio, setUserBio] = useState(() => localStorage.getItem("pune_user_bio") || "Exploring the cultural pride & heritage of Pune 🚩");
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("pune_user_avatar") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
  const [coverPhoto, setCoverPhoto] = useState(() => localStorage.getItem("pune_cover_photo") || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80");

  // Dynamic Stories State
  const [stories, setStories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pune_user_stories")) || DEFAULT_STORIES;
    } catch {
      return DEFAULT_STORIES;
    }
  });

  // New Story Form State
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryIcon, setNewStoryIcon] = useState("🚩");
  const [newStoryCover, setNewStoryCover] = useState("");

  // AI Daily Summary State
  const [aiSummaryDate, setAiSummaryDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const [aiSummaryTip, setAiSummaryTip] = useState("Punekar AI Insight: Start your morning early at Shaniwar Wada before 10 AM to beat the crowd, then head to Vaishali on FC Road for authentic SPDP and Filter Coffee!");

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const storyInputRef = useRef(null);

  const compressImage = (file, maxDim = 800) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
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
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    try {
      const compressed = await compressImage(file, 400);
      setUserAvatar(compressed);
      localStorage.setItem("pune_user_avatar", compressed);
      updateUserProfileApi({ avatarUrl: compressed }).catch(err => console.warn("Avatar sync error:", err));
      toast.success("Profile photo updated & synced! 📷");
    } catch (err) {
      toast.error("Failed to process image.");
    }
  };

  const handleCoverFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    try {
      const compressed = await compressImage(file, 1000);
      setCoverPhoto(compressed);
      localStorage.setItem("pune_cover_photo", compressed);
      updateUserProfileApi({ coverUrl: compressed }).catch(err => console.warn("Cover banner sync error:", err));
      toast.success("Cover banner updated & synced! 🖼️");
    } catch (err) {
      toast.error("Failed to process image.");
    }
  };

  const handleStoryCoverFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    try {
      const compressed = await compressImage(file, 500);
      setNewStoryCover(compressed);
      toast.success("Highlight cover photo selected! 🌟");
    } catch (err) {
      toast.error("Failed to process image.");
    }
  };

  const t = translations[userLanguage] || translations.English;

  // Mask Email Helper
  const maskEmail = (emailStr) => {
    if (!emailStr || !emailStr.includes("@")) return "••••••••@hidden.com";
    const [namePart, domainPart] = emailStr.split("@");
    if (namePart.length <= 2) return `••@${domainPart}`;
    return `${namePart[0]}••••${namePart[namePart.length - 1]}@${domainPart}`;
  };

  const user = {
    name: userName,
    handle: userHandle,
    email: userEmail,
    bio: userBio,
    avatar: userAvatar,
    cover: coverPhoto,
    xp: userStats?.totalPoints || 620,
    level: Math.floor((userStats?.totalPoints || 620) / 100) + 1,
  };

  useEffect(() => {
    localStorage.setItem("pune_user_stories", JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem("pune_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoadingStats(true);
      try {
        const [stats, me] = await Promise.allSettled([fetchUserStats(), fetchUserMe()]);
        if (stats.status === "fulfilled") setUserStats(stats.value);
        if (me.status === "fulfilled" && me.value) {
          if (me.value.name) setUserName(me.value.name);
          if (me.value.email) setUserEmail(me.value.email);
          if (me.value.avatarUrl) setUserAvatar(me.value.avatarUrl);
          if (me.value.coverUrl) setCoverPhoto(me.value.coverUrl);
          if (me.value.bio) setUserBio(me.value.bio);
          if (me.value.handle) setUserHandle(me.value.handle);
          if (me.value.stories) setStories(me.value.stories);
        }
      } catch (error) {
        console.error("Failed to fetch profile details:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadProfileData();
  }, []);

  const handleSaveProfile = async () => {
    localStorage.setItem("pune_user_name", userName);
    localStorage.setItem("pune_user_handle", userHandle);
    localStorage.setItem("pune_user_bio", userBio);
    localStorage.setItem("pune_user_avatar", userAvatar);
    localStorage.setItem("pune_cover_photo", coverPhoto);

    try {
      await updateUserProfileApi({
        name: userName,
        handle: userHandle,
        bio: userBio,
        avatarUrl: userAvatar,
        coverUrl: coverPhoto,
        stories: stories,
      });
    } catch (e) {
      console.warn("Backend profile sync warning:", e);
    }

    setShowEditProfileModal(false);
    toast.success("Profile updated successfully!");
  };

  const handleAddStory = (e) => {
    e.preventDefault();
    if (!newStoryTitle.trim()) {
      toast.error("Please enter a highlight title!");
      return;
    }

    const storyObj = {
      id: Date.now(),
      title: newStoryTitle.trim(),
      icon: newStoryIcon || "🚩",
      cover: newStoryCover.trim() || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=200&q=80",
    };

    const updatedStories = [storyObj, ...stories];
    setStories(updatedStories);
    updateUserProfileApi({ stories: updatedStories }).catch(err => console.warn("Story sync error:", err));
    setNewStoryTitle("");
    setNewStoryCover("");
    setShowAddStoryModal(false);
    toast.success("Highlight story added! ✨");
  };

  const handleDeleteStory = (storyId) => {
    const updatedStories = stories.filter(s => s.id !== storyId);
    setStories(updatedStories);
    updateUserProfileApi({ stories: updatedStories }).catch(err => console.warn("Story sync error:", err));
    setActiveStory(null);
    toast.success("Highlight story deleted.");
  };

  const handleRegenerateAiSummary = () => {
    const TIPS = [
      "Punekar AI Daily Recommendation: Early morning trek to Sinhagad Fort for famous Kanda Bhajji & Pithla Bhakri!",
      "Culture Tip: Visit Dagdusheth Halwai Ganpati Temple in afternoon for serene darshan & historic Tulshibaug shopping.",
      "Foodie Pick: Try authentic Punekar Misal at Kata Kirr or Bedekar Misal followed by Mastani at Sujata Cold Storage!",
      "Nature Escape: Peaceful evening walk along Vetal Tekdi sunset point to enjoy clean breeze and scenic city view."
    ];
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setAiSummaryTip(randomTip);
    toast.success("AI Daily Summary Regenerated! 🤖✨");
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.name} on Pune Explorer`,
        text: `Check out ${user.name}'s travel profile on Pune Explorer!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      toast.success("Profile link copied to clipboard!");
    }
  };

  const bgMain = isDarkMode ? "bg-[#181311] text-[#FAF6F0]" : "bg-[#FBF8F3] text-[#1C1412]";
  const bgCard = isDarkMode ? "bg-[#241E1C] border-[#362D2A]" : "bg-white border-gray-200";
  const textTitle = isDarkMode ? "text-white" : "text-gray-900";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`h-full w-full min-h-0 ${bgMain} flex flex-col overflow-y-auto pb-28 transition-colors duration-200`} style={{ height: "100%", overflowY: "auto" }}>
      <Toaster />
      <StatusBar light={isDarkMode} />

      {/* Hidden File Inputs for Local Photo Selection */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverFileSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={storyInputRef}
        onChange={handleStoryCoverFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className={`p-4 border-b ${bgCard} flex justify-between items-center sticky top-0 z-20 shadow-sm backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title={t.home || "Home"}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#8B3A2A] text-white hover:bg-opacity-90 transition-all shadow-sm"
            >
              <Home size={18} />
            </button>
          )}
          <h1 className={`text-lg font-black ${textTitle}`}>{userLanguage === "Marathi" ? "माझी प्रोफाईल" : "My Profile"}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* QR Code Profile */}
          <button
            onClick={() => setShowQrModal(true)}
            title="QR Code"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EDE8DF] text-[#8B3A2A] hover:bg-[#E5DFD3] transition-all border border-[#DCD5C8]"
          >
            <QrCode size={18} />
          </button>

          {/* Edit Profile */}
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B3A2A] text-white hover:bg-opacity-90 text-xs font-bold transition-all shadow-sm"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Profile Cover Photo & Identity Card */}
      <div className="relative">
        {/* Custom Cover Photo Banner */}
        <div
          className="h-36 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${user.cover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={() => coverInputRef.current?.click()}
              className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl backdrop-blur-md transition-all text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-sm"
              title="Change Cover Banner Photo from Local Device"
            >
              <Camera size={14} />
              <span>Change Cover</span>
            </button>
            <button
              onClick={handleShareProfile}
              className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl backdrop-blur-md transition-all text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-sm"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Profile Avatar & Info Overlay */}
        <div className={`px-4 pb-4 pt-0 border-b ${bgCard} relative`}>
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Click to select profile photo from device"
            >
              <img
                src={user.avatar}
                alt="User Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#241E1C] shadow-lg group-hover:opacity-90 transition-opacity"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                }}
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-[#8B3A2A] hover:bg-[#742E20] text-white p-1.5 rounded-full border-2 border-white dark:border-[#241E1C] shadow-md transition-transform group-hover:scale-110"
                title="Change Avatar Photo"
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Level Badge */}
            <div className="bg-gradient-to-r from-[#8B3A2A] to-[#C46348] text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1">
              <Award size={14} />
              <span>Level {user.level} Punekar</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className={`text-xl font-black ${textTitle}`}>{user.name}</h2>
              <ShieldCheck size={18} className="text-[#8B3A2A]" title="Verified Explorer" />
            </div>

            {/* Masked / Protected Email for Privacy */}
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <span>{user.handle}</span>
                <span>·</span>
                <span>{showEmail ? user.email : maskEmail(user.email)}</span>
              </p>
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={showEmail ? "Hide Email" : "Show Email"}
              >
                {showEmail ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>

            <p className="text-xs text-[#8B3A2A] dark:text-amber-400 font-bold mt-1.5">
              {user.bio}
            </p>
          </div>

          {/* Social Dynamic Stats Row: Followers, Following & Posts */}
          <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} grid grid-cols-3 gap-2 text-center`}>
            <div>
              <p className={`text-lg font-black ${textTitle}`}>{userStats?.followerCount || 142}</p>
              <p className={`text-[11px] font-bold ${textMuted}`}>Followers</p>
            </div>
            <div>
              <p className={`text-lg font-black ${textTitle}`}>{userStats?.followingCount || 86}</p>
              <p className={`text-[11px] font-bold ${textMuted}`}>Following</p>
            </div>
            <div>
              <p className={`text-lg font-black ${textTitle}`}>{userStats?.discoveredCount || 24}</p>
              <p className={`text-[11px] font-bold ${textMuted}`}>Explored</p>
            </div>
          </div>

          {/* Dynamic Stories & Highlights Carousel */}
          <div className="mt-4 pt-3 border-t border-gray-100/10">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>Stories & Highlights</p>
              <button
                onClick={() => setShowAddStoryModal(true)}
                className="text-xs font-bold text-[#8B3A2A] flex items-center gap-0.5 hover:underline"
              >
                <Plus size={14} />
                <span>Add Highlight</span>
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {/* Add Story Button */}
              <div
                onClick={() => setShowAddStoryModal(true)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              >
                <div className="w-13 h-13 rounded-full border-2 border-dashed border-[#8B3A2A] flex items-center justify-center bg-[#8B3A2A]/5 text-[#8B3A2A] group-hover:bg-[#8B3A2A]/10 transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-500 mt-1">New</span>
              </div>

              {/* Dynamic Highlights List */}
              {stories.map(story => (
                <div
                  key={story.id}
                  onClick={() => setActiveStory(story)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group relative"
                >
                  <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#8B3A2A] to-amber-400 group-hover:scale-105 transition-transform">
                    <img src={story.cover} alt={story.title} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-[#241E1C]" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mt-1 max-w-[56px] truncate">{story.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Menu Sub-Tabs */}
      <div className={`flex border-b ${bgCard} sticky top-[57px] z-10 shadow-xs`}>
        <button
          onClick={() => setActiveMenuTab("stats")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all ${
            activeMenuTab === "stats" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Award size={15} />
          <span>Stats & AI Summary</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("media")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all ${
            activeMenuTab === "media" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Camera size={15} />
          <span>Media & Saved</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("wallet")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all ${
            activeMenuTab === "wallet" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Wallet size={15} />
          <span>Wallet & Passes</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("settings")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all ${
            activeMenuTab === "settings" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Globe size={15} />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Content 1: Dynamic AI Daily Summary, Stats & Badges */}
      {activeMenuTab === "stats" && (
        <div className="p-4 space-y-4">
          {/* Enhanced Interactive AI Daily Summary & Diary */}
          <div className="bg-gradient-to-br from-[#8B3A2A] via-[#742E20] to-[#5C2317] text-white p-4 rounded-2xl shadow-md border border-[#9A4231] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center font-black">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Daily Punekar AI Summary</h3>
                  <p className="text-[10px] text-amber-200 font-bold">{aiSummaryDate}</p>
                </div>
              </div>

              <button
                onClick={handleRegenerateAiSummary}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-amber-300 hover:text-white transition-all"
                title="Regenerate Summary"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <p className="text-xs text-white/90 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/10 font-medium mb-3">
              "{aiSummaryTip}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-amber-200 uppercase font-black">Total XP Earned</p>
                <p className="text-base font-black text-white mt-0.5">{user.xp} XP</p>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-amber-200 uppercase font-black">Badges Unlocked</p>
                <p className="text-base font-black text-white mt-0.5">5 / 6</p>
              </div>
            </div>
          </div>

          {/* Punekar Badges Showcase */}
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${textTitle} mb-2.5`}>Punekar Badges & Achievements</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {BADGES_LIST.map(badge => (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`${bgCard} p-3 rounded-2xl border shadow-sm cursor-pointer hover:border-[#8B3A2A] transition-all flex items-start gap-2.5`}
                >
                  <div className="text-2xl">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-extrabold truncate ${textTitle}`}>{badge.title}</p>
                    <p className="text-[10px] text-gray-500 font-semibold">{badge.category}</p>
                    <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md border mt-1 ${badge.color}`}>
                      +{badge.xp} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Media & Saved Items */}
      {activeMenuTab === "media" && (
        <div className="p-4 space-y-3">
          <div className={`${bgCard} p-4 rounded-2xl border shadow-sm text-center py-8`}>
            <Camera size={32} className="mx-auto text-[#8B3A2A] mb-2" />
            <h3 className={`text-sm font-black ${textTitle}`}>My Moments Gallery</h3>
            <p className="text-xs text-gray-500 mt-1">Photos and moments you share appear here and in the main feed.</p>
          </div>
        </div>
      )}

      {/* Tab Content 3: Wallet & Passes */}
      {activeMenuTab === "wallet" && (
        <div className="p-4 space-y-3">
          <div className={`${bgCard} p-4 rounded-2xl border shadow-sm flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                🪙
              </div>
              <div>
                <p className={`text-xs font-bold ${textTitle}`}>Punekar Token Wallet</p>
                <p className="text-[10px] text-gray-500">250 Pune Explorer Coins</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl">Redeem</button>
          </div>
        </div>
      )}

      {/* Tab Content 4: Settings & Theme */}
      {activeMenuTab === "settings" && (
        <div className="p-4 space-y-3">
          {/* Dark / Light Mode Switcher */}
          <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex justify-between items-center`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8B3A2A]/10 flex items-center justify-center text-[#8B3A2A]">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <div>
                <p className={`text-xs font-bold ${textTitle}`}>App Theme Mode</p>
                <p className="text-[10px] text-gray-500">{isDarkMode ? "Dark Theme Active" : "Light Theme Active"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                isDarkMode ? 'bg-[#8B3A2A]' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          {/* Language Selector */}
          <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex justify-between items-center`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8B3A2A]/10 flex items-center justify-center text-[#8B3A2A]">
                <Globe size={18} />
              </div>
              <div>
                <p className={`text-xs font-bold ${textTitle}`}>{t.appLanguage || "App Language"}</p>
                <p className="text-[10px] text-gray-500">English, Marathi, Hindi, Gujarati</p>
              </div>
            </div>
            <select
              value={userLanguage}
              onChange={(e) => setUserLanguage(e.target.value)}
              className={`p-1.5 border rounded-xl text-xs font-bold outline-none ${isDarkMode ? 'bg-[#2D2522] border-gray-700 text-white' : 'bg-[#FBF8F3] border-gray-300 text-gray-800'}`}
            >
              <option value="English">English</option>
              <option value="Marathi">मराठी</option>
              <option value="Hindi">हिन्दी</option>
              <option value="Gujarati">ગુજરાતી</option>
            </select>
          </div>
        </div>
      )}

      {/* Styled Logout Button */}
      <div className="p-4 mt-auto space-y-2">
        <button
          onClick={onLogout}
          className="w-full bg-[#8B3A2A] hover:bg-[#742E20] text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] border border-[#742E20]"
        >
          <LogOut size={18} />
          <span>
            {userLanguage === "Marathi"
              ? "खात्यातून लॉगआउट करा"
              : userLanguage === "Hindi"
              ? "खाते से लॉगआउट करें"
              : "Logout from Account"}
          </span>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full bg-transparent text-gray-500 hover:text-rose-600 py-1 text-xs font-bold transition-all text-center"
        >
          Delete Account
        </button>
      </div>

      {/* Active Story Modal */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden relative text-center">
            <img src={activeStory.cover} alt={activeStory.title} className="w-full h-64 object-cover" />
            <div className="p-4">
              <span className="text-2xl">{activeStory.icon}</span>
              <h3 className="text-base font-black text-gray-900 mt-1">{activeStory.title}</h3>
              <p className="text-xs text-gray-500 mt-1">Highlighted Pune Moment</p>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleDeleteStory(activeStory.id)}
                  className="flex-1 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setActiveStory(null)}
                  className="flex-1 py-2 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddStoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 rounded-3xl shadow-2xl w-full max-w-xs">
            <h3 className="text-base font-black text-gray-900 mb-3">Add Highlight Story</h3>
            <form onSubmit={handleAddStory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Highlight Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sinhagad Trek, Misal Trail"
                  className="w-full p-2.5 border rounded-xl text-xs outline-none bg-[#FBF8F3]"
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Emoji</label>
                <div className="flex gap-2">
                  {["🚩", "☕", "⛰️", "🌺", "📸", "🏰"].map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setNewStoryIcon(emoji)}
                      className={`p-2 rounded-xl text-lg border ${newStoryIcon === emoji ? 'border-[#8B3A2A] bg-amber-50' : 'border-gray-200'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Highlight Cover Photo</label>
                <button
                  type="button"
                  onClick={() => storyInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-[#FAF6F0] hover:bg-[#F2EAE7] text-[#8B3A2A] border border-[#8B3A2A]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <UploadCloud size={16} />
                  <span>Select Photo from Local Device</span>
                </button>
                {newStoryCover ? (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 h-24 flex items-center justify-center bg-gray-50">
                    <img src={newStoryCover} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewStoryCover("")}
                      className="absolute top-1.5 right-1.5 bg-black/70 text-white p-1 rounded-full hover:bg-black transition-colors"
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1 italic text-center">Select photo from your phone or PC</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoryModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl"
                >
                  Add Highlight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Profile Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center">
            <h3 className="text-lg font-black text-gray-900 mb-1">{user.name}</h3>
            <p className="text-xs text-gray-500 font-bold mb-4">{user.handle}</p>
            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-gray-200 inline-block mb-4">
              <QrCode size={140} className="text-[#8B3A2A]" />
            </div>
            <p className="text-xs text-gray-600 font-semibold mb-4">Scan QR to view profile on Pune Explorer</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center">
            <Trash2 size={36} className="text-rose-600 mx-auto mb-2" />
            <h3 className="text-base font-black text-gray-900 mb-1">Delete Account?</h3>
            <p className="text-xs text-gray-600 font-medium mb-4">Are you sure? This action will permanently remove your account and XP progress.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  onLogout();
                }}
                className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs border border-gray-100 text-center">
            <div className="text-5xl mb-3">{selectedBadge.icon}</div>
            <h3 className="text-base font-black text-gray-900 mb-1">{selectedBadge.title}</h3>
            <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border mb-3 ${selectedBadge.color}`}>
              +{selectedBadge.xp} XP Points
            </span>
            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
              {selectedBadge.desc}
            </p>
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile & Cover Banner Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-5 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 my-auto">
            <h2 className="text-base font-black text-gray-900 mb-3">{t.editProfileModal || "Edit Profile & Banners"}</h2>
            
            <div className="space-y-3 mb-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B3A2A] bg-[#FBF8F3]"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Username Handle</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B3A2A] bg-[#FBF8F3]"
                  value={userHandle}
                  onChange={(e) => setUserHandle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bio / Tagline</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B3A2A] bg-[#FBF8F3]"
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  rows="2"
                ></textarea>
              </div>

              {/* Cover Banner Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Profile Cover Banner</label>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full mb-2.5 py-2 px-3 bg-[#FAF6F0] hover:bg-[#F2EAE7] text-[#8B3A2A] border border-[#8B3A2A]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <UploadCloud size={16} />
                  <span>Select Cover Photo from Device</span>
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_BANNERS.map(banner => (
                    <div
                      key={banner.id}
                      onClick={() => setCoverPhoto(banner.url)}
                      className={`h-14 rounded-xl bg-cover bg-center cursor-pointer border-2 relative overflow-hidden ${coverPhoto === banner.url ? 'border-[#8B3A2A] shadow-md' : 'border-transparent'}`}
                      style={{ backgroundImage: `url(${banner.url})` }}
                    >
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-bold text-white text-center py-0.5 truncate px-1">
                        {banner.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Avatar Profile Photo</label>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-[#FAF6F0] hover:bg-[#F2EAE7] text-[#8B3A2A] border border-[#8B3A2A]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <UploadCloud size={16} />
                  <span>Select Avatar Photo from Device</span>
                </button>
                {userAvatar && (
                  <div className="flex items-center gap-2.5 mt-2 p-1.5 bg-[#FAF6F0] rounded-xl border border-gray-200">
                    <img src={userAvatar} alt="Avatar Preview" className="w-9 h-9 rounded-full object-cover border border-gray-300" />
                    <span className="text-[11px] text-gray-700 font-bold truncate">Current Avatar Selected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
