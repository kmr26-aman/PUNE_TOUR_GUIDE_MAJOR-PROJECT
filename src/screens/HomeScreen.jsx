import { useState, useEffect } from "react";
import StatusBar from "../components/StatusBar";
import PlaceCard from "../components/PlaceCard";
import SosModal from "../components/SosModal";
import { categories } from "../data/puneData";
import { fetchPlaces, fetchEvents } from "../data/api";
import { translations } from "../data/translations";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { 
  Search, Mic, Bell, Navigation, MapPin, Calendar, Heart, Bookmark, 
  Sparkles, PhoneCall, Compass, Hotel, Utensils, Car, Landmark, 
  Share2, Plus, QrCode, Camera, X, Ticket, ChevronRight, Wind, ShieldAlert,
  Calculator, Wallet, DollarSign, PlusCircle, Trash2, Users, Receipt, Clock, Check,
  Bot, MessageSquare, AlertCircle, ChevronLeft, PartyPopper, ChevronDown, ChevronUp, Play,
  Crosshair, LocateFixed
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const AI_RECOMMENDATIONS = [
  { id: 1, title: "Shaniwar Wada Morning Heritage Walk", match: "98% AI Match", time: "2 Hours", desc: "Best visited at 8:00 AM before crowds.", image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=400&q=80" },
  { id: 2, title: "Goodluck Cafe Irani Chai & Bun Maska", match: "95% AI Match", time: "1 Hour", desc: "Iconic Punekar breakfast spot on FC Road.", image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=400&q=80" },
  { id: 3, title: "Aga Khan Palace Architecture Tour", match: "92% AI Match", time: "1.5 Hours", desc: "Peaceful gardens & freedom movement history.", image: "https://images.unsplash.com/photo-1609828913647-7576722d36d2?auto=format&fit=crop&w=400&q=80" },
];

const RECENT_SEARCHES = ["Shaniwar Wada", "Goodluck Cafe", "Sinhagad Fort Trek", "Dagdusheth Ganpati", "Koregaon Park"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Leaflet Custom Pin Icon
const pinIcon = L.divIcon({
  className: "custom-map-picker-pin",
  html: `<div style="background-color: #8B3A2A; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"><span style="color: white; font-size: 18px;">📍</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

// Helper component for handling Leaflet click events & map panning
function MapEventsHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Reverse Geocoding Helper for Pune Areas
function resolvePuneAddress(lat, lng) {
  if (Math.abs(lat - 18.5204) < 0.02 && Math.abs(lng - 73.8567) < 0.02) return "Shivajinagar, Pune";
  if (Math.abs(lat - 18.5186) < 0.02 && Math.abs(lng - 73.8427) < 0.02) return "FC Road, Deccan, Pune";
  if (Math.abs(lat - 18.5074) < 0.02 && Math.abs(lng - 73.8077) < 0.02) return "Kothrud, Pune";
  if (Math.abs(lat - 18.5679) < 0.02 && Math.abs(lng - 73.9143) < 0.02) return "Viman Nagar, Pune";
  if (Math.abs(lat - 18.5590) < 0.02 && Math.abs(lng - 73.7868) < 0.02) return "Baner, Pune";
  if (Math.abs(lat - 18.4988) < 0.02 && Math.abs(lng - 73.8580) < 0.02) return "Swargate, Pune";
  if (Math.abs(lat - 18.5362) < 0.02 && Math.abs(lng - 73.8940) < 0.02) return "Koregaon Park, Pune";
  return `Live Pin (${lat.toFixed(4)}, ${lng.toFixed(4)}), Pune`;
}

export default function HomeScreen({ onPlaceSelect, onSearchClick, userLocation, userLanguage, weatherData, isDarkMode }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Nearby Events expansion state (Show MAX 2 by default)
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Today's Itinerary Expandable One-Liner State
  const [isTodayItineraryExpanded, setIsTodayItineraryExpanded] = useState(false);

  // Live Location State with Real-Time Map Location Picker
  const [currentLocationName, setCurrentLocationName] = useState(() => localStorage.getItem("pune_user_selected_loc") || "Shivajinagar, Pune");
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Interactive Map Picker State
  const [mapPickerCoords, setMapPickerCoords] = useState({ lat: 18.5204, lng: 73.8567 });
  const [mapPickerAddress, setMapPickerAddress] = useState("Shivajinagar, Pune");

  // Ask Aamhi AI Assistant Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Real-Time Live Clock State (Day, Date, Year & Time)
  const [liveDateTime, setLiveDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveDateTime = liveDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }) + " • " + liveDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  // UI Modals & Voice State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showExpenseTrackerModal, setShowExpenseTrackerModal] = useState(false);
  const [showPlanCalendarModal, setShowPlanCalendarModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState("hotels");

  // 💰 Expense Tracker & Contri Calculator State
  const [tripBudget, setTripBudget] = useState(() => Number(localStorage.getItem("pune_trip_budget")) || 3000);
  const [expensesList, setExpensesList] = useState(() => {
    const saved = localStorage.getItem("pune_trip_expenses");
    return saved ? JSON.parse(saved) : [
      { id: 1, title: "Goodluck Cafe Chai & Bun Maska", amount: 180, category: "Food ☕" },
      { id: 2, title: "Uber Cab to Shaniwar Wada", amount: 240, category: "Transport 🚕" },
      { id: 3, title: "Entry Ticket & Audio Guide", amount: 100, category: "Tickets 🎟️" }
    ];
  });
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpCategory, setNewExpCategory] = useState("Food ☕");
  const [splitBillAmount, setSplitBillAmount] = useState("");
  const [splitPeopleCount, setSplitPeopleCount] = useState("4");

  // 📅 Dynamic Month, Day, Year Real-Time Calendar Planner State
  const [calSelectedYear, setCalSelectedYear] = useState(2026);
  const [calSelectedMonthIdx, setCalSelectedMonthIdx] = useState(7); // 7 = August
  const [calSelectedDay, setCalSelectedDay] = useState(5); // 5th

  const [plannedCalendarEvents, setPlannedCalendarEvents] = useState(() => {
    const saved = localStorage.getItem("pune_planned_calendar_events_v2");
    return saved ? JSON.parse(saved) : [
      { id: 201, year: 2026, month: 7, day: 5, time: "08:30 AM", title: "Shaniwar Wada Heritage Walk", category: "Heritage 🚩", cost: 250, hours: 3, status: "LIVE NOW" },
      { id: 202, year: 2026, month: 7, day: 5, time: "01:00 PM", title: "Goodluck Cafe Misal & Irani Chai", category: "Food ☕", cost: 180, hours: 1, status: "NEXT STOP" },
      { id: 203, year: 2026, month: 7, day: 5, time: "07:00 PM", title: "Dagdusheth Ganpati Evening Aarti", category: "Cultural 🎭", cost: 50, hours: 1.5, status: "UPCOMING" },
      { id: 204, year: 2026, month: 7, day: 15, time: "06:00 AM", title: "Sinhagad Fort Sunrise Trek & Pitla Bhakri", category: "Trek ⛰️", cost: 350, hours: 4, status: "UPCOMING" }
    ];
  });

  const [newCalTitle, setNewCalTitle] = useState("");
  const [newCalCategory, setNewCalCategory] = useState("Heritage 🚩");
  const [newCalCost, setNewCalCost] = useState("");
  const [newCalHours, setNewCalHours] = useState("2");

  const t = translations[userLanguage] || translations.English;

  // Real-time live location map sync
  useEffect(() => {
    if (userLocation?.address) {
      setCurrentLocationName(userLocation.address);
    } else if (userLocation?.city) {
      setCurrentLocationName(`${userLocation.city}, Pune`);
    }
  }, [userLocation]);

  // Handle Location Picker change on map click
  const handleMapPickerClick = (lat, lng) => {
    setMapPickerCoords({ lat, lng });
    const resolved = resolvePuneAddress(lat, lng);
    setMapPickerAddress(resolved);
  };

  // Detect real GPS location on device
  const handleDetectGpsLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Detecting your GPS location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss();
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapPickerCoords({ lat, lng });
          const resolved = resolvePuneAddress(lat, lng);
          setMapPickerAddress(resolved);
          toast.success("GPS Location Detected!");
        },
        (error) => {
          toast.dismiss();
          toast.error("GPS detection failed. Click anywhere on the map pin.");
        }
      );
    } else {
      toast.error("Geolocation not supported by browser");
    }
  };

  // Confirm Location selection from Map
  const handleConfirmMapLocation = () => {
    setCurrentLocationName(mapPickerAddress);
    localStorage.setItem("pune_user_selected_loc", mapPickerAddress);
    setShowLocationModal(false);
    toast.success(`Location set to ${mapPickerAddress}!`);
  };

  // Persist expenses & calendar
  useEffect(() => {
    localStorage.setItem("pune_trip_expenses", JSON.stringify(expensesList));
  }, [expensesList]);

  useEffect(() => {
    localStorage.setItem("pune_trip_budget", tripBudget.toString());
  }, [tripBudget]);

  useEffect(() => {
    localStorage.setItem("pune_planned_calendar_events_v2", JSON.stringify(plannedCalendarEvents));
  }, [plannedCalendarEvents]);

  const totalSpent = expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBudget = tripBudget - totalSpent;
  const perPersonContri = (Number(splitBillAmount || 0) / Math.max(1, Number(splitPeopleCount || 1))).toFixed(2);

  // Dynamic Days In Month calculation
  const getDaysInMonth = (monthIdx, year) => {
    return new Date(year, monthIdx + 1, 0).getDate();
  };

  const daysInCurrentMonth = getDaysInMonth(calSelectedMonthIdx, calSelectedYear);
  const calendarDaysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  // Filter events for selected date
  const eventsForSelectedDate = plannedCalendarEvents.filter(
    ev => ev.year === calSelectedYear && ev.month === calSelectedMonthIdx && ev.day === calSelectedDay
  );

  // DYNAMIC TODAY'S EVENTS (matching 2026, August 5th)
  const eventsForToday = plannedCalendarEvents.filter(
    ev => ev.year === 2026 && ev.month === 7 && ev.day === 5
  );

  const totalDayCost = eventsForSelectedDate.reduce((sum, ev) => sum + Number(ev.cost || 0), 0);
  const totalDayHours = eventsForSelectedDate.reduce((sum, ev) => sum + Number(ev.hours || 0), 0);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount || Number(newExpAmount) <= 0) {
      toast.error("Please enter a valid expense title and amount");
      return;
    }
    const item = {
      id: Date.now(),
      title: newExpTitle.trim(),
      amount: Number(newExpAmount),
      category: newExpCategory,
    };
    setExpensesList([item, ...expensesList]);
    setNewExpTitle("");
    setNewExpAmount("");
    toast.success(`Added ₹${item.amount} for ${item.title}!`);
  };

  const handleDeleteExpense = (id) => {
    setExpensesList(expensesList.filter((item) => item.id !== id));
    toast.success("Expense item deleted!");
  };

  // Add Calendar Note/Event
  const handleAddCalendarEvent = (e) => {
    e.preventDefault();
    if (!newCalTitle.trim()) {
      toast.error("Please enter an event or note title");
      return;
    }
    const eventObj = {
      id: Date.now(),
      year: calSelectedYear,
      month: calSelectedMonthIdx,
      day: calSelectedDay,
      time: "10:00 AM",
      title: newCalTitle.trim(),
      category: newCalCategory,
      cost: Number(newCalCost) || 0,
      hours: Number(newCalHours) || 1,
      status: "UPCOMING"
    };
    setPlannedCalendarEvents([eventObj, ...plannedCalendarEvents]);
    setNewCalTitle("");
    setNewCalCost("");
    toast.success(`Scheduled on ${MONTH_NAMES[calSelectedMonthIdx]} ${calSelectedDay}, ${calSelectedYear}!`);
  };

  const handleDeleteCalendarEvent = (id) => {
    setPlannedCalendarEvents(plannedCalendarEvents.filter(ev => ev.id !== id));
    toast.success("Scheduled note deleted!");
  };

  // AI Assistant Query Handler
  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    setTimeout(() => {
      setAiLoading(false);
      setAiResponse(
        `🤖 Aamhi AI Guide: For "${aiQuery}", I recommend starting at Shaniwar Wada at 8:30 AM, enjoying Misal at Bedekar, and visiting Dagdusheth Ganpati by 5:00 PM!`
      );
    }, 1200);
  };

  // Time-based greeting helper
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return userLanguage === "Marathi" ? "शुभ सकाळ, पुणेकर!" : "Good Morning, Punekar!";
    if (hour < 17) return userLanguage === "Marathi" ? "शुभ दुपार, पुणेकर!" : "Good Afternoon, Punekar!";
    return userLanguage === "Marathi" ? "शुभ संध्याकाळ, पुणेकर!" : "Good Evening, Punekar!";
  };

  const userName = localStorage.getItem("pune_user_name") || "Explorer";
  const userAvatar = localStorage.getItem("pune_user_avatar") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [placesData, eventsData] = await Promise.all([
          fetchPlaces({ category: activeCategory }),
          fetchEvents()
        ]);
        setPlaces(placesData);
        setEvents(eventsData);
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeCategory]);

  const handleVoiceSearch = () => {
    setIsVoiceSearching(true);
    toast.success("Listening... Speak search query (e.g. Shaniwar Wada)");
    setTimeout(() => {
      setIsVoiceSearching(false);
      onSearchClick({ query: "Shaniwar Wada" });
    }, 2500);
  };

  const bgMain = isDarkMode ? "bg-[#181311] text-[#FAF6F0]" : "bg-[#FBF8F3] text-[#1C1412]";
  const bgCard = isDarkMode ? "bg-[#241E1C] border-[#362D2A]" : "bg-white border-gray-200";
  const textTitle = isDarkMode ? "text-white" : "text-gray-900";

  // Limit nearby events to MAX 2 by default
  const displayedEvents = showAllEvents ? events : events.slice(0, 2);

  // Build compact one-liner text for today's itinerary
  const todaySummaryOneLiner = eventsForToday.length > 0
    ? `Today (${eventsForToday.length} Scheduled): ${eventsForToday.map(e => e.title).join(" • ")}`
    : "Today: Shaniwar Wada Walk (8 AM) • Goodluck Cafe (1 PM) • Dagdusheth Aarti (7 PM)";

  return (
    <div className={`h-full w-full min-h-0 ${bgMain} flex flex-col overflow-y-auto pb-28 transition-colors duration-200 relative`} style={{ height: "100%", overflowY: "auto" }}>
      <Toaster />
      <StatusBar light={!isDarkMode} />

      {/* Enhanced Hero Header Section */}
      <div className="bg-gradient-to-br from-[#8B3A2A] via-[#742E20] to-[#5C2317] text-white p-4 pt-5 pb-5 relative overflow-hidden shadow-md flex-shrink-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          {/* Top Bar: Dynamic Live Location with Real-Time Map Picker */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/15">
              <MapPin size={13} className="text-amber-400 animate-pulse" />
              <span className="truncate max-w-[130px]">{currentLocationName}</span>
              <button
                onClick={() => setShowLocationModal(true)}
                className="p-1 rounded-full bg-white/15 hover:bg-white/30 text-amber-300 hover:text-white transition-all ml-1 flex items-center justify-center"
                title="Change Location on Map"
              >
                <Compass size={14} className="hover:rotate-45 transition-transform" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSosModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md animate-pulse flex items-center gap-1 text-[11px] font-black px-2.5"
              >
                <ShieldAlert size={14} />
                <span>SOS</span>
              </button>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-white/15 hover:bg-white/25 transition-all text-white"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#8B3A2A]" />
              </button>
            </div>
          </div>

          {/* 👋 Dynamic Greeting + User Info & Ask AI (Prominent & Unobstructed) */}
          <div className="flex items-center justify-between my-3">
            <div className="flex items-center gap-3">
              <img
                src={userAvatar}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md flex-shrink-0"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                }}
              />
              <div>
                <h1 className="text-lg font-black leading-tight flex items-center gap-1.5 text-white">
                  <span>{getGreetingTime()}</span>
                </h1>
                <p className="text-xs text-amber-200 font-bold mt-0.5">
                  Welcome back, {userName}! 👋
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAiModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all min-w-[68px] flex-shrink-0"
            >
              <Bot size={18} />
              <span className="leading-none text-[9px]">Ask Aamhi AI</span>
            </button>
          </div>

          {/* 🌦️ WEATHER & TEMP STATUS BAR */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold">
              <span>{weatherData?.weather === "Sunny" ? "☀️" : "🌧️"}</span>
              <span>{weatherData?.temp || 32}°C</span>
              <span className="text-white/70">• {weatherData?.weather || "Sunny"}</span>
            </div>

            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
              <Wind size={12} />
              <span>AQI 42 (Good)</span>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
              <Clock size={12} className="text-amber-300 animate-pulse" />
              <span>{formattedLiveDateTime}</span>
            </div>
          </div>

          {/* 📅 ONE-LINER BY DEFAULT & EXPANDABLE TODAY'S ITINERARY & DYNAMIC EVENTS */}
          <div
            onClick={() => setIsTodayItineraryExpanded(!isTodayItineraryExpanded)}
            className="bg-black/30 backdrop-blur-md border border-white/20 p-3 rounded-2xl cursor-pointer hover:bg-black/40 transition-all shadow-sm group"
          >
            {/* One-Liner Header (Always Visible) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <Calendar size={16} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs font-black text-white truncate leading-tight">
                  {todaySummaryOneLiner}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                  {isTodayItineraryExpanded ? "Hide Details" : "Details"}
                </span>
                {isTodayItineraryExpanded ? <ChevronUp size={16} className="text-amber-300" /> : <ChevronDown size={16} className="text-amber-300" />}
              </div>
            </div>

            {/* Expandable Detailed View */}
            {isTodayItineraryExpanded && (
              <div className="mt-3 pt-3 border-t border-white/15 space-y-2.5 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <span>🟢 Live Real-Time Schedule · Aug 5</span>
                  </span>
                  <button
                    onClick={() => setShowPlanCalendarModal(true)}
                    className="text-[10px] font-black bg-amber-400 text-gray-900 px-2.5 py-1 rounded-xl shadow-xs hover:bg-amber-300"
                  >
                    Calendar Planner
                  </button>
                </div>

                {/* Lively Dynamic Scheduled Events Timeline */}
                {eventsForToday.length === 0 ? (
                  <p className="text-xs text-white/70 italic">No events scheduled for today. Tap Calendar Planner to schedule!</p>
                ) : (
                  eventsForToday.map((item) => (
                    <div key={item.id} className="bg-white/10 p-2.5 rounded-xl border border-white/15 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-white">{item.title}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            item.status === 'LIVE NOW' ? 'bg-emerald-500 text-white animate-pulse' :
                            item.status === 'NEXT STOP' ? 'bg-amber-500 text-white' : 'bg-white/20 text-white'
                          }`}>
                            {item.status || 'SCHEDULED'}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-200/80 font-semibold mt-0.5">
                          ⏰ {item.time || '10:00 AM'} · {item.category || 'Heritage'} · Est. ₹{item.cost || 0}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎤 Voice + AI Search Bar (Positioned cleanly below Header without overlapping) */}
      <div className="px-4 mt-3 relative z-10 flex-shrink-0">
        <div
          onClick={() => onSearchClick()}
          className={`${bgCard} p-3 rounded-2xl border shadow-md flex items-center gap-3 cursor-pointer group transition-all`}
        >
          <Search size={18} className="text-[#8B3A2A]" />
          <span className="text-xs font-semibold text-gray-500 flex-1 truncate">
            {t.searchPlaceholder || "Search Shaniwar Wada, Misal, Forts..."}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleVoiceSearch(); }}
            className={`p-1.5 rounded-xl ${isVoiceSearching ? 'bg-rose-500 text-white animate-bounce' : 'bg-[#F2EAE7] text-[#8B3A2A] hover:bg-[#E8DCD7]'} transition-all`}
            title="Voice Search"
          >
            <Mic size={16} />
          </button>
        </div>
      </div>

      {/* 🧳 Recent Searches */}
      <div className="px-4 mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider whitespace-nowrap">Recent:</span>
        {RECENT_SEARCHES.map((search, idx) => (
          <button
            key={idx}
            onClick={() => onSearchClick({ query: search })}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all ${
              isDarkMode ? 'bg-[#241E1C] border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700 hover:bg-[#FAF6F0]'
            }`}
          >
            {search}
          </button>
        ))}
      </div>

      {/* ⚡ Quick Actions Grid */}
      <div className="p-4 grid grid-cols-5 gap-2 text-center flex-shrink-0">
        <button
          onClick={() => onSearchClick({ category: "Nearby" })}
          className={`${bgCard} p-2.5 rounded-2xl border shadow-xs hover:border-[#8B3A2A] transition-all flex flex-col items-center gap-1`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Navigation size={20} />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Nearby</span>
        </button>

        {/* 📅 PLAN TRIP WITH DYNAMIC MONTH/DAY/YEAR CALENDAR PLANNER */}
        <button
          onClick={() => setShowPlanCalendarModal(true)}
          className={`${bgCard} p-2.5 rounded-2xl border shadow-xs hover:border-[#8B3A2A] transition-all flex flex-col items-center gap-1`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Plan Trip</span>
        </button>

        <button
          onClick={() => toast.success("Event booking modal open")}
          className={`${bgCard} p-2.5 rounded-2xl border shadow-xs hover:border-[#8B3A2A] transition-all flex flex-col items-center gap-1`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Ticket size={20} />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Book</span>
        </button>

        {/* 💰 EXPENSE TRACKER BUTTON */}
        <button
          onClick={() => setShowExpenseTrackerModal(true)}
          className={`${bgCard} p-2.5 rounded-2xl border shadow-xs hover:border-[#8B3A2A] transition-all flex flex-col items-center gap-1`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Calculator size={20} />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">Expense</span>
        </button>

        <button
          onClick={() => onSearchClick({ isSaved: true })}
          className={`${bgCard} p-2.5 rounded-2xl border shadow-xs hover:border-[#8B3A2A] transition-all flex flex-col items-center gap-1`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Bookmark size={20} />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Saved</span>
        </button>
      </div>

      {/* 📍 Home Tab Quick Create & Check-in (+) Section (Scrolls naturally with Home tab content) */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="bg-gradient-to-r from-[#8B3A2A] via-[#742E20] to-[#5C2317] text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform active:scale-95 border border-white/20 flex-shrink-0"
              title="Quick Add Menu"
            >
              {showFabMenu ? <X size={22} /> : <Plus size={22} />}
            </button>
            <div>
              <p className="text-xs font-black text-white">Punekar Quick Actions (+)</p>
              <p className="text-[10px] text-amber-200 font-medium">Post photos or check-in at live locations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSearchClick({ tab: "createPost" })}
              className="bg-white text-[#8B3A2A] px-3 py-1.5 rounded-xl text-xs font-black hover:bg-amber-50 transition-all flex items-center gap-1 shadow-xs"
            >
              <Camera size={14} />
              <span>Post</span>
            </button>
            <button
              onClick={() => toast.success("Checked in at Shaniwar Wada 📍 (+20 XP)")}
              className="bg-amber-400 text-gray-900 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-amber-300 transition-all flex items-center gap-1 shadow-xs"
            >
              <MapPin size={14} />
              <span>Check-in</span>
            </button>
          </div>
        </div>

        {showFabMenu && (
          <div className="mt-2.5 bg-white dark:bg-[#241E1C] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-around animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setShowFabMenu(false); onSearchClick({ tab: "createPost" }); }}
              className="flex items-center gap-2 text-xs font-bold text-[#8B3A2A] hover:underline"
            >
              <Camera size={16} />
              <span>Share Pune Moment 📷</span>
            </button>
            <button
              onClick={() => { setShowFabMenu(false); toast.success("Checked in at Shaniwar Wada 📍 (+20 XP)"); }}
              className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline"
            >
              <MapPin size={16} />
              <span>GPS Live Check-in 📍</span>
            </button>
          </div>
        )}
      </div>
      <div className="mb-4">
        <div className="px-4 flex justify-between items-center mb-2.5">
          <h2 className={`text-sm font-extrabold ${textTitle}`}>{t.popularSpots || "Popular Spots in Pune"}</h2>
          <button onClick={() => onSearchClick()} className="text-xs font-bold text-[#8B3A2A] hover:underline">
            {t.seeAll || "See all"}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? "bg-[#8B3A2A] text-white border-[#8B3A2A] shadow-xs"
                  : isDarkMode
                  ? "bg-[#241E1C] text-gray-300 border-gray-800"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-[#FAF6F0]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Place Cards */}
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} onClick={onPlaceSelect} userLocation={userLocation} userLanguage={userLanguage} />
          ))}
        </div>
      </div>

      {/* 🎉 Nearby Events Section (LIMITED TO MAX 2 BY DEFAULT) */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <h2 className={`text-sm font-extrabold ${textTitle}`}>{t.nearbyEvents || "Featured Pune Events"}</h2>
            <span className="text-[10px] text-gray-500 font-bold">Showing {displayedEvents.length} of {events.length} events</span>
          </div>
          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className="text-xs font-bold text-[#8B3A2A] hover:underline flex items-center gap-1"
          >
            <span>{showAllEvents ? "Show Less 🔼" : "See All 🔽"}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {displayedEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              className={`${bgCard} p-3.5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer hover:border-[#8B3A2A] transition-all`}
            >
              <div>
                <span className="text-[10px] font-black text-[#8B3A2A] uppercase tracking-wider">{ev.date}</span>
                <h3 className={`text-xs font-bold ${textTitle} leading-tight`}>{ev.name}</h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{ev.desc}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                className="bg-[#8B3A2A] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-90 flex-shrink-0"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 📍 REAL-TIME INTERACTIVE MAP LOCATION SELECTOR MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#241E1C] dark:text-white p-5 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={18} className="text-[#8B3A2A]" />
                <span>Select Location on Real-Time Map</span>
              </h3>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Selected Address Badge */}
            <div className="bg-[#FAF6F0] dark:bg-[#2D2522] p-2.5 rounded-2xl border border-[#EDE8DF] dark:border-gray-700 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8B3A2A] dark:text-amber-400 font-black uppercase tracking-wider block">Selected Area</span>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white">{mapPickerAddress}</span>
              </div>
              <button
                onClick={handleDetectGpsLocation}
                className="bg-[#8B3A2A] text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-opacity-90 active:scale-95 transition-all"
                title="Detect GPS"
              >
                <LocateFixed size={14} />
                <span className="text-[10px]">GPS</span>
              </button>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative mb-4 shadow-inner">
              <MapContainer
                center={[mapPickerCoords.lat, mapPickerCoords.lng]}
                zoom={14}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[mapPickerCoords.lat, mapPickerCoords.lng]} icon={pinIcon}>
                  <Popup>
                    <div className="text-xs font-bold">📍 {mapPickerAddress}</div>
                  </Popup>
                </Marker>
                <MapEventsHandler onLocationChange={handleMapPickerClick} />
                <MapFlyTo center={[mapPickerCoords.lat, mapPickerCoords.lng]} />
              </MapContainer>
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-lg z-[1000]">
                Tap anywhere on map to move pin
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMapLocation}
                className="flex-1 py-2.5 bg-[#8B3A2A] text-white text-xs font-black rounded-xl shadow-md hover:bg-opacity-90"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎙️ ASK AAMHI AI ASSISTANT MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Bot size={20} className="text-[#8B3A2A]" />
                <span>Ask Aamhi AI Guide</span>
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAskAi} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask anything (e.g. Best misal spot near FC Road?)"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B3A2A] bg-[#FBF8F3]"
                />
                <button
                  type="submit"
                  className="bg-[#8B3A2A] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-opacity-90"
                >
                  {aiLoading ? "Thinking..." : "Ask AI"}
                </button>
              </div>
            </form>

            {aiResponse && (
              <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EDE8DF] text-xs font-medium text-gray-800 leading-relaxed mb-3">
                {aiResponse}
              </div>
            )}

            <div className="text-[10px] text-gray-400 text-center">
              Powered by Pune Cultural Knowledge AI Engine 🚩
            </div>
          </div>
        </div>
      )}

      {/* 🚨 ROADSoS GLOBAL RESCUE & EMERGENCY NETWORK MODAL */}
      <SosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        userLocation={userLocation}
        userLanguage={userLanguage}
      />

      {/* 📅 DYNAMIC MONTH, DAY, YEAR REAL-TIME CALENDAR PLANNER MODAL */}
      {showPlanCalendarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#241E1C] dark:text-white p-5 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <Calendar size={18} className="text-[#8B3A2A]" />
                <span>Real-Time Calendar Planner</span>
              </h3>
              <button onClick={() => setShowPlanCalendarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Dynamic Month & Year Navigation Bar */}
            <div className="bg-[#FAF6F0] dark:bg-[#2D2522] p-3 rounded-2xl mb-4 border border-[#EDE8DF] dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (calSelectedMonthIdx === 0) {
                        setCalSelectedMonthIdx(11);
                        setCalSelectedYear(calSelectedYear - 1);
                      } else {
                        setCalSelectedMonthIdx(calSelectedMonthIdx - 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <select
                    value={calSelectedMonthIdx}
                    onChange={(e) => setCalSelectedMonthIdx(Number(e.target.value))}
                    className="p-1 rounded-lg text-xs font-black bg-white dark:bg-[#1C1412] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 outline-none"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={calSelectedYear}
                    onChange={(e) => setCalSelectedYear(Number(e.target.value))}
                    className="p-1 rounded-lg text-xs font-black bg-white dark:bg-[#1C1412] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 outline-none"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>

                  <button
                    onClick={() => {
                      if (calSelectedMonthIdx === 11) {
                        setCalSelectedMonthIdx(0);
                        setCalSelectedYear(calSelectedYear + 1);
                      } else {
                        setCalSelectedMonthIdx(calSelectedMonthIdx + 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <span className="text-[10px] font-black text-[#8B3A2A] bg-[#8B3A2A]/10 px-2 py-0.5 rounded-full">
                  {MONTH_NAMES[calSelectedMonthIdx]} {calSelectedDay}, {calSelectedYear}
                </span>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDaysArray.map((day) => {
                  const hasEvents = plannedCalendarEvents.some(
                    ev => ev.year === calSelectedYear && ev.month === calSelectedMonthIdx && ev.day === day
                  );
                  const isSelected = calSelectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setCalSelectedDay(day)}
                      className={`p-1.5 rounded-xl text-xs font-bold transition-all relative ${
                        isSelected
                          ? "bg-[#8B3A2A] text-white shadow-xs"
                          : hasEvents
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                          : "bg-white dark:bg-[#1C1412] text-gray-800 dark:text-gray-300 hover:bg-[#F2EAE7]"
                      }`}
                    >
                      {day}
                      {hasEvents && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#8B3A2A] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Summary & Calculator Bar */}
            <div className="bg-gradient-to-r from-[#8B3A2A] to-[#742E20] text-white p-3 rounded-2xl mb-4 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] text-white/70">{MONTH_NAMES[calSelectedMonthIdx]} {calSelectedDay}, {calSelectedYear} Cost</p>
                <p className="text-lg font-black text-white">₹{totalDayCost}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/70">Total Planned Hours</p>
                <p className="text-lg font-black text-amber-300">{totalDayHours} Hours</p>
              </div>
            </div>

            {/* ➕ Add Custom Event & Note Form for Selected Date */}
            <form onSubmit={handleAddCalendarEvent} className="space-y-2 mb-4">
              <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                <PlusCircle size={14} className="text-[#8B3A2A]" />
                <span>Schedule Event on {MONTH_NAMES[calSelectedMonthIdx]} {calSelectedDay}, {calSelectedYear}</span>
              </h4>
              <input
                type="text"
                placeholder="Event Title (e.g. Shaniwar Wada Heritage Walk)"
                value={newCalTitle}
                onChange={(e) => setNewCalTitle(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <select
                  value={newCalCategory}
                  onChange={(e) => setNewCalCategory(e.target.value)}
                  className="p-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-[11px] font-bold outline-none"
                >
                  <option value="Heritage 🚩">Heritage 🚩</option>
                  <option value="Food ☕">Food ☕</option>
                  <option value="Trek ⛰️">Trek ⛰️</option>
                  <option value="Cultural 🎭">Cultural 🎭</option>
                </select>

                <input
                  type="number"
                  placeholder="Cost (₹)"
                  value={newCalCost}
                  onChange={(e) => setNewCalCost(e.target.value)}
                  className="p-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
                />

                <input
                  type="number"
                  placeholder="Hours"
                  value={newCalHours}
                  onChange={(e) => setNewCalHours(e.target.value)}
                  className="p-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#8B3A2A] text-white py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 shadow-sm"
              >
                Save Schedule
              </button>
            </form>

            {/* Scheduled Notes & Events List */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-700 dark:text-gray-300">
                Scheduled Events ({eventsForSelectedDate.length})
              </h4>
              {eventsForSelectedDate.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No notes or events scheduled for this date.</p>
              ) : (
                eventsForSelectedDate.map((ev) => (
                  <div key={ev.id} className="flex justify-between items-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#FAF6F0] dark:bg-[#2D2522]">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{ev.title}</p>
                      <span className="text-[10px] text-gray-500 font-semibold">{ev.category} · {ev.hours} Hrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#8B3A2A] dark:text-amber-400">₹{ev.cost}</span>
                      <button
                        onClick={() => handleDeleteCalendarEvent(ev.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowPlanCalendarModal(false)}
              className="w-full mt-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold rounded-xl"
            >
              Close Planner
            </button>
          </div>
        </div>
      )}

      {/* 💰 EXPENSE TRACKER & CONTRI CALCULATOR MODAL */}
      {showExpenseTrackerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#241E1C] dark:text-white p-5 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <Calculator size={18} className="text-[#8B3A2A]" />
                <span>Pune Trip Expense & Contri</span>
              </h3>
              <button onClick={() => setShowExpenseTrackerModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Budget Summary Bar */}
            <div className="bg-gradient-to-r from-[#8B3A2A] to-[#742E20] text-white p-3.5 rounded-2xl mb-4 shadow-sm">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-white/80">Trip Budget: ₹{tripBudget}</span>
                <button
                  onClick={() => {
                    const b = prompt("Set total trip budget (₹):", tripBudget);
                    if (b && !isNaN(b)) setTripBudget(Number(b));
                  }}
                  className="text-[10px] bg-white/20 px-2 py-0.5 rounded-lg font-bold hover:bg-white/30"
                >
                  Edit Budget
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/70">Total Spent</p>
                  <p className="text-lg font-black text-white">₹{totalSpent}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/70">Remaining</p>
                  <p className={`text-lg font-black ${remainingBudget < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    ₹{remainingBudget}
                  </p>
                </div>
              </div>
            </div>

            {/* 🤝 Contri / Split Bill Quick Calculator */}
            <div className="bg-[#FAF6F0] dark:bg-[#2D2522] p-3 rounded-2xl mb-4 border border-[#EDE8DF] dark:border-gray-700">
              <h4 className="text-xs font-black text-gray-900 dark:text-white mb-2 flex items-center gap-1">
                <Users size={14} className="text-[#8B3A2A]" />
                <span>Split Bill ("Contri" Calculator)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Total Bill (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={splitBillAmount}
                    onChange={(e) => setSplitBillAmount(e.target.value)}
                    className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">No. of People</label>
                  <input
                    type="number"
                    value={splitPeopleCount}
                    onChange={(e) => setSplitPeopleCount(e.target.value)}
                    className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
                  />
                </div>
              </div>
              {splitBillAmount && (
                <div className="bg-[#8B3A2A]/10 border border-[#8B3A2A]/20 p-2 rounded-xl text-center">
                  <span className="text-xs font-black text-[#8B3A2A] dark:text-amber-400">
                    Each Person Pays: ₹{perPersonContri}
                  </span>
                </div>
              )}
            </div>

            {/* ➕ Add New Expense Entry Form */}
            <form onSubmit={handleAddExpense} className="space-y-2 mb-4">
              <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                <Receipt size={14} className="text-[#8B3A2A]" />
                <span>Log New Expense</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Item / Note (e.g. Chai)"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1412] text-xs font-bold outline-none"
                >
                  <option value="Food ☕">Food ☕</option>
                  <option value="Transport 🚕">Transport 🚕</option>
                  <option value="Tickets 🎟️">Tickets 🎟️</option>
                  <option value="Shopping 🛍️">Shopping 🛍️</option>
                  <option value="Stay 🏨">Stay 🏨</option>
                </select>
                <button
                  type="submit"
                  className="bg-[#8B3A2A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 shadow-sm"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Expense Log History List */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-700 dark:text-gray-300">Expense Log ({expensesList.length})</h4>
              {expensesList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No expenses logged yet.</p>
              ) : (
                expensesList.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#FAF6F0] dark:bg-[#2D2522]">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{item.title}</p>
                      <span className="text-[10px] text-gray-500 font-semibold">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#8B3A2A] dark:text-amber-400">₹{item.amount}</span>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowExpenseTrackerModal(false)}
              className="w-full mt-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold rounded-xl"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* 🚑 Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center border border-gray-100">
            <ShieldAlert size={44} className="text-rose-600 mx-auto mb-2 animate-bounce" />
            <h3 className="text-lg font-black text-gray-900 mb-1">Tourist Helpline & Emergency</h3>
            <p className="text-xs text-gray-600 font-medium mb-4">Direct 1-touch dial emergency services in Pune:</p>

            <div className="space-y-2 mb-5 text-left text-xs">
              <a href="tel:112" className="block bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl font-bold text-rose-700 flex justify-between">
                <span>🚑 National Emergency SOS</span>
                <span>112</span>
              </a>
              <a href="tel:02026122880" className="block bg-blue-50 hover:bg-blue-100 p-2.5 rounded-xl font-bold text-blue-700 flex justify-between">
                <span>👮 Tourist Police Pune</span>
                <span>020-26122880</span>
              </a>
              <a href="tel:108" className="block bg-emerald-50 hover:bg-emerald-100 p-2.5 rounded-xl font-bold text-emerald-700 flex justify-between">
                <span>🏥 Ambulance Service</span>
                <span>108</span>
              </a>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2.5 bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🔔 Notifications Dropdown Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-start justify-end z-50 p-4 pt-16">
          <div className="bg-white p-4 rounded-3xl shadow-2xl w-full max-w-xs border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-gray-900">Notifications (3)</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EDE8DF]">
                <p className="font-bold text-gray-900">🚩 Shaniwar Wada Light Show</p>
                <p className="text-[10px] text-gray-500">Starts today at 7:00 PM in Marathi & English</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EDE8DF]">
                <p className="font-bold text-gray-900">☀️ Clear Sky Weather Alert</p>
                <p className="text-[10px] text-gray-500">Great weather for Sinhagad Fort trek!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎭 Event Booking Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center border border-gray-100">
            <span className="text-xs font-black text-[#8B3A2A] uppercase tracking-wider block mb-1">{selectedEvent.date}</span>
            <h3 className="text-base font-black text-gray-900 mb-2">{selectedEvent.name}</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">{selectedEvent.desc}</p>
            <button
              onClick={() => {
                toast.success(`Tickets booked for ${selectedEvent.name}!`);
                setSelectedEvent(null);
              }}
              className="w-full py-3 bg-[#8B3A2A] text-white text-xs font-bold rounded-xl shadow-md mb-2"
            >
              Confirm Booking (Free Pass)
            </button>
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
