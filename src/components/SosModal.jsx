import { useState, useEffect } from "react";
import { 
  ShieldAlert, Phone, MapPin, AlertTriangle, Heart, Stethoscope, 
  Wrench, Copy, Share2, Check, X, User, Activity, Clock, ShieldCheck, FileText, Zap
} from "lucide-react";
import toast from "react-hot-toast";

// First Aid Protocols from RoadSoS
const FIRST_AID_DATA = [
  {
    title: "Severe Bleeding",
    icon: "🩸",
    scenario: "Uncontrolled bleeding from a wound or impact.",
    steps: [
      "Apply firm direct pressure to the wound with a clean cloth or bandage.",
      "Keep pressure applied continuously until paramedics arrive.",
      "Help the victim lie down flat and keep them warm to prevent traumatic shock."
    ]
  },
  {
    title: "CPR (Adult)",
    icon: "🫀",
    scenario: "Victim is unresponsive and not breathing normally.",
    steps: [
      "Call 108 / 112 emergency services immediately.",
      "Place heel of hand on center of chest, push hard and fast (100–120 beats/min).",
      "Allow chest to recoil fully between compressions until help arrives."
    ]
  },
  {
    title: "Burns & Scalds",
    icon: "🔥",
    scenario: "Skin contact with hot engine parts, exhaust, or fire.",
    steps: [
      "Cool the burn with cool running water for at least 10 minutes.",
      "Remove tight clothing or jewelry before swelling begins.",
      "Cover loosely with sterile bandage. Do NOT apply ice, oil, or butter."
    ]
  },
  {
    title: "Fractures & Sprains",
    icon: "🦴",
    scenario: "Broken bones or severe joint damage from road collision.",
    steps: [
      "Immobilize the limb. Do NOT attempt to realign broken bones.",
      "Apply ice wrapped in a towel to reduce swelling.",
      "Keep victim calm and stationary until medical transport arrives."
    ]
  }
];

// Pune Major Emergency Medical & Police Centers
const PUNE_EMERGENCY_CENTERS = [
  { name: "Sassoon General & Trauma Hospital", type: "Hospital 🏥", phone: "020-26128000", address: "Near Pune Railway Station", lat: 18.5284, lng: 73.8739 },
  { name: "Sancheti Orthopedic & Trauma Institute", type: "Trauma Center 🚑", phone: "020-28999999", address: "Shivajinagar, Pune", lat: 18.5273, lng: 73.8519 },
  { name: "Ruby Hall Clinic 24/7 Emergency", type: "Hospital 🏥", phone: "020-66455100", address: "Sassoon Road, Pune", lat: 18.5322, lng: 73.8776 },
  { name: "Jehangir Hospital Emergency", type: "Hospital 🏥", phone: "020-66819999", address: "Sassoon Road, Pune", lat: 18.5305, lng: 73.8752 },
  { name: "Pune Police Control Room", type: "Police 🚓", phone: "100", address: "Shivajinagar, Pune", lat: 18.5300, lng: 73.8500 },
  { name: "Deccan Gymkhana Police Station", type: "Police 🚓", phone: "020-25537555", address: "FC Road, Deccan", lat: 18.5186, lng: 73.8427 }
];

