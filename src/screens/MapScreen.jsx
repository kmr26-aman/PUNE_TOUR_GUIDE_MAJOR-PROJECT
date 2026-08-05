import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Home, Search, Navigation, MapPin, Star, Clock, ChevronDown, ChevronUp,
  Locate, X, Info, Plus, Trash2, CheckCircle2, Layers, Compass, ArrowRight, ExternalLink
} from "lucide-react";
import StatusBar from "../components/StatusBar";
import {
  fetchPlaces, fetchItinerary, updateStopStatus,
  deleteStopFromItinerary, addStopToItinerary
} from "../data/api";
import { translations } from "../data/translations";
import { categories } from "../data/puneData";
import toast, { Toaster } from "react-hot-toast";

const TRAVEL_MODES = [
  { id: "Walking", label: "🚶 Walk", profile: "foot", gmapMode: "walking" },
  { id: "Auto",    label: "🛺 Auto", profile: "driving", gmapMode: "driving" },
  { id: "Driving", label: "🚗 Drive", profile: "driving", gmapMode: "driving" }
];

const MAP_STYLES = [
  {
    id: "voyager",
    label: "🗺️ Street",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
  },
  {
    id: "dark",
    label: "🌑 Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  },
  {
    id: "satellite",
    label: "🛰️ Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  }
];

const PUNE_CENTER = [18.5204, 73.8567];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatInstruction = (maneuver, streetName) => {
  const type = maneuver?.type || "";
  const modifier = maneuver?.modifier || "";
  let action = "Continue";
  if (type === "depart") action = "Start journey";
  else if (type === "arrive") action = "Arrive at destination";
  else if (type === "turn") action = `Turn ${modifier}`;
  else if (type === "new name" || type === "notification") action = "Continue onto";
  action = action.charAt(0).toUpperCase() + action.slice(1);
  const street = streetName ? ` on ${streetName}` : "";
  return `${action}${street}`;
};

const getCategoryColor = (category) => {
  const map = {
    Heritage: "#8B3A2A", Temple: "#B87318", Nature: "#4A6741",
    Food: "#15803D", Wellness: "#0369A1", Cultural: "#7C3AED", Museum: "#BE185D"
  };
  return map[category] || "#8B3A2A";
};

const getCategoryEmoji = (cat) => {
  const map = {
    All:"🗺️", Heritage:"🏰", Temple:"🛕", Nature:"🌿",
    Food:"🍽️", Wellness:"🧘", Cultural:"🎭", Museum:"🏛️"
  };
  return map[cat] || "📍";
};

function fmtDuration(secs) {
  const m = Math.round(secs / 60);
  if (m < 1) return "<1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    try {
      map.invalidateSize();
      if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, zoom || map.getZoom());
      }
    } catch (e) { /* noop */ }
  }, [center, zoom, map]);
  return null;
}

