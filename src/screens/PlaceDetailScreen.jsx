import { useState } from "react";
import StatusBar from "../components/StatusBar";
import { addStopToItinerary, toggleSavePlace, fetchItinerary } from "../data/api";
import { calculateDistance, formatDistance } from "../utils/location";
import { translations } from "../data/translations";
import { Home, ArrowLeft, Heart, Image as ImageIcon, MapPin, Clock, Calendar, Phone } from "lucide-react";

const getPlacePhotos = (place) => {
  if (!place) return [];
  if (place.imageUrl && place.imageUrl.startsWith("http")) {
    return [place.imageUrl];
  }
  const name = (place.name || "").toLowerCase();
  if (name.includes("shaniwar")) {
    return [
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (name.includes("aga khan")) {
    return [
      "https://images.unsplash.com/photo-1609828913647-7576722d36d2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (name.includes("ganpati") || name.includes("dagdusheth")) {
    return [
      "https://images.unsplash.com/photo-1662446736466-9b57d079942a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80"
    ];
  }
  return [
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80"
  ];
};

export default function PlaceDetailScreen({ place, onBack, userLocation, userLanguage, onNavigateHome }) {
  const [isSaved, setIsSaved] = useState(place?.isSaved || false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!place) return null;

  const t = translations[userLanguage] || translations.English;
  const photos = getPlacePhotos(place);

  const dynamicDistance = userLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude)
    : null;

  const handleToggleSave = async () => {
    try {
      const updated = await toggleSavePlace(place.id, !isSaved);
      setIsSaved(updated.isSaved);
    } catch (error) {
      console.error("Failed to toggle save:", error);
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToItinerary = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      let day1Id = null;
      try {
        const itinerary = await fetchItinerary();
        const day1 = Array.isArray(itinerary) ? itinerary.find(d => d.day === 1) : null;
        if (day1) day1Id = day1.id;
      } catch (e) {
        console.warn("Could not fetch itinerary day1 fallback:", e);
      }

      await addStopToItinerary({
        itineraryDayId: day1Id,
        name: place.name,
        name_mr: place.name_mr || place.name,
        time: "TBD",
        desc: place.description || "",
        desc_mr: place.description_mr || place.description || "",
        dotColor: "#8B3A2A",
        tags: [{ label: place.category || "Heritage", type: (place.category || "heritage").toLowerCase() }]
      });

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
    } catch (error) {
      console.error("Failed to add to itinerary:", error);
      alert(userLanguage === "Marathi" ? "सहलीत जोडण्यात अडचण आली." : "Failed to add to itinerary. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div style={{ background: "#fff", height: "100%", overflowY: "auto" }}>
      <StatusBar light />

      {/* Hero Banner with Photo */}
      <div
        style={{
          height: 220,
          backgroundImage: `url(${photos[activePhotoIndex] || photos[0]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Top-Left Action Buttons (Back & Home) */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8, zIndex: 10 }}>
          <button
            onClick={onBack}
            title="Back"
            style={{
              width: 36, height: 36,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 10,
              color: "#fff",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} />
          </button>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title={t.home || "Home"}
              style={{
                width: 36, height: 36,
                background: "#8B3A2A",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(139,58,42,0.4)"
              }}
            >
              <Home size={18} />
            </button>
          )}
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleToggleSave}
          style={{
            position: "absolute",
            top: 12, right: 12,
            width: 36, height: 36,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10,
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10
          }}
        >
          {isSaved ? "❤️" : "🤍"}
        </button>

        {/* Emoji Badge on Hero */}
        <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "center", gap: 10, zIndex: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
            {place.emoji}
          </div>
          <div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
              {userLanguage === "Marathi" && place.name_mr ? place.name_mr : place.name}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>
              📍 {place.address}
            </p>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div style={{ padding: 16 }}>
        {/* Rating and Distance */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B5B52" }}>
            <span>📍 {place.address}</span>
            <span>•</span>
            <span style={{ fontWeight: 700, color: "#8B3A2A" }}>{formatDistance(dynamicDistance)}</span>
          </div>
          <div style={{ display: "flex", itemsCenter: "center", gap: 6 }}>
            <button
              onClick={() => {
                const lat = place.latitude || 18.5194;
                const lng = place.longitude || 73.8553;
                const query = encodeURIComponent(`${place.name}, Pune`);
                window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${query}`;
              }}
              style={{
                background: "#8B3A2A",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              🧭 {userLanguage === "Marathi" ? "दिशा" : "Directions"}
            </button>
            <div
              style={{
                background: "#FDF3E0",
                color: "#B87318",
                padding: "5px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {place.rating?.toFixed(1) || "4.5"} ⭐
            </div>
          </div>
        </div>

        {/* Photos Gallery Carousel Section */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1C1412", marginBottom: 8 }}>
            <ImageIcon size={16} className="text-[#8B3A2A]" />
            <span>{userLanguage === "Marathi" ? "फोटो गॅलरी" : userLanguage === "Hindi" ? "फोटो गैलरी" : "Photos & Gallery"}</span>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
            {photos.map((pUrl, idx) => (
              <img
                key={idx}
                src={pUrl}
                alt={`Photo ${idx + 1}`}
                onClick={() => setActivePhotoIndex(idx)}
                style={{
                  width: 100,
                  height: 70,
                  borderRadius: 12,
                  objectFit: "cover",
                  cursor: "pointer",
                  border: activePhotoIndex === idx ? "2.5px solid #8B3A2A" : "1px solid #EDE8DF",
                  opacity: activePhotoIndex === idx ? 1 : 0.7,
                  transition: "all 0.2s"
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "16px 0" }}>
          {[
            { val: place.estYear, lbl: t.estYear },
            { val: place.entryFee, lbl: t.entryFee },
            { val: place.visitTime, lbl: t.visitTime },
          ].map((s) => (
            <div
              key={s.lbl}
              style={{
                background: "#FBF8F3",
                borderRadius: 12,
                padding: "10px 8px",
                textAlign: "center",
                border: "1px solid #EDE8DF"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1C1412" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#6B5B52", marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* About */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1412", marginBottom: 6 }}>{t.about}</div>
        <div style={{ fontSize: 12, color: "#6B5B52", lineHeight: 1.6, marginBottom: 16 }}>
          {userLanguage === "Marathi" && place.description_mr ? place.description_mr : place.description}
        </div>

        {/* Info Rows */}
        <div style={{ background: "#FBF8F3", padding: 12, borderRadius: 16, border: "1px solid #EDE8DF", marginBottom: 20 }}>
          <InfoRow icon="🕐" text={place.hours} />
          {place.phone !== "—" && (
            <a href={`tel:${place.phone}`} style={{ textDecoration: 'none' }}>
              <InfoRow icon="📞" text={place.phone} />
            </a>
          )}
        </div>

        {/* Add to Itinerary Button */}
        <button
          onClick={handleAddToItinerary}
          disabled={isAdding}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: isAdded ? "#15803D" : "#8B3A2A",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(139,58,42,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
        >
          {isAdding ? "..." : isAdded ? "✓ Added to Itinerary!" : t.addToPlan}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12, color: "#1C1412" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontWeight: 600 }}>{text}</span>
    </div>
  );
}
