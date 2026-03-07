import { useState } from "react";

// ─── TRANSLATIONS ────────────────────────────────────────────────
const T = {
  ua: {
    appName: "Huugs", tagline: "два атоми — одна орбіта",
    welcomeTitle: "Знайди свою людину", welcomeSub: "Увійди через соцмережу — і починай",
    loginWith: "Увійти через",
    orDivider: "або",
    continueGuest: "Переглянути без реєстрації",
    tgModal: { title: "Telegram", desc: "Відкрий Telegram і підтвердь вхід", btn: "Симулювати вхід ✓", cancel: "Скасувати" },
    igModal: { title: "Instagram", desc: "Авторизуй застосунок через Instagram", btn: "Симулювати вхід ✓", cancel: "Скасувати" },
    loggingIn: "Авторизація…",
    loggedAs: "Увійшов як",
    logout: "Вийти",
    search: "Пошук", profile: "Профіль", liked: "Лайки",
    cityPlaceholder: "Введи місто…",
    likeBtn: "Подобається", likedBtn: "Вподобано",
    replyBtn: "Відповісти ❤️",
    editBtn: "✏️ Редагувати", saveBtn: "Зберегти", cancelBtn: "Скасувати",
    likedMe: "людей вподобали тебе",
    nobody: "Нікого не знайдено",
    nobodyCity: c => `у місті «${c}»`,
    fieldName: "Ім'я", fieldBirth: "Дата народження", fieldCity: "Місто", fieldBio: "Про себе",
    years: "років",
  },
  by: {
    appName: "Huugs", tagline: "два атома — одна орбита",
    welcomeTitle: "Найди своего человека", welcomeSub: "Войди через соцсеть — и начинай",
    loginWith: "Войти через",
    orDivider: "или",
    continueGuest: "Просмотреть без регистрации",
    tgModal: { title: "Telegram", desc: "Открой Telegram и подтверди вход", btn: "Симулировать вход ✓", cancel: "Отмена" },
    igModal: { title: "Instagram", desc: "Авторизуй приложение через Instagram", btn: "Симулировать вход ✓", cancel: "Отмена" },
    loggingIn: "Авторизация…",
    loggedAs: "Вошёл как",
    logout: "Выйти",
    search: "Поиск", profile: "Профиль", liked: "Лайки",
    cityPlaceholder: "Введи город…",
    likeBtn: "Нравится", likedBtn: "Понравилось",
    replyBtn: "Ответить ❤️",
    editBtn: "✏️ Редактировать", saveBtn: "Сохранить", cancelBtn: "Отмена",
    likedMe: "человек оценили тебя",
    nobody: "Никого не найдено",
    nobodyCity: c => `в городе «${c}»`,
    fieldName: "Имя", fieldBirth: "Дата рождения", fieldCity: "Город", fieldBio: "О себе",
    years: "лет",
  },
};