function MapClickTracker({ onClick }) {
  useMapEvents({ click: onClick });
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MapScreen({ userLocation, userLanguage, weatherData, onNavigateHome }) {
  const t = translations[userLanguage] || translations.English;

  // core state
  const [mode, setMode] = useState("Walking");
  const [activeFilter, setActiveFilter] = useState("All");
  const [mapStyle, setMapStyle] = useState("voyager");
  const [stops, setStops] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState(PUNE_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [liveLocation, setLiveLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [routeStats, setRouteStats] = useState({ distanceKm: 0, durationSec: 0 });
  const [completedStopId, setCompletedStopId] = useState(null);
  const [directions, setDirections] = useState([]);
  const [showDirections, setShowDirections] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showStopList, setShowStopList] = useState(false);

  // Auto detect browser GPS on load
  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLiveLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(15);
          toast.success("Located your current position!");
        },
        () => {
          toast.error("GPS access unavailable, showing Pune center");
          setMapCenter(PUNE_CENTER);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation not supported by browser");
    }
  }, []);

  useEffect(() => {
    handleLocateUser();
  }, [handleLocateUser]);

  // load places & itinerary stops
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [placesData, itinerary] = await Promise.all([
          fetchPlaces({ category: activeFilter === "All" ? undefined : activeFilter }),
          fetchItinerary()
        ]);
        setPlaces(placesData || []);
        if (itinerary?.length > 0) setStops(itinerary[0].stops || []);
      } catch (e) {
        console.error("MapScreen load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeFilter]);

  // Filter places by search
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    const q = searchQuery.toLowerCase();
    return places.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  }, [places, searchQuery]);

  // Calculate route points
  const origin = liveLocation
    ? [liveLocation.lat, liveLocation.lng]
    : userLocation?.latitude ? [userLocation.latitude, userLocation.longitude] : PUNE_CENTER;

  const routePoints = useMemo(() => {
    if (stops.length > 0) {
      const validStops = stops.map(stop => {
        const mp = places.find(p => p.name.toLowerCase() === stop.name.toLowerCase());
        return mp?.latitude && mp?.longitude ? [mp.latitude, mp.longitude] : null;
      }).filter(Boolean);
      if (validStops.length > 0) return [origin, ...validStops];
    }
    if (selectedPlace?.latitude && selectedPlace?.longitude && origin) {
      return [origin, [selectedPlace.latitude, selectedPlace.longitude]];
    }
    return [];
  }, [stops, places, selectedPlace, origin]);

  // Fetch OSRM route for polyline & turn-by-turn
  useEffect(() => {
    if (routePoints.length < 2) {
      setRouteGeometry([]);
      setRouteStats({ distanceKm: 0, durationSec: 0 });
      setDirections([]);
      return;
    }
    (async () => {
      try {
        const profile = mode === "Walking" ? "foot" : "driving";
        const coordsStr = routePoints.map(p => `${p[1]},${p[0]}`).join(";");
        const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM error");
        const data = await res.json();
        if (data.routes?.length > 0) {
          const route = data.routes[0];
          setRouteGeometry(route.geometry.coordinates.map(c => [c[1], c[0]]));
          let dur = route.duration;
          if (mode === "Auto") dur *= 1.25;
          setRouteStats({ distanceKm: route.distance / 1000, durationSec: dur });
          const steps = [];
          route.legs?.forEach(leg =>
            leg.steps?.forEach(step => {
              if (step.name || step.maneuver.type !== "turn") {
                steps.push({ instruction: formatInstruction(step.maneuver, step.name), distance: step.distance });
              }
            })
          );
          setDirections(steps);
        }
      } catch {
        setRouteGeometry(routePoints);
      }
    })();
  }, [routePoints, mode]);

  // ── Icon Builders ─────────────────────────────────────────────────────────

  const placeIcon = useCallback((place, stopNum) => L.divIcon({
    html: `
      <div style="position:relative;width:38px;height:38px;border-radius:50%;
        background:${getCategoryColor(place.category)};display:flex;align-items:center;
        justify-content:center;border:2.5px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.35);font-size:17px;transition:transform 0.2s;">
        ${place.emoji || "📍"}
        ${stopNum !== null ? `<div style="position:absolute;top:-6px;right:-6px;
          background:#8B3A2A;color:white;width:18px;height:18px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;
          border:1.5px solid white;">${stopNum}</div>` : ""}
      </div>`,
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  }), []);

  const userIcon = L.divIcon({
    html: `<div style="position:relative;width:24px;height:24px;border-radius:50%;background:#8B3A2A;border:3px solid white;box-shadow:0 0 0 6px rgba(139,58,42,0.35);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
    </div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // ── Navigation Handlers (FIXED NAVIGATE BUTTON) ──────────────────────────

  const handleNavigate = (targetPlace = null) => {
    const destPlace = targetPlace || selectedPlace || (filteredPlaces.length > 0 ? filteredPlaces[0] : null);
    
    // Calculate origin coordinates
    const origLat = liveLocation?.lat ?? userLocation?.latitude ?? PUNE_CENTER[0];
    const origLng = liveLocation?.lng ?? userLocation?.longitude ?? PUNE_CENTER[1];
    const origStr = `${origLat},${origLng}`;

    let url = "";
    const selectedMode = TRAVEL_MODES.find(m => m.id === mode)?.gmapMode || "driving";

    if (destPlace?.latitude && destPlace?.longitude) {
      // Direct navigation to destination place
      url = `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${destPlace.latitude},${destPlace.longitude}&travelmode=${selectedMode}`;
      toast.success(`Navigating to ${destPlace.name}... 🗺️`);
    } else if (routePoints.length >= 2) {
      // Multi-waypoint itinerary navigation
      const dest = `${routePoints[routePoints.length - 1][0]},${routePoints[routePoints.length - 1][1]}`;
      const waypoints = routePoints.slice(1, -1).map(p => `${p[0]},${p[1]}`).join("|");
      url = `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=${selectedMode}`;
      toast.success("Launching Google Maps Navigation... 🧭");
    } else {
      // Fallback navigation to Pune center or first spot
      const dest = places.length > 0 ? `${places[0].latitude},${places[0].longitude}` : `${PUNE_CENTER[0]},${PUNE_CENTER[1]}`;
      url = `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${dest}&travelmode=${selectedMode}`;
      toast.success("Opening Google Maps Navigation... 📍");
    }

    window.open(url, "_blank");
  };

  const handleToggleStop = async (id) => {
    const stop = stops.find(s => s.id === id);
    if (!stop) return;
    try {
      const updated = await updateStopStatus(id, !stop.done);
      if (updated.done) { setCompletedStopId(id); setTimeout(() => setCompletedStopId(null), 1200); }
      setStops(prev => prev.map(s => s.id === id ? { ...s, done: updated.done } : s));
      toast.success(updated.done ? "Stop completed! 🎉" : "Stop unchecked");
    } catch { toast.error("Failed to update stop"); }
  };

  const handleDeleteStop = async (id) => {
    try {
      await deleteStopFromItinerary(id);
      setStops(prev => prev.filter(s => s.id !== id));
      toast.success("Stop removed");
    } catch { toast.error("Failed to remove stop"); }
  };

  const handleAddToItinerary = async (place) => {
    try {
      let day1Id = null;
      const itinerary = await fetchItinerary();
      const day1 = Array.isArray(itinerary) ? itinerary.find(d => d.day === 1) : null;
      if (day1) day1Id = day1.id;
      const newStop = await addStopToItinerary(day1Id, place.id);
      setStops(prev => [...prev, newStop]);
      toast.success(`${place.name} added to itinerary!`);
    } catch { toast.error("Failed to add to itinerary"); }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setSheetOpen(true);
    if (place.latitude && place.longitude) {
      setMapCenter([place.latitude, place.longitude]);
      setMapZoom(15);
    }
  };

  const currentMapStyle = MAP_STYLES.find(s => s.id === mapStyle) || MAP_STYLES[0];

  return (
    <div className="h-full flex flex-col bg-[#0F0F10] relative overflow-hidden font-sans">
      <Toaster position="top-center" />
      <StatusBar light />

      {/* ── 1. UNIFIED DE-CLUTTERED TOP FLOATING HEADER ──────────────────────── */}
      <div className="absolute top-8 left-3 right-3 z-[900] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Back Home */}
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center text-[#8B3A2A] hover:bg-white transition-all flex-shrink-0 border border-gray-100"
            >
              <Home size={18} />
            </button>
          )}

          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 h-10 shadow-lg border border-gray-100">
            <Search size={16} className="text-[#8B3A2A] flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Pune heritage, temples, food..."
              className="w-full bg-transparent border-none outline-none text-xs font-semibold text-gray-900 placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Chips Horizontal Bar */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
          {["All", ...categories.filter(c => c !== "All")].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shadow-sm ${
                activeFilter === cat
                  ? "bg-[#8B3A2A] text-white border-[#8B3A2A]"
                  : "bg-white/95 backdrop-blur-md text-gray-700 border-gray-100 hover:bg-white"
              }`}
            >
              <span>{getCategoryEmoji(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. STACKED RIGHT FLOATING ACTION BUTTONS (NO OVERLAP) ─────────────── */}
      <div className="absolute top-36 right-3 z-[900] flex flex-col gap-2 pointer-events-auto">
        {/* Layer Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowStylePicker(!showStylePicker)}
            title="Switch Map Style"
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 flex items-center justify-center text-[#8B3A2A] hover:scale-105 transition-all"
          >
            <Layers size={18} />
          </button>

          {showStylePicker && (
            <div className="absolute top-0 right-12 bg-white rounded-2xl p-1.5 shadow-xl border border-gray-100 flex flex-col gap-1 min-w-[120px] z-[1100]">
              {MAP_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setMapStyle(s.id); setShowStylePicker(false); }}
                  className={`px-3 py-1.5 rounded-xl text-left text-xs font-bold transition-all ${
                    mapStyle === s.id ? "bg-[#8B3A2A]/10 text-[#8B3A2A]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Locate Button */}
        <button
          onClick={handleLocateUser}
          title="Center on my location"
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 flex items-center justify-center text-[#8B3A2A] hover:scale-105 transition-all"
        >
          <Locate size={18} />
        </button>
      </div>

      {/* ── 3. FLOATING ROUTE OVERLAY BANNER (TOP CENTER) ────────────────────── */}
      {routeStats.distanceKm > 0 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[900] bg-gray-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full shadow-xl border border-white/20 flex items-center gap-3 text-xs font-bold pointer-events-auto">
          <span className="text-amber-400 flex items-center gap-1">
            {TRAVEL_MODES.find(m => m.id === mode)?.label}
          </span>
          <span className="text-white font-extrabold">{fmtDuration(routeStats.durationSec)}</span>
          <span className="text-gray-400">·</span>
          <span className="text-emerald-400">{routeStats.distanceKm.toFixed(1)} km</span>
        </div>
      )}

      {/* ── 4. FULL-SCREEN MAP CONTAINER ────────────────────────────────────── */}
      <div className="flex-1 relative z-10">
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .leaflet-container { font-family: inherit; }
          .flowing-route {
            stroke-dasharray: 8 6;
            animation: routeFlow 18s linear infinite;
          }
          @keyframes routeFlow {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -1000; }
          }
        `}</style>

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
            <Compass size={32} className="animate-spin text-amber-400" />
            <div className="text-xs font-bold">Loading Real-Time Pune Map...</div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          scrollWheelZoom
        >
          <TileLayer
            key={mapStyle}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={currentMapStyle.url}
          />
          <RecenterMap center={mapCenter} zoom={mapZoom} />
          <MapClickTracker onClick={() => { setShowStylePicker(false); }} />

          {/* User GPS location marker */}
          {(liveLocation || userLocation) && (() => {
            const lat = liveLocation?.lat ?? userLocation?.latitude;
            const lng = liveLocation?.lng ?? userLocation?.longitude;
            return lat && lng ? (
              <Marker position={[lat, lng]} icon={userIcon}>
                <Popup>
                  <div className="text-xs font-extrabold text-[#8B3A2A]">📍 Live Location</div>
                </Popup>
              </Marker>
            ) : null;
          })()}

          {/* Place markers */}
          {filteredPlaces.filter(p => p.latitude && p.longitude).map(place => {
            const stopIdx = stops.findIndex(s => s.name.toLowerCase() === place.name.toLowerCase());
            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={placeIcon(place, stopIdx !== -1 ? stopIdx + 1 : null)}
                eventHandlers={{ click: () => handleSelectPlace(place) }}
              >
                <Popup>
                  <div className="min-w-[160px]">
                    <div className="flex gap-1.5 items-center mb-1.5">
                      <span className="text-lg">{place.emoji || "📍"}</span>
                      <div>
                        <div className="text-xs font-black text-gray-900 leading-tight">
                          {userLanguage === "Marathi" && place.name_mr ? place.name_mr : place.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">
                          ⭐ {place.rating?.toFixed(1)} · {place.category}
                        </div>
                      </div>
                    </div>
                    {place.address && (
                      <div className="text-[10px] text-gray-600 mb-2 truncate">
                        📍 {place.address}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleNavigate(place)}
                        className="flex-1 py-1 rounded-lg bg-[#8B3A2A] text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Navigation size={10} /> Go
                      </button>
                      <button
                        onClick={() => {
                          if (stopIdx !== -1) handleDeleteStop(stops[stopIdx].id);
                          else handleAddToItinerary(place);
                        }}
                        className="flex-1 py-1 rounded-lg bg-gray-100 text-gray-800 text-[10px] font-bold"
                      >
                        {stopIdx !== -1 ? "Remove" : "+ Plan"}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Route Polyline */}
          {(routeGeometry.length > 1 || routePoints.length > 1) && (
            <>
              <Polyline
                positions={routeGeometry.length > 1 ? routeGeometry : routePoints}
                color="#8B3A2A"
                weight={5}
                opacity={0.9}
                pathOptions={{ className: "flowing-route" }}
              />
              <Polyline
                positions={routeGeometry.length > 1 ? routeGeometry : routePoints}
                color="#F59E0B"
                weight={10}
                opacity={0.2}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* ── 5. BOTTOM CONTROLS BAR (CLEAN & NON-OVERLAPPING) ──────────────────── */}
      <div className="bg-white border-t border-gray-100 p-3 z-[800] shadow-2xl flex flex-col gap-2.5">
        {/* Travel Mode Pills */}
        <div className="flex gap-2">
          {TRAVEL_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                mode === m.id
                  ? "bg-[#8B3A2A] text-white border-[#8B3A2A] shadow-xs"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Action Row */}
        <div className="flex gap-2 items-center">
          {/* Directions toggle */}
          {directions.length > 0 && (
            <button
              onClick={() => { setShowDirections(!showDirections); setShowStopList(false); }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                showDirections ? "bg-[#8B3A2A]/10 text-[#8B3A2A] border-[#8B3A2A]/30" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {showDirections ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span>Steps ({directions.length})</span>
            </button>
          )}

          {/* Spots toggle */}
          <button
            onClick={() => { setShowStopList(!showStopList); setShowDirections(false); }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              showStopList ? "bg-[#8B3A2A]/10 text-[#8B3A2A] border-[#8B3A2A]/30" : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            <MapPin size={13} />
            <span>{stops.length > 0 ? `${stops.length} Stops` : `${filteredPlaces.length} Spots`}</span>
          </button>

          {/* 🌟 ALWAYS-WORKING PRIMARY NAVIGATE BUTTON 🌟 */}
          <button
            onClick={() => handleNavigate()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B3A2A] to-[#B87318] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <Navigation size={15} />
            <span>
              {selectedPlace
                ? `Navigate to ${selectedPlace.name.split(' ')[0]}`
                : stops.length > 0
                ? `Navigate ${stops.length} Stops`
                : "Navigate Route"}
            </span>
            <ExternalLink size={12} className="opacity-80" />
          </button>
        </div>

        {/* Turn-by-Turn Expandable Drawer */}
        {showDirections && directions.length > 0 && (
          <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-2.5 border border-gray-200 no-scrollbar space-y-1.5">
            {directions.map((step, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px] pb-1 border-b border-gray-200 last:border-none">
                <span className="text-gray-800 font-semibold flex-1 pr-2">{step.instruction}</span>
                <span className="text-[#8B3A2A] font-bold text-[10px] flex-shrink-0">
                  {step.distance > 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Place / Stop List Expandable Drawer */}
        {showStopList && (
          <div className="max-h-44 overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 no-scrollbar divide-y divide-gray-200">
            {(stops.length > 0 ? stops : filteredPlaces).map((item) => {
              const isStop = stops.length > 0;
              const isSelected = selectedPlace?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !isStop && handleSelectPlace(item)}
                  className={`flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-gray-100 transition-all ${
                    isSelected ? "bg-[#8B3A2A]/10" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm flex-shrink-0 shadow-xs">
                    {item.emoji || "📍"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {userLanguage === "Marathi" && item.name_mr ? item.name_mr : item.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {isStop ? item.time : `⭐ ${item.rating} · ${item.address || item.category}`}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNavigate(item); }}
                    className="p-1.5 rounded-lg bg-[#8B3A2A] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs flex-shrink-0"
                  >
                    <Navigation size={10} /> Go
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 6. BOTTOM SHEET: SELECTED PLACE DETAIL (SLIDE UP) ────────────────── */}
      {sheetOpen && selectedPlace && (
        <div className="absolute bottom-0 left-0 right-0 z-[2000] bg-white rounded-t-3xl shadow-2xl p-4 max-h-[50vh] overflow-y-auto no-scrollbar border-t border-gray-100 animate-in slide-in-from-bottom duration-200">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          <button
            onClick={() => setSheetOpen(false)}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
          >
            <X size={14} />
          </button>

          {selectedPlace.image && (
            <img
              src={selectedPlace.image}
              alt={selectedPlace.name}
              className="w-full h-32 object-cover rounded-2xl mb-3 shadow-xs"
            />
          )}

          <div className="flex items-start gap-3 mb-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#8B3A2A]/10 text-[#8B3A2A] flex items-center justify-center text-xl flex-shrink-0">
              {selectedPlace.emoji || "📍"}
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                {userLanguage === "Marathi" && selectedPlace.name_mr ? selectedPlace.name_mr : selectedPlace.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-amber-500">⭐ {selectedPlace.rating?.toFixed(1)}</span>
                <span className="text-gray-300">•</span>
                <span className="text-[10px] font-black text-[#8B3A2A] bg-[#8B3A2A]/10 px-2 py-0.5 rounded-full">
                  {selectedPlace.category}
                </span>
              </div>
            </div>
          </div>

          {selectedPlace.address && (
            <p className="text-xs text-gray-600 font-medium flex items-center gap-1 mb-2">
              <MapPin size={12} className="text-[#8B3A2A]" />
              <span>{selectedPlace.address}</span>
            </p>
          )}

          {selectedPlace.description && (
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {selectedPlace.description}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                const stopIdx = stops.findIndex(s => s.name.toLowerCase() === selectedPlace.name.toLowerCase());
                if (stopIdx !== -1) handleDeleteStop(stops[stopIdx].id);
                else handleAddToItinerary(selectedPlace);
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs font-bold hover:bg-gray-100 transition-all"
            >
              {stops.some(s => s.name.toLowerCase() === selectedPlace.name.toLowerCase())
                ? "❌ Remove Stop"
                : "📅 Add to Itinerary"}
            </button>

            {/* Go Here button in sheet */}
            <button
              onClick={() => handleNavigate(selectedPlace)}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#8B3A2A] to-[#B87318] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all"
            >
              <Navigation size={14} />
              <span>Go Here</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
