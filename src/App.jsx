import { useState, useEffect, lazy, Suspense } from "react";
import HomeScreen from "./screens/HomeScreen";
import BottomNav from "./components/BottomNav";
import AuthScreen from "./screens/AuthScreen";
import { useUserLocation } from "./hooks/useUserLocation";
import { logoutUser, fetchWeather, fetchUserMe } from "./data/api";

import ProfileScreen from "./screens/ProfileScreen";
const ExploreScreen = lazy(() => import("./screens/ExploreScreen"));
const MapScreen = lazy(() => import("./screens/MapScreen"));
const PlanScreen = lazy(() => import("./screens/PlanScreen"));
const SocialMediaScreen = lazy(() => import("./screens/SocialMediaScreen.jsx"));
const PlaceDetailScreen = lazy(() => import("./screens/PlaceDetailScreen.jsx"));
const UserProfileScreen = lazy(() => import("./screens/userProfileScreen.jsx"));
const PostDetailScreen = lazy(() => import("./data/PostDetailScreen.jsx"));
const CreatePostScreen = lazy(() => import("./screens/CreatePostScreen.jsx"));

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [exploreParams, setExploreParams] = useState({});
  const { location: userLocation } = useUserLocation();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [userLanguage, setUserLanguage] = useState(() => localStorage.getItem("pune_user_lang") || "English");
  const [weatherData, setWeatherData] = useState({ weather: "Sunny", temp: 32 });
  
  // Global Dark / Light Theme State (Persisted)
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("pune_theme") === "dark");

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("pune_auth_token");
    const name = localStorage.getItem("pune_user_name") || "Explorer";
    return token ? { name } : null;
  });

  useEffect(() => {
    localStorage.setItem("pune_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem("pune_auth_token");
      if (token) {
        try {
          const userData = await fetchUserMe();
          setUser(userData);
        } catch (err) {
          console.error("User session sync failed:", err);
        }
      }
    };
    syncUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("pune_user_lang", userLanguage);
  }, [userLanguage]);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const data = await fetchWeather();
        setWeatherData(data);
      } catch (err) {
        console.error("Failed to load initial weather:", err);
      }
    };
    loadWeather();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser({ name: userData.name || "Explorer", ...userData });
    setActiveTab("home");
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setActiveTab("detail");
  };

  const handleBack = () => {
    setSelectedPlace(null);
    setActiveTab("explore");
  };

  const handleSearchClick = (params = {}) => {
    setExploreParams(params);
    setActiveTab("explore");
  };

  const handleNavigateToCreatePost = () => {
    setActiveTab("createPost");
  };

  const handlePostSelect = (postId) => {
    setSelectedPostId(postId);
    setActiveTab("postDetail");
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    setActiveTab("userProfile");
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setActiveTab("home");
  };

  const renderScreen = () => {
    if (!user) {
      return (
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          userLanguage={userLanguage}
          setUserLanguage={setUserLanguage}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            onPlaceSelect={handlePlaceSelect}
            onSearchClick={handleSearchClick}
            userLocation={userLocation}
            userLanguage={userLanguage}
            weatherData={weatherData}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        );
      case "explore":
        return (
          <ExploreScreen
            onPlaceSelect={handlePlaceSelect}
            initialParams={exploreParams}
            userLocation={userLocation}
            userLanguage={userLanguage}
            isDarkMode={isDarkMode}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "map":
        return (
          <MapScreen
            userLocation={userLocation}
            userLanguage={userLanguage}
            weatherData={weatherData}
            isDarkMode={isDarkMode}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "plan":
        return (
          <PlanScreen
            userLocation={userLocation}
            userLanguage={userLanguage}
            weatherData={weatherData}
            isDarkMode={isDarkMode}
            onPlaceSelect={handlePlaceSelect}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "social":
        return (
          <SocialMediaScreen
            userLanguage={userLanguage}
            isDarkMode={isDarkMode}
            onUserSelect={handleUserSelect}
            onPostSelect={handlePostSelect}
            onNavigateToCreatePost={handleNavigateToCreatePost}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            onPlaceSelect={handlePlaceSelect}
            userLocation={userLocation}
            userLanguage={userLanguage}
            setUserLanguage={setUserLanguage}
            onLogout={handleLogout}
            user={user}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "detail":
        return (
          <PlaceDetailScreen
            place={selectedPlace}
            onBack={handleBack}
            userLocation={userLocation}
            userLanguage={userLanguage}
            isDarkMode={isDarkMode}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "userProfile":
        return (
          <UserProfileScreen
            userId={selectedUserId}
            onBack={() => setActiveTab('social')}
            userLanguage={userLanguage}
            isDarkMode={isDarkMode}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "postDetail":
        return (
          <PostDetailScreen
            postId={selectedPostId}
            onBack={() => setSelectedPostId(null) || setActiveTab('social')}
            userLanguage={userLanguage}
            isDarkMode={isDarkMode}
            onUserSelect={handleUserSelect}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      case "createPost":
        return (
          <CreatePostScreen
            onPostCreated={() => setActiveTab('social')}
            onBack={() => setActiveTab('social')}
            userLanguage={userLanguage}
            isDarkMode={isDarkMode}
            onNavigateHome={() => setActiveTab("home")}
          />
        );
      default:
        return (
          <HomeScreen
            onPlaceSelect={handlePlaceSelect}
            onSearchClick={handleSearchClick}
            userLocation={userLocation}
            userLanguage={userLanguage}
            weatherData={weatherData}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        );
    }
  };

  return (
    <div className={`flex justify-center items-stretch sm:items-start min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white sm:bg-gray-100'} sm:py-8 transition-colors duration-200`}>
      <div
        className={`relative overflow-hidden flex flex-col w-full h-[100dvh] sm:h-auto sm:w-[375px] sm:min-h-[812px] sm:rounded-[40px] sm:border-2 ${
          isDarkMode ? 'bg-[#181311] border-[#362D2A]' : 'bg-[#FBF8F3] border-[#D1CBC0]'
        } transition-colors duration-200`}
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Notch - hidden on mobile device screens */}
        <div
          className="mx-auto z-10 hidden sm:block"
          style={{
            width: 126,
            height: 28,
            background: "#1a1a1a",
            borderRadius: "0 0 18px 18px",
          }}
        />

        {/* Screen content */}
        <div className="flex-1 relative overflow-hidden pb-16">
          <Suspense fallback={
            <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-[#181311] text-[#FAF6F0]' : 'bg-[#FBF8F3] text-[#1C1412]'}`}>
              <div style={{ color: "#8B3A2A", fontWeight: 600, fontSize: 13 }}>Loading Pune Explorer...</div>
            </div>
          }>
            {renderScreen()}
          </Suspense>
        </div>

        {/* Bottom nav — hidden when logged out or on specific sub-screens */}
        {user && activeTab !== "detail" && activeTab !== "userProfile" && activeTab !== "postDetail" && activeTab !== "createPost" && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userLanguage={userLanguage} isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  );
}