// ─── DATA ────────────────────────────────────────────────────────
const mockProfiles = [
  { id:1, name:"Соня",  birth:"1998-03-12", city:"Київ",   photo:"https://randomuser.me/api/portraits/women/44.jpg", bio:{ua:"Люблю каву, гори та хороші книжки 📚",         by:"Люблю кофе, горы и хорошие книги 📚"},         liked:false },
  { id:2, name:"Марія", birth:"1995-07-22", city:"Львів",   photo:"https://randomuser.me/api/portraits/women/65.jpg", bio:{ua:"Художниця. Шукаю того, хто помічає деталі 🎨", by:"Художница. Ищу того, кто замечает детали 🎨"},  liked:false },
  { id:3, name:"Олена", birth:"2000-01-05", city:"Одеса",   photo:"https://randomuser.me/api/portraits/women/32.jpg", bio:{ua:"Море, сонце і спонтанні пригоди ☀️",           by:"Море, солнце и спонтанные приключения ☀️"},      liked:false },
  { id:4, name:"Діана", birth:"1993-11-18", city:"Київ",   photo:"https://randomuser.me/api/portraits/women/17.jpg", bio:{ua:"Лікар. Ціную щирість та гумор 💙",              by:"Врач. Ценю искренность и юмор 💙"},               liked:false },
  { id:5, name:"Аня",   birth:"1997-06-30", city:"Харків", photo:"https://randomuser.me/api/portraits/women/55.jpg", bio:{ua:"Танцюю сальсу, мрію про Барселону 🌹",          by:"Танцую сальсу, мечтаю о Барселоне 🌹"},           liked:false },
  { id:6, name:"Катя",  birth:"2001-09-14", city:"Львів",   photo:"https://randomuser.me/api/portraits/women/29.jpg", bio:{ua:"Студентка архітектури. Закохана у простір 🏛️", by:"Студентка архитектуры. Влюблена в пространство 🏛️"}, liked:false },
];
const whoLikedMe = [
  { id:7, name:"Іра",  birth:"1999-04-10", city:"Київ",   photo:"https://randomuser.me/api/portraits/women/12.jpg" },
  { id:8, name:"Таня", birth:"1996-08-25", city:"Одеса",  photo:"https://randomuser.me/api/portraits/women/77.jpg" },
  { id:9, name:"Віка", birth:"1994-12-03", city:"Харків", photo:"https://randomuser.me/api/portraits/women/91.jpg" },
];
const fakeUsers = {
  telegram:  { name:"Олег", birth:"1992-05-14", city:"Київ", photo:"https://randomuser.me/api/portraits/men/32.jpg", bio:{ua:"Мандрівник. Люблю технології і каву ☕", by:"Путешественник. Люблю технологии и кофе ☕"}, provider:"telegram",  handle:"@oleh_ua" },
  instagram: { name:"Олег", birth:"1992-05-14", city:"Київ", photo:"https://randomuser.me/api/portraits/men/32.jpg", bio:{ua:"Мандрівник. Люблю технології і каву ☕", by:"Путешественник. Люблю технологии и кофе ☕"}, provider:"instagram", handle:"@oleh.photo" },
};

function calcAge(b) { return Math.floor((Date.now()-new Date(b))/(1e3*60*60*24*365.25)); }

