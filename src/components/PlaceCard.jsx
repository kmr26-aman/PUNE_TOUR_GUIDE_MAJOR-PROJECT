import { memo, useState } from "react";
import { tagColorMap } from "../data/tokens";
import { calculateDistance, formatDistance } from "../utils/location";
import { Heart, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const getPlacePhoto = (place) => {
  if (place.imageUrl && place.imageUrl.startsWith("http")) return place.imageUrl;
  const name = (place.name || "").toLowerCase();
  if (name.includes("shaniwar")) return "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=400&q=80";
  if (name.includes("aga khan")) return "https://images.unsplash.com/photo-1609828913647-7576722d36d2?auto=format&fit=crop&w=400&q=80";
  if (name.includes("ganpati") || name.includes("dagdusheth")) return "https://images.unsplash.com/photo-1662446736466-9b57d079942a?auto=format&fit=crop&w=400&q=80";
  if (name.includes("pataleshwar") || name.includes("cave")) return "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=400&q=80";
  if (name.includes("sinhagad") || name.includes("fort")) return "https://images.unsplash.com/photo-1626014903708-ecb661d9a26a?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=400&q=80";
};

const PlaceCard = memo(function PlaceCard({ place, onClick, userLocation, userLanguage }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const tagStyle = tagColorMap[place.tagColor] || tagColorMap.terracotta;
  const photoUrl = getPlacePhoto(place);

  const dynamicDistance = userLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude)
    : null;

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Check out ${place.name} on Pune Explorer!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      toast.success(`Link for ${place.name} copied!`);
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? `Removed from Saved` : `Added ${place.name} to Saved ❤️`);
  };

  return (
    <div
      onClick={() => onClick(place)}
      className="w-40 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between"
    >
      {/* Real Photo Thumbnail */}
      <div className="w-full h-24 relative overflow-hidden bg-gray-100">
        <img
          src={photoUrl}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        
        {/* Emoji Badge overlay */}
        <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">
          {place.emoji}
        </div>

        {/* Favorite & Share Buttons */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
          <button
            onClick={handleFavorite}
            className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center transition-all"
            title="Bookmark"
          >
            <Heart size={12} fill={isFavorite ? '#EF4444' : 'none'} stroke={isFavorite ? '#EF4444' : '#FFFFFF'} />
          </button>
          <button
            onClick={handleShare}
            className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center transition-all"
            title="Share"
          >
            <Share2 size={11} />
          </button>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
            {(userLanguage === "Marathi" || userLanguage === "Hindi") && place.name_mr ? place.name_mr : place.name}
          </h4>
          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
            ⭐ {place.rating?.toFixed(1) || "4.5"} · {formatDistance(dynamicDistance)}
          </p>
        </div>

        <div className="mt-2">
          <span
            style={{ background: tagStyle.bg, color: tagStyle.color }}
            className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full"
          >
            {place.tag || "Must Visit"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default PlaceCard;
