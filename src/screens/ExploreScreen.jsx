import { useState, useEffect, useMemo } from "react";
import { Home } from "lucide-react";
import StatusBar from "../components/StatusBar";
import PlaceListItem from "../components/PlaceListItem";
import { categories } from "../data/puneData";
import { fetchPlaces } from "../data/api";
import { translations } from "../data/translations";

export default function ExploreScreen({ onPlaceSelect, initialParams = {}, userLocation, userLanguage, onNavigateHome }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(initialParams.showFilters || false);
  const [sortBy, setSortBy] = useState("rating"); // 'rating' or 'name'
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const t = translations[userLanguage] || translations.English;

  // Advanced Filters
  const [onlyAccessible, setOnlyAccessible] = useState(false);
  const [priceFilter, setPriceFilter] = useState("All"); // 'All', 'Free', 'Paid'
  const [onlyTopRated, setOnlyTopRated] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById('explore-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const loadPlaces = async () => {
      setLoading(true);
      try {
        const data = await fetchPlaces({ category: activeFilter, q: search });
        setPlaces(data);
      } catch (error) {
        console.error("Failed to load explore data:", error);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(loadPlaces, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [activeFilter, search]);

  const filteredAndSortedPlaces = useMemo(() => {
    return [...places]
      .filter((place) => {
        if (onlyAccessible && !place.accessible) return false;
        if (onlyTopRated && place.rating < 4.5) return false;
        if (priceFilter === "Free" && place.entryFee !== "Free" && place.entryFee !== "—") return false;
        if (priceFilter === "Paid" && (place.entryFee === "Free" || place.entryFee === "—")) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [places, onlyAccessible, onlyTopRated, priceFilter, sortBy]);

  if (loading && places.length === 0) {
    return (
      <div style={{ background: "#FBF8F3", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <StatusBar />
        <div style={{ color: "#8B3A2A", fontWeight: 600, fontSize: 13 }}>{t.searching}</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FBF8F3", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Fixed Header Section */}
      <div style={{ background: "#FBF8F3", zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <StatusBar />
        
        {/* Header */}
        <div style={{ padding: "10px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                title={t.home || "Home"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#8B3A2A",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(139,58,42,0.2)",
                  transition: "all 0.2s"
                }}
              >
                <Home size={18} />
              </button>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1412", flex: 1, textAlign: onNavigateHome ? "right" : "left" }}>
              {t.exploreTitle}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                background: "#EDE8DF",
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14, color: "#6B5B52" }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: "#1C1412",
                  width: "100%",
                }}
              />
            </div>
            <div
              onClick={() => setShowFilters(true)}
              style={{
                width: 36,
                height: 36,
                background: "#8B3A2A",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 16, color: "#fff" }}>☰</span>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ 
          display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", 
          background: "#FBF8F3", paddingBottom: 12
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: "5px 12px",
                borderRadius: 16,
                fontSize: 11,
                fontWeight: 500,
                flexShrink: 0,
                border: "none",
                cursor: "pointer",
                background: activeFilter === cat ? "#3D3680" : "#EDE8DF",
                color: activeFilter === cat ? "#fff" : "#6B5B52",
              }}
            >
              {userLanguage === "Marathi" ? (translations.Marathi[cat.toLowerCase()] || cat) : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        id="explore-scroll-container"
        onScroll={(e) => setShowScrollTop(e.target.scrollTop > 300)}
        style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}
      >
        <div style={{ background: "#fff" }}>
          {filteredAndSortedPlaces.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#6B5B52", fontSize: 13 }}>
              {t.noPlaces}
            </div>
          ) : (
            filteredAndSortedPlaces.map((place) => (
              <PlaceListItem key={place.id} place={place} onClick={onPlaceSelect} userLocation={userLocation} />
            ))
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: "absolute",
            bottom: 100,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#8B3A2A",
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 12px rgba(139,58,42,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            cursor: "pointer",
            zIndex: 100,
            transition: "0.3s"
          }}
        >
          ↑
        </button>
      )}

      {/* Filter Modal Overlay */}
      {showFilters && (
        <div 
          onClick={() => setShowFilters(false)}
          style={{ 
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", 
            zIndex: 100, display: "flex", alignItems: "flex-end" 
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ 
              width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", 
              padding: "24px 20px 40px", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              maxHeight: "80%", overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1412" }}>{t.filters}</div>
              <button onClick={() => setShowFilters(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            {/* Sort Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5B52", marginBottom: 12 }}>{t.sortBy}</div>
              <div style={{ display: "flex", gap: 10 }}>
                {["rating", "name"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 12, border: "1.5px solid",
                      borderColor: sortBy === s ? "#8B3A2A" : "#EDE8DF",
                      background: sortBy === s ? "#F2EAE7" : "#fff",
                      color: sortBy === s ? "#8B3A2A" : "#6B5B52",
                      fontSize: 12, fontWeight: 600, textTransform: "capitalize", cursor: "pointer"
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5B52", marginBottom: 12 }}>{t.priceRange}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["All", "Free", "Paid"].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriceFilter(p)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 12, border: "1.5px solid",
                      borderColor: priceFilter === p ? "#8B3A2A" : "#EDE8DF",
                      background: priceFilter === p ? "#F2EAE7" : "#fff",
                      color: priceFilter === p ? "#8B3A2A" : "#6B5B52",
                      fontSize: 12, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles Section */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5B52", marginBottom: 16 }}>{t.preferences}</div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: "#1C1412", fontWeight: 500 }}>{t.accessible}</div>
                <button 
                  onClick={() => setOnlyAccessible(!onlyAccessible)}
                  style={{ 
                    width: 44, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
                    background: onlyAccessible ? "#4A6741" : "#EDE8DF",
                    position: "relative", transition: "0.3s"
                  }}
                >
                  <div style={{ 
                    width: 18, height: 18, background: "#fff", borderRadius: "50%",
                    position: "absolute", top: 3, left: onlyAccessible ? 23 : 3, transition: "0.3s"
                  }} />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, color: "#1C1412", fontWeight: 500 }}>{t.topRated}</div>
                <button 
                  onClick={() => setOnlyTopRated(!onlyTopRated)}
                  style={{ 
                    width: 44, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
                    background: onlyTopRated ? "#B87318" : "#EDE8DF",
                    position: "relative", transition: "0.3s"
                  }}
                >
                  <div style={{ 
                    width: 18, height: 18, background: "#fff", borderRadius: "50%",
                    position: "absolute", top: 3, left: onlyTopRated ? 23 : 3, transition: "0.3s"
                  }} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowFilters(false)}
              style={{ 
                width: "100%", background: "#8B3A2A", color: "#fff", border: "none", 
                borderRadius: 14, padding: "14px", fontWeight: 600, cursor: "pointer" 
              }}
            >
              {t.apply}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
