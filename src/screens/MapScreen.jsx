import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Home, Search, Navigation, MapPin, Star, Clock, ChevronDown, ChevronUp,
  Locate, Route, X, Info, Plus, Trash2, CheckCircle2, Layers, Compass
} from "lucide-react";
import StatusBar from "../components/StatusBar";
import {
  fetchPlaces, fetchItinerary, updateStopStatus,
  deleteStopFromItinerary, addStopToItinerary
} from "../data/api";
import { translations } from "../data/translations";
import { categories } from "../data/puneData";
import { calculateDistance } from "../utils/location";
import toast, { Toaster } from "react-hot-toast";

const TRAVEL_MODES = [
  { id: "Walking", label: "🚶 Walk", profile: "foot" },
  { id: "Auto",    label: "🛺 Auto", profile: "driving" },
  { id: "Driving", label: "🚗 Drive", profile: "driving" }
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
  return map[category] || "#6B5B52";
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
      if (center && !isNaN(center[0])) map.setView(center, zoom || map.getZoom());
    } catch (e) { /* noop */ }
  }, [center, zoom, map]);
  return null;
}

function MapClickTracker({ onClick }) {
  useMapEvents({ click: onClick });
  return null;
}

function LocateButton({ onLocate }) {
  const map = useMap();
  const handle = () => {
    map.locate({ setView: true, maxZoom: 16 });
    map.once("locationfound", (e) => onLocate(e.latlng));
    map.once("locationerror", () => toast.error("Could not get location"));
  };
  return (
    <button
      onClick={handle}
      title="Go to my location"
      style={{
        position: "absolute", bottom: 100, right: 12, zIndex: 1000,
        width: 40, height: 40, borderRadius: "50%",
        background: "#fff", border: "1.5px solid #EDE8DF",
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#8B3A2A"
      }}
    >
      <Locate size={18} />
    </button>
  );
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

  // use browser GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLiveLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
        },
        () => {
          // fallback to Pune center
          setMapCenter(PUNE_CENTER);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // load places & stops
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

  // filter by search
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    const q = searchQuery.toLowerCase();
    return places.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  }, [places, searchQuery]);

  // route points
  const origin = liveLocation
    ? [liveLocation.lat, liveLocation.lng]
    : userLocation?.latitude ? [userLocation.latitude, userLocation.longitude] : null;

  const routePoints = useMemo(() => {
    if (stops.length > 0) {
      return stops.map(stop => {
        const mp = places.find(p => p.name.toLowerCase() === stop.name.toLowerCase());
        return mp?.latitude && mp?.longitude ? [mp.latitude, mp.longitude] : null;
      }).filter(Boolean);
    }
    if (selectedPlace?.latitude && selectedPlace?.longitude && origin) {
      return [origin, [selectedPlace.latitude, selectedPlace.longitude]];
    }
    return [];
  }, [stops, places, selectedPlace, origin]);

  // fetch OSRM route
  useEffect(() => {
    if (routePoints.length < 2) {
      setRouteGeometry([]); setRouteStats({ distanceKm: 0, durationSec: 0 }); setDirections([]); return;
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
              if (step.name || step.maneuver.type !== "turn")
                steps.push({ instruction: formatInstruction(step.maneuver, step.name), distance: step.distance });
            })
          );
          setDirections(steps);
        }
      } catch {
        setRouteGeometry(routePoints);
      }
    })();
  }, [routePoints, mode]);

  // ── Icon builders ─────────────────────────────────────────────────────────

  const placeIcon = useCallback((place, stopNum) => L.divIcon({
    html: `
      <div style="position:relative;width:36px;height:36px;border-radius:50%;
        background:${getCategoryColor(place.category)};display:flex;align-items:center;
        justify-content:center;border:2.5px solid white;
        box-shadow:0 3px 8px rgba(0,0,0,0.28);font-size:16px;transition:transform 0.2s;">
        ${place.emoji || "📍"}
        ${stopNum !== null ? `<div style="position:absolute;top:-7px;right:-7px;
          background:#3D3680;color:white;width:18px;height:18px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;
          border:1.5px solid white;">${stopNum}</div>` : ""}
      </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  }), []);

  const userIcon = L.divIcon({
    html: `<div style="position:relative;">
      <div style="width:18px;height:18px;border-radius:50%;background:#3D3680;border:2.5px solid white;box-shadow:0 0 0 4px rgba(61,54,128,0.25);"></div>
    </div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

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
    if (place.latitude && place.longitude) setMapCenter([place.latitude, place.longitude]);
  };

  const openGoogleMaps = () => {
    if (routePoints.length < 2) return;
    const orig = `${routePoints[0][0]},${routePoints[0][1]}`;
    const dest = `${routePoints[routePoints.length - 1][0]},${routePoints[routePoints.length - 1][1]}`;
    const wp = routePoints.slice(1, -1).map(p => `${p[0]},${p[1]}`).join("|");
    const modeMap = { Walking: "walking", Auto: "driving", Driving: "driving" };
    const url = `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}${wp ? `&waypoints=${wp}` : ""}&travelmode=${modeMap[mode] || "driving"}`;
    window.open(url, "_blank");
  };

  const currentMapStyle = MAP_STYLES.find(s => s.id === mapStyle) || MAP_STYLES[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0F0F10", position: "relative" }}>
      <Toaster />
      <StatusBar light />

      {/* ── Premium Floating Header ──────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 32, left: 0, right: 0, zIndex: 900,
        padding: "0 12px", pointerEvents: "none"
      }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, pointerEvents: "all"
        }}>
          {/* Back home */}
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.95)", border: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#8B3A2A", flexShrink: 0
              }}
            >
              <Home size={18} />
            </button>
          )}

          {/* Search bar */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.96)", borderRadius: 12,
            padding: "0 12px", height: 40,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
          }}>
            <Search size={15} color="#8B3A2A" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Pune spots..."
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 13, color: "#1C1412", fontWeight: 500
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", display: "flex" }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Layer picker */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowStylePicker(!showStylePicker)}
              title="Map style"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.95)", border: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#8B3A2A"
              }}
            >
              <Layers size={18} />
            </button>
            {showStylePicker && (
              <div style={{
                position: "absolute", top: 46, right: 0, zIndex: 1100,
                background: "#fff", borderRadius: 12, padding: "6px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", gap: 4,
                minWidth: 130
              }}>
                {MAP_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setMapStyle(s.id); setShowStylePicker(false); }}
                    style={{
                      padding: "7px 12px", borderRadius: 8, border: "none",
                      background: mapStyle === s.id ? "#F2EAE7" : "transparent",
                      color: mapStyle === s.id ? "#8B3A2A" : "#333",
                      fontWeight: 600, fontSize: 12, cursor: "pointer", textAlign: "left"
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div style={{
          display: "flex", gap: 6, marginTop: 8, overflowX: "auto",
          paddingBottom: 2, pointerEvents: "all"
        }} className="no-scrollbar">
          {["All", ...categories.filter(c => c !== "All")].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap",
                fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                background: activeFilter === cat
                  ? "#8B3A2A"
                  : "rgba(255,255,255,0.92)",
                color: activeFilter === cat ? "#fff" : "#333",
                boxShadow: activeFilter === cat
                  ? "0 2px 8px rgba(139,58,42,0.35)"
                  : "0 2px 6px rgba(0,0,0,0.12)",
                transition: "all 0.2s"
              }}
            >
              <span>{getCategoryEmoji(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-Screen Map ──────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>

        {/* CSS overrides */}
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .leaflet-container { font-family: inherit; }
          .flowing-route {
            stroke-dasharray: 10 6;
            animation: routeFlow 20s linear infinite;
          }
          @keyframes routeFlow {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -1000; }
          }
          @keyframes pulse {
            0%,100% { opacity:0.3; transform:scale(0.9); }
            50% { opacity:0; transform:scale(1.5); }
          }
        `}</style>

        {loading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 1000, background: "rgba(15,15,16,0.7)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#fff", gap: 10
          }}>
            <Compass size={32} className="animate-spin" style={{ color: "#F59E0B" }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Loading Pune Map...</div>
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

          {/* GPS Locate button inside map */}
          <LocateButton onLocate={(latlng) => {
            setLiveLocation({ lat: latlng.lat, lng: latlng.lng });
            setMapCenter([latlng.lat, latlng.lng]);
          }} />

          {/* User/Live location marker */}
          {(liveLocation || userLocation) && (() => {
            const lat = liveLocation?.lat ?? userLocation?.latitude;
            const lng = liveLocation?.lng ?? userLocation?.longitude;
            return lat && lng ? (
              <Marker position={[lat, lng]} icon={userIcon}>
                <Popup>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>📍 You are here</div>
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
                  <div style={{ minWidth: 160, fontFamily: "inherit" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{place.emoji || "📍"}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1412" }}>
                          {userLanguage === "Marathi" && place.name_mr ? place.name_mr : place.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
                          ⭐ {place.rating?.toFixed(1)} &nbsp;·&nbsp; {place.category}
                        </div>
                      </div>
                    </div>
                    {place.address && (
                      <div style={{ fontSize: 10, color: "#6B5B52", marginBottom: 6 }}>
                        📍 {place.address}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (stopIdx !== -1) handleDeleteStop(stops[stopIdx].id);
                        else handleAddToItinerary(place);
                      }}
                      style={{
                        width: "100%", padding: "6px 0", borderRadius: 8, border: "none",
                        background: stopIdx !== -1 ? "#F2EAE7" : "#8B3A2A",
                        color: stopIdx !== -1 ? "#8B3A2A" : "#fff",
                        fontSize: 11, fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      {stopIdx !== -1 ? "❌ Remove Stop" : "📅 Add to Itinerary"}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Route polyline */}
          {(routeGeometry.length > 1 || routePoints.length > 1) && (
            <>
              <Polyline
                positions={routeGeometry.length > 1 ? routeGeometry : routePoints}
                color={stops.length > 0 ? "#8B3A2A" : "#3D3680"}
                weight={5}
                opacity={0.85}
                pathOptions={{ className: "flowing-route" }}
              />
              {/* Glow underline */}
              <Polyline
                positions={routeGeometry.length > 1 ? routeGeometry : routePoints}
                color={stops.length > 0 ? "#F59E0B" : "#818CF8"}
                weight={10}
                opacity={0.18}
              />
            </>
          )}
        </MapContainer>

        {/* ── Fullscreen Expand Badge ────────────────────────────────── */}
        {/* Live stats bar (bottom-left overlay) */}
        {routeStats.distanceKm > 0 && (
          <div style={{
            position: "absolute", bottom: 148, left: 12, zIndex: 900,
            background: "rgba(255,255,255,0.96)", borderRadius: 12,
            padding: "8px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", gap: 2
          }}>
            <div style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>
              {TRAVEL_MODES.find(m => m.id === mode)?.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1C1412" }}>
              {fmtDuration(routeStats.durationSec)}
            </div>
            <div style={{ fontSize: 10, color: "#8B3A2A", fontWeight: 700 }}>
              {routeStats.distanceKm.toFixed(1)} km
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Controls Panel ────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderTop: "1px solid #EDE8DF",
        padding: "10px 16px 16px", zIndex: 800,
        boxShadow: "0 -8px 24px rgba(0,0,0,0.1)"
      }}>
        {/* Travel mode selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {TRAVEL_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, padding: "7px 4px", borderRadius: 10, border: "1.5px solid",
                borderColor: mode === m.id ? "#8B3A2A" : "#EDE8DF",
                background: mode === m.id ? "#8B3A2A" : "#fff",
                color: mode === m.id ? "#fff" : "#555",
                fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s"
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* Directions toggle */}
          {directions.length > 0 && (
            <button
              onClick={() => setShowDirections(!showDirections)}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #EDE8DF",
                background: showDirections ? "#F2EAE7" : "#fff",
                color: "#8B3A2A", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
              }}
            >
              {showDirections ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              Directions ({directions.length})
            </button>
          )}

          {/* Stops list toggle */}
          {(stops.length > 0 || filteredPlaces.length > 0) && (
            <button
              onClick={() => setShowStopList(!showStopList)}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #EDE8DF",
                background: showStopList ? "#F2EAE7" : "#fff",
                color: "#333", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
              }}
            >
              <MapPin size={13} />
              {stops.length > 0 ? `${stops.length} Stops` : `${filteredPlaces.length} Spots`}
            </button>
          )}

          {/* Navigate CTA */}
          <button
            onClick={openGoogleMaps}
            disabled={routePoints.length < 2}
            style={{
              flex: 1.4, padding: "9px 14px", borderRadius: 10, border: "none",
              background: routePoints.length < 2 ? "#EDE8DF" : "linear-gradient(135deg,#8B3A2A,#B87318)",
              color: routePoints.length < 2 ? "#aaa" : "#fff",
              fontSize: 12, fontWeight: 800, cursor: routePoints.length < 2 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              boxShadow: routePoints.length >= 2 ? "0 4px 12px rgba(139,58,42,0.35)" : "none"
            }}
          >
            <Navigation size={14} />
            Navigate
          </button>
        </div>

        {/* ── Turn-by-turn Directions ── */}
        {showDirections && directions.length > 0 && (
          <div style={{
            marginTop: 10, maxHeight: 160, overflowY: "auto",
            background: "#FBF8F3", borderRadius: 10, padding: "8px 10px",
            border: "1px solid #EDE8DF"
          }} className="no-scrollbar">
            {directions.map((step, idx) => (
              <div key={idx} style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                fontSize: 11, paddingBottom: 6, marginBottom: 6,
                borderBottom: idx !== directions.length - 1 ? "1px solid #EDE8DF" : "none"
              }}>
                <div style={{ color: "#1C1412", fontWeight: 600, flex: 1, paddingRight: 8 }}>
                  {step.instruction}
                </div>
                <div style={{ color: "#8B3A2A", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                  {step.distance > 1000
                    ? `${(step.distance / 1000).toFixed(1)} km`
                    : `${Math.round(step.distance)} m`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Place / Stop List ── */}
        {showStopList && (
          <div style={{
            marginTop: 10, maxHeight: 200, overflowY: "auto",
            background: "#FBF8F3", borderRadius: 10,
            border: "1px solid #EDE8DF"
          }} className="no-scrollbar">
            {(stops.length > 0 ? stops : filteredPlaces).map((item, idx) => {
              const isStop = stops.length > 0;
              const isSelected = selectedPlace?.id === item.id;
              const isCompleted = completedStopId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !isStop && handleSelectPlace(item)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", cursor: isStop ? "default" : "pointer",
                    borderBottom: idx !== (stops.length > 0 ? stops : filteredPlaces).length - 1 ? "1px solid #EDE8DF" : "none",
                    background: isSelected || isCompleted ? "#F2EAE7" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, fontSize: 14,
                    background: isStop ? "#F2EAE7" : (item.bgColor || "#F2EAE7"),
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {item.emoji || "📍"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1412", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userLanguage === "Marathi" && item.name_mr ? item.name_mr : item.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
                      {isStop ? item.time : `⭐ ${item.rating} · ${item.address || item.category}`}
                    </div>
                  </div>
                  {isStop && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleToggleStop(item.id)}
                        style={{
                          width: 24, height: 24, borderRadius: "50%", border: item.done ? "none" : "1.5px solid #EDE8DF",
                          background: item.done ? "#4A6741" : "transparent", color: item.done ? "#fff" : "transparent",
                          fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >✓</button>
                      <button
                        onClick={() => handleDeleteStop(item.id)}
                        style={{
                          width: 24, height: 24, borderRadius: "50%", border: "none",
                          background: "#F2EAE7", color: "#8B3A2A",
                          fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      ><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom Sheet: Selected Place Detail ─────────────────────── */}
      {sheetOpen && selectedPlace && (
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2000,
            background: "#fff", borderRadius: "20px 20px 0 0",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
            padding: "16px", maxHeight: "55vh", overflowY: "auto"
          }}
          className="no-scrollbar"
        >
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, background: "#EDE8DF", borderRadius: 4, margin: "0 auto 14px" }} />

          <button
            onClick={() => setSheetOpen(false)}
            style={{
              position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%",
              background: "#F2EAE7", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#8B3A2A"
            }}
          ><X size={14} /></button>

          {/* Place image */}
          {selectedPlace.image && (
            <img
              src={selectedPlace.image}
              alt={selectedPlace.name}
              style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 14, marginBottom: 12 }}
            />
          )}

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0, fontSize: 22,
              background: `${getCategoryColor(selectedPlace.category)}22`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {selectedPlace.emoji || "📍"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1C1412" }}>
                {userLanguage === "Marathi" && selectedPlace.name_mr ? selectedPlace.name_mr : selectedPlace.name}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                <span>⭐ {selectedPlace.rating?.toFixed(1)}</span>
                <span>·</span>
                <span style={{ background: `${getCategoryColor(selectedPlace.category)}22`, color: getCategoryColor(selectedPlace.category), padding: "1px 8px", borderRadius: 10, fontWeight: 700, fontSize: 10 }}>
                  {selectedPlace.category}
                </span>
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {selectedPlace.address && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#FBF8F3", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#555", fontWeight: 600 }}>
                <MapPin size={11} color="#8B3A2A" />
                {selectedPlace.address}
              </div>
            )}
            {selectedPlace.openHours && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#FBF8F3", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#555", fontWeight: 600 }}>
                <Clock size={11} color="#8B3A2A" />
                {selectedPlace.openHours}
              </div>
            )}
          </div>

          {/* Description */}
          {selectedPlace.description && (
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 14 }}>
              {selectedPlace.description}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const stopIdx = stops.findIndex(s => s.name.toLowerCase() === selectedPlace.name.toLowerCase());
                if (stopIdx !== -1) handleDeleteStop(stops[stopIdx].id);
                else handleAddToItinerary(selectedPlace);
              }}
              style={{
                flex: 1, padding: "10px", borderRadius: 12, border: "1.5px solid #EDE8DF",
                background: "#FBF8F3", color: "#8B3A2A", fontSize: 12, fontWeight: 700, cursor: "pointer"
              }}
            >
              {stops.some(s => s.name.toLowerCase() === selectedPlace.name.toLowerCase())
                ? "❌ Remove Stop"
                : "📅 Add to Itinerary"}
            </button>
            <button
              onClick={() => {
                if (selectedPlace.latitude && selectedPlace.longitude) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}&travelmode=${mode.toLowerCase() === "auto" ? "driving" : mode.toLowerCase()}`;
                  window.open(url, "_blank");
                }
              }}
              style={{
                flex: 1, padding: "10px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#8B3A2A,#B87318)",
                color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                boxShadow: "0 4px 12px rgba(139,58,42,0.35)"
              }}
            >
              <Navigation size={14} />
              Go Here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
