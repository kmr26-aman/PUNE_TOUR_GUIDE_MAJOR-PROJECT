import { useState, useEffect } from "react";
import { loginUser, registerUser, googleAuthUser } from "../data/api";
import StatusBar from "../components/StatusBar";

const authTranslations = {
  English: {
    login: "Login",
    register: "Register",
    name: "Full Name",
    email: "Email Address",
    password: "Password",
    welcomeBack: "Welcome Back",
    getStarted: "Create Account",
    welcomeSubtitle: "Explore the cultural pride of Pune 🚩",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    errorOccurred: "An error occurred. Please try again.",
    puneExplorer: "Pune Explorer",
    enterName: "Enter full name",
    enterEmail: "Enter email",
    enterPassword: "Enter password",
    continueWithGoogle: "Continue with Google",
    googleSignIn: "Sign in with Google",
    googleSignUp: "Sign up with Google",
    orDivider: "OR",
    googleModalTitle: "Sign in with Google",
    googleModalSub: "Choose a Google account to continue to Pune Explorer",
    enterGoogleEmail: "Your Google Email",
    enterGoogleName: "Your Display Name (Optional)",
    googleBtnSubmit: "Continue with Google",
    cancel: "Cancel"
  },
  Marathi: {
    login: "लॉगिन",
    register: "नोंदणी",
    name: "पूर्ण नाव",
    email: "ईमेल पत्ता",
    password: "पासवर्ड",
    welcomeBack: "पुन्हा आपले स्वागत आहे",
    getStarted: "खाते तयार करा",
    welcomeSubtitle: "पुण्याच्या सांस्कृतिक वैभवाचा अनुभव घ्या 🚩",
    dontHaveAccount: "खाते नाही का?",
    alreadyHaveAccount: "आधीच खाते आहे का?",
    errorOccurred: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
    puneExplorer: "पुणे एक्सप्लोरर",
    enterName: "पूर्ण नाव प्रविष्ट करा",
    enterEmail: "ईमेल प्रविष्ट करा",
    enterPassword: "पासवर्ड प्रविष्ट करा",
    continueWithGoogle: "Google सह सुरू ठेवा",
    googleSignIn: "Google सह साइन इन करा",
    googleSignUp: "Google सह खाते तयार करा",
    orDivider: "किंवा",
    googleModalTitle: "Google सह साइन इन करा",
    googleModalSub: "पुणे एक्सप्लोरर सुरू ठेवण्यासाठी Google खाते निवडा",
    enterGoogleEmail: "तुमचा Google ईमेल",
    enterGoogleName: "तुमचे नाव (पर्यायी)",
    googleBtnSubmit: "Google सह पुढे जा",
    cancel: "रद्द करा"
  },
  Hindi: {
    login: "लॉगिन",
    register: "रजिस्टर",
    name: "पूरा नाम",
    email: "ईमेल पता",
    password: "पासवर्ड",
    welcomeBack: "आपका स्वागत है",
    getStarted: "खाता बनाएँ",
    welcomeSubtitle: "पुणे के सांस्कृतिक गौरव का अनुभव करें 🚩",
    dontHaveAccount: "खाता नहीं है?",
    alreadyHaveAccount: "पहले से ही खाता है?",
    errorOccurred: "कोई त्रुटि हुई। कृपया पुन: प्रयास करें।",
    puneExplorer: "पुणे एक्सप्लोरर",
    enterName: "पूरा नाम दर्ज करें",
    enterEmail: "ईमेल दर्ज करें",
    enterPassword: "पासवर्ड दर्ज करें",
    continueWithGoogle: "Google के साथ जारी रखें",
    googleSignIn: "Google के साथ साइन इन करें",
    googleSignUp: "Google के साथ साइन अप करें",
    orDivider: "या",
    googleModalTitle: "Google के साथ साइन इन करें",
    googleModalSub: "पुणे एक्सप्लोरर जारी रखने के लिए Google खाता चुनें",
    enterGoogleEmail: "आपका Google ईमेल",
    enterGoogleName: "आपका नाम (वैकल्पिक)",
    googleBtnSubmit: "Google से आगे बढ़ें",
    cancel: "रद्द करें"
  },
  Gujarati: {
    login: "લોગિન",
    register: "રજીસ્ટર",
    name: "પૂરું નામ",
    email: "ઇમેઇલ સરનામું",
    password: "પાસવર્ડ",
    welcomeBack: "સ્વાગત છે",
    getStarted: "ખાતું બનાવો",
    welcomeSubtitle: "પુણેના સાંસ્કૃતિક ગૌરવનો અનુભવ કરો 🚩",
    dontHaveAccount: "ખાતું નથી?",
    alreadyHaveAccount: "પહેલાથી જ ખાતું છે?",
    errorOccurred: "કોઈ ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.",
    puneExplorer: "પુણે એક્સપ્લોરર",
    enterName: "પૂરું નામ દાખલ કરો",
    enterEmail: "ઇમેઇલ દાખલ કરો",
    enterPassword: "પાસવર્ડ દાખલ કરો",
    continueWithGoogle: "Google સાથે ચાલુ રાખો",
    googleSignIn: "Google સાથે સાઇન ઇન કરો",
    googleSignUp: "Google સાથે સાઇન અપ કરો",
    orDivider: "અથવા",
    googleModalTitle: "Google સાથે સાઇન ઇન કરો",
    googleModalSub: "પુણે એક્સપ્લોરર સાથે આગળ વધવા માટે Google ખાતું પસંદ કરો",
    enterGoogleEmail: "તમારું Google ઇમેઇલ",
    enterGoogleName: "તમારું નામ (વૈકલ્પિક)",
    googleBtnSubmit: "Google સાથે આગળ વધો",
    cancel: "રદ કરો"
  }
};

