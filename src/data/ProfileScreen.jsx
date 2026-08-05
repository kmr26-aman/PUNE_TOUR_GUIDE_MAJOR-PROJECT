import { useState, useEffect } from "react";
import { useUserLocation } from "../hooks/useUserLocation";
import { fetchUserStats } from "../data/api";
import { translations } from "../data/translations";
import StatusBar from "../components/StatusBar";
import { Plus, MapPin, Heart, CheckCircle, Award, Edit } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ProfileScreen({ onPlaceSelect, userLocation, userLanguage, setUserLanguage, onLogout }) {
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem("pune_user_name") || "Explorer");
  const [userBio, setUserBio] = useState(() => localStorage.getItem("pune_user_bio") || "");
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("pune_user_avatar") || "https://via.placeholder.com/150");

  const t = translations[userLanguage] || translations.English;

  // Mock user data for now
  const user = {
    name: userName,
    bio: userBio,
    avatar: userAvatar,
    xp: userStats?.totalPoints || 0,
    level: Math.floor((userStats?.totalPoints || 0) / 100) + 1, // Example level calculation
  };

  useEffect(() => {
    const loadUserStats = async () => {
      setLoadingStats(true);
      try {
        const stats = await fetchUserStats();
        setUserStats(stats);
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        toast.error("Failed to load user stats.");
      } finally {
        setLoadingStats(false);
      }
    };
    loadUserStats();
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem("pune_user_name", userName);
    localStorage.setItem("pune_user_bio", userBio);
    localStorage.setItem("pune_user_avatar", userAvatar);
    setShowEditProfileModal(false);
    toast.success("Profile updated successfully!");
  };

  return (
    <div className="h-full w-full bg-[#FBF8F3] flex flex-col">
      <Toaster />
      <StatusBar />
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-800">{t.profile.myDiscoveries}</h1>
      </div>

      {/* User Info Section */}
      <div className="p-4 bg-white flex items-center border-b border-gray-200">
        <img src={user.avatar} alt="User Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-[#8B3A2A]" />
        <div className="flex-1 ml-4">
          <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.bio || t.profile.memberSince}</p>
        </div>
        <button
          onClick={() => setShowEditProfileModal(true)}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <Edit size={18} />
        </button>
      </div>

      {/* Stats Section */}
      <div className="p-4 bg-white border-b border-gray-200 grid grid-cols-2 gap-4 text-center">
        {loadingStats ? (
          <p className="col-span-2 text-gray-500">{t.socialMedia.loading}</p>
        ) : (
          <>
            <div>
              <p className="text-2xl font-bold text-[#8B3A2A]">{userStats?.followerCount || 0}</p>
              <p className="text-sm text-gray-600">{t.profile.followers}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#8B3A2A]">{userStats?.followingCount || 0}</p>
              <p className="text-sm text-gray-600">{t.profile.following}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#8B3A2A]">{userStats?.savedCount || 0}</p>
              <p className="text-sm text-gray-600">{t.profile.placesSaved}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#8B3A2A]">{userStats?.completedStops || 0}</p>
              <p className="text-sm text-gray-600">{t.profile.stopsCompleted}</p>
            </div>
          </>
        )}
      </div>

      {/* XP and Level */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold text-gray-800">{t.profile.punekarLevel} {user.level}</h3>
          <span className="text-sm text-gray-600">{user.xp} {t.profile.points}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-[#8B3A2A] h-2.5 rounded-full" style={{ width: `${(user.xp % 100)}%` }}></div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h3 className="text-md font-semibold text-gray-800 mb-3">{t.profile.earnedBadges}</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Mock Badges */}
          <div className="flex flex-col items-center">
            <Award size={36} className="text-yellow-500" />
            <span className="text-xs text-gray-700 mt-1">Explorer</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle size={36} className="text-green-500" />
            <span className="text-xs text-gray-700 mt-1">Completer</span>
          </div>
          <div className="flex flex-col items-center">
            <Heart size={36} className="text-red-500" />
            <span className="text-xs text-gray-700 mt-1">Liker</span>
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <span className="text-md font-semibold text-gray-800">{t.profile.language}</span>
        <select
          value={userLanguage}
          onChange={(e) => setUserLanguage(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
        >
          <option value="English">English</option>
          <option value="Marathi">मराठी</option>
          <option value="Hindi">हिन्दी</option>
          <option value="Gujarati">ગુજરાતી</option>
        </select>
      </div>

      {/* Logout Button */}
      <div className="p-4 bg-white">
        <button
          onClick={onLogout}
          className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600"
        >
          {t.profile.logout}
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h2 className="text-xl font-bold mb-4">{t.profile.editProfileModal}</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">{t.profile.displayName}</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">{t.profile.bio}</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                rows="3"
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">{t.profile.changePhoto}</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={userAvatar}
                onChange={(e) => setUserAvatar(e.target.value)}
                placeholder="Image URL"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                {t.profile.cancel}
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-[#8B3A2A] text-white rounded-lg hover:bg-opacity-90"
              >
                {t.profile.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}