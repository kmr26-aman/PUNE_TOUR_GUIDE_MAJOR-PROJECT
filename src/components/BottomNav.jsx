import { translations } from "../data/translations";

export default function BottomNav({ activeTab, onTabChange, userLanguage, isDarkMode }) {
  const t = translations[userLanguage] || translations.English;
  const tabs = [
    { id: "home", icon: "🏠", label: t.home },
    { id: "explore", icon: "🧭", label: t.explore },
    { id: "map", icon: "🗺️", label: t.map },
    { id: "plan", icon: "📅", label: t.plan },
    { id: "social", icon: "📷", label: userLanguage === "Marathi" ? "क्षण" : userLanguage === "Hindi" ? "पल" : userLanguage === "Gujarati" ? "ક્ષણો" : "Moments" },
    { id: "profile", icon: "👤", label: t.profile },
  ];

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 flex justify-around items-center border-t transition-colors duration-200 ${
        isDarkMode ? 'bg-[#1F1A18] border-[#3A302C]' : 'bg-white border-[#EDE8DF]'
      }`}
      style={{ paddingTop: 10, paddingBottom: 16, zIndex: 50 }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 transition-all"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? "#8B3A2A" : isDarkMode ? "#A89A90" : "#6B5B52",
              minWidth: 48,
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span className={isActive ? "font-bold" : ""}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
