import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import StatusBar from "../components/StatusBar";
import { tagStyles, colors } from "../data/tokens";
import { fetchItinerary, deleteStopFromItinerary, fetchPlaces, addStopToItinerary, optimizeItinerary, generateItinerary, adaptItineraryForWeather } from "../data/api";
import { translations } from "../data/translations";

const localTranslations = {
  English: {
    itineraryOverview: "Itinerary Overview",
    totalDuration: "Total Duration",
    totalFees: "Total Entry Fees",
    categoryBreakdown: "Category Breakdown",
    routeSequence: "Route Sequence",
    selectTime: "Select Time",
    searchPlacesPlaceholder: "Search tourist places...",
    selectPlace: "Select a Place",
    addStopButton: "Add Stop",
    successAdded: "Stop successfully added!",
    noStopToOverview: "Add stops to your plan to see the overview.",
    stopsCount: "Stops",
    customDescription: "Optional Description / Note",
    confirmAdd: "Confirm Add Stop",
    viewSummary: "View Day Summary",
    aiTitle: "AI Itinerary Planner 🤖",
    aiSubtitle: "Let our AI craft your perfect custom trip!",
    aiDays: "Number of Days",
    aiPace: "Travel Pace",
    aiCategories: "What are your interests?",
    aiAccessible: "Wheelchair Accessible Spots Only",
    aiGenerating: "Punekar AI is crafting your dream itinerary...",
    aiGenerateBtn: "Generate Custom Plan 🤖",
    aiTipTitle: "🤖 Punekar AI Tip",
    relaxed: "Relaxed (3 stops/day)",
    adventure: "Adventure (5 stops/day)"
  },
  Marathi: {
    itineraryOverview: "सहलीचा आढावा",
    totalDuration: "एकूण वेळ",
    totalFees: "एकूण प्रवेश शुल्क",
    categoryBreakdown: "वर्गवारी विभागणी",
    routeSequence: "मार्ग अनुक्रम",
    selectTime: "वेळ निवडा",
    searchPlacesPlaceholder: "पर्यटन ठिकाणे शोधा...",
    selectPlace: "ठिकाण निवडा",
    addStopButton: "थांबा जोडा",
    successAdded: "थांबा यशस्वीरित्या जोडला गेला!",
    noStopToOverview: "आढावा पाहण्यासाठी तुमच्या नियोजनात थांबे जोडा.",
    stopsCount: "थांबे",
    customDescription: "पर्यायी वर्णन / टीप",
    confirmAdd: "थांबा निश्चित करा",
    viewSummary: "दिवसाचा सारांश पहा",
    aiTitle: "AI सहल नियोजन 🤖",
    aiSubtitle: "आमच्या AI द्वारे आपली परिपूर्ण सानुकूल सहल डिझाइन करा!",
    aiDays: "दिवसांची संख्या",
    aiPace: "सहलीचा वेग",
    aiCategories: "तुमच्या आवडीचे क्षेत्र?",
    aiAccessible: "फक्त व्हीलचेअर प्रवेशयोग्य ठिकाणे",
    aiGenerating: "पुणेकर AI आपला स्वप्नातील प्रवास नियोजित करत आहे...",
    aiGenerateBtn: "सानुकूल सहल जनरेट करा 🤖",
    aiTipTitle: "🤖 पुणेकर AI टीप",
    relaxed: "संतुलित (३ थांबे/दिवस)",
    adventure: "वेगवान (५ थांबे/दिवस)"
  },
  Hindi: {
    itineraryOverview: "यात्रा कार्यक्रम का अवलोकन",
    totalDuration: "कुल अवधि",
    totalFees: "कुल शुल्क",
    categoryBreakdown: "श्रेणी विवरण",
    routeSequence: "मार्ग अनुक्रम",
    selectTime: "समय चुनें",
    searchPlacesPlaceholder: "पर्यटन स्थलों की खोज करें...",
    selectPlace: "स्थान चुनें",
    addStopButton: "पड़ाव जोड़ें",
    successAdded: "पड़ाव सफलतापूर्वक जोड़ा गया!",
    noStopToOverview: "अवलोकन देखने के लिए पड़ाव जोड़ें।",
    stopsCount: "पड़ाव",
    customDescription: "वैकल्पिक विवरण / नोट",
    confirmAdd: "पड़ाव की पुष्टि करें",
    viewSummary: "दिन का सारांश देखें",
    aiTitle: "AI यात्रा योजनाकार 🤖",
    aiSubtitle: "हमारे AI को आपके लिए एक बेहतरीन यात्रा तैयार करने दें!",
    aiDays: "दिनों की संख्या",
    aiPace: "यात्रा की गति",
    aiCategories: "आपकी रुचि के क्षेत्र?",
    aiAccessible: "केवल व्हीलचेयर अनुकूल स्थान",
    aiGenerating: "पुणेकर AI आपकी सपनों की यात्रा की योजना बना रहा है...",
    aiGenerateBtn: "कस्टम यात्रा तैयार करें 🤖",
    aiTipTitle: "🤖 पुणेकर AI सुझाव",
    relaxed: "आरामदेह (3 पड़ाव/दिन)",
    adventure: "रोमांचक (5 पड़ाव/दिन)"
  },
  Gujarati: {
    itineraryOverview: "મુસાફરી ઝાંખી",
    totalDuration: "કુલ સમય",
    totalFees: "કુલ ફી",
    categoryBreakdown: "કેટેગરી વિગત",
    routeSequence: "માર્ગ ક્રમ",
    selectTime: "સમય પસંદ કરો",
    searchPlacesPlaceholder: "પર્યટન સ્થળો શોધો...",
    selectPlace: "સ્થળ પસંદ કરો",
    addStopButton: "સ્ટોપ ઉમેરો",
    successAdded: "સ્ટોપ સફળતાપૂર્વક ઉમેરાયો!",
    noStopToOverview: "ઝાંખી જોવા માટે સ્ટોપ ઉમેરો.",
    stopsCount: "સ્ટોપ્સ",
    customDescription: "વૈકલ્પિક વર્ણન / નોંધ",
    confirmAdd: "સ્ટોપની પુષ્ટિ કરો",
    viewSummary: "દિવસનો સારાંશ જુઓ",
    aiTitle: "AI મુસાફરી આયોજન 🤖",
    aiSubtitle: "અમારા AI ને તમારી સંપૂર્ણ મુસાફરી તૈયાર કરવા દો!",
    aiDays: "દિવસોની સંખ્યા",
    aiPace: "મુસાફરીની ઝડપ",
    aiCategories: "તમારા રસના વિષયો?",
    aiAccessible: "માત્ર વ્હીલચેર સુલભ સ્થળો",
    aiGenerating: "પુણેકર AI તમારી સપનાની મુસાફરીનું આયોજન કરી રહ્યું છે...",
    aiGenerateBtn: "કસ્ટમ પ્લાન બનાવો 🤖",
    aiTipTitle: "🤖 પુણેકર AI ટીપ",
    relaxed: "આરામદાયક (૩ સ્ટોપ/દિવસ)",
    adventure: "સાહસિક (૫ સ્ટોપ/દિવસ)"
  }
};