export default function AuthScreen({ onAuthSuccess, userLanguage, setUserLanguage }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const t = authTranslations[userLanguage] || authTranslations.English;

  // Initialize Google Identity Services Script if available
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleJwtResponse,
        });
      } catch (e) {
        console.warn("Google GIS init skipped:", e);
      }
    }
  }, []);

  const handleGoogleJwtResponse = async (response) => {
    try {
      setLoading(true);
      setError("");
      // Decode JWT token payload from Google
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const googleUser = JSON.parse(jsonPayload);

      const data = await googleAuthUser({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        googleId: googleUser.sub,
      });

      onAuthSuccess(data.user);
    } catch (err) {
      console.error("Google JWT auth error:", err);
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthClick = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes("@")) {
      setError("Please enter a valid Google email address");
      return;
    }

    setLoading(true);
    setError("");
    setShowGoogleModal(false);

    try {
      const data = await googleAuthUser({
        email: googleEmail,
        name: googleName || googleEmail.split("@")[0],
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleEmail)}`,
      });
      onAuthSuccess(data.user);
    } catch (err) {
      console.error("Google Auth modal error:", err);
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser(email, password);
        onAuthSuccess(data.user);
      } else {
        if (!name) {
          const errorMsg =
            userLanguage === "Marathi" ? "कृपया तुमचे नाव प्रविष्ट करा" :
            userLanguage === "Hindi" ? "कृपया अपना नाम दर्ज करें" :
            userLanguage === "Gujarati" ? "કૃપા કરીને તમારું નામ દાખલ કરો" :
            "Please enter your name";
          setError(errorMsg);
          setLoading(false);
          return;
        }
        const data = await registerUser(name, email, password);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#FBF8F3", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, position: "relative", overflowY: "auto" }}>
      <StatusBar light={false} />

      {/* Language Switcher */}
      <div style={{ position: "absolute", top: 16, right: 16, display: "inline-flex", background: "#EDE8DF", borderRadius: 10, padding: 3, zIndex: 10 }}>
        {[
          { code: "English", label: "English" },
          { code: "Marathi", label: "मराठी" },
          { code: "Hindi", label: "हिन्दी" },
          { code: "Gujarati", label: "ગુજરાતી" }
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => setUserLanguage(lang.code)}
            style={{
              padding: "4px 10px", borderRadius: 8, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer",
              background: userLanguage === lang.code ? "#fff" : "none",
              color: userLanguage === lang.code ? "#8B3A2A" : "#6B5B52",
              transition: "0.2s"
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Logo Area */}
      <div style={{ textAlign: "center", marginBottom: 20, marginTop: 24 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#8B3A2A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 30, boxShadow: "0 8px 16px rgba(139,58,42,0.15)" }}>
          🚩
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1C1412", fontFamily: "Mukta", letterSpacing: 0.5 }}>
          {t.puneExplorer}
        </div>
        <div style={{ fontSize: 12, color: "#6B5B52", marginTop: 2 }}>
          {t.welcomeSubtitle}
        </div>
      </div>

      {/* Form Card */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 20, border: "1px solid #EDE8DF", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}>
        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuthClick}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 12,
            border: "1px solid #DADCE0",
            background: "#FFFFFF",
            color: "#3C4043",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            transition: "background 0.2s, box-shadow 0.2s"
          }}
        >
          {/* Official Google G Logo SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {isLogin ? t.googleSignIn : t.googleSignUp}
        </button>

        {/* OR Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "16px 0", color: "#A0938A", fontSize: 11, fontWeight: 700 }}>
          <div style={{ flex: 1, height: 1, background: "#EDE8DF" }}></div>
          <span style={{ padding: "0 10px" }}>{t.orDivider}</span>
          <div style={{ flex: 1, height: 1, background: "#EDE8DF" }}></div>
        </div>

        {/* Tab switchers */}
        <div style={{ display: "flex", marginBottom: 16, borderBottom: "1.5px solid #EDE8DF" }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(""); }}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer",
              color: isLogin ? "#8B3A2A" : "#6B5B52",
              borderBottom: isLogin ? "3.5px solid #8B3A2A" : "3.5px solid transparent",
              transition: "all 0.2s"
            }}
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(""); }}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer",
              color: !isLogin ? "#8B3A2A" : "#6B5B52",
              borderBottom: !isLogin ? "3.5px solid #8B3A2A" : "3.5px solid transparent",
              transition: "all 0.2s"
            }}
          >
            {t.register}
          </button>
        </div>

        {error && (
          <div style={{ background: "#FDF2F2", color: "#DE350B", padding: "10px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, marginBottom: 14, border: "1px solid #FAD2D2" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!isLogin && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B5B52", marginBottom: 4 }}>{t.name}</div>
              <input
                type="text"
                placeholder={t.enterName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE8DF",
                  fontSize: 13, outline: "none", background: "#FBF8F3", fontFamily: "inherit"
                }}
              />
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B5B52", marginBottom: 4 }}>{t.email}</div>
            <input
              type="email"
              placeholder={t.enterEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE8DF",
                fontSize: 13, outline: "none", background: "#FBF8F3", fontFamily: "inherit"
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B5B52", marginBottom: 4 }}>{t.password}</div>
            <input
              type="password"
              placeholder={t.enterPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE8DF",
                fontSize: 13, outline: "none", background: "#FBF8F3", fontFamily: "inherit"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: "#8B3A2A", color: "#fff", fontWeight: 700, cursor: "pointer",
              fontSize: 13, marginTop: 4, boxShadow: "0 4px 10px rgba(139,58,42,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            {loading ? (
              <span style={{ fontSize: 12 }}>...</span>
            ) : (
              isLogin ? t.login : t.register
            )}
          </button>
        </form>
      </div>

      {/* Switch Link */}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#6B5B52" }}>
        {isLogin ? (
          <>
            {t.dontHaveAccount}{" "}
            <span
              onClick={() => { setIsLogin(false); setError(""); }}
              style={{ color: "#8B3A2A", fontWeight: 700, cursor: "pointer" }}
            >
              {t.register}
            </span>
          </>
        ) : (
          <>
            {t.alreadyHaveAccount}{" "}
            <span
              onClick={() => { setIsLogin(true); setError(""); }}
              style={{ color: "#8B3A2A", fontWeight: 700, cursor: "pointer" }}
            >
              {t.login}
            </span>
          </>
        )}
      </div>

      {/* Google Interactive Account Modal */}
      {showGoogleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 340, borderRadius: 20, padding: 24, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#F2F4F7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1C1412", margin: 0 }}>{t.googleModalTitle}</h3>
              <p style={{ fontSize: 11, color: "#6B5B52", marginTop: 4 }}>{t.googleModalSub}</p>
            </div>

            <form onSubmit={handleGoogleModalSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B5B52", marginBottom: 4 }}>{t.enterGoogleEmail}</div>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE8DF",
                    fontSize: 13, outline: "none", background: "#FBF8F3", fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B5B52", marginBottom: 4 }}>{t.enterGoogleName}</div>
                <input
                  type="text"
                  placeholder="e.g. Rahul Deshmukh"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE8DF",
                    fontSize: 13, outline: "none", background: "#FBF8F3", fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #EDE8DF",
                    background: "#F5F2EC", color: "#6B5B52", fontWeight: 700, cursor: "pointer", fontSize: 12
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2, padding: "10px", borderRadius: 10, border: "none",
                    background: "#4285F4", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12,
                    boxShadow: "0 4px 10px rgba(66,133,244,0.3)"
                  }}
                >
                  {loading ? "..." : t.googleBtnSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