// ─── PARTICLES ───────────────────────────────────────────────────
function Particles() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
      {Array.from({length:16},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          left:`${(i*23+7)%100}%`, top:`${(i*37+13)%100}%`,
          width:2+(i%3)*1.5, height:2+(i%3)*1.5,
          borderRadius:"50%",
          background:"radial-gradient(circle,#a8e6cf,#56ab91)",
          opacity:0.1+(i%4)*0.07,
          animation:`fp${i%3} ${7+(i%5)*2}s ${(i%4)*2}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────────────
function AuthModal({ provider, t, onConfirm, onCancel, loading }) {
  const info = provider === "telegram" ? t.tgModal : t.igModal;
  const isTg = provider === "telegram";
  const color = isTg ? "#27a7e7" : "url(#igGrad)";
  const icon = isTg
    ? <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.928l-2.948-.924c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.881.632z"/></svg>
    : <svg width="32" height="32" viewBox="0 0 24 24"><defs><linearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="white" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:100,
      background:"rgba(5,12,24,0.88)",
      backdropFilter:"blur(12px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:20,
      animation:"fadeUp 0.25s ease",
    }}>
      <div style={{
        background:"linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))",
        border:"1px solid rgba(168,230,207,0.14)",
        borderRadius:28, padding:"36px 28px",
        maxWidth:340, width:"100%",
        textAlign:"center",
        boxShadow:"0 24px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Provider icon */}
        <div style={{
          width:68,height:68,borderRadius:"50%",
          background: isTg ? "#27a7e7" : "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
          display:"flex",alignItems:"center",justifyContent:"center",
          margin:"0 auto 20px",
          boxShadow:`0 8px 28px ${isTg?"rgba(39,167,231,0.4)":"rgba(220,39,67,0.4)"}`,
        }}>{icon}</div>

        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:500,color:"#e8f4e8",marginBottom:10}}>
          {info.title}
        </h2>
        <p style={{fontFamily:"'Nunito',sans-serif",fontSize:14,color:"rgba(168,230,207,0.6)",lineHeight:1.6,marginBottom:28}}>
          {info.desc}
        </p>

        {/* Fake phone/username input */}
        <div style={{
          background:"rgba(255,255,255,0.05)",
          border:"1.5px solid rgba(168,230,207,0.15)",
          borderRadius:14, padding:"12px 16px",
          marginBottom:16, textAlign:"left",
        }}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:10,color:"rgba(168,230,207,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>
            {isTg ? "Telegram" : "Instagram"} ID
          </div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:15,color:"#a8e6cf"}}>
            {isTg ? "@oleh_ua" : "@oleh.photo"}
          </div>
        </div>

        <button onClick={onConfirm} disabled={loading} style={{
          width:"100%", padding:"14px",
          background: loading ? "rgba(86,171,145,0.3)" : (isTg ? "linear-gradient(135deg,#27a7e7,#1d8cbf)" : "linear-gradient(135deg,#f09433,#dc2743)"),
          border:"none", borderRadius:16,
          color:"#fff", fontFamily:"'Nunito',sans-serif",
          fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
          marginBottom:12,
          boxShadow: loading ? "none" : `0 4px 20px ${isTg?"rgba(39,167,231,0.35)":"rgba(220,39,67,0.35)"}`,
          transition:"all 0.2s",
        }}>
          {loading ? "⏳ " + t.loggingIn : info.btn}
        </button>
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px",
          background:"transparent",
          border:"1.5px solid rgba(168,230,207,0.15)",
          borderRadius:16, color:"rgba(168,230,207,0.5)",
          fontFamily:"'Nunito',sans-serif", fontSize:13, cursor:"pointer",
        }}>{info.cancel}</button>
      </div>
    </div>
  );
}

// ─── WELCOME SCREEN ──────────────────────────────────────────────
function WelcomeScreen({ lang, setLang, t, onAuth }) {
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = (provider) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setModal(null); onAuth(provider); }, 1800);
  };

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 24px", position:"relative", zIndex:1,
    }}>
      {modal && <AuthModal provider={modal} t={t} loading={loading} onConfirm={() => handleConfirm(modal)} onCancel={() => setModal(null)} />}

      {/* Lang switcher top */}
      <div style={{ position:"absolute", top:20, right:20, display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:50, padding:3, gap:2, border:"1px solid rgba(168,230,207,0.1)" }}>
        {[{code:"ua",flag:"🇺🇦"},{code:"by",flag:"🇧🇾"}].map(l=>(
          <button key={l.code} onClick={()=>setLang(l.code)} style={{
            background: lang===l.code?"rgba(86,171,145,0.35)":"transparent",
            border:"none", borderRadius:50,
            width:38,height:38,fontSize:21,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:lang===l.code?"0 0 14px rgba(86,171,145,0.35)":"none",
            transition:"all 0.2s",
          }}>{l.flag}</button>
        ))}
      </div>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:52 }}>
        {/* Orbit animation */}
        <div style={{ position:"relative", width:100, height:100, margin:"0 auto 24px" }}>
          <div style={{
            position:"absolute", inset:0,
            border:"1.5px solid rgba(86,171,145,0.25)",
            borderRadius:"50%",
            animation:"orbit 6s linear infinite",
          }}/>
          <div style={{
            position:"absolute", inset:10,
            border:"1px solid rgba(168,230,207,0.15)",
            borderRadius:"50%",
            animation:"orbit 10s linear infinite reverse",
          }}/>
          {/* Center dot */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:28, height:28, borderRadius:"50%",
            background:"linear-gradient(135deg,#56ab91,#388d73)",
            boxShadow:"0 0 24px rgba(86,171,145,0.6)",
          }}/>
          {/* Orbiting dot */}
          <div style={{
            position:"absolute", top:0, left:"50%",
            width:10, height:10, borderRadius:"50%",
            background:"#f9d976",
            boxShadow:"0 0 10px rgba(249,217,118,0.8)",
            marginLeft:-5, marginTop:-5,
            transformOrigin:"5px 55px",
            animation:"orbit 6s linear infinite",
          }}/>
        </div>

        <h1 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:48, fontWeight:600, lineHeight:1,
          background:"linear-gradient(90deg,#a8e6cf 0%,#56ab91 40%,#f9d976 60%,#a8e6cf 100%)",
          backgroundSize:"200% auto",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          backgroundClip:"text",
          animation:"shimmer 4s linear infinite",
        }}>{t.appName}</h1>
        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:"rgba(168,230,207,0.4)", letterSpacing:2.5, textTransform:"uppercase", marginTop:6 }}>
          {t.tagline}
        </p>
      </div>

      {/* Headline */}
      <div style={{ textAlign:"center", marginBottom:44 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:400, color:"#e8f4e8", lineHeight:1.3, marginBottom:10 }}>
          {t.welcomeTitle}
        </h2>
        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, color:"rgba(168,230,207,0.5)", lineHeight:1.6 }}>
          {t.welcomeSub}
        </p>
      </div>

      {/* Auth buttons */}
      <div style={{ width:"100%", maxWidth:320, display:"flex", flexDirection:"column", gap:14 }}>
        {/* Telegram */}
        <button onClick={()=>setModal("telegram")} style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:14,
          padding:"16px 24px",
          background:"linear-gradient(135deg, rgba(39,167,231,0.2), rgba(29,140,191,0.15))",
          border:"1.5px solid rgba(39,167,231,0.35)",
          borderRadius:18, cursor:"pointer",
          color:"#e8f4e8",
          fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700,
          boxShadow:"0 4px 24px rgba(39,167,231,0.15)",
          transition:"all 0.2s",
          letterSpacing:0.3,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#27a7e7"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.928l-2.948-.924c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.881.632z"/></svg>
          {t.loginWith} Telegram
        </button>

        {/* Instagram */}
        <button onClick={()=>setModal("instagram")} style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:14,
          padding:"16px 24px",
          background:"linear-gradient(135deg, rgba(240,148,51,0.15), rgba(220,39,67,0.15), rgba(188,24,136,0.15))",
          border:"1.5px solid rgba(220,39,67,0.3)",
          borderRadius:18, cursor:"pointer",
          color:"#e8f4e8",
          fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700,
          boxShadow:"0 4px 24px rgba(220,39,67,0.12)",
          transition:"all 0.2s",
          letterSpacing:0.3,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24"><defs><linearGradient id="ig2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          {t.loginWith} Instagram
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"4px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(168,230,207,0.1)" }}/>
          <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:"rgba(168,230,207,0.3)", letterSpacing:1 }}>{t.orDivider}</span>
          <div style={{ flex:1, height:1, background:"rgba(168,230,207,0.1)" }}/>
        </div>

        {/* Guest */}
        <button onClick={()=>onAuth("guest")} style={{
          padding:"13px",
          background:"transparent",
          border:"1.5px solid rgba(168,230,207,0.12)",
          borderRadius:16, cursor:"pointer",
          color:"rgba(168,230,207,0.4)",
          fontFamily:"'Nunito',sans-serif", fontSize:13,
          transition:"all 0.2s",
        }}>{t.continueGuest}</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]       = useState("ua");
  const [authState, setAuth]  = useState(null); // null | { provider, user }
  const [tab, setTab]         = useState("search");
  const [city, setCity]       = useState("");
  const [profiles, setProfiles] = useState(mockProfiles);
  const [myProfile, setMyProfile] = useState(null);
  const [draft, setDraft]     = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [openCard, setOpenCard] = useState(null);
  const t = T[lang];

  const handleAuth = (provider) => {
    const user = provider === "guest"
      ? { name:"Гість", birth:"2000-01-01", city:"Київ", photo:"https://randomuser.me/api/portraits/lego/1.jpg", bio:{ua:"",by:""}, provider:"guest", handle:"" }
      : fakeUsers[provider];
    setMyProfile(user);
    setAuth({ provider, user });
    setTab("search");
  };

  const handleLogout = () => { setAuth(null); setMyProfile(null); setTab("search"); };

  const toggleLike = (id, e) => {
    e.stopPropagation();
    setProfiles(prev => prev.map(p => p.id===id ? {...p,liked:!p.liked} : p));
  };

  const filtered = city.trim()==="" ? profiles : profiles.filter(p=>p.city.toLowerCase().includes(city.trim().toLowerCase()));

  const fs = { display:"block",width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(168,230,207,0.15)",borderRadius:14,fontSize:15,fontFamily:"'Nunito',sans-serif",color:"#e8f4e8",marginBottom:2 };
  const pBtn = { width:"100%",padding:"14px",background:"linear-gradient(135deg,#56ab91,#388d73)",border:"none",borderRadius:16,color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(86,171,145,0.3)" };
  const gBtn = { width:"100%",padding:"14px",background:"transparent",border:"1.5px solid rgba(86,171,145,0.3)",borderRadius:16,color:"#56ab91",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer" };

  const providerColor = authState?.provider==="telegram" ? "#27a7e7" : authState?.provider==="instagram" ? "#dc2743" : "rgba(168,230,207,0.4)";
  const providerIcon  = authState?.provider==="telegram" ? "✈️" : authState?.provider==="instagram" ? "📸" : "👤";

  return (
    <div style={{ minHeight:"100dvh", background:"linear-gradient(160deg,#0a1628 0%,#0d2137 40%,#112b1e 100%)", fontFamily:"'Cormorant Garamond','Georgia',serif", color:"#e8f4e8", position:"relative", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;0,600;1,300;1,400&family=Nunito:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{width:0;}
        @keyframes fp0{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12px,-18px) scale(1.3)}}
        @keyframes fp1{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,20px)}}
        @keyframes fp2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(8px,14px) scale(0.8)}66%{transform:translate(-10px,-8px) scale(1.2)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(86,171,145,0.4)}50%{box-shadow:0 0 0 10px rgba(86,171,145,0)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.45)}100%{transform:scale(1)}}
        .cw:nth-child(1){animation:fadeUp 0.4s 0.04s ease both}
        .cw:nth-child(2){animation:fadeUp 0.4s 0.10s ease both}
        .cw:nth-child(3){animation:fadeUp 0.4s 0.16s ease both}
        .cw:nth-child(4){animation:fadeUp 0.4s 0.22s ease both}
        .cw:nth-child(5){animation:fadeUp 0.4s 0.28s ease both}
        .cw:nth-child(6){animation:fadeUp 0.4s 0.34s ease both}
        .pc{transition:transform .25s,box-shadow .25s;}.pc:active{transform:scale(0.975);}
        .lb{transition:transform .2s,background .2s;}.lb:active{animation:heartPop .3s ease;}
        .nb{transition:all .2s;}
        input,textarea,select{outline:none;-webkit-appearance:none;}
        input:focus,textarea:focus{border-color:#56ab91!important;box-shadow:0 0 0 3px rgba(86,171,145,.15)!important;}
        button:hover{opacity:0.9;}
      `}</style>

      <div style={{position:"fixed",inset:0,borderRadius:"50%",filter:"blur(70px)",pointerEvents:"none",zIndex:0,width:320,height:320,top:-90,right:-90,background:"rgba(86,171,145,0.07)"}}/>
      <div style={{position:"fixed",inset:0,borderRadius:"50%",filter:"blur(70px)",pointerEvents:"none",zIndex:0,width:260,height:260,bottom:80,left:-70,background:"rgba(249,217,118,0.05)"}}/>
      <Particles/>

      <div style={{ maxWidth:430, minHeight:"100dvh", margin:"0 auto", display:"flex", flexDirection:"column", position:"relative", zIndex:1 }}>

        {/* ── NOT LOGGED IN ── */}
        {!authState && <WelcomeScreen lang={lang} setLang={setLang} t={t} onAuth={handleAuth}/>}

        {/* ── LOGGED IN ── */}
        {authState && <>
          {/* Header */}
          <header style={{padding:"16px 20px 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:8,paddingBottom:4}}>
              <div>
                <h1 style={{
                  fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, letterSpacing:"-0.5px", lineHeight:1,
                  background:"linear-gradient(90deg,#a8e6cf 0%,#56ab91 40%,#f9d976 60%,#a8e6cf 100%)",
                  backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                  animation:"shimmer 4s linear infinite",
                }}>{t.appName}</h1>
                <p style={{fontFamily:"'Nunito',sans-serif",fontSize:10,color:"rgba(168,230,207,0.4)",letterSpacing:2.5,textTransform:"uppercase",marginTop:3}}>{t.tagline}</p>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {/* Lang */}
                <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:50,padding:3,gap:2,border:"1px solid rgba(168,230,207,0.1)"}}>
                  {[{code:"ua",flag:"🇺🇦"},{code:"by",flag:"🇧🇾"}].map(l=>(
                    <button key={l.code} onClick={()=>setLang(l.code)} style={{background:lang===l.code?"rgba(86,171,145,0.35)":"transparent",border:"none",borderRadius:50,width:34,height:34,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:lang===l.code?"0 0 12px rgba(86,171,145,0.3)":"none",transition:"all 0.2s"}}>{l.flag}</button>
                  ))}
                </div>

                {/* Avatar + logout */}
                <div style={{position:"relative",cursor:"pointer"}} onClick={handleLogout} title={t.logout}>
                  <img src={authState.user.photo} alt="" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:`2px solid ${providerColor}`,display:"block"}}/>
                  <div style={{position:"absolute",bottom:-2,right:-2,background:providerColor,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,border:"2px solid #0d2137"}}>
                    {authState.provider==="telegram"?"✈":authState.provider==="instagram"?"📸":"👤"}
                  </div>
                </div>
              </div>
            </div>

            {/* Provider badge */}
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 14px",padding:"7px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,230,207,0.08)",borderRadius:50,width:"fit-content"}}>
              <span style={{fontSize:13}}>{providerIcon}</span>
              <span style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:"rgba(168,230,207,0.5)"}}>
                {t.loggedAs} <span style={{color:providerColor,fontWeight:700}}>{authState.user.handle || authState.user.name}</span>
              </span>
              <span onClick={handleLogout} style={{marginLeft:4,cursor:"pointer",fontSize:11,color:"rgba(168,230,207,0.3)"}}>✕</span>
            </div>

            {/* Nav */}
            <nav style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,background:"rgba(255,255,255,0.04)",borderRadius:18,padding:5,border:"1px solid rgba(168,230,207,0.07)"}}>
              {[{key:"search",icon:"✦",label:t.search},{key:"profile",icon:"◎",label:t.profile},{key:"likes",icon:"❤",label:t.liked}].map(tb=>(
                <button key={tb.key} className="nb" onClick={()=>setTab(tb.key)} style={{
                  background:tab===tb.key?"linear-gradient(135deg,rgba(86,171,145,0.45),rgba(56,141,115,0.45))":"transparent",
                  border:"none",borderRadius:13,padding:"9px 4px",
                  color:tab===tb.key?"#a8e6cf":"rgba(168,230,207,0.38)",
                  fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:tab===tb.key?700:400,
                  cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  boxShadow:tab===tb.key?"0 2px 14px rgba(86,171,145,0.18)":"none",
                }}>
                  <span style={{fontSize:15}}>{tb.icon}</span>{tb.label}
                </button>
              ))}
            </nav>
          </header>

          <main style={{flex:1,padding:"20px 16px 32px",overflowY:"auto"}}>

            {/* SEARCH */}
            {tab==="search" && (
              <div>
                <div style={{position:"relative",marginBottom:20}}>
                  <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none",opacity:0.5}}>🌿</span>
                  <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder={t.cityPlaceholder}
                    style={{width:"100%",padding:"14px 44px 14px 46px",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(168,230,207,0.14)",borderRadius:50,fontSize:15,fontFamily:"'Nunito',sans-serif",color:"#e8f4e8"}}/>
                  {city && <span onClick={()=>setCity("")} style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",color:"#56ab91",cursor:"pointer",fontSize:18,lineHeight:1}}>✕</span>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {filtered.map(p=>(
                    <div key={p.id} className="cw">
                      <div className="pc" onClick={()=>setOpenCard(openCard===p.id?null:p.id)}
                        style={{background:"linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))",borderRadius:24,overflow:"hidden",border:p.liked?"1px solid rgba(86,171,145,0.3)":"1px solid rgba(168,230,207,0.09)",backdropFilter:"blur(20px)",cursor:"pointer",boxShadow:p.liked?"0 8px 32px rgba(86,171,145,0.2)":"0 4px 24px rgba(0,0,0,0.28)"}}>
                        <div style={{position:"relative",height:280}}>
                          <img src={p.photo} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(8,20,14,0.85) 100%)"}}/>
                          <div style={{position:"absolute",top:14,left:14,background:"rgba(8,20,14,0.6)",backdropFilter:"blur(8px)",border:"1px solid rgba(168,230,207,0.18)",borderRadius:50,padding:"4px 13px",fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#a8e6cf",fontWeight:600}}>
                            {calcAge(p.birth)} {t.years}
                          </div>
                          {p.liked && <div style={{position:"absolute",top:14,right:14,background:"rgba(86,171,145,0.85)",borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,animation:"pulse 2s infinite"}}>❤️</div>}
                          <div style={{position:"absolute",bottom:16,left:18,right:18}}>
                            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:500,color:"#e8f4e8",textShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>{p.name}</div>
                            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:"rgba(168,230,207,0.7)",marginTop:3}}>🌿 {p.city}</div>
                          </div>
                        </div>
                        <div style={{overflow:"hidden",maxHeight:openCard===p.id?110:0,transition:"max-height 0.35s cubic-bezier(0.4,0,0.2,1)"}}>
                          <div style={{padding:"14px 18px 4px"}}>
                            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"rgba(232,244,232,0.72)",lineHeight:1.65}}>{p.bio[lang]}</p>
                          </div>
                        </div>
                        <div style={{display:"flex",justifyContent:"flex-end",padding:"12px 16px 16px"}}>
                          <button className="lb" onClick={e=>toggleLike(p.id,e)} style={{padding:"9px 22px",borderRadius:50,border:p.liked?"none":"1.5px solid rgba(86,171,145,0.38)",background:p.liked?"linear-gradient(135deg,#56ab91,#388d73)":"rgba(86,171,145,0.07)",color:p.liked?"#fff":"#56ab91",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                            {p.liked?"❤️":"🤍"} {p.liked?t.likedBtn:t.likeBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filtered.length===0 && <div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Nunito',sans-serif",color:"rgba(168,230,207,0.3)",fontSize:15}}>🌙 {t.nobody}{city&&<div style={{fontSize:13,marginTop:6}}>{t.nobodyCity(city)}</div>}</div>}
                </div>
              </div>
            )}

            {/* PROFILE */}
            {tab==="profile" && myProfile && (
              <div style={{animation:"fadeUp 0.35s ease"}}>
                <div style={{background:"linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))",borderRadius:28,overflow:"hidden",border:"1px solid rgba(168,230,207,0.09)",backdropFilter:"blur(20px)"}}>
                  <div style={{position:"relative",height:300}}>
                    <img src={myProfile.photo} alt={myProfile.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 35%,rgba(8,20,14,0.9) 100%)"}}/>
                    <div style={{position:"absolute",bottom:20,left:22}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:"#e8f4e8"}}>{myProfile.name}</div>
                      <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:"rgba(168,230,207,0.65)",marginTop:3}}>{calcAge(myProfile.birth)} {t.years} · 🌿 {myProfile.city}</div>
                    </div>
                    {/* Provider tag on photo */}
                    <div style={{position:"absolute",top:14,right:14,background:"rgba(8,20,14,0.7)",backdropFilter:"blur(8px)",border:`1px solid ${providerColor}`,borderRadius:50,padding:"5px 12px",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13}}>{providerIcon}</span>
                      <span style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:providerColor,fontWeight:700}}>{authState.user.handle||authState.provider}</span>
                    </div>
                  </div>
                  <div style={{padding:"20px 22px 26px"}}>
                    {!editMode ? (
                      <>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:"italic",color:"rgba(232,244,232,0.7)",lineHeight:1.7,marginBottom:20}}>{myProfile.bio[lang]||"—"}</p>
                        <div style={{display:"flex",gap:10,marginBottom:22,flexWrap:"wrap"}}>
                          <Chip icon="🌿" label={myProfile.city}/>
                          <Chip icon="🎂" label={new Date(myProfile.birth).toLocaleDateString(lang==="ua"?"uk-UA":"ru-RU")}/>
                        </div>
                        <button onClick={()=>{setDraft({...myProfile,bio:{...myProfile.bio}});setEditMode(true);}} style={pBtn}>{t.editBtn}</button>
                      </>
                    ):(
                      <>
                        <FL>{t.fieldName}</FL><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} style={fs}/>
                        <FL>{t.fieldBirth}</FL><input type="date" value={draft.birth} onChange={e=>setDraft({...draft,birth:e.target.value})} style={fs}/>
                        <FL>{t.fieldCity}</FL><input value={draft.city} onChange={e=>setDraft({...draft,city:e.target.value})} style={fs}/>
                        <FL>{t.fieldBio} 🇺🇦</FL><textarea value={draft.bio.ua} onChange={e=>setDraft({...draft,bio:{...draft.bio,ua:e.target.value}})} rows={3} style={{...fs,resize:"none",lineHeight:1.6}}/>
                        <FL>{t.fieldBio} 🇧🇾</FL><textarea value={draft.bio.by} onChange={e=>setDraft({...draft,bio:{...draft.bio,by:e.target.value}})} rows={3} style={{...fs,resize:"none",lineHeight:1.6}}/>
                        <div style={{display:"flex",gap:10,marginTop:10}}>
                          <button onClick={()=>{setMyProfile({...draft});setEditMode(false);}} style={pBtn}>{t.saveBtn}</button>
                          <button onClick={()=>setEditMode(false)} style={gBtn}>{t.cancelBtn}</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LIKES */}
            {tab==="likes" && (
              <div style={{animation:"fadeUp 0.35s ease"}}>
                <p style={{textAlign:"center",fontFamily:"'Nunito',sans-serif",fontSize:13,color:"rgba(168,230,207,0.45)",marginBottom:20,letterSpacing:1}}>❤️ {whoLikedMe.length} {t.likedMe}</p>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {whoLikedMe.map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:16,background:"linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))",borderRadius:20,padding:"14px 16px",border:"1px solid rgba(168,230,207,0.09)",animation:`fadeUp 0.4s ${i*0.08}s ease both`}}>
                      <div style={{position:"relative",flexShrink:0}}>
                        <img src={p.photo} alt={p.name} style={{width:66,height:66,borderRadius:"50%",objectFit:"cover",border:"2.5px solid rgba(86,171,145,0.35)",display:"block"}}/>
                        <div style={{position:"absolute",bottom:0,right:0,background:"#56ab91",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,border:"2px solid #0d2137"}}>❤</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:500,color:"#e8f4e8"}}>{p.name}</div>
                        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:"rgba(168,230,207,0.45)",marginTop:2}}>{calcAge(p.birth)} {t.years} · 🌿 {p.city}</div>
                      </div>
                      <button onClick={()=>setTab("search")} style={{flexShrink:0,background:"linear-gradient(135deg,#56ab91,#388d73)",border:"none",borderRadius:14,padding:"9px 13px",color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{t.replyBtn}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </>}
      </div>
    </div>
  );
}

function Chip({icon,label}){return(<div style={{background:"rgba(86,171,145,0.1)",border:"1px solid rgba(86,171,145,0.18)",borderRadius:10,padding:"6px 13px",fontFamily:"'Nunito',sans-serif",fontSize:13,color:"#a8e6cf",display:"flex",alignItems:"center",gap:5}}>{icon} {label}</div>);}
function FL({children}){return(<div style={{fontFamily:"'Nunito',sans-serif",fontSize:10,color:"rgba(168,230,207,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:6,marginTop:16}}>{children}</div>);}