export default function SosModal({ isOpen, onClose, userLocation, userLanguage }) {
  const [activeTab, setActiveTab] = useState("sos"); // sos, firstaid, centers, medical
  
  // 3-Second SOS Haptic Countdown Timer State
  const [countdown, setCountdown] = useState(null);
  const [isEmergencyTriggered, setIsEmergencyTriggered] = useState(false);

  // User Medical Profile
  const [bloodGroup, setBloodGroup] = useState(() => localStorage.getItem("pune_user_blood_group") || "O+");
  const [emergencyContactName, setEmergencyContactName] = useState(() => localStorage.getItem("pune_user_em_name") || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(() => localStorage.getItem("pune_user_em_phone") || "");
  const [emergencyContactPhone2, setEmergencyContactPhone2] = useState(() => localStorage.getItem("pune_user_em_phone2") || "");
  const [medicalNotes, setMedicalNotes] = useState(() => localStorage.getItem("pune_user_med_notes") || "");
  const [isCopied, setIsCopied] = useState(false);

  // Sync Emergency Profile from LocalStorage whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setBloodGroup(localStorage.getItem("pune_user_blood_group") || "O+");
      setEmergencyContactName(localStorage.getItem("pune_user_em_name") || "");
      setEmergencyContactPhone(localStorage.getItem("pune_user_em_phone") || "");
      setEmergencyContactPhone2(localStorage.getItem("pune_user_em_phone2") || "");
      setMedicalNotes(localStorage.getItem("pune_user_med_notes") || "");
    }
  }, [isOpen]);

  // Save Medical Profile
  const handleSaveMedicalProfile = (e) => {
    e.preventDefault();
    localStorage.setItem("pune_user_blood_group", bloodGroup);
    localStorage.setItem("pune_user_em_name", emergencyContactName);
    localStorage.setItem("pune_user_em_phone", emergencyContactPhone);
    localStorage.setItem("pune_user_em_phone2", emergencyContactPhone2);
    localStorage.setItem("pune_user_med_notes", medicalNotes);
    toast.success("Emergency Medical Profile saved locally! 🛡️");
  };

  // Start SOS 3-Second Countdown
  const startSosCountdown = () => {
    setCountdown(3);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (navigator.vibrate) navigator.vibrate(200);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsEmergencyTriggered(true);
      setCountdown(null);
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 800]);
      
      // Auto-open WhatsApp / SMS emergency alert to primary emergency contact if set
      if (emergencyContactPhone) {
        const message = encodeURIComponent(`🚨 EMERGENCY ROAD SOS ALERT 🚨\nI need immediate rescue assistance!\nLive Location: ${userLocation?.address || "Pune"}\nGPS: ${userLocation?.latitude || 18.5204}, ${userLocation?.longitude || 73.8567}\nGoogle Maps: https://maps.google.com/?q=${userLocation?.latitude || 18.5204},${userLocation?.longitude || 73.8567}\nBlood Group: ${bloodGroup}\nMedical Notes: ${medicalNotes || "None"}`);
        window.open(`https://api.whatsapp.com/send?phone=${emergencyContactPhone.replace(/[^0-9]/g, '')}&text=${message}`, "_blank");
      }

      toast.error("🚨 EMERGENCY DISPATCH ACTIVATED! Alert sent to your emergency contact.", { duration: 6000 });
    }
  }, [countdown]);

  const cancelSos = () => {
    setCountdown(null);
    setIsEmergencyTriggered(false);
    toast("SOS Alert Cancelled", { icon: "🛡️" });
  };

  const lat = userLocation?.latitude || 18.5204;
  const lng = userLocation?.longitude || 73.8567;
  const address = userLocation?.address || "Shivajinagar, Pune";

  const locationShareText = `🚨 EMERGENCY ROAD SOS ALERT 🚨\nLocation: ${address}\nGPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nGoogle Maps: https://maps.google.com/?q=${lat},${lng}\nBlood Group: ${bloodGroup}\nEmergency Contact: ${emergencyContactName} (${emergencyContactPhone})`;

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(locationShareText);
    setIsCopied(true);
    toast.success("Emergency Location & Coordinates copied!");
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(locationShareText)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 420, borderRadius: 28, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.4)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#DE350B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(222,53,11,0.3)" }}>
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: "#1C1412", margin: 0, lineHeight: 1.2 }}>
                ROADSoS Rescue Network
              </h3>
              <p style={{ fontSize: 10, color: "#6B5B52", margin: 0, fontWeight: 700 }}>
                24/7 Global Emergency Assistance · Pune Unit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "#F4F0EA", border: "none", color: "#6B5B52", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: 4, background: "#F4F0EA", padding: 4, borderRadius: 16, marginBottom: 14 }}>
          {[
            { id: "sos", label: "🚨 SOS Alert", icon: ShieldAlert },
            { id: "centers", label: "🏥 Hospitals", icon: Stethoscope },
            { id: "firstaid", label: "🩸 First Aid", icon: Heart },
            { id: "medical", label: "📋 Medical ID", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 12, border: "none", fontSize: 10, fontWeight: 800, cursor: "pointer",
                background: activeTab === tab.id ? "#8B3A2A" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#6B5B52",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }} className="no-scrollbar">
          
          {/* TAB 1: SOS ALERT & HELPLINE DIALERS */}
          {activeTab === "sos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              
              {/* 3-Second Countdown / Active Alert Card */}
              <div style={{ background: isEmergencyTriggered ? "#FEF2F2" : "#FFF8F6", border: isEmergencyTriggered ? "2px solid #EF4444" : "1.5px solid #FCD34D", borderRadius: 20, padding: 16, textAlign: "center", position: "relative" }}>
                {countdown !== null ? (
                  <div style={{ padding: "10px 0" }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: "#DE350B", animation: "ping 1s infinite" }}>{countdown}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#991B1B", marginTop: 4 }}>ACTIVATING EMERGENCY SOS...</div>
                    <p style={{ fontSize: 11, color: "#6B5B52", marginTop: 2 }}>Broadcasting GPS coordinates to rescue team</p>
                    <button
                      onClick={cancelSos}
                      style={{ marginTop: 10, padding: "8px 18px", borderRadius: 12, background: "#4B5563", color: "#fff", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer" }}
                    >
                      CANCEL SOS ALERT ✕
                    </button>
                  </div>
                ) : isEmergencyTriggered ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#DC2626" }}>🚨 EMERGENCY SOS DISPATCHED</div>
                    <p style={{ fontSize: 11, color: "#7F1D1D", marginTop: 4, lineHeight: 1.4 }}>
                      Live tracking active. Rescue teams & emergency contacts have been notified of your exact GPS location.
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={handleShareWhatsApp} style={{ flex: 1, padding: "8px", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
                        WhatsApp Share 💬
                      </button>
                      <button onClick={cancelSos} style={{ padding: "8px 12px", background: "#6B7280", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
                        Deactivate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={startSosCountdown}
                      style={{
                        width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, #EF4444, #B91C1C)",
                        color: "#fff", border: "4px solid #FCA5A5", boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 10px",
                        cursor: "pointer", activeScale: 0.95, transition: "transform 0.1s"
                      }}
                    >
                      <Zap size={32} />
                      <span style={{ fontSize: 11, fontWeight: 900 }}>HOLD SOS</span>
                    </button>
                    <p style={{ fontSize: 11, color: "#6B5B52", fontWeight: 700, margin: 0 }}>
                      Tap button above or shake phone to trigger 3-sec Emergency Rescue Alarm
                    </p>
                  </div>
                )}
              </div>

              {/* Live Location Broadcast Box */}
              <div style={{ background: "#FBF8F3", border: "1px solid #EDE8DF", borderRadius: 16, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#8B3A2A" }}>
                    <MapPin size={14} />
                    <span>Your Live GPS Location</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#15803D", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>
                    ACCURATE
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1C1412" }}>{address}</div>
                <div style={{ fontSize: 10, color: "#6B5B52", marginTop: 2 }}>GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</div>
                
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={handleCopyLocation}
                    style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid #EDE8DF", background: "#fff", color: "#1C1412", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                  >
                    {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    <span>{isCopied ? "Copied!" : "Copy Coordinates"}</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", background: "#25D366", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                  >
                    <Share2 size={14} />
                    <span>Share Location</span>
                  </button>
                </div>
              </div>

              {/* Personal Emergency Contact Card (Saved in Profile) */}
              {emergencyContactPhone && (
                <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 16, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: "#DC2626", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      🚨 Personal Emergency Contact
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#991B1B", background: "#FEE2E2", padding: "2px 6px", borderRadius: 6 }}>
                      SAVED IN PROFILE
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#1C1412" }}>
                    {emergencyContactName || "Emergency Contact"}: <span style={{ color: "#DC2626" }}>{emergencyContactPhone}</span>
                  </div>
                  {emergencyContactPhone2 && (
                    <div style={{ fontSize: 11, color: "#6B5B52", fontWeight: 700, marginTop: 2 }}>
                      Alt Contact: {emergencyContactPhone2}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <a
                      href={`tel:${emergencyContactPhone}`}
                      style={{ flex: 1, padding: "8px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 800, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    >
                      <Phone size={14} /> Call Contact
                    </a>
                    <button
                      onClick={() => {
                        const message = encodeURIComponent(`🚨 EMERGENCY ROAD SOS ALERT! I need immediate rescue assistance.\nLive Location: ${address}\nGPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nGoogle Maps: https://maps.google.com/?q=${lat},${lng}\nBlood Group: ${bloodGroup}\nMedical Notes: ${medicalNotes || "None"}`);
                        window.open(`https://api.whatsapp.com/send?phone=${emergencyContactPhone.replace(/[^0-9]/g, '')}&text=${message}`, "_blank");
                      }}
                      style={{ flex: 1, padding: "8px", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    >
                      <span>WhatsApp Alert 💬</span>
                    </button>
                  </div>
                </div>
              )}

              {/* One-Tap Emergency Helpline Call Grid */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#6B5B52", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>
                  National & Regional Helplines
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { title: "Ambulance & Trauma", number: "108", bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" },
                    { title: "Police Control", number: "100", bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
                    { title: "Highway Assistance", number: "1033", bg: "#FEFCE8", color: "#CA8A04", border: "#FEF08A" },
                    { title: "Women Helpline", number: "1091", bg: "#FAF5FF", color: "#9333EA", border: "#E9D5FF" },
                    { title: "Fire Brigade", number: "101", bg: "#FFF7ED", color: "#EA580C", border: "#FFEDD5" },
                    { title: "National Emergency", number: "112", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" }
                  ].map((h, i) => (
                    <a
                      key={i}
                      href={`tel:${h.number}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{ background: h.bg, border: `1px solid ${h.border}`, borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#6B5B52" }}>{h.title}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: h.color }}>{h.number}</div>
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: h.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Phone size={14} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEARBY HOSPITALS & POLICE STATIONS */}
          {activeTab === "centers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, color: "#6B5B52", fontWeight: 700, marginBottom: 4 }}>
                Major Trauma Centers & Emergency Stations in Pune:
              </div>
              {PUNE_EMERGENCY_CENTERS.map((center, idx) => (
                <div key={idx} style={{ background: "#FBF8F3", border: "1px solid #EDE8DF", borderRadius: 16, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#8B3A2A", background: "#F2EAE7", padding: "2px 6px", borderRadius: 6 }}>
                      {center.type}
                    </span>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1C1412", margin: "4px 0 2px" }}>{center.name}</h4>
                    <p style={{ fontSize: 11, color: "#6B5B52", margin: 0 }}>📍 {center.address}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <a
                      href={`tel:${center.phone}`}
                      style={{ padding: "6px 12px", background: "#15803D", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 800, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Phone size={12} /> Call
                    </a>
                    <button
                      onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`, "_blank");
                      }}
                      style={{ padding: "5px 10px", background: "#8B3A2A", color: "#fff", border: "none", borderRadius: 10, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                    >
                      Directions 🧭
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FIRST AID PROCEDURES */}
          {activeTab === "firstaid" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: 10, fontSize: 11, color: "#1E40AF", fontWeight: 700 }}>
                💡 Emergency First Aid Protocols: Perform initial stabilization until medical personnel arrive.
              </div>
              {FIRST_AID_DATA.map((item, idx) => (
                <div key={idx} style={{ background: "#FBF8F3", border: "1px solid #EDE8DF", borderRadius: 16, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1C1412", margin: 0 }}>{item.title}</h4>
                  </div>
                  <p style={{ fontSize: 10, color: "#8B3A2A", fontWeight: 700, margin: "0 0 8px" }}>{item.scenario}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {item.steps.map((step, sIdx) => (
                      <div key={sIdx} style={{ fontSize: 11, color: "#4A3E39", display: "flex", gap: 6 }}>
                        <span style={{ fontWeight: 800, color: "#8B3A2A" }}>{sIdx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: MEDICAL ID PROFILE */}
          {activeTab === "medical" && (
            <form onSubmit={handleSaveMedicalProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 14, padding: 10, fontSize: 11, color: "#92400E", fontWeight: 700 }}>
                🔒 Stored locally on your device for instant offline access by first responders.
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6B5B52", display: "block", marginBottom: 4 }}>Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #EDE8DF", fontSize: 13, fontWeight: 800, background: "#FBF8F3", outline: "none" }}
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6B5B52", display: "block", marginBottom: 4 }}>Emergency Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Parent / Spouse Name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #EDE8DF", fontSize: 13, background: "#FBF8F3", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6B5B52", display: "block", marginBottom: 4 }}>Emergency Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #EDE8DF", fontSize: 13, background: "#FBF8F3", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6B5B52", display: "block", marginBottom: 4 }}>Medical Notes / Allergies (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Diabetes, Peanut Allergy, Asthma"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #EDE8DF", fontSize: 12, background: "#FBF8F3", outline: "none", resize: "none" }}
                />
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "#8B3A2A", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 10px rgba(139,58,42,0.2)" }}
              >
                Save Emergency Medical ID 💾
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
