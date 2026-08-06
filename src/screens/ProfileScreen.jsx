import { useState, useEffect } from "react";
import { useUserLocation } from "../hooks/useUserLocation";
import { fetchUserStats, fetchUserMe } from "../data/api.js";
import { translations } from "../data/translations";
import StatusBar from "../components/StatusBar";
import { 
  Home, Edit, Heart, CheckCircle, Award, LogOut, User, Mail, ShieldCheck, 
  Globe, Bell, HardDrive, HelpCircle, FileText, Sparkles, ChevronRight, X, 
  Moon, Sun, QrCode, Share2, MapPin, Bookmark, Camera, Video, Compass, 
  Wallet, Ticket, Users, Lock, AlertTriangle, Trash2, Star, BookOpen, Film
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

const MOCK_STORIES = [
  { id: 1, title: "Shaniwar Wada", icon: "🚩", cover: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=200&q=80" },
  { id: 2, title: "FC Road Eats", icon: "☕", cover: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=200&q=80" },
  { id: 3, title: "Sinhagad Trek", icon: "⛰️", cover: "https://images.unsplash.com/photo-1626014903708-ecb661d9a26a?auto=format&fit=crop&w=200&q=80" },
  { id: 4, title: "Ganpati Festival", icon: "🌺", cover: "https://images.unsplash.com/photo-1662446736466-9b57d079942a?auto=format&fit=crop&w=200&q=80" },
];

export default function ProfileScreen({ onPlaceSelect, userLocation, userLanguage, setUserLanguage, onLogout, onNavigateHome, isDarkMode, setIsDarkMode }) {
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Active Profile Sub-Tab (Defaults to ROADSoS Emergency setup)
  const [activeMenuTab, setActiveMenuTab] = useState("sos"); // 'sos', 'stats', 'media', 'wallet', 'settings'

  // User Profile Identity State
  const [userName, setUserName] = useState(() => localStorage.getItem("pune_user_name") || "Sourav Paul");
  const [userHandle, setUserHandle] = useState(() => localStorage.getItem("pune_user_handle") || "@punekar_explorer");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("pune_user_email") || "explorer@punetourguide.com");
  const [userBio, setUserBio] = useState(() => localStorage.getItem("pune_user_bio") || "Exploring the cultural pride & heritage of Pune 🚩");
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("pune_user_avatar") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
  const [coverPhoto, setCoverPhoto] = useState(() => localStorage.getItem("pune_cover_photo") || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80");

  // Feature Toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  // ROADSoS Emergency Contacts & Medical Details State
  const [emContactName, setEmContactName] = useState(() => localStorage.getItem("pune_user_em_name") || "");
  const [emContactPhone, setEmContactPhone] = useState(() => localStorage.getItem("pune_user_em_phone") || "");
  const [emContactPhone2, setEmContactPhone2] = useState(() => localStorage.getItem("pune_user_em_phone2") || "");
  const [emBloodGroup, setEmBloodGroup] = useState(() => localStorage.getItem("pune_user_blood_group") || "O+");
  const [emMedicalNotes, setEmMedicalNotes] = useState(() => localStorage.getItem("pune_user_med_notes") || "");
  const [emAutoAlert, setEmAutoAlert] = useState(() => localStorage.getItem("pune_user_em_auto_alert") !== "false");

  const handleSaveEmergencyDetails = (e) => {
    e.preventDefault();
    if (!emContactPhone || emContactPhone.trim().length < 8) {
      toast.error("Please enter a valid Emergency Contact phone number!");
      return;
    }
    localStorage.setItem("pune_user_em_name", emContactName.trim());
    localStorage.setItem("pune_user_em_phone", emContactPhone.trim());
    localStorage.setItem("pune_user_em_phone2", emContactPhone2.trim());
    localStorage.setItem("pune_user_blood_group", emBloodGroup);
    localStorage.setItem("pune_user_med_notes", emMedicalNotes.trim());
    localStorage.setItem("pune_user_em_auto_alert", emAutoAlert ? "true" : "false");
    toast.success("🚨 Emergency Contacts & ROADSoS Medical Profile Saved!");
  };

  const t = translations[userLanguage] || translations.English;

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
        }
      } catch (error) {
        console.error("Failed to fetch profile details:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadProfileData();
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem("pune_user_name", userName);
    localStorage.setItem("pune_user_handle", userHandle);
    localStorage.setItem("pune_user_bio", userBio);
    localStorage.setItem("pune_user_avatar", userAvatar);
    localStorage.setItem("pune_cover_photo", coverPhoto);
    setShowEditProfileModal(false);
    toast.success("Profile updated successfully!");
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

  const handleClearCache = () => {
    localStorage.removeItem("pune_api_cache");
    setCacheCleared(true);
    toast.success("App storage & offline cache cleared successfully!");
    setTimeout(() => setCacheCleared(false), 3000);
  };

  // Theme styling helpers
  const bgMain = isDarkMode ? "bg-[#181311] text-[#FAF6F0]" : "bg-[#FBF8F3] text-[#1C1412]";
  const bgCard = isDarkMode ? "bg-[#241E1C] border-[#362D2A]" : "bg-white border-gray-200";
  const bgSubCard = isDarkMode ? "bg-[#2D2522] border-[#3A302C]" : "bg-[#FAF6F0] border-[#EDE8DF]";
  const textTitle = isDarkMode ? "text-white" : "text-gray-900";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`h-full w-full ${bgMain} flex flex-col overflow-y-auto pb-24 transition-colors duration-200`}>
      <Toaster />
      <StatusBar light={isDarkMode} />

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
          <h1 className={`text-lg font-extrabold ${textTitle}`}>
            {userLanguage === "Marathi" ? "माझी प्रोफाईल" : "My Profile"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

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
        {/* Cover Photo */}
        <div
          className="h-32 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${user.cover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={handleShareProfile}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl backdrop-blur-md transition-all text-xs font-bold flex items-center gap-1.5"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>

        {/* Profile Avatar & Info Overlay */}
        <div className={`px-4 pb-4 pt-0 border-b ${bgCard} relative`}>
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <img
                src={user.avatar}
                alt="User Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#241E1C] shadow-lg"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                }}
              />
              <span className="absolute bottom-1 right-1 bg-[#8B3A2A] text-white p-1 rounded-full text-[10px] border-2 border-white shadow-sm">
                🚩
              </span>
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
            <p className="text-xs text-gray-500 font-semibold">{user.handle} · {user.email}</p>
            <p className="text-xs text-[#8B3A2A] dark:text-amber-400 font-bold mt-1.5">
              {user.bio}
            </p>
          </div>

          {/* Social Stats Row: Followers, Following & Posts */}
          <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} grid grid-cols-3 gap-2 text-center`}>
            <div>
              <p className={`text-lg font-black ${textTitle}`}>{userStats?.followerCount || 128}</p>
              <p className={`text-[11px] font-bold ${textMuted}`}>Followers</p>
            </div>
            <div>
              <p className={`text-lg font-black ${textTitle}`}>{userStats?.followingCount || 94}</p>
              <p className={`text-[11px] font-bold ${textMuted}`}>Following</p>
            </div>
            <div>
              <p className={`text-lg font-black ${textTitle}`}>{userStats?.postsCount || 18}</p>
              <p className={`text-[11px] font-bold ${textMuted}`}>Moments</p>
            </div>
          </div>

          {/* Stories & Highlights Carousel */}
          <div className="mt-4 pt-3 border-t border-gray-100/10">
            <p className={`text-[11px] font-extrabold uppercase tracking-wider ${textMuted} mb-2`}>Stories & Highlights</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {MOCK_STORIES.map(story => (
                <div key={story.id} className="flex flex-col items-center flex-shrink-0 cursor-pointer">
                  <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#8B3A2A] to-amber-400">
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
      <div className={`flex border-b ${bgCard} sticky top-[57px] z-10 shadow-xs overflow-x-auto no-scrollbar`}>
        <button
          onClick={() => setActiveMenuTab("stats")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${
            activeMenuTab === "stats" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Award size={15} />
          <span>Stats</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("sos")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${
            activeMenuTab === "sos" ? "border-rose-600 text-rose-600 bg-rose-50 dark:bg-rose-950/20" : "border-transparent text-rose-600/80"
          }`}
        >
          <ShieldAlert size={15} className="animate-pulse" />
          <span>ROADSoS Contacts 🚨</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("media")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${
            activeMenuTab === "media" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Camera size={15} />
          <span>Media & Saved</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("wallet")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${
            activeMenuTab === "wallet" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Wallet size={15} />
          <span>Wallet</span>
        </button>

        <button
          onClick={() => setActiveMenuTab("settings")}
          className={`flex-1 py-3 text-xs font-extrabold border-b-2 flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${
            activeMenuTab === "settings" ? "border-[#8B3A2A] text-[#8B3A2A] bg-[#8B3A2A]/5" : "border-transparent text-gray-500"
          }`}
        >
          <Globe size={15} />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Content: ROADSoS Emergency Contacts & Medical Profile */}
      {activeMenuTab === "sos" && (
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-[#8B3A2A] text-white p-4 rounded-2xl shadow-md border border-rose-800">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black">
                🚨
              </div>
              <div>
                <h3 className="text-sm font-black text-white">ROADSoS Emergency Dispatch Profile</h3>
                <p className="text-[11px] text-rose-100 font-medium">Automatic Live Location & Emergency Broadcast Setup</p>
              </div>
            </div>
            <p className="text-xs text-white/90 leading-relaxed mt-2 bg-black/20 p-2.5 rounded-xl border border-white/10">
              When SOS is activated on the Home tab or via Shake-to-SOS, your live GPS coordinates, Google Maps pin link, blood group, and medical notes will be automatically dispatched to these contacts.
            </p>
          </div>

          <form onSubmit={handleSaveEmergencyDetails} className={`${bgCard} p-4 rounded-2xl border shadow-sm space-y-3.5`}>
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
              <ShieldAlert size={18} className="text-rose-600" />
              <h4 className={`text-xs font-black uppercase tracking-wider ${textTitle}`}>Primary Emergency Contact</h4>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Contact Person Name</label>
              <input
                type="text"
                placeholder="e.g. Parent / Spouse / Guardian Name"
                value={emContactName}
                onChange={(e) => setEmContactName(e.target.value)}
                required
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-[#2D2522] border-gray-700 text-white' : 'bg-[#FBF8F3] border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Primary Emergency Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={emContactPhone}
                onChange={(e) => setEmContactPhone(e.target.value)}
                required
                className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-[#2D2522] border-gray-700 text-white' : 'bg-[#FBF8F3] border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Secondary Emergency Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+91 91234 56789"
                value={emContactPhone2}
                onChange={(e) => setEmContactPhone2(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-[#2D2522] border-gray-700 text-white' : 'bg-[#FBF8F3] border-gray-300 text-gray-900'}`}
              />
            </div>

            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 pt-2">
              <Activity size={18} className="text-rose-600" />
              <h4 className={`text-xs font-black uppercase tracking-wider ${textTitle}`}>Medical ID & Allergies</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Blood Group</label>
                <select
                  value={emBloodGroup}
                  onChange={(e) => setEmBloodGroup(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-black outline-none ${isDarkMode ? 'bg-[#2D2522] border-gray-700 text-white' : 'bg-[#FBF8F3] border-gray-300 text-gray-900'}`}
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Auto-Alert Emergency Contact</label>
                <div
                  onClick={() => setEmAutoAlert(!emAutoAlert)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs font-bold ${
                    emAutoAlert ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 text-gray-500'
                  }`}
                >
                  <span>{emAutoAlert ? "ON (Auto SMS/WA)" : "OFF"}</span>
                  <span>{emAutoAlert ? "✅" : "⚪"}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Medical Conditions / Allergies / Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Asthma, Diabetic, Allergic to Penicillin, Wears Lenses"
                value={emMedicalNotes}
                onChange={(e) => setEmMedicalNotes(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${isDarkMode ? 'bg-[#2D2522] border-gray-700 text-white' : 'bg-[#FBF8F3] border-gray-300 text-gray-900'}`}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} />
              <span>Save ROADSoS Emergency Contacts 🛡️</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab Content 1: Stats, Badges & AI Diary */}
      {activeMenuTab === "stats" && (
        <div className="p-4 space-y-4">
          {/* Punekar XP Progress Card */}
          <div className={`${bgCard} p-4 rounded-2xl border shadow-sm`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs font-black ${textTitle} flex items-center gap-1.5`}>
                <Award size={16} className="text-[#8B3A2A]" />
                <span>Punekar Score & Level</span>
              </span>
              <span className="text-xs font-black text-[#8B3A2A]">{user.xp} XP</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner mb-2">
              <div
                className="bg-gradient-to-r from-[#8B3A2A] to-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (user.xp % 100))}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 font-semibold text-right">
              {100 - (user.xp % 100)} XP to Level {user.level + 1}
            </p>
          </div>

          {/* Badges Grid */}
          <div className={`${bgCard} p-4 rounded-2xl border shadow-sm`}>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle} mb-3 flex items-center gap-1.5`}>
              <Sparkles size={16} className="text-[#8B3A2A]" />
              <span>Cultural Badges Showcase</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {BADGES_LIST.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    badge.unlocked
                      ? `${bgSubCard} hover:border-[#8B3A2A]`
                      : "bg-gray-100 dark:bg-gray-800/40 opacity-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${badge.color}`}>
                      +{badge.xp} XP
                    </span>
                  </div>
                  <h4 className={`text-xs font-extrabold ${textTitle} leading-tight`}>{badge.title}</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{badge.category}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Travel Diary & Recommendations */}
          <div className={`${bgCard} p-4 rounded-2xl border shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-[#8B3A2A]" />
              <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle}`}>AI Travel Diary</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              "Completed 5 heritage spots this weekend! Next recommended trip: <strong>Sinhagad Fort Sunrise & Pitla Bhakri Crawl</strong>."
            </p>
            <button
              onClick={() => toast.success("AI Travel Diary updated!")}
              className="text-xs font-bold text-[#8B3A2A] bg-[#8B3A2A]/10 px-3 py-1.5 rounded-xl border border-[#8B3A2A]/20"
            >
              Generate AI Summary
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 2: Media, Wishlist & Saved */}
      {activeMenuTab === "media" && (
        <div className="p-4 space-y-4">
          {/* Visited Places & Wishlist */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-xl bg-[#8B3A2A]/10 flex items-center justify-center text-[#8B3A2A]">
                <MapPin size={18} />
              </div>
              <div>
                <p className={`text-sm font-black ${textTitle}`}>{userStats?.completedStops || 14}</p>
                <p className="text-[10px] text-gray-500 font-bold">Visited Places</p>
              </div>
            </div>

            <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-xl bg-[#8B3A2A]/10 flex items-center justify-center text-[#8B3A2A]">
                <Bookmark size={18} />
              </div>
              <div>
                <p className={`text-sm font-black ${textTitle}`}>{userStats?.savedCount || 8}</p>
                <p className="text-[10px] text-gray-500 font-bold">Bucket List</p>
              </div>
            </div>
          </div>

          {/* Photos & Videos Gallery */}
          <div className={`${bgCard} p-4 rounded-2xl border shadow-sm`}>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textTitle} mb-3 flex items-center gap-1.5`}>
              <Film size={16} className="text-[#8B3A2A]" />
              <span>Posts, Photos & Reels</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <img src="https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=200&q=80" alt="Media" className="w-full h-24 object-cover rounded-xl" />
              <img src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=200&q=80" alt="Media" className="w-full h-24 object-cover rounded-xl" />
              <img src="https://images.unsplash.com/photo-1609828913647-7576722d36d2?auto=format&fit=crop&w=200&q=80" alt="Media" className="w-full h-24 object-cover rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Wallet, Bookings & Friends */}
      {activeMenuTab === "wallet" && (
        <div className="p-4 space-y-4">
          {/* Punekar Wallet Card */}
          <div className="bg-gradient-to-r from-[#8B3A2A] to-[#742E20] text-white p-4 rounded-2xl shadow-md border border-[#742E20]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-white/80">Punekar Explorer Wallet</span>
              <Wallet size={18} className="text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">₹ 250 <span className="text-xs font-bold text-amber-300">Coins</span></p>
            <p className="text-[10px] text-white/70 mt-1">Redeem for Heritage Pass discounts & Food Coupons</p>
          </div>

          {/* Bookings & Travel Buddies */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex items-center gap-3 cursor-pointer`} onClick={() => toast.success("No active ticket bookings")}>
              <Ticket size={18} className="text-[#8B3A2A]" />
              <div>
                <p className={`text-xs font-bold ${textTitle}`}>Booking History</p>
                <p className="text-[10px] text-gray-500">2 Past Tickets</p>
              </div>
            </div>

            <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex items-center gap-3 cursor-pointer`} onClick={() => toast.success("Travel Buddies list coming soon")}>
              <Users size={18} className="text-[#8B3A2A]" />
              <div>
                <p className={`text-xs font-bold ${textTitle}`}>Travel Buddies</p>
                <p className="text-[10px] text-gray-500">5 Friends connected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Settings, Theme & Security */}
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

          {/* Privacy & Block / Report */}
          <div className={`${bgCard} p-3.5 rounded-2xl border shadow-sm space-y-2.5`}>
            <div onClick={() => toast.success("Account privacy is set to Public Explorer")} className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Lock size={16} className="text-[#8B3A2A]" />
                <span className={`text-xs font-bold ${textTitle}`}>Privacy & Security Settings</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            <div onClick={() => toast.success("Block / Report options available")} className="flex items-center justify-between cursor-pointer pt-2 border-t border-gray-100/10">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <span className={`text-xs font-bold ${textTitle}`}>Report & Blocked Users</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Styled Logout Button Matched Perfectly to App Color Combination */}
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

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-4">{t.profile.editProfileModal || "Edit Profile"}</h2>
            
            <div className="space-y-3 mb-5">
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
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B3A2A] bg-[#FBF8F3]"
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  rows="2"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Avatar Photo URL</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B3A2A] bg-[#FBF8F3]"
                  value={userAvatar}
                  onChange={(e) => setUserAvatar(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2.5 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