const parseEntryFee = (fee) => {
  if (!fee || fee.toLowerCase() === 'free' || fee === '—' || fee === '-') return 0;
  const match = fee.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const parseVisitTime = (time) => {
  if (!time) return 0;
  const match = time.match(/(\d+(\.\d+)?)\s*h/); // e.g. 2.5h, 1h
  if (match) return parseFloat(match[1]);
  const minMatch = time.match(/(\d+)\s*min/); // e.g. 45 min
  if (minMatch) return parseInt(minMatch[1], 10) / 60;
  return 1; // default fallback 1 hour
};

export default function PlanScreen({ userLocation, userLanguage, weatherData, onWeatherToggle, onPlaceSelect, onNavigateHome }) {
  const [activeDay, setActiveDay] = useState(0);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
  
  // Add Stop States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [stopTime, setStopTime] = useState("10:00 AM");
  const [customDesc, setCustomDesc] = useState("");
  const [optimizing, setOptimizing] = useState(false);

  // AI Generator States
  const [aiDays, setAiDays] = useState(2);
  const [aiPace, setAiPace] = useState("Relaxed");
  const [aiCategories, setAiCategories] = useState(["Heritage", "Temple", "Nature", "Food", "Wellness"]);
  const [aiAccessible, setAiAccessible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adaptingWeather, setAdaptingWeather] = useState(false);

  const t = translations[userLanguage] || translations.English;
  const lt = localTranslations[userLanguage] || localTranslations.English;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [itineraryData, placesData] = await Promise.all([
          fetchItinerary(),
          fetchPlaces()
        ]);
        setItineraryDays(itineraryData);
        setPlaces(placesData);
      } catch (error) {
        console.error("Failed to load plan screen data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const hasOutdoorStops = (day) => {
    if (!day || !Array.isArray(day.stops)) return false;
    const outdoorKeywords = [
      'fort', 'trek', 'hill', 'lake', 'tekdi', 'valley', 'outdoor', 
      'garden', 'waterfall', 'viewpoint', 'zoo', 'park', 'caves', 'trail'
    ];
    return day.stops.some(stop => {
      let isNature = false;
      if (Array.isArray(stop.tags)) {
        isNature = stop.tags.some(t => {
          if (typeof t === 'string') {
            return t.toLowerCase() === 'nature';
          }
          return t && (t.label === 'Nature' || t.type === 'nature');
        });
      }
      if (isNature) return true;
      const n = (stop.name || '').toLowerCase();
      const d = (stop.desc || '').toLowerCase();
      return outdoorKeywords.some(kw => n.includes(kw) || d.includes(kw));
    });
  };

  const handleAdaptWeather = async (dayId) => {
    setAdaptingWeather(true);
    try {
      const response = await adaptItineraryForWeather(dayId, userLanguage);
      if (response.success && response.swappedCount > 0) {
        const updatedData = await fetchItinerary();
        setItineraryDays(updatedData);
        let msg = '';
        if (userLanguage === 'Marathi') {
          msg = `यशस्वीरित्या ${response.swappedCount} ठिकाणे बदलली: ${response.swappedInfo.join(', ')}`;
        } else if (userLanguage === 'Hindi') {
          msg = `सफलतापूर्वक ${response.swappedCount} स्थान बदले गए: ${response.swappedInfo.join(', ')}`;
        } else if (userLanguage === 'Gujarati') {
          msg = `સફળતાપૂર્વક ${response.swappedCount} સ્ટોપ્સ બદલાયા: ${response.swappedInfo.join(', ')}`;
        } else {
          msg = `Successfully swapped ${response.swappedCount} spots: ${response.swappedInfo.join(', ')}`;
        }
        alert(msg);
      } else {
        alert(userLanguage === 'Marathi' ? "कोणतेही बदल आवश्यक नाहीत किंवा इनडोर पर्याय आढळले नाहीत." : "No outdoor stops found or no indoor alternatives available.");
      }
    } catch (err) {
      console.error("Failed to adapt weather:", err);
      alert(userLanguage === 'Marathi' ? "मार्ग बदलण्यात अयशस्वी" : "Failed to adapt itinerary");
    } finally {
      setAdaptingWeather(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Heritage":
        return "#8B3A2A";
      case "Temple":
        return "#B87318";
      case "Nature":
        return "#4A6741";
      case "Food":
        return "#15803D";
      case "Wellness":
        return "#0369A1";
      default:
        return "#6B5B52";
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case "Heritage": return "🏰";
      case "Temple": return "⛩️";
      case "Nature": return "🌲";
      case "Food": return "🥯";
      case "Wellness": return "🧘";
      default: return "📍";
    }
  };

  const handleDeleteStop = async (stopId, dayId) => {
    if (confirm(userLanguage === "Marathi" ? "तुम्हाला हा थांबा काढून टाकायचा आहे का?" : "Are you sure you want to remove this stop?")) {
      try {
        await deleteStopFromItinerary(stopId);
        setItineraryDays((prev) =>
          prev.map((d) => {
            if (d.id === dayId) {
              return {
                ...d,
                stops: d.stops.filter((s) => s.id !== stopId)
              };
            }
            return d;
          })
        );
      } catch (error) {
        console.error("Failed to delete stop:", error);
        alert("Failed to delete stop");
      }
    }
  };

  const handleAddStopSubmit = async () => {
    if (!selectedPlace) return;
    try {
      const day = itineraryDays[activeDay];
      if (!day) return;

      const stopData = {
        itineraryDayId: day.id,
        name: selectedPlace.name,
        name_mr: selectedPlace.name_mr || selectedPlace.name,
        time: stopTime,
        desc: customDesc || selectedPlace.description,
        desc_mr: selectedPlace.description_mr || selectedPlace.description,
        dotColor: getCategoryColor(selectedPlace.category),
        tags: [{ label: selectedPlace.category, type: selectedPlace.category.toLowerCase() }]
      };

      const newStop = await addStopToItinerary(stopData);

      setItineraryDays((prev) =>
        prev.map((d) => {
          if (d.id === day.id) {
            return {
              ...d,
              stops: [...d.stops, newStop]
            };
          }
          return d;
        })
      );

      setIsAddStopOpen(false);
      setSelectedPlace(null);
      setSearchQuery("");
      setCustomDesc("");
      setStopTime("10:00 AM");
    } catch (error) {
      console.error("Failed to add stop:", error);
      alert("Failed to add stop");
    }
  };

  const handleOptimize = async () => {
    const day = itineraryDays[activeDay];
    if (!day || day.stops.length < 3) return;
    
    setOptimizing(true);
    try {
      const optimizedStops = await optimizeItinerary(day.id, "Walking");
      setItineraryDays((prev) =>
        prev.map((d) => {
          if (d.id === day.id) {
            return {
              ...d,
              stops: optimizedStops
            };
          }
          return d;
        })
      );
      alert(userLanguage === "Marathi" ? "मार्ग यशस्वीरित्या सुधारा केला!" : "Route sequence successfully optimized!");
    } catch (error) {
      console.error("Failed to optimize route:", error);
      alert(userLanguage === "Marathi" ? "मार्ग सुधारण्यात अडचण आली." : "Failed to optimize route.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (aiCategories.length === 0) {
      alert(userLanguage === "Marathi" ? "कृपया किमान एक वर्गवारी निवडा." : 
            userLanguage === "Hindi" ? "कृपया कम से कम एक श्रेणी चुनें।" :
            userLanguage === "Gujarati" ? "કૃપા કરીને ઓછામાં ઓછી એક કેટેગરી પસંદ કરો." :
            "Please select at least one category.");
      return;
    }

    setGenerating(true);
    try {
      const generated = await generateItinerary({
        days: aiDays,
        categories: aiCategories,
        pace: aiPace,
        accessibleOnly: aiAccessible,
        userLanguage: userLanguage
      });
      setItineraryDays(generated);
      setActiveDay(0);
      setIsAiWizardOpen(false);
      alert(userLanguage === "Marathi" ? "सहल यशस्वीरित्या जनरेट केली!" : 
            userLanguage === "Hindi" ? "यात्रा सफलतापूर्वक तैयार की गई!" :
            userLanguage === "Gujarati" ? "મુસાફરી સફળતાપૂર્વક તૈયાર કરવામાં આવી!" :
            "Itinerary successfully generated!");
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      alert(userLanguage === "Marathi" ? "सहल जनरेट करण्यात अडचण आली." : 
            userLanguage === "Hindi" ? "यात्रा तैयार करने में विफल।" :
            userLanguage === "Gujarati" ? "મુસાફરી તૈયાર કરવામાં નિષ્ફળ." :
            "Failed to generate itinerary.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#FBF8F3", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8B3A2A", fontWeight: 600 }}>{t.planning}</div>
      </div>
    );
  }

  if (itineraryDays.length === 0) {
    return (
      <div style={{ background: "#FBF8F3", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8B3A2A", fontWeight: 600 }}>{userLanguage === "Marathi" ? "सहलीचा कार्यक्रम सापडला नाही." : "No itinerary found."}</div>
      </div>
    );
  }

  const day = itineraryDays[activeDay];

  // Overview stats calculation
  const totalStopsCount = day.stops.length;
  
  const totalDurationHours = day.stops.reduce((acc, stop) => {
    const matchedPlace = places.find(p => p.name.toLowerCase() === stop.name.toLowerCase());
    return acc + (matchedPlace ? parseVisitTime(matchedPlace.visitTime) : 1.0);
  }, 0);

  const totalEntryFeesCost = day.stops.reduce((acc, stop) => {
    const matchedPlace = places.find(p => p.name.toLowerCase() === stop.name.toLowerCase());
    return acc + (matchedPlace ? parseEntryFee(matchedPlace.entryFee) : 0);
  }, 0);

  const categoryBreakdown = day.stops.reduce((acc, stop) => {
    const matchedPlace = places.find(p => p.name.toLowerCase() === stop.name.toLowerCase());
    const cat = matchedPlace ? matchedPlace.category : "Heritage";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Places that are not in the current active day's itinerary
  const stopNamesLower = day.stops.map(s => s.name.toLowerCase());
  const availablePlaces = places.filter(p => !stopNamesLower.includes(p.name.toLowerCase()));

  // Search filtered places for Add Stop
  const filteredAvailablePlaces = availablePlaces.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMrMatch = p.name_mr ? p.name_mr.includes(searchQuery) : false;
    const descMatch = p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || nameMrMatch || descMatch;
  });

  const timeOptions = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", 
    "06:00 PM", "07:00 PM", "08:00 PM", "TBD"
  ];

  return (
    <div style={{ background: "#FBF8F3", height: "100%", overflowY: "auto", paddingBottom: 80, position: "relative" }}>
      <StatusBar light />
      <style>{`
        .custom-modal-fade {
          animation: modalFadeIn 0.25s ease-out forwards;
        }
        .custom-modal-slide {
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .hover-scale {
          transition: transform 0.2s;
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
      `}</style>

      {/* Hero / Header */}
      <div
        style={{
          background: "#8B3A2A",
          padding: "20px 20px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  title={t.home || "Home"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    backdropFilter: "blur(4px)",
                    transition: "all 0.2s"
                  }}
                >
                  <Home size={18} />
                </button>
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{t.myPlan}</span>
              <span
                style={{
                  fontSize: 10,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  padding: "2px 8px",
                  color: "#fff",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3
                }}
              >
                {weatherData?.weather === "Sunny" ? "☀️" : "🌧️"} {weatherData?.temp}°C
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>
              {day.stops.length} {t.stops} · Pune, MH
            </div>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: t.myPlan,
                  text: "Check out my Pune travel plan!",
                  url: window.location.href,
                }).catch(console.error);
              } else {
                alert("Sharing is not supported on this browser.");
              }
            }}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 10,
              padding: "6px 10px",
              fontSize: 11,
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t.share} ↗
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ background: "#8B3A2A", padding: "0 16px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        {itineraryDays.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDay(i)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              border: "none",
              cursor: "pointer",
              background: activeDay === i ? "#fff" : "rgba(255,255,255,0.2)",
              color: activeDay === i ? "#8B3A2A" : "rgba(255,255,255,0.85)",
            }}
          >
            {d.label}
          </button>
        ))}
        <button
          onClick={() => setIsAiWizardOpen(true)}
          style={{
            padding: "7px 16px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #FFB03A, #C46348)",
            color: "#fff",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          {userLanguage === "Marathi" ? "AI नियोजन 🤖" :
           userLanguage === "Hindi" ? "AI योजनाकार 🤖" :
           userLanguage === "Gujarati" ? "AI આયોજન 🤖" :
           "AI Planner 🤖"}
        </button>
        <button
          onClick={() => setIsOverviewOpen(true)}
          style={{
            padding: "7px 16px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: "rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.85)",
            whiteSpace: "nowrap"
          }}
        >
          {t.overview} 📊
        </button>
        {day.stops.length >= 3 && (
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)",
              whiteSpace: "nowrap",
              opacity: optimizing ? 0.6 : 1
            }}
          >
            {optimizing ? "..." : (userLanguage === "Marathi" ? "मार्ग सुधारा" : "Optimize Route")} ⚡
          </button>
        )}
      </div>

      {/* Timeline */}
      <div style={{ padding: "24px 20px", background: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, position: "relative", zIndex: 5 }}>
        {weatherData?.weather === "Rainy" && hasOutdoorStops(day) && (
          <div
            style={{
              background: "linear-gradient(135deg, #FFF5F5 0%, #FFF0F0 100%)",
              border: "1px solid #FEB2B2",
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🌧️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C53030" }}>
                  {userLanguage === "Marathi" ? "पुण्यात पाऊस सुरू आहे!" : 
                   userLanguage === "Hindi" ? "पुणे में बारिश हो रही है!" :
                   userLanguage === "Gujarati" ? "પુણેમાં વરસાદ પડી રહ્યો છે!" :
                   "It's Raining in Pune!"}
                </div>
                <div style={{ fontSize: 11, color: "#9B2C2C", marginTop: 2, lineHeight: 1.4 }}>
                  {userLanguage === "Marathi" ? "तुमच्या प्रवासात बाहेरील ठिकाणे समाविष्ट आहेत. निसरडे रस्ते टाळण्यासाठी घरातील सुरक्षित ठिकाणी बदला." : 
                   userLanguage === "Hindi" ? "आपकी यात्रा में बाहरी स्थान शामिल हैं। फिसलन वाले रास्तों से बचने के लिए इनडोर स्थानों पर स्विच करें।" :
                   userLanguage === "Gujarati" ? "તમારા પ્રવાસમાં બહારના સ્થળો શામેલ છે. ઇન્ડોર સ્થળો પર બદલો." :
                   "Your active day includes outdoor stops. We recommend swapping them for indoor alternatives to stay dry."}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleAdaptWeather(day.id)}
              disabled={adaptingWeather}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#E53E3E",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 2px 4px rgba(229,62,62,0.2)",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#C53030"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#E53E3E"}
            >
              {adaptingWeather ? (
                userLanguage === "Marathi" ? "मार्ग जुळवत आहे..." : "Adapting Route..."
              ) : (
                <>
                  <span>🌦️</span>
                  <span>
                    {userLanguage === "Marathi" ? "हवामानानुसार मार्ग बदला (घरातील पर्याय)" : 
                     userLanguage === "Hindi" ? "मौसम के अनुसार बदलें (इनडोर विकल्प)" :
                     userLanguage === "Gujarati" ? "હવામાન અનુકૂલન (ઇન્ડોર વિકલ્પો)" :
                     "Adapt Route for Weather (Indoor Swap)"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {day.stops.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: colors.inkMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {userLanguage === "Marathi" ? "या दिवशी कोणतेही थांबे नाहीत." : "No stops added for this day yet."}
            </div>
            <div style={{ fontSize: 11, color: colors.inkMuted, marginTop: 4 }}>
              {userLanguage === "Marathi" ? "सुरुवात करण्यासाठी खालील 'थांबा जोडा' वर क्लिक करा." : "Click '+ Add a stop' below to get started."}
            </div>
          </div>
        ) : (
          day.stops.map((stop, i) => (
            <div key={stop.id} style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative" }}>
              {/* Time */}
              <div style={{ width: 45, fontSize: 11, fontWeight: 700, color: "#8B3A2A", paddingTop: 2 }}>
                {stop.time}
              </div>

              {/* Dot & Line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: stop.dotColor || colors.wadaRed, zIndex: 2 }} />
                {i !== day.stops.length - 1 && (
                  <div style={{ width: 1.5, flex: 1, background: "#EDE8DF", margin: "4px 0" }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1412", paddingRight: 8 }}>
                    {userLanguage === "Marathi" && stop.name_mr ? stop.name_mr : stop.name}
                  </div>
                  <button
                    onClick={() => handleDeleteStop(stop.id, day.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8B3A2A",
                      fontSize: 12,
                      cursor: "pointer",
                      padding: "2px 6px",
                    }}
                  >
                    🗑️
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#6B5B52", marginTop: 4, lineHeight: 1.5 }}>
                  {userLanguage === "Marathi" && stop.desc_mr ? stop.desc_mr : stop.desc}
                </div>
                <div style={{ marginTop: 6 }}>
                  <button
                    onClick={() => {
                      const query = encodeURIComponent(`${stop.name}, Pune`);
                      window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 8,
                      background: "#F2EAE7",
                      color: "#8B3A2A",
                      fontSize: 10,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    🧭 {userLanguage === "Marathi" ? "दिशा" : "Directions"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {Array.isArray(stop.tags) && stop.tags.map((tag, idx) => {
                    const isStr = typeof tag === 'string';
                    const label = isStr ? tag : tag.label;
                    const type = isStr ? tag.toLowerCase() : (tag.type || 'neutral');
                    const style = tagStyles[type] || tagStyles.neutral;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          background: style.bg,
                          color: style.color,
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
                {Array.isArray(stop.tags) && stop.tags.find(t => t.type === "ai")?.reason && (
                  <div style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#FDF9F2",
                    borderLeft: `3px solid #D4AF37`,
                    fontSize: 11,
                    color: "#6B5B52",
                    lineHeight: 1.4
                  }}>
                    <strong style={{ color: "#B87318", display: "block", marginBottom: 3 }}>
                      {lt.aiTipTitle}
                    </strong>
                    {stop.tags.find(t => t.type === "ai").reason}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add stop button */}
      <div style={{ padding: "16px 16px 8px", background: "#fff" }}>
        <button
          onClick={() => setIsAddStopOpen(true)}
          style={{
            width: "100%",
            background: "#FBF8F3",
            color: "#8B3A2A",
            border: "1.5px dashed #C46348",
            borderRadius: 14,
            padding: "12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          + {t.addStop}
        </button>
      </div>

      {/* 📊 ITINERARY OVERVIEW MODAL */}
      {isOverviewOpen && (
        <div 
          className="custom-modal-fade"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            backdropFilter: "blur(4px)"
          }}
        >
          <div 
            className="custom-modal-slide"
            style={{ 
              background: "#fff", width: "100%", maxWidth: 380, borderRadius: 24, 
              padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", maxHeight: "85vh", overflowY: "auto"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: colors.ink }}>{lt.itineraryOverview}</div>
                <div style={{ fontSize: 12, color: colors.inkMuted }}>{day.label}</div>
              </div>
              <button 
                onClick={() => setIsOverviewOpen(false)}
                style={{ background: colors.stoneDark, border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            {totalStopsCount === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: colors.inkMuted, fontSize: 13 }}>
                {lt.noStopToOverview}
              </div>
            ) : (
              <div>
                {/* Stats cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <div style={{ background: colors.wadaRedLight, padding: 12, borderRadius: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.wadaRed }}>{totalStopsCount}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: colors.inkMuted, textTransform: "uppercase" }}>{lt.stopsCount}</div>
                  </div>
                  <div style={{ background: colors.puneGreenLight, padding: 12, borderRadius: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.puneGreen }}>{totalDurationHours.toFixed(1)} h</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: colors.inkMuted, textTransform: "uppercase" }}>{lt.totalDuration}</div>
                  </div>
                  <div style={{ background: colors.clayLight, padding: 12, borderRadius: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.clay }}>{totalEntryFeesCost > 0 ? `₹${totalEntryFeesCost}` : "Free"}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: colors.inkMuted, textTransform: "uppercase" }}>{lt.totalFees}</div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 10 }}>{lt.categoryBreakdown}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(categoryBreakdown).map(([cat, count]) => (
                      <div 
                        key={cat}
                        style={{
                          background: colors.stoneDark,
                          borderRadius: 8,
                          padding: "6px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: colors.ink,
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span>{getCategoryEmoji(cat)}</span>
                        <span>{userLanguage === "Marathi" ? (translations.Marathi[cat.toLowerCase()] || cat) : cat}</span>
                        <span style={{ color: colors.wadaRed, fontWeight: 700 }}>({count})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route sequence timeline */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>{lt.routeSequence}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {day.stops.map((stop, index) => (
                      <div 
                        key={stop.id} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 12,
                          background: "#FBF8F3",
                          padding: "10px 14px",
                          borderRadius: 12,
                          borderLeft: `4px solid ${stop.dotColor || colors.wadaRed}`
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: colors.inkMuted, width: 14 }}>{index + 1}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {userLanguage === "Marathi" && stop.name_mr ? stop.name_mr : stop.name}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: colors.wadaRed, background: "#fff", padding: "2px 6px", borderRadius: 6, border: "1px solid #EDE8DF" }}>
                          {stop.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📅 ADD A STOP MODAL */}
      {isAddStopOpen && (
        <div 
          className="custom-modal-fade"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            backdropFilter: "blur(4px)"
          }}
        >
          <div 
            className="custom-modal-slide"
            style={{ 
              background: "#fff", width: "100%", maxWidth: 380, borderRadius: 24, 
              padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", maxHeight: "85vh", display: "flex", flexDirection: "column"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: colors.ink }}>{lt.confirmAdd}</div>
                <div style={{ fontSize: 11, color: colors.inkMuted }}>{day.label}</div>
              </div>
              <button 
                onClick={() => {
                  setIsAddStopOpen(false);
                  setSelectedPlace(null);
                  setSearchQuery("");
                }}
                style={{ background: colors.stoneDark, border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            {/* Place Selection Screen */}
            {!selectedPlace ? (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                {/* Search Bar */}
                <input 
                  type="text"
                  placeholder={lt.searchPlacesPlaceholder || "Search or type a custom place name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${colors.stoneDark}`,
                    fontSize: 13, outline: "none", background: "#FBF8F3", marginBottom: 12
                  }}
                />

                {/* Quick Add Custom Name Button if user typed a name */}
                {searchQuery.trim().length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedPlace({
                        id: Date.now(),
                        name: searchQuery.trim(),
                        name_mr: searchQuery.trim(),
                        category: "Custom",
                        emoji: "📍",
                        description: "Custom spot added to itinerary",
                        rating: 5.0
                      });
                    }}
                    style={{
                      background: "linear-gradient(135deg, #8B3A2A, #A94432)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(139,58,42,0.3)"
                    }}
                  >
                    <span>➕ Add Custom Spot: "{searchQuery.trim()}"</span>
                  </button>
                )}

                {/* Places List */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }} className="no-scrollbar">
                  {filteredAvailablePlaces.length === 0 ? (
                    <div style={{ textAlign: "center", color: colors.inkMuted, fontSize: 12, padding: "20px 0" }}>
                      {searchQuery.trim().length === 0 ? (t.noPlaces || "No places available to add.") : `Tap the button above to add "${searchQuery.trim()}" to your plan!`}
                    </div>
                  ) : (
                    filteredAvailablePlaces.map((place) => (
                      <div 
                        key={place.id}
                        onClick={() => setSelectedPlace(place)}
                        className="hover-scale"
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
                          border: "1px solid #EDE8DF", cursor: "pointer", background: "#fff",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: place.bgColor || colors.wadaRedLight, display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 18, justifyContent: "center", flexShrink: 0 }}>
                          {place.emoji || "📍"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {userLanguage === "Marathi" && place.name_mr ? place.name_mr : place.name}
                          </div>
                          <div style={{ fontSize: 10, color: colors.inkMuted, marginTop: 2 }}>
                            ⭐ {place.rating} · {userLanguage === "Marathi" ? (translations.Marathi[place.category.toLowerCase()] || place.category) : place.category}
                          </div>
                        </div>
                        <div style={{ fontSize: 16, color: colors.wadaRed }}>＋</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Time Selection Screen */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Selected Place Card */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: colors.stone, border: "1px solid #EDE8DF" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: selectedPlace.bgColor || colors.wadaRedLight, display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 20, justifyContent: "center" }}>
                    {selectedPlace.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.ink }}>
                      {userLanguage === "Marathi" && selectedPlace.name_mr ? selectedPlace.name_mr : selectedPlace.name}
                    </div>
                    <div style={{ fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>
                      {selectedPlace.address || selectedPlace.category}
                    </div>
                  </div>
                </div>

                {/* Time selector */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkMuted, marginBottom: 8 }}>{lt.selectTime}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {timeOptions.slice(0, 12).map((time) => (
                      <button
                        key={time}
                        onClick={() => setStopTime(time)}
                        style={{
                          padding: "6px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                          background: stopTime === time ? colors.wadaRed : colors.stoneDark,
                          color: stopTime === time ? "#fff" : colors.ink,
                          transition: "0.2s"
                        }}
                      >
                        {time.replace(" AM", "").replace(" PM", "")} {time.includes("AM") ? "AM" : "PM"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note/Description */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkMuted, marginBottom: 6 }}>{lt.customDescription}</div>
                  <textarea 
                    rows={2}
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder={userLanguage === "Marathi" ? "उदा. शनिवार वाड्याची माहिती मिळवणे..." : "e.g., Explore the Peshwa museum inside..."}
                    style={{
                      width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.stoneDark}`,
                      fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit"
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button 
                    onClick={() => setSelectedPlace(null)}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${colors.stoneDark}`, background: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                  >
                    {t.cancel || "Back"}
                  </button>
                  <button 
                    onClick={handleAddStopSubmit}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: colors.wadaRed, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                  >
                    {lt.confirmAdd}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🤖 AI ITINERARY GENERATOR WIZARD MODAL */}
      {isAiWizardOpen && (
        <div 
          className="custom-modal-fade"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            backdropFilter: "blur(4px)"
          }}
        >
          <div 
            className="custom-modal-slide"
            style={{ 
              background: "#fff", width: "100%", maxWidth: 380, borderRadius: 24, 
              padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: colors.ink }}>{lt.aiTitle}</div>
                <div style={{ fontSize: 11, color: colors.inkMuted }}>{lt.aiSubtitle}</div>
              </div>
              <button 
                onClick={() => setIsAiWizardOpen(false)}
                disabled={generating}
                style={{ background: colors.stoneDark, border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            {generating ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 2s linear infinite" }}>⚙️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.wadaRed }}>{lt.aiGenerating}</div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Number of Days */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkMuted, marginBottom: 8 }}>{lt.aiDays}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[1, 2, 3].map(d => (
                      <button
                        key={d}
                        onClick={() => setAiDays(d)}
                        style={{
                          flex: 1, padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                          border: "none", cursor: "pointer",
                          background: aiDays === d ? colors.wadaRed : colors.stoneDark,
                          color: aiDays === d ? "#fff" : colors.ink,
                          transition: "0.2s"
                        }}
                      >
                        {d} {d === 1 ? (userLanguage === "Marathi" ? "दिवस" : "Day") : (userLanguage === "Marathi" ? "दिवस" : "Days")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Pace */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkMuted, marginBottom: 8 }}>{lt.aiPace}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["Relaxed", "Adventure"].map(pace => (
                      <button
                        key={pace}
                        onClick={() => setAiPace(pace)}
                        style={{
                          flex: 1, padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                          border: "none", cursor: "pointer",
                          background: aiPace === pace ? colors.wadaRed : colors.stoneDark,
                          color: aiPace === pace ? "#fff" : colors.ink,
                          transition: "0.2s"
                        }}
                      >
                        {pace === "Relaxed" ? lt.relaxed : lt.adventure}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Checkboxes */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkMuted, marginBottom: 8 }}>{lt.aiCategories}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["Heritage", "Temple", "Nature", "Food", "Wellness"].map(cat => {
                      const isSelected = aiCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setAiCategories(prev => 
                              isSelected ? prev.filter(c => c !== cat) : [...prev, cat]
                            );
                          }}
                          style={{
                            padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                            border: isSelected ? "none" : `1px solid ${colors.stoneDark}`, cursor: "pointer",
                            background: isSelected ? colors.paithaniGold : "none",
                            color: isSelected ? "#fff" : colors.inkMuted,
                            transition: "0.2s",
                            display: "flex", alignItems: "center", gap: 4
                          }}
                        >
                          <span>{getCategoryEmoji(cat)}</span>
                          <span>{userLanguage === "Marathi" ? (translations.Marathi[cat.toLowerCase()] || cat) : cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wheelchair accessibility */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 14, background: colors.stone, border: "1px solid #EDE8DF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>♿</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>{lt.aiAccessible}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiAccessible}
                    onChange={(e) => setAiAccessible(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: colors.wadaRed, cursor: "pointer" }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button 
                    onClick={() => setIsAiWizardOpen(false)}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${colors.stoneDark}`, background: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                  >
                    {t.cancel || "Cancel"}
                  </button>
                  <button 
                    onClick={handleGenerateItinerary}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #FFB03A, #8B3A2A)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                  >
                    {lt.aiGenerateBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
