import { useState, useEffect } from "react";
import StatusBar from "../components/StatusBar";
import PlaceListItem from "../components/PlaceListItem"; // This component is not used in the provided file.
import { fetchPlaces, fetchUserStats, fetchUserActivity } from "../data/api";
import { colors } from "../data/tokens";
import { translations } from "../data/translations";
import { Home, ArrowLeft } from "lucide-react";

const languageOptions = [
  { code: "English", label: "English" },
  { code: "Marathi", label: "मराठी (Marathi)" },
  { code: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { code: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
  { code: "Bengali", label: "বাংলা (Bengali)" },
  { code: "Punjabi", label: "ਪੰਜਾਬી (Punjabi)" },
  { code: "Malayalam", label: "മലയാളം (Malayalam)" },
  { code: "Odia", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "Urdu", label: "اردو (Urdu)" },
  { code: "Assamese", label: "অસમীয়া (Assamese)" },
  { code: "Maithili", label: "मैथिली (Maithili)" },
  { code: "Sanskrit", label: "संस्कृतम् (Sanskrit)" }
];

export default function ProfileScreen({ onBack, onPlaceSelect, userLocation, userLanguage, setUserLanguage, onLogout, onNavigateHome }) {
  // User Personalization State
  const [userName, setUserName] = useState(() => localStorage.getItem("pune_user_name") || "Sourav Paul");
  const [userBio, setUserBio] = useState(() => localStorage.getItem("pune_user_bio") || "Local Guide · Pune Explorer");
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("pune_user_avatar") || null);
  
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [discoveredPlaces, setDiscoveredPlaces] = useState([]);
  const [stats, setStats] = useState({ totalPoints: 0, savedCount: 0, completedStops: 0, discoveredCount: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveTab] = useState("bookmarks"); // 'bookmarks', 'discoveries', 'activity'
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempBio, setTempBio] = useState(userBio);
  const [tempAvatar, setTempAvatar] = useState(userAvatar);
  const [tempLanguage, setTempLanguage] = useState(userLanguage);

  const t = translations[userLanguage] || translations.English;

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const userId = JSON.parse(atob(localStorage.getItem('pune_auth_token').split('.')[1])).id;
        const [savedData, discoveredData, statsData, activityData] = await Promise.all([
          fetchPlaces({ isSaved: true }),
          fetchPlaces({ isDiscovered: true }),
          fetchUserStats(),
          fetchUserActivity(userId)
        ]);
        setSavedPlaces(savedData);
        setDiscoveredPlaces(discoveredData);
        setStats(statsData);
        setActivity(activityData);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, []);

  const getPunekarLevel = (pts) => {
    if (pts >= 1000) return { title: userLanguage === "Marathi" ? "पुणेरी लिजेंड" : "PUNERI LEGEND", icon: "👑", rank: 5 };
    if (pts >= 500) return { title: userLanguage === "Marathi" ? "शिलेदार" : "SHILEDAR", icon: "🚩", rank: 42 };
    if (pts >= 101) return { title: userLanguage === "Marathi" ? "पुणे एक्सप्लोरर" : "PUNE EXPLORER", icon: "🧭", rank: 156 };
    return { title: userLanguage === "Marathi" ? "नवीन पुणेकर" : "NAVIN PUNEKAR", icon: "🌱", rank: 890 };
  };

  const currentLevel = getPunekarLevel(stats.totalPoints);

  const handleSaveProfile = () => {
    setUserName(tempName);
    setUserBio(tempBio);
    setUserAvatar(tempAvatar);
    localStorage.setItem("pune_user_name", tempName);
    localStorage.setItem("pune_user_bio", tempBio);
    if (tempAvatar) {
      localStorage.setItem("pune_user_avatar", tempAvatar);
    } else {
      localStorage.removeItem("pune_user_avatar");
    }
    setUserLanguage(tempLanguage);
    setIsEditModalOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



  if (loading) {
    return (
      <div style={{ background: "#FBF8F3", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: colors.wadaRed, fontWeight: 600 }}>
          {userLanguage === "Marathi" ? "प्रोफाइल लोड होत आहे..." :
           userLanguage === "Hindi" ? "प्रोफ़ाइल लोड हो रही है..." :
           userLanguage === "Gujarati" ? "પ્રોફાઇલ લોડ થઈ રહી છે..." :
           "Loading profile..."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FBF8F3", height: "100%", overflowY: "auto", paddingBottom: 80, fontFamily: 'Mukta', position: "relative" }}>
      <StatusBar light />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{ background: "#fff", width: "100%", borderRadius: 20, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 20 }}>{t.editProfileModal}</div>
            
            {/* Avatar Edit Section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <label style={{ position: "relative", cursor: "pointer" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                    border: `3px solid ${colors.paithaniGold}`,
                    overflow: "hidden",
                    backgroundImage: tempAvatar ? `url(${tempAvatar})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!tempAvatar && "👤"}
                </div>
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: "50%",
                  background: colors.wadaRed, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, border: "2px solid #fff"
                }}>
                  📷
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
              <div style={{ fontSize: 11, color: colors.inkMuted, marginTop: 8 }}>{t.changePhoto}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.inkMuted, marginBottom: 6 }}>{t.displayName}</div>
              <input 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${colors.stoneDark}`,
                  fontSize: 14, outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.inkMuted, marginBottom: 6 }}>{t.bio}</div>
              <input 
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${colors.stoneDark}`,
                  fontSize: 14, outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.inkMuted, marginBottom: 6 }}>{t.language}</div>
              <select
                value={tempLanguage}
                onChange={(e) => setTempLanguage(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${colors.stoneDark}`,
                  fontSize: 14, outline: "none", background: "#fff", cursor: "pointer"
                }}
              >
                {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${colors.stoneDark}`, background: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveProfile}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: colors.wadaRed, color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div
        style={{
          background: colors.wadaRed,
          padding: "16px 16px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top-Left Action Bar (Back & Home buttons) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onBack && (
              <button
                onClick={onBack}
                title="Back"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(4px)"
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                title="Home"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(4px)"
                }}
              >
                <Home size={18} />
              </button>
            )}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "#fff",
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              border: `4px solid ${colors.paithaniGold}`,
              boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
              overflow: "hidden",
              backgroundImage: userAvatar ? `url(${userAvatar})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!userAvatar && "👤"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{userName}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
            {userBio}
          </div>
          
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 16,
            background: colors.paithaniSaffron,
            padding: "6px 14px",
            borderRadius: 20,
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.3)"
          }}>
            <span style={{ fontSize: 14 }}>{currentLevel.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
              {t.punekarLevel}: {currentLevel.title}
            </span>
          </div>
        </div>
      </div>

      {/* Stats & Rank Card */}
      <div style={{ 
        margin: "-24px 16px 20px", 
        background: "#fff", 
        borderRadius: 16, 
        padding: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        position: "relative",
        zIndex: 2
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16, borderBottom: `1px solid ${colors.stone}`, paddingBottom: 16 }}>
          {[
            { label: t.saved, val: stats.savedCount, color: colors.wadaRed },
            { label: t.points, val: stats.totalPoints, color: colors.paithaniSaffron },
            { label: t.stops, val: stats.completedStops, color: colors.peshwaPurple },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.inkMuted, textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.wadaRedLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>{t.communityRank}</div>
              <div style={{ fontSize: 10, color: colors.inkMuted }}>{userLanguage === "Marathi" ? `${stats.totalPoints} गुणांवर आधारित` : `Based on ${stats.totalPoints} points`}</div>
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: colors.wadaRed }}>#{currentLevel.rank} {t.rankInPune}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 20, padding: "0 20px", borderBottom: `1px solid ${colors.stoneDark}`, overflowX: "auto" }}>
        {[
          { id: "bookmarks", label: t.saved },
          { id: "discoveries", label: t.discoveries },
          { id: "activity", label: t.badges },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: "12px 4px", fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer",
              color: activeSubTab === tab.id ? colors.wadaRed : colors.inkMuted,
              borderBottom: activeSubTab === tab.id ? `3px solid ${colors.wadaRed}` : "3px solid transparent",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: "#fff", flex: 1 }}>
        {activeSubTab === "bookmarks" && (
          <div>
            {savedPlaces.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>{t.noTreasureMsg}</div>
                <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 6 }}>{t.saveSpotsMsg}</div>
              </div>
            ) : (
              savedPlaces.map((place) => (
                <PlaceListItem key={place.id} place={place} onClick={onPlaceSelect} userLocation={userLocation} />
              ))
            )}
          </div>
        )}

        {activeSubTab === "discoveries" && (
          <div>
            {discoveredPlaces.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>{t.noDiscoveriesMsg}</div>
                <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 6, padding: "0 40px" }}>
                  {userLanguage === "Marathi" ? "पुणे मार्गदर्शिका मध्ये योगदान देण्यासाठी एक्सप्लोर टॅबमध्ये नवीन ठिकाणे शोधा!" : "Search for new places in the Explore tab to contribute to the Pune Guide!"}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: colors.wadaRed, background: colors.wadaRedLight }}>
                  {t.contributionsMsg}
                </div>
                {discoveredPlaces.map((place) => (
                  <PlaceListItem key={place.id} place={place} onClick={onPlaceSelect} userLocation={userLocation} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === "activity" && (
          <div style={{ padding: "16px" }}>
            {activity.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center", color: colors.inkMuted }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No recent activity.</div>
              </div>
            ) : (
              activity.map(item => (
                <div key={`${item.type}-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 18 }}>
                    {item.type === 'like' ? '❤️' : '💬'}
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: colors.inkMuted }}>
                    {item.type === 'like' ? (
                      <>You liked a post: <strong>{item.post.caption || 'Image Post'}</strong></>
                    ) : (
                      <>You commented: "<strong>{item.text}</strong>" on a post.</>
                    )}
                    <div style={{ fontSize: 10, marginTop: 2 }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {item.post.imageUrl && (
                    <img src={item.post.imageUrl} alt="post thumbnail" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === "activity" && (
          <div style={{ padding: "20px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>{t.earnedBadges}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: "🏰", name: userLanguage === "Marathi" ? "इतिहास प्रेमी" : "History Buff", active: stats.totalPoints > 200 },
                { icon: "🍽️", name: userLanguage === "Marathi" ? "खवय्ये" : "Foodie", active: stats.totalPoints > 400 },
                { icon: "⛩️", name: userLanguage === "Marathi" ? "भक्त" : "Devotee", active: stats.totalPoints > 100 },
                { icon: "🥾", name: userLanguage === "Marathi" ? "गिर्यारोहक" : "Trekker", active: stats.totalPoints > 800 },
              ].map(badge => (
                <div key={badge.name} style={{ 
                  background: badge.active ? colors.stone : "#f9f9f9", 
                  borderRadius: 12, padding: "12px", border: `1px solid ${badge.active ? colors.stoneDark : "#eee"}`,
                  display: "flex", alignItems: "center", gap: 10,
                  opacity: badge.active ? 1 : 0.4
                }}>
                  <div style={{ fontSize: 24, filter: badge.active ? "none" : "grayscale(1)" }}>{badge.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>{badge.name}</div>
                    <div style={{ fontSize: 10, color: colors.inkMuted }}>{badge.active ? t.unlocked : t.locked}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ 
              marginTop: 24, padding: "16px", borderRadius: 12, background: colors.wadaRedLight,
              border: `1px dashed ${colors.wadaRed}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.wadaRed }}>{t.pointsBreakdown}</div>
              <div style={{ fontSize: 11, color: colors.inkMuted, marginTop: 6 }}>
                • {stats.savedCount} {t.placesSaved} (+{stats.savedCount * 10} {t.points})<br/>
                • {stats.completedStops} {t.stopsCompleted} (+{stats.completedStops * 50} {t.points})<br/>
                • {stats.discoveredCount} {t.newDiscoveries} (+{stats.discoveredCount * 100} {t.points})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "24px 16px 40px", textAlign: "center", background: "#FBF8F3" }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button 
            onClick={() => {
              setTempName(userName);
              setTempBio(userBio);
              setTempAvatar(userAvatar);
              setTempLanguage(userLanguage);
              setIsEditModalOpen(true);
            }}
            style={{ 
              background: "none", border: `1px solid ${colors.stoneDark}`, borderRadius: 10,
              padding: "8px 20px", fontSize: 12, fontWeight: 600, color: colors.inkMuted, cursor: "pointer"
            }}
          >
            {t.editProfile}
          </button>
          <button 
            onClick={onLogout}
            style={{ 
              background: "none", border: `1px solid ${colors.wadaRed}`, borderRadius: 10,
              padding: "8px 20px", fontSize: 12, fontWeight: 600, color: colors.wadaRed, cursor: "pointer"
            }}
          >
            {userLanguage === "Marathi" ? "लॉगआउट" : "Logout"}
          </button>
        </div>
        <div style={{ fontSize: 10, color: colors.inkMuted, marginTop: 12 }}>
          {t.memberSince}
        </div>
      </div>
    </div>
  );
}
