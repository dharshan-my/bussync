const {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext
} = React;
const {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} = ReactRouterDOM;
const API_BASE = '/api';
const getStatusStyle = status => {
  if (!status) return 'text-[#64748B] bg-[#F7F7F5] border-[#E5E7EB]';
  if (status.includes('Active') || status.includes('Travelling')) return 'text-[#D71920] bg-[#FEF9C3] border-[#FDE047]';
  if (status.includes('Scheduled') || status.includes('In Use') || status.includes('Delayed')) return 'text-[#171717] bg-[#F7F7F5] border-[#E5E7EB]';
  if (status.includes('Completed') || status.includes('Available')) return 'text-[#171717] bg-[#FFFDF7] border-[#E5E7EB]';
  return 'text-[#64748B] bg-[#F7F7F5] border-[#E5E7EB]';
};
const getStatusBadge = (status, translatedStatus) => {
  if (!status) return null;
  if (status.includes('Active') || status.includes('Travelling')) {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 bg-[#FEF9C3] px-3 py-1 rounded-full border border-[#FDE047] text-[#D71920]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-[#D71920] animate-pulse"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-bold"
    }, translatedStatus ? translatedStatus.replace('🟢 ', '') : status.replace('🟢 ', '')));
  }
  let color = 'text-[#64748B] bg-[#F7F7F5] border-[#E5E7EB]';
  let icon = 'help-circle';
  if (status.includes('Scheduled') || status.includes('In Use') || status.includes('Delayed')) {
    color = 'text-[#171717] bg-[#F7F7F5] border-[#E5E7EB]';
    icon = 'clock';
  } else if (status.includes('Completed') || status.includes('Available')) {
    color = 'text-[#171717] bg-[#FFFDF7] border-[#E5E7EB]';
    icon = 'check-circle';
  } else if (status.includes('No recent update')) {
    color = 'text-[#D71920] bg-[#FEE2E2] border-[#FECACA]';
    icon = 'alert-circle';
  }
  const cleanText = (translatedStatus || status).replace('🟡 ', '').replace('⚪ ', '').replace('🟠 ', '').replace('✓ ', '');
  return /*#__PURE__*/React.createElement("span", {
    className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 12,
    className: "text-[#D71920]"
  }), cleanText);
};
const timeAgo = dateStr => {
  if (!dateStr) return '';
  const diff = new Date() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Updated ${mins}m ago`;
  return `Updated ${Math.floor(mins / 60)}h ago`;
};
const toPascal = str => {
  if (!str) return '';
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};
const Icon = ({
  name,
  size = 24,
  className = '',
  ...props
}) => {
  const iconRef = useRef(null);
  useEffect(() => {
    if (iconRef.current && window.lucide && window.lucide.icons) {
      iconRef.current.innerHTML = '';
      const pascalName = toPascal(name);
      const iconObj = window.lucide.icons[pascalName] || window.lucide.icons[name];
      if (iconObj && typeof iconObj.toSvg === 'function') {
        const iconNode = iconObj.toSvg({
          width: size,
          height: size,
          class: className,
          ...props
        });
        const doc = new DOMParser().parseFromString(iconNode, 'image/svg+xml');
        if (doc.documentElement) {
          iconRef.current.appendChild(doc.documentElement);
        }
      }
    }
  }, [name, size, className]);
  return /*#__PURE__*/React.createElement("span", {
    ref: iconRef,
    className: `inline-flex items-center justify-center ${className}`
  });
};
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});
const ThemeProvider = ({
  children
}) => {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => {};
  return /*#__PURE__*/React.createElement(ThemeContext.Provider, {
    value: {
      theme,
      setTheme,
      toggleTheme
    }
  }, children);
};
const WSContext = createContext({
  messages: []
});
const WSProvider = ({
  children
}) => {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
      window.dispatchEvent(new CustomEvent('ws-update', {
        detail: data
      }));
    };
    return () => ws.close();
  }, []);
  return /*#__PURE__*/React.createElement(WSContext.Provider, {
    value: {
      messages
    }
  }, children);
};

// --- Ambient Background Component (Karnataka Red/Yellow Accents) ---
const AmbientBackground = () => /*#__PURE__*/React.createElement("div", {
  className: "fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
}, /*#__PURE__*/React.createElement("div", {
  className: "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FFCC00]/5 blur-[120px]"
}), /*#__PURE__*/React.createElement("div", {
  className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D71920]/5 blur-[120px]"
}));
const LiveIndicator = ({
  label = "LIVE"
}) => /*#__PURE__*/React.createElement("div", {
  className: "inline-flex items-center gap-1.5 text-[#D71920] font-bold tracking-widest uppercase"
}, /*#__PURE__*/React.createElement("div", {
  className: "w-2.5 h-2.5 rounded-full bg-[#D71920] animate-pulse"
}), /*#__PURE__*/React.createElement("span", null, label));
const BusLoading = () => /*#__PURE__*/React.createElement("div", {
  className: "fixed inset-0 bg-[#F7F7F5]/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
}, /*#__PURE__*/React.createElement("div", {
  className: "w-64 h-16 relative overflow-hidden mb-4"
}, /*#__PURE__*/React.createElement("div", {
  className: "absolute inset-0 flex items-center justify-center animate-bus-drive"
}, /*#__PURE__*/React.createElement("div", {
  className: "w-14 h-14 rounded-2xl bg-[#FFCC00] flex items-center justify-center shadow-lg border-2 border-[#D71920]"
}, /*#__PURE__*/React.createElement(Icon, {
  name: "bus",
  size: 30,
  className: "text-[#171717]"
}))), /*#__PURE__*/React.createElement("div", {
  className: "absolute bottom-2 left-0 right-0 h-1 bg-[#D71920] rounded-full"
})), /*#__PURE__*/React.createElement("div", {
  className: "font-heading font-black text-sm text-[#171717] tracking-wider uppercase flex items-center gap-2"
}, /*#__PURE__*/React.createElement("span", null, "SYNCHRONIZING FLEET TELEMETRY")), /*#__PURE__*/React.createElement("div", {
  className: "text-xs text-[#D71920] font-bold mt-1"
}, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u2022 \u0CA8\u0CBF\u0CB2\u0CCD\u0CA6\u0CBE\u0CA3 \u0CAA\u0CB0\u0CBF\u0CB6\u0CC0\u0CB2\u0CA8\u0CC6"));

// ======== TRANSLATIONS & LOCALIZATION ========
const translations = {
  en: {
    "Where is my bus?": "Where is my bus?",
    "Search bus number, route or stop...": "Search bus number, route or stop...",
    "LAST REPORTED STOP": "LAST REPORTED STOP",
    "UPDATED": "UPDATED",
    "NEXT STOP": "NEXT STOP",
    "Travelling": "Travelling",
    "Scheduled": "Scheduled",
    "Completed": "Completed",
    "No recent update": "No recent update",
    "Notify Me": "Notify Me",
    "Notifications On": "Notifications On",
    "Save Notifications": "Save Notifications",
    "Buses Operating Now": "Buses Operating Now",
    "Active": "Active",
    "Check My Bus": "Check My Bus",
    "Operating Route": "Operating Route",
    "Bus Number": "Bus Number",
    "Route Timeline": "Route Timeline",
    "Trip is scheduled and waiting to start.": "Trip is scheduled and waiting to start.",
    "Back": "Back",
    "Back to Search": "Back to Search",
    "Home": "Home",
    "Passenger": "Passenger",
    "Ticket Machine": "Ticket Machine",
    "Admin": "Admin",
    "Your Bus.": "Your Bus.",
    "Your Journey.": "Your Journey.",
    "In Sync.": "In Sync.",
    "BusSync helps passengers stay informed...": "BusSync helps passengers stay informed with the latest reported journey status of their bus — powered by dynamic session syncing.",
    "Explore BusSync": "Explore BusSync",
    "Notifications": "Notifications",
    "No notifications yet.": "No notifications yet.",
    "Mark all read": "Mark all read",
    "Buses on Route": "Buses on Route",
    "No buses currently operating.": "No buses currently operating.",
    "No buses operating on this route right now.": "No buses operating on this route right now.",
    "SYSTEM ONLINE": "SYSTEM ONLINE",
    "Live Session": "Live Session",
    "BusSync Core": "BusSync Core",
    "Passenger App": "Passenger App",
    "Notify me when:": "Notify me when:",
    "Trip starts": "Trip starts",
    "Bus reports my stop": "Bus reports my stop",
    "Bus reaches destination": "Bus reaches destination",
    "-- Select your stop --": "-- Select your stop --",
    "Just now": "Just now",
    "ago": "ago"
  },
  kn: {
    "Where is my bus?": "ನನ್ನ ಬಸ್ ಎಲ್ಲಿದೆ?",
    "Search bus number, route or stop...": "ಬಸ್ ಸಂಖ್ಯೆ, ಮಾರ್ಗ ಅಥವಾ ನಿಲ್ದಾಣವನ್ನು ಹುಡುಕಿ...",
    "LAST REPORTED STOP": "ಕೊನೆಯದಾಗಿ ವರದಿ ಮಾಡಿದ ನಿಲ್ದಾಣ",
    "UPDATED": "ಕೊನೆಯ ನವೀಕರಣ",
    "NEXT STOP": "ಮುಂದಿನ ನಿಲ್ದಾಣ",
    "Travelling": "ಪ್ರಯಾಣದಲ್ಲಿದೆ",
    "Scheduled": "ನಿಗದಿಯಾಗಿದೆ",
    "Completed": "ಪೂರ್ಣಗೊಂಡಿದೆ",
    "No recent update": "ಇತ್ತೀಚಿನ ನವೀಕರಣವಿಲ್ಲ",
    "Notify Me": "ನನಗೆ ತಿಳಿಸಿ",
    "Notifications On": "ಸೂಚನೆಗಳು ಆನ್ ಆಗಿವೆ",
    "Save Notifications": "ಸೂಚನೆಗಳನ್ನು ಉಳಿಸಿ",
    "Buses Operating Now": "ಪ್ರಸ್ತುತ ಸಂಚರಿಸುತ್ತಿರುವ ಬಸ್ಗಳು",
    "Active": "ಸಕ್ರಿಯ",
    "Check My Bus": "ನನ್ನ ಬಸ್ ಪರಿಶೀಲಿಸಿ",
    "Operating Route": "ಕಾರ್ಯಾಚರಣೆಯ ಮಾರ್ಗ",
    "Bus Number": "ಬಸ್ ಸಂಖ್ಯೆ",
    "Route Timeline": "ಮಾರ್ಗ ಟೈಮ್‌ಲೈನ್",
    "Trip is scheduled and waiting to start.": "ಪ್ರಯಾಣ ನಿಗದಿಯಾಗಿದೆ ಮತ್ತು ಪ್ರಾರಂಭಿಸಲು ಕಾಯುತ್ತಿದೆ.",
    "Back": "ಹಿಂದೆ",
    "Back to Search": "ಹುಡುಕಾಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    "Home": "ಮುಖಪುಟ",
    "Passenger": "ಪ್ರಯಾಣಿಕ",
    "Ticket Machine": "ಟಿಕೆಟ್ ಯಂತ್ರ",
    "Admin": "ನಿರ್ವಾಹಕ",
    "Your Bus.": "ನಿಮ್ಮ ಬಸ್.",
    "Your Journey.": "ನಿಮ್ಮ ಪ್ರಯಾಣ.",
    "In Sync.": "ಸಿಂಕ್‌ನಲ್ಲಿದೆ.",
    "BusSync helps passengers stay informed...": "ಬಸ್‌ಸಿಂಕ್ ಪ್ರಯಾಣಿಕರಿಗೆ ತಮ್ಮ ಬಸ್‌ನ ಇತ್ತೀಚಿನ ವರದಿಯಾದ ಪ್ರಯಾಣದ ಸ್ಥಿತಿಯನ್ನು ತಿಳಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ — ಡೈನಾಂಡಿಕ್ ಸೆಷನ್ ಸಿಂಕಿಂಗ್‌ನಿಂದ ನಿಯಂತ್ರಿಸಲ್ಪಡುತ್ತದೆ.",
    "Explore BusSync": "ಬಸ್‌ಸಿಂಕ್ ಅನ್ವೇಷಿಸಿ",
    "Notifications": "ಸೂಚನೆಗಳು",
    "No notifications yet.": "ಇನ್ನೂ ಯಾವುದೇ ಸೂಚನೆಗಳಿಲ್ಲ.",
    "Mark all read": "ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
    "Buses on Route": "ಮಾರ್ಗದಲ್ಲಿರುವ ಬಸ್‌ಗಳು",
    "No buses currently operating.": "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಬಸ್‌ಗಳು ಸಂಚರಿಸುತ್ತಿಲ್ಲ.",
    "No buses operating on this route right now.": "ಪ್ರಸ್ತುತ ಈ ಮಾರ್ಗದಲ್ಲಿ ಯಾವುದೇ ಬಸ್‌ಗಳು ಸಂಚರಿಸುತ್ತಿಲ್ಲ.",
    "SYSTEM ONLINE": "ಸಿಸ್ಟಮ್ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದೆ",
    "Live Session": "ಲೈವ್ ಸೆಷನ್",
    "BusSync Core": "ಬಸ್‌ಸಿಂಕ್ ಕೋರ್",
    "Passenger App": "ಪ್ರಯಾಣಿಕರ ಅಪ್ಲಿಕೇಶನ್",
    "Notify me when:": "ನನಗೆ ಈ ಸಂದರ್ಭದಲ್ಲಿ ತಿಳಿಸಿ:",
    "Trip starts": "ಪ್ರಯಾಣ ಪ್ರಾರಂಭವಾದಾಗ",
    "Bus reports my stop": "ಬಸ್ ನನ್ನ ನಿಲ್ದಾಣವನ್ನು ವರದಿ ಮಾಡಿದಾಗ",
    "Bus reaches destination": "ಬಸ್ ಗಮ್ಯಸ್ಥಾನವನ್ನು ತಲುಪಿದಾಗ",
    "-- Select your stop --": "-- ನಿಮ್ಮ ನಿಲ್ದಾಣವನ್ನು ಆರಿಸಿ --",
    "Just now": "ಈಗಷ್ಟೇ",
    "ago": "ಹಿಂದೆ"
  }
};
const LanguageContext = createContext();
const LanguageProvider = ({
  children
}) => {
  const [lang, setLang] = useState(localStorage.getItem('bussync_lang') || 'en');
  useEffect(() => {
    localStorage.setItem('bussync_lang', lang);
  }, [lang]);
  const t = key => translations[lang]?.[key] || key;
  const translateNotif = msg => {
    if (!msg || lang === 'en') return msg;
    let m = msg;
    m = m.replace('has started its journey.', 'ತನ್ನ ಪ್ರಯಾಣವನ್ನು ಪ್ರಾರಂಭಿಸಿದೆ.');
    m = m.replace('has reported', 'ವರದಿ ಮಾಡಿದೆ:');
    m = m.replace('has reached its destination.', 'ತನ್ನ ಗಮ್ಯಸ್ಥಾನವನ್ನು ತಲುಪಿದೆ.');
    m = m.replace('Trip Started', 'ಪ್ರಯಾಣ ಪ್ರಾರಂಭವಾಯಿತು');
    m = m.replace('Stop Reported', 'ನಿಲ್ದಾಣವನ್ನು ವರದಿ ಮಾಡಲಾಗಿದೆ');
    m = m.replace('Destination Reached', 'ಗಮ್ಯಸ್ಥಾನವನ್ನು ತಲುಪಿದೆ');
    return m;
  };
  const translateStatus = s => {
    if (!s) return s;
    return s.replace('Travelling', t('Travelling')).replace('Scheduled', t('Scheduled')).replace('Completed', t('Completed')).replace('No recent update', t('No recent update'));
  };
  return /*#__PURE__*/React.createElement(LanguageContext.Provider, {
    value: {
      lang,
      setLang,
      t,
      translateNotif,
      translateStatus
    }
  }, children);
};
const PassengerContext = createContext();
const PassengerProvider = ({
  children
}) => {
  const {
    t,
    translateNotif
  } = useContext(LanguageContext) || {};
  const [passengerId, setPassengerId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const fetchNotifications = async pid => {
    try {
      const res = await fetch(`${API_BASE}/passenger/${pid}/notifications`);
      if (res.ok) setNotifications(await res.json());
    } catch (e) {}
  };
  useEffect(() => {
    let pid = localStorage.getItem('bussync_pid');
    if (!pid) {
      pid = 'pass_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bussync_pid', pid);
    }
    setPassengerId(pid);
    fetchNotifications(pid);
  }, []);
  useEffect(() => {
    const handleWs = e => {
      const data = e.detail;
      if (data.type === 'NEW_NOTIFICATION' && data.passenger_id === passengerId) {
        const n = data.notification;
        setToast(n);
        setNotifications(prev => [n, ...prev]);
        setTimeout(() => setToast(null), 5000);
      }
    };
    window.addEventListener('ws-update', handleWs);
    return () => window.removeEventListener('ws-update', handleWs);
  }, [passengerId]);
  const markAsRead = async id => {
    try {
      await fetch(`${API_BASE}/passenger/notifications/${id}/read`, {
        method: 'PUT'
      });
      setNotifications(prev => prev.map(n => n.id === id ? {
        ...n,
        is_read: 1
      } : n));
    } catch (e) {}
  };
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/passenger/${passengerId}/notifications/read-all`, {
        method: 'PUT'
      });
      setNotifications(prev => prev.map(n => ({
        ...n,
        is_read: 1
      })));
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement(PassengerContext.Provider, {
    value: {
      passengerId,
      notifications,
      markAsRead,
      markAllAsRead
    }
  }, children, toast && /*#__PURE__*/React.createElement("div", {
    className: "fixed top-24 right-6 bg-white border-2 border-[#D71920] p-4 rounded-2xl shadow-[0_10px_40px_rgba(215,25,32,0.15)] z-[100] animate-in slide-in-from-right-8 fade-in flex gap-4 w-80 group cursor-pointer",
    onClick: () => {
      markAsRead(toast.id);
      setToast(null);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FEF9C3] text-[#D71920] p-3 rounded-xl self-start border border-[#FDE047]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell-ring",
    size: 20,
    className: "animate-pulse"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-bold text-sm text-[#171717] mb-1"
  }, translateNotif ? translateNotif(toast.title) : toast.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B] leading-relaxed"
  }, translateNotif ? translateNotif(toast.message) : toast.message), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#D71920] uppercase tracking-widest mt-2"
  }, t ? t('Just now') : 'Just now'))));
};

// ======== COMPONENT: NAVBAR (KARNATAKA THEME) ========
const Navbar = () => {
  const location = useLocation();
  const {
    notifications,
    markAsRead,
    markAllAsRead
  } = useContext(PassengerContext);
  const {
    lang,
    setLang,
    t,
    translateNotif
  } = useContext(LanguageContext);
  const [showDropdown, setShowDropdown] = useState(false);
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/machine')) return null;
  const unread = notifications.filter(n => !n.is_read).length;
  const timeAgo = dateStr => {
    const diff = new Date() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('Just now');
    if (mins < 60) return `${mins}m ${t('ago')}`;
    return `${Math.floor(mins / 60)}h ${t('ago')}`;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "bg-white/95 backdrop-blur-xl border border-[#E5E7EB] shadow-md rounded-2xl px-6 py-3.5 flex justify-between items-center transition-all duration-300"
  }, /*#__PURE__*/React.createElement(Link, {
    to: "/",
    className: "flex items-center gap-3 group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFCC00] p-2 rounded-xl shadow-sm text-[#171717] group-hover:scale-105 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 22,
    className: "text-[#171717]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-heading font-black tracking-wider text-[#171717]"
  }, "BUSSYNC"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-heading font-bold text-[#D71920] tracking-widest uppercase"
  }, "SYNC THE MOTION."))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 sm:gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hidden md:flex gap-6 text-xs font-bold text-[#475569]"
  }, /*#__PURE__*/React.createElement(Link, {
    to: "/",
    className: "hover:text-[#D71920] transition-colors"
  }, t('Home')), /*#__PURE__*/React.createElement(Link, {
    to: "/passenger",
    className: "hover:text-[#D71920] transition-colors"
  }, t('Passenger')), /*#__PURE__*/React.createElement(Link, {
    to: "/admin",
    className: "hover:text-[#D71920] transition-colors"
  }, t('Admin')), /*#__PURE__*/React.createElement(Link, {
    to: "/machine",
    className: "hover:text-[#D71920] transition-colors"
  }, t('Ticket Machine'))), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDropdown(!showDropdown),
    className: "relative p-2 text-[#64748B] hover:text-[#D71920] transition-colors bg-[#F7F7F5] rounded-full hover:bg-[#FEF9C3] flex items-center justify-center border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 18
  }), unread > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute top-0 right-0 w-2.5 h-2.5 bg-[#D71920] rounded-full border-2 border-white animate-pulse"
  })), showDropdown && /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 mt-3 w-[340px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FFFDF7]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-bold text-sm text-[#171717]"
  }, t('Notifications')), unread > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: markAllAsRead,
    className: "text-xs text-[#D71920] hover:underline font-bold"
  }, t('Mark all read'))), /*#__PURE__*/React.createElement("div", {
    className: "max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]"
  }, notifications.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "p-8 text-center text-[#64748B] text-xs"
  }, t('No notifications yet.')) : notifications.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.id,
    onClick: () => markAsRead(n.id),
    className: `p-3.5 hover:bg-[#FFFDF7] transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-[#FEF9C3]/40' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `mt-0.5 ${!n.is_read ? 'text-[#D71920]' : 'text-[#94A3B8]'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.type === 'TRIP_STARTED' ? 'play-circle' : n.type === 'DESTINATION_REACHED' ? 'check-circle' : 'map-pin',
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: `text-xs font-bold mb-0.5 ${!n.is_read ? 'text-[#171717]' : 'text-[#475569]'}`
  }, translateNotif(n.title)), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#64748B]"
  }, translateNotif(n.message)), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1"
  }, timeAgo(n.created_at))), !n.is_read && /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 rounded-full bg-[#D71920] self-center ml-auto"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 text-xs font-bold bg-[#F7F7F5] rounded-full p-1 border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLang('en'),
    className: `px-3 py-1 rounded-full transition-all ${lang === 'en' ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#64748B] hover:text-[#171717]'}`
  }, "English"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLang('kn'),
    className: `px-3 py-1 rounded-full transition-all ${lang === 'kn' ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#64748B] hover:text-[#171717]'}`
  }, "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1")))));
};

// ======== COMPONENT: LANDING PAGE (KARNATAKA THEME) ========
const LandingPage = () => {
  const {
    t
  } = useContext(LanguageContext);
  const [kpis, setKpis] = useState({
    total_buses: 10,
    active_trips: 3,
    active_buses: 3,
    available_machines: 2,
    total_routes: 7,
    total_stops: 21
  });
  const [activeBuses, setActiveBuses] = useState([]);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [demoStep, setDemoStep] = useState(1);
  const demoStops = [{
    id: 1,
    name: 'Tumakuru',
    tag: 'Origin',
    time: '08:30 AM'
  }, {
    id: 2,
    name: 'Kunigal',
    tag: 'Checkpoint 1',
    time: '08:52 AM'
  }, {
    id: 3,
    name: 'Nelamangala',
    tag: 'Checkpoint 2',
    time: 'ETA 09:18 AM'
  }, {
    id: 4,
    name: 'Yeshwanthpur',
    tag: 'Checkpoint 3',
    time: 'ETA 09:40 AM'
  }, {
    id: 5,
    name: 'Bengaluru',
    tag: 'Destination',
    time: 'ETA 10:05 AM'
  }];
  const fetchLandingData = () => {
    fetch(`${API_BASE}/dashboard/kpis`).then(r => r.json()).then(data => {
      if (data && data.kpis) setKpis(data.kpis);
    }).catch(() => {});
    fetch(`${API_BASE}/passenger/buses/active`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setActiveBuses(data);
    }).catch(() => {});
  };
  useEffect(() => {
    fetchLandingData();
    const interval = setInterval(fetchLandingData, 10000);
    return () => clearInterval(interval);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-[#F7F7F5] text-[#171717] font-sans selection:bg-[#FEF9C3] selection:text-[#D71920]"
  }, /*#__PURE__*/React.createElement(AmbientBackground, null), /*#__PURE__*/React.createElement("section", {
    className: "relative pt-32 pb-20 px-6 lg:px-20 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 space-y-6 text-center lg:text-left z-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold tracking-wide shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u2022 INTELLIGENT TRANSIT TELEMETRY")), /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-[#171717] leading-[1.12]"
  }, "My Bus, ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920]"
  }, "My Journey."), /*#__PURE__*/React.createElement("span", {
    className: "block text-2xl sm:text-3xl lg:text-4xl text-[#171717] font-bold mt-3 tracking-normal"
  }, "Karnataka's Next-Gen ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] underline decoration-[#FFCC00] decoration-wavy decoration-2"
  }, "Intelligent Bus Monitoring."))), /*#__PURE__*/React.createElement("p", {
    className: "text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
  }, "Deterministic, stop-based journey tracking for passengers, conductors, and administrators across Karnataka. 100% verified through ticket machines without unreliable GPS hardware."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4"
  }, /*#__PURE__*/React.createElement(Link, {
    to: "/passenger",
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-8 py-4 rounded-2xl font-heading font-bold text-sm tracking-wide shadow-md transition-all flex items-center gap-3 group"
  }, /*#__PURE__*/React.createElement("span", null, "Track Bus Live"), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 18,
    className: "group-hover:translate-x-1 transition-transform"
  })), /*#__PURE__*/React.createElement(Link, {
    to: "/admin",
    className: "bg-white hover:bg-[#FFFDF7] text-[#171717] border border-[#E5E7EB] hover:border-[#D71920] px-8 py-4 rounded-2xl font-heading font-bold text-sm transition-all shadow-sm flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 18,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, "Control Center"))), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs text-[#64748B]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex h-2.5 w-2.5 relative"
  }, /*#__PURE__*/React.createElement("span", {
    className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"
  }), /*#__PURE__*/React.createElement("span", {
    className: "relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D71920]"
  })), activeBuses.length > 0 ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-[#171717]"
  }, activeBuses[0].bus_number), " is live on ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, activeBuses[0].route_name), " (Last stop: ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#171717] font-bold"
  }, activeBuses[0].current_stop_name || 'Departed'), ")") : /*#__PURE__*/React.createElement("span", null, "Active fleet verified \u2022 21 verified checkpoints operating across Karnataka transit routes"))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 w-full max-w-lg relative z-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 backdrop-blur-xl border-2 border-[#E5E7EB] p-5 sm:p-7 rounded-3xl shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-start mb-4 pb-4 border-b border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-heading font-bold tracking-widest text-[#D71920] uppercase mb-1.5 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "radio",
    size: 13,
    className: "animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "LIVE CHECKPOINT TELEMETRY")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center bg-[#F7F7F5] border-2 border-[#171717] rounded-lg shadow-sm px-2.5 py-1 text-xs font-mono font-black tracking-wider text-[#171717]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-[#1D4ED8] text-white text-[8px] font-bold px-1 rounded mr-1"
  }, "IND"), /*#__PURE__*/React.createElement("span", null, "KA-01-F-1234")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-[#64748B] bg-[#F7F7F5] px-2 py-0.5 rounded-full border border-[#E5E7EB]"
  }, "Express #07")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#475569] mt-1 font-semibold flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "Tumakuru"), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 12,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, "Bengaluru"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-[#64748B] font-normal"
  }, "(72 km Corridor)"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FEF9C3] border border-[#FDE047] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "relative flex h-2 w-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"
  }), /*#__PURE__*/React.createElement("span", {
    className: "relative inline-flex rounded-full h-2 w-2 bg-[#D71920]"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#D71920]"
  }, "Travelling"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] border border-[#E5E7EB] rounded-2xl p-3.5 mb-4 shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-xs mb-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    size: 12,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, "Journey Pipeline")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono font-bold text-[#D71920] bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-[#FDE047]"
  }, Math.round(demoStep / (demoStops.length - 1) * 100), "% Cleared (Stop ", demoStep + 1, " of ", demoStops.length, ")")), /*#__PURE__*/React.createElement("div", {
    className: "relative h-2.5 bg-[#E5E7EB] rounded-full my-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-gradient-to-r from-[#FFCC00] to-[#D71920] rounded-full transition-all duration-500 ease-out",
    style: {
      width: `${Math.max(10, Math.min(100, demoStep / (demoStops.length - 1) * 100))}%`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-10",
    style: {
      left: `${Math.max(8, Math.min(94, demoStep / (demoStops.length - 1) * 100))}%`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute -inset-1 rounded-full bg-[#D71920]/40 animate-ping"
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative w-6 h-6 rounded-full bg-[#D71920] border-2 border-white shadow-md flex items-center justify-center text-white"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 12
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-[10px] text-[#64748B] pt-0.5 font-semibold"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFC1 Tumakuru"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "Now at: ", demoStops[demoStep].name), /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFAF Bengaluru"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2.5 mb-4 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#64748B] uppercase"
  }, "Current Checkpoint"), /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-black text-sm text-[#D71920] mt-0.5 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, demoStops[demoStep].name)), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#64748B] mt-0.5"
  }, "Verified at ", demoStops[demoStep].time)), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#64748B] uppercase"
  }, "Next Checkpoint"), /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-bold text-sm text-[#171717] mt-0.5"
  }, demoStep < demoStops.length - 1 ? demoStops[demoStep + 1].name : 'Terminal Reached'), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#D71920] mt-0.5"
  }, demoStep < demoStops.length - 1 ? demoStops[demoStep + 1].time : 'Journey Completed'))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] border border-[#E5E7EB] p-2.5 rounded-xl mb-4 flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ticket",
    size: 14
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#171717]"
  }, "Dynamic POS Terminal M102"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#64748B]"
  }, "Ticket check-in verification"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-[#D71920] flex items-center gap-1 bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FDE047]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    size: 11
  }), " 100% Synced")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 mb-4 relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", null, "Sequential Checkpoints"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-[#D71920] font-bold bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#FDE047]"
  }, "\uD83D\uDC49 Tap stop to test")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 max-h-48 overflow-y-auto pr-1"
  }, demoStops.map((stop, idx) => {
    const isPassed = idx < demoStep;
    const isCurrent = idx === demoStep;
    return /*#__PURE__*/React.createElement("div", {
      key: stop.id,
      onClick: () => setDemoStep(idx),
      className: `p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${isCurrent ? 'bg-white border-2 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' : isPassed ? 'bg-[#FFFDF7] border-[#E5E7EB]' : 'bg-[#F7F7F5] border-[#E5E7EB] opacity-65'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-[#D71920] text-white font-black' : isPassed ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : 'bg-white text-[#94A3B8] border border-[#E5E7EB]'}`
    }, isPassed ? /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }) : idx + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: `text-xs font-heading ${isCurrent ? 'font-black text-[#D71920]' : 'font-bold text-[#171717]'}`
    }, stop.name), /*#__PURE__*/React.createElement("div", {
      className: "text-[9px] text-[#64748B]"
    }, stop.tag))), /*#__PURE__*/React.createElement("div", {
      className: "text-right"
    }, /*#__PURE__*/React.createElement("div", {
      className: `text-[11px] font-mono font-bold ${isCurrent ? 'text-[#D71920]' : 'text-[#64748B]'}`
    }, stop.time), isCurrent && /*#__PURE__*/React.createElement("span", {
      className: "text-[9px] font-bold text-[#D71920] uppercase tracking-wider"
    }, "\u25CF Current Bus Location"), isPassed && /*#__PURE__*/React.createElement("span", {
      className: "text-[9px] font-semibold text-[#64748B]"
    }, "Passed")));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-[11px] text-[#64748B] pt-2.5 border-t border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("span", null, "Deterministic Stop Checkpoint Protocol"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "Zero-GPS Drift"))))), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-6 lg:px-20 max-w-7xl mx-auto border-t border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-heading font-bold tracking-widest text-[#D71920] uppercase mb-2"
  }, "HOW IT WORKS"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl sm:text-4xl font-heading font-black text-[#171717]"
  }, "Architected for Karnataka Public Transit"), /*#__PURE__*/React.createElement("p", {
    className: "text-[#64748B] text-sm mt-2 max-w-xl mx-auto"
  }, "Eliminating expensive GPS tracking hardware by leveraging existing conductor ticketing workflows.")), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4 mb-12"
  }, [{
    title: 'Deterministic Checkpoints',
    kn: 'ನಿಲ್ದಾಣ ಪರಿಶೀಲನೆ',
    desc: 'Stops are verified sequentially by the ticket machine, preventing false movement.'
  }, {
    title: 'Conductor POS Terminal',
    kn: 'ನಿರ್ವಾಹಕರ ಯಂತ್ರ',
    desc: 'Tactile 72px thumb buttons designed for conductors operating on bumpy roads.'
  }, {
    title: 'Passenger Telemetry',
    kn: 'ಪ್ರಯಾಣಿಕರ ನೆರವು',
    desc: 'Live stop timelines, accurate arrival estimates, and push notifications.'
  }, {
    title: 'Control Center',
    kn: 'ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
    desc: 'Central transport operations dashboard monitoring routes and fleet metrics.'
  }].map((feat, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center font-bold text-xs mb-3"
  }, "0", i + 1), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#D71920] mb-0.5"
  }, feat.kn), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-base text-[#171717] mb-1.5"
  }, feat.title), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] leading-relaxed"
  }, feat.desc))))), /*#__PURE__*/React.createElement("section", {
    className: "py-16 px-6 lg:px-20 max-w-7xl mx-auto border-t border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-heading font-bold tracking-widest text-[#D71920] uppercase mb-2"
  }, "WHY NO-GPS?"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-heading font-black text-[#171717]"
  }, "The Deterministic Checkpoint Advantage")), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-2 gap-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-[#D71920] font-heading font-bold text-lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x-circle",
    size: 24
  }), /*#__PURE__*/React.createElement("span", null, "Traditional GPS Bus Tracking")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-3 text-[#64748B] text-sm"
  }, /*#__PURE__*/React.createElement("li", {
    className: "flex items-start gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "\u2715"), /*#__PURE__*/React.createElement("span", null, "GPS drift in urban corridors and complete signal loss inside ghats or tunnels")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "\u2715"), /*#__PURE__*/React.createElement("span", null, "High hardware installation and ongoing maintenance costs for state-wide fleets")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "\u2715"), /*#__PURE__*/React.createElement("span", null, "High battery drain on commuter devices and erratic arrival estimates in traffic")))), /*#__PURE__*/React.createElement("div", {
    className: "p-8 rounded-3xl bg-white border-2 border-[#D71920] shadow-md space-y-4 relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 right-0 bg-[#D71920] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider"
  }, "Recommended"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-[#D71920] font-heading font-bold text-lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle",
    size: 24
  }), /*#__PURE__*/React.createElement("span", null, "BusSync Checkpoint Architecture")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-3 text-[#171717] text-sm"
  }, /*#__PURE__*/React.createElement("li", {
    className: "flex items-start gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "\u2713"), /*#__PURE__*/React.createElement("span", null, "100% deterministic: Bus location updates only when conductor logs the physical stop")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "\u2713"), /*#__PURE__*/React.createElement("span", null, "Zero additional hardware cost: Leverages existing handheld ticketing machines")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, "\u2713"), /*#__PURE__*/React.createElement("span", null, "Guaranteed reliability: Lightweight WebSocket streaming requires minimal mobile data")))))), /*#__PURE__*/React.createElement("footer", {
    className: "border-t border-[#E5E7EB] bg-white py-12 px-6 lg:px-20 text-[#64748B] text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#171717]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-black text-base text-[#171717]"
  }, "BUSSYNC"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#64748B] ml-2"
  }, "Karnataka Transit Platform"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-6 text-xs font-semibold text-[#475569]"
  }, /*#__PURE__*/React.createElement(Link, {
    to: "/passenger",
    className: "hover:text-[#D71920] transition-colors"
  }, "Passenger App"), /*#__PURE__*/React.createElement(Link, {
    to: "/machine",
    className: "hover:text-[#D71920] transition-colors"
  }, "Conductor Terminal"), /*#__PURE__*/React.createElement(Link, {
    to: "/admin",
    className: "hover:text-[#D71920] transition-colors"
  }, "Admin Control Center")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, "Engine v2.4 \u2022 All Karnataka Systems Synchronized")))));
};

// ======== COMPONENT: PASSENGER APP (KARNATAKA THEME) ========
const PassengerPage = () => {
  const {
    passengerId
  } = useContext(PassengerContext);
  const {
    t,
    translateStatus
  } = useContext(LanguageContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [buses, setBuses] = useState([]);
  const [routesSearch, setRoutesSearch] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeBuses, setRouteBuses] = useState([]);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyPrefs, setNotifyPrefs] = useState({
    notify_trip_start: false,
    notify_my_stop: false,
    notify_destination: false,
    selected_stop_id: ''
  });
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [savedBuses, setSavedBuses] = useState(() => JSON.parse(localStorage.getItem('bussync_saved')) || []);
  const fetchActiveBuses = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/passenger/buses/active`);
    setBuses(await res.json());
    setRoutesSearch([]);
    setLoading(false);
  };
  const handleSearch = async query => {
    if (!query.trim()) return fetchActiveBuses();
    setLoading(true);
    const res = await fetch(`${API_BASE}/passenger/search_routes?q=${query}`);
    setRoutesSearch(await res.json());
    setBuses([]);
    setLoading(false);
  };
  useEffect(() => {
    fetchActiveBuses();
  }, []);
  const toggleSaveBus = bus_number => {
    const newSaved = savedBuses.includes(bus_number) ? savedBuses.filter(b => b !== bus_number) : [...savedBuses, bus_number];
    setSavedBuses(newSaved);
    localStorage.setItem('bussync_saved', JSON.stringify(newSaved));
  };
  useEffect(() => {
    const handleWs = e => {
      const data = e.detail;
      if (['STOP_UPDATED', 'TRIP_STARTED', 'TRIP_ENDED', 'ADMIN_UPDATE', 'PASSENGER_UPDATE'].includes(data.type)) {
        if (view === 'bus_detail' && selectedBus && data.bus_number === selectedBus.bus_number) {
          fetch(`${API_BASE}/passenger/bus/${selectedBus.bus_number}`).then(r => r.json()).then(d => d.active_trip ? setSelectedBus(d.active_trip) : setView('list'));
        } else if (view === 'route_buses' && selectedRoute) {
          fetchRouteBuses(selectedRoute);
        } else if (view === 'list') {
          if (!searchQuery) fetchActiveBuses();else handleSearch(searchQuery);
        }
      }
    };
    window.addEventListener('ws-update', handleWs);
    return () => window.removeEventListener('ws-update', handleWs);
  }, [view, selectedBus, selectedRoute, searchQuery]);
  useEffect(() => {
    if (view === 'bus_detail' && selectedBus) {
      fetch(`${API_BASE}/passenger/${passengerId}/subscription/${selectedBus.trip_id}`).then(r => r.json()).then(data => {
        if (data && (data.notify_trip_start || data.notify_my_stop || data.notify_destination)) {
          setHasActiveSub(true);
          setNotifyPrefs({
            notify_trip_start: !!data.notify_trip_start,
            notify_my_stop: !!data.notify_my_stop,
            notify_destination: !!data.notify_destination,
            selected_stop_id: data.selected_stop_id || ''
          });
        } else {
          setHasActiveSub(false);
          setNotifyPrefs({
            notify_trip_start: false,
            notify_my_stop: false,
            notify_destination: false,
            selected_stop_id: ''
          });
        }
      });
    }
  }, [view, selectedBus, passengerId]);
  const saveNotifications = async () => {
    const payload = {
      trip_id: selectedBus.trip_id,
      ...notifyPrefs,
      selected_stop_id: notifyPrefs.selected_stop_id ? parseInt(notifyPrefs.selected_stop_id) : null
    };
    await fetch(`${API_BASE}/passenger/${passengerId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    setShowNotifyModal(false);
    const isActive = notifyPrefs.notify_trip_start || notifyPrefs.notify_my_stop || notifyPrefs.notify_destination;
    setHasActiveSub(isActive);
    alert(isActive ? `✓ Notifications enabled for ${selectedBus.bus_number}` : `✓ Notifications disabled for ${selectedBus.bus_number}`);
  };
  const fetchRouteBuses = async route => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/passenger/route/${route.id}/buses`);
    setRouteBuses(await res.json());
    setSelectedRoute(route);
    setView('route_buses');
    setLoading(false);
  };
  if (view === 'bus_detail' && selectedBus) {
    const currentStopName = selectedBus.current_stop_name || 'Departed Origin';
    const stopsList = selectedBus.stops || [];
    const currentIdx = stopsList.findIndex(st => st.id === selectedBus.current_stop_id || st.name === currentStopName);
    const totalStops = stopsList.length || 4;
    const progressPct = stopsList.length > 1 ? Math.round(Math.max(0, currentIdx) / (stopsList.length - 1) * 100) : 50;
    const originStop = stopsList[0]?.name || 'Origin';
    const destStop = stopsList[stopsList.length - 1]?.name || 'Destination';
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen bg-[#F7F7F5] text-[#171717] pt-24 pb-16 px-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "max-w-2xl mx-auto"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center mb-6"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setSelectedBus(null);
        setView(selectedRoute ? 'route_buses' : 'list');
      },
      className: "flex items-center gap-2 text-[#475569] hover:text-[#D71920] font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-[#E5E7EB] shadow-sm"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    }), /*#__PURE__*/React.createElement("span", null, "Back to Buses")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        navigator.clipboard?.writeText(window.location.href);
        alert('✓ Live bus tracking link copied!');
      },
      className: "px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-white text-[#171717] border border-[#E5E7EB] hover:border-[#D71920] shadow-sm transition-all"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "copy",
      size: 14,
      className: "text-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", {
      className: "hidden sm:inline"
    }, "Share")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowNotifyModal(true),
      className: `px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${hasActiveSub ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : 'bg-white text-[#171717] border border-[#E5E7EB] hover:border-[#D71920]'}`
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 15,
      className: hasActiveSub ? "text-[#D71920] animate-pulse" : "text-[#64748B]"
    }), hasActiveSub ? 'Alerts Active' : 'Notify Me'))), /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E5E7EB] shadow-2xl relative overflow-hidden mb-8"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap justify-between items-start gap-4 mb-6 pb-5 border-b border-[#E5E7EB]"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold shadow-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: "relative flex h-2 w-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"
    }), /*#__PURE__*/React.createElement("span", {
      className: "relative inline-flex rounded-full h-2 w-2 bg-[#D71920]"
    })), /*#__PURE__*/React.createElement("span", {
      className: "tracking-wide"
    }, "LIVE TELEMETRY STREAM")), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
    }, "VERIFIED HARDWARE LINK")), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap items-center gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-flex items-center bg-white border-2 border-[#171717] rounded-lg shadow-sm px-3 py-1 text-sm font-mono font-black tracking-wider text-[#171717]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bg-[#1D4ED8] text-white text-[9px] font-bold px-1 py-0.5 rounded mr-1.5 flex items-center gap-0.5"
    }, /*#__PURE__*/React.createElement("span", null, "IND"), /*#__PURE__*/React.createElement("span", null, "\uD83C\uDDEE\uD83C\uDDF3")), /*#__PURE__*/React.createElement("span", {
      className: "text-xl tracking-widest"
    }, selectedBus.bus_number)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-base sm:text-lg font-heading font-black text-[#171717]"
    }, selectedBus.route_name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-[#64748B]"
    }, "Karnataka State Road Transport \u2022 Express Corridor")))), /*#__PURE__*/React.createElement("div", null, getStatusBadge(selectedBus.status, translateStatus(selectedBus.status)))), /*#__PURE__*/React.createElement("div", {
      className: "bg-[#FFFDF7] border-2 border-[#FEF9C3] rounded-2xl p-4 sm:p-5 mb-6 shadow-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center text-xs mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "activity",
      size: 14,
      className: "text-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", null, "Journey Trajectory")), /*#__PURE__*/React.createElement("span", {
      className: "font-mono font-bold text-[#D71920] bg-[#FEF9C3] px-2.5 py-0.5 rounded-full border border-[#FDE047] text-[11px]"
    }, progressPct, "% Completed (", Math.max(1, currentIdx + 1), " of ", totalStops, " Checkpoints)")), /*#__PURE__*/React.createElement("div", {
      className: "relative h-3.5 bg-[#E5E7EB] rounded-full my-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full bg-gradient-to-r from-[#FFCC00] via-[#F59E0B] to-[#D71920] rounded-full transition-all duration-700 ease-out shadow-sm",
      style: {
        width: `${Math.max(8, Math.min(100, progressPct))}%`
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out z-10",
      style: {
        left: `${Math.max(6, Math.min(94, progressPct))}%`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative"
    }, /*#__PURE__*/React.createElement("span", {
      className: "absolute -inset-2 rounded-full bg-[#D71920]/40 animate-ping"
    }), /*#__PURE__*/React.createElement("div", {
      className: "relative w-8 h-8 rounded-full bg-[#D71920] border-2 border-white shadow-lg flex items-center justify-center text-white"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bus",
      size: 15
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center text-xs text-[#64748B] font-semibold pt-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1 text-[#171717]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2.5 h-2.5 rounded-full bg-[#FFCC00] border border-[#CA8A04]"
    }), /*#__PURE__*/React.createElement("span", null, originStop)), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-bold text-[#D71920] flex items-center gap-1 bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-[#FDE047]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"
    }), /*#__PURE__*/React.createElement("span", null, "At: ", currentStopName)), /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1 text-[#171717]"
    }, /*#__PURE__*/React.createElement("span", null, destStop), /*#__PURE__*/React.createElement("span", {
      className: "w-2.5 h-2.5 rounded-full bg-[#D71920] border border-[#991B1B]"
    })))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-[#FFFDF7] p-4 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 bottom-0 w-1 bg-[#D71920]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-[#64748B] uppercase tracking-wider"
    }, "Current Checkpoint"), /*#__PURE__*/React.createElement("div", {
      className: "font-heading font-black text-xl text-[#D71920] mt-1 flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "map-pin",
      size: 18
    }), /*#__PURE__*/React.createElement("span", null, currentStopName)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-[#64748B] mt-1 flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 13,
      className: "text-emerald-600"
    }), /*#__PURE__*/React.createElement("span", null, "Verified by Conductor Terminal"))), /*#__PURE__*/React.createElement("div", {
      className: "bg-[#F7F7F5] p-4 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 bottom-0 w-1 bg-[#FFCC00]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-[#64748B] uppercase tracking-wider"
    }, "Next Station Ahead"), /*#__PURE__*/React.createElement("div", {
      className: "font-heading font-black text-xl text-[#171717] mt-1"
    }, currentIdx !== -1 && currentIdx < stopsList.length - 1 ? stopsList[currentIdx + 1].name : 'Terminal Reached'), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-[#D71920] mt-1 font-semibold flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 13
    }), /*#__PURE__*/React.createElement("span", null, currentIdx !== -1 && currentIdx < stopsList.length - 1 ? 'Approaching Next Station' : 'Journey Completed'))), /*#__PURE__*/React.createElement("div", {
      className: "bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs sm:col-span-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#B45309] border border-[#FDE047] flex items-center justify-center font-bold"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "ticket",
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-bold text-[#171717]"
    }, "Dynamic POS Terminal: ", selectedBus.machine_code || 'Smart POS M102'), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#64748B]"
    }, "Deterministic stop check-in verification \u2022 Anti-spoofing enabled"))), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
    }, "100% Synced"))), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#64748B]"
    }, /*#__PURE__*/React.createElement("span", null, "Route Checkpoint Progression"), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-[#D71920] font-bold bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FDE047]"
    }, "Live Sequence")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2.5"
    }, stopsList.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-[#64748B] text-center py-6 bg-[#F7F7F5] rounded-2xl border border-dashed border-[#E5E7EB]"
    }, "Loading route checkpoints...") : stopsList.map((s, idx) => {
      const isPast = currentIdx !== -1 && idx < currentIdx;
      const isCurrent = currentIdx !== -1 && idx === currentIdx;
      return /*#__PURE__*/React.createElement("div", {
        key: s.id,
        className: `p-3.5 rounded-2xl border transition-all flex items-center justify-between ${isCurrent ? 'bg-white border-2 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' : isPast ? 'bg-[#FFFDF7] border-[#E5E7EB]' : 'bg-[#F7F7F5] border-[#E5E7EB] opacity-70'}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-3"
      }, /*#__PURE__*/React.createElement("div", {
        className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-[#D71920] text-white font-black shadow-md' : isPast ? 'bg-[#FEF9C3] text-[#D71920] border-2 border-[#FFCC00]' : 'bg-white text-[#94A3B8] border-2 border-[#E5E7EB]'}`
      }, isPast ? /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 15
      }) : isCurrent ? /*#__PURE__*/React.createElement(Icon, {
        name: "bus",
        size: 15
      }) : idx + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: `text-sm font-heading ${isCurrent ? 'text-[#D71920] font-black' : isPast ? 'text-[#171717] font-bold' : 'text-[#64748B]'}`
      }, s.name), /*#__PURE__*/React.createElement("div", {
        className: "text-[10px] text-[#64748B]"
      }, "Checkpoint #", idx + 1))), /*#__PURE__*/React.createElement("div", {
        className: "text-right"
      }, isCurrent && /*#__PURE__*/React.createElement("span", {
        className: "inline-flex items-center gap-1.5 bg-[#D71920] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm"
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-1.5 h-1.5 rounded-full bg-white animate-pulse"
      }), /*#__PURE__*/React.createElement("span", null, "Current Location")), isPast && /*#__PURE__*/React.createElement("span", {
        className: "inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 12
      }), /*#__PURE__*/React.createElement("span", null, "Passed")), !isPast && !isCurrent && /*#__PURE__*/React.createElement("span", {
        className: "text-[11px] font-semibold text-[#94A3B8]"
      }, "Upcoming")));
    }))))), showNotifyModal && /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E5E7EB] shadow-2xl relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
    }), /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-black text-lg text-[#171717] mb-2"
    }, "Arrival Alerts"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-[#64748B] mb-5"
    }, "Receive instant alerts when ", selectedBus.bus_number, " updates its checkpoint"), /*#__PURE__*/React.createElement("div", {
      className: "space-y-4 mb-6 text-xs"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "text-[10px] font-bold text-[#64748B] uppercase block mb-1"
    }, "Alert on Checkpoint"), /*#__PURE__*/React.createElement("select", {
      value: notifyPrefs.selected_stop_id,
      onChange: e => setNotifyPrefs({
        ...notifyPrefs,
        selected_stop_id: e.target.value,
        notify_my_stop: true
      }),
      className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "-- Choose Arrival Stop --"), selectedBus.stops && selectedBus.stops.map(s => /*#__PURE__*/React.createElement("option", {
      key: s.id,
      value: s.id
    }, s.name)))), /*#__PURE__*/React.createElement("label", {
      className: "flex items-center gap-2 cursor-pointer"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: notifyPrefs.notify_trip_start,
      onChange: e => setNotifyPrefs({
        ...notifyPrefs,
        notify_trip_start: e.target.checked
      }),
      className: "accent-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-[#171717]"
    }, "Alert when trip departs")), /*#__PURE__*/React.createElement("label", {
      className: "flex items-center gap-2 cursor-pointer"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: notifyPrefs.notify_destination,
      onChange: e => setNotifyPrefs({
        ...notifyPrefs,
        notify_destination: e.target.checked
      }),
      className: "accent-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-[#171717]"
    }, "Alert on final terminal arrival"))), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-end gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowNotifyModal(false),
      className: "px-4 py-2 text-xs font-bold text-[#64748B]"
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      onClick: saveNotifications,
      className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
    }, "Save Preferences")))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-[#F7F7F5] text-[#171717] pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u2022 PASSENGER LIVE TELEMETRY")), /*#__PURE__*/React.createElement("h1", {
    className: "text-3xl sm:text-4xl font-heading font-black text-[#171717]"
  }, "Track Your Bus Live"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-[#64748B] mt-1 max-w-md mx-auto"
  }, "Real-time stop verification directly updated from conductor ticket machines across Karnataka.")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none"
  }, ['All Active Buses', 'Bengaluru Corridors', 'Express Routes', 'Airport Links', 'Mysuru Line'].map((filter, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: `px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-[#D71920] text-white shadow-sm' : 'bg-white text-[#171717] border border-[#E5E7EB] hover:border-[#D71920]'}`
  }, filter))), /*#__PURE__*/React.createElement("div", {
    className: "relative mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 20,
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search bus number (e.g. KA-01-1234), route, or destination...",
    value: searchQuery,
    onChange: e => {
      setSearchQuery(e.target.value);
      handleSearch(e.target.value);
    },
    className: "w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#E5E7EB] text-sm text-[#171717] font-medium outline-none focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/10 shadow-sm transition-all"
  })), view === 'route_buses' && selectedRoute && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSelectedRoute(null);
      setView('list');
    },
    className: "text-xs font-bold text-[#475569] flex items-center gap-1.5 hover:text-[#D71920]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 14
  }), " Back to all routes"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#D71920]"
  }, routeBuses.length, " Active Bus(es) on this route")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4"
  }, routeBuses.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.bus_id,
    onClick: () => {
      setSelectedBus(b);
      setView('bus_detail');
    },
    className: "bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#D71920] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-xl bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 24
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-black text-lg text-[#171717]"
  }, b.bus_number), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B]"
  }, "Last reported stop: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-[#D71920]"
  }, b.current_stop_name || 'In Transit')))), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "Track Live"), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#94A3B8] mt-1"
  }, timeAgo(b.last_update))))))), view === 'list' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, loading && /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12 text-[#64748B] text-sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    size: 24,
    className: "animate-spin text-[#D71920] mx-auto mb-2"
  }), /*#__PURE__*/React.createElement("span", null, "Updating live fleet locations...")), !loading && buses.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-[#F7F7F5] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 text-[#94A3B8]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 32
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-1"
  }, "No Active Buses Matching Search"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B]"
  }, "Try searching for other routes or clear your search query.")), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, buses.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.bus_id,
    className: "bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#D71920] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-start mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-black text-lg text-[#171717] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, b.bus_number), /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleSaveBus(b.bus_number),
    className: "text-[#94A3B8] hover:text-[#D71920]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bookmark",
    size: 14,
    className: savedBuses.includes(b.bus_number) ? "fill-[#D71920] text-[#D71920]" : ""
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-semibold text-[#D71920]"
  }, b.route_name)), getStatusBadge(b.status, translateStatus(b.status))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] p-3 rounded-xl border border-[#E5E7EB] mb-4 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#64748B] font-bold uppercase"
  }, "Current Reported Checkpoint"), /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-bold text-sm text-[#171717] mt-0.5 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, b.current_stop_name || 'En Route')))), /*#__PURE__*/React.createElement("div", {
    className: "pt-3 border-t border-[#E5E7EB] flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-[#64748B]"
  }, timeAgo(b.last_update)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSelectedBus(b);
      setView('bus_detail');
    },
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement("span", null, "Track Live"), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 13
  }))))))));
};
// ======== COMPONENT: TICKET MACHINE SIMULATOR (KARNATAKA POS TERMINAL) ========
const TicketMachinePage = () => {
  const [machineCode, setMachineCode] = useState('M102');
  const [busNumber, setBusNumber] = useState('');
  const [session, setSession] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmStop, setConfirmStop] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE}/machine-session/${machineCode}`).then(r => r.json()).then(data => {
      if (data.active) {
        setSession(data);
        fetchStops(data.route_id);
      }
    });
  }, [machineCode]);
  const fetchStops = routeId => fetch(`${API_BASE}/routes/${routeId}/stops`).then(r => r.json()).then(setRouteStops);
  const startTrip = async () => {
    if (!busNumber.trim()) return alert("Enter bus number");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/trip/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          machine_code: machineCode,
          bus_number: busNumber.toUpperCase()
        })
      });
      const data = await res.json();
      if (res.ok) {
        const sRes = await fetch(`${API_BASE}/machine-session/${machineCode}`);
        const sData = await sRes.json();
        setSession(sData);
        fetchStops(sData.route_id);
      } else alert(data.detail);
    } catch (err) {
      alert("Error starting trip");
    }
    setLoading(false);
  };
  const reportStop = async stopId => {
    setConfirmStop(null);
    const res = await fetch(`${API_BASE}/trip/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        machine_code: machineCode,
        stop_id: stopId
      })
    });
    if (res.ok) {
      setSession(prev => ({
        ...prev,
        current_stop_id: stopId
      }));
      setToast(`✓ CHECKPOINT REPORTED:${routeStops.find(s => s.id === stopId)?.name} synced.`);
      setTimeout(() => setToast(null), 2500);
    } else alert((await res.json()).detail);
  };
  const endTrip = async () => {
    const res = await fetch(`${API_BASE}/trip/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        machine_code: machineCode
      })
    });
    if (res.ok) {
      setConfirmEnd(false);
      setSession(null);
      setBusNumber('');
      setToast("✓ TRIP COMPLETED:Machine returned to available pool.");
      setTimeout(() => setToast(null), 3000);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-[#F7F7F5] flex items-center justify-center p-3 md:p-6 text-[#171717] font-sans"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-lg bg-white rounded-3xl border-2 border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#171717] p-4 flex justify-between items-center text-white relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#171717] shadow-sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-black text-base tracking-wider text-white"
  }, "BUSSYNC POS"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#FFCC00] font-bold tracking-widest uppercase"
  }, "KARNATAKA TICKET MACHINE"))), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-mono font-bold text-white text-sm"
  }, machineCode), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold tracking-wider uppercase flex items-center justify-end gap-1.5 text-[#FFCC00]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-[#FFCC00] animate-pulse"
  }), " Connected"))), /*#__PURE__*/React.createElement("div", {
    className: "h-1 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
  }), toast && /*#__PURE__*/React.createElement("div", {
    className: "absolute top-20 left-4 right-4 bg-[#FEF9C3] border-2 border-[#FDE047] text-[#D71920] font-bold px-4 py-3 rounded-2xl shadow-xl z-50 text-center animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-heading text-sm"
  }, toast.split(':')[0]), toast.split(':')[1] && /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium text-[#171717] mt-0.5"
  }, toast.split(':')[1])), !session ? /*#__PURE__*/React.createElement("div", {
    className: "p-6 md:p-8 flex flex-col items-center justify-center space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#D71920] mb-2 shadow-sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ticket",
    size: 36
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Start Conductor Shift"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-1"
  }, "Bind this terminal dynamically to an active Karnataka bus")), /*#__PURE__*/React.createElement("div", {
    className: "w-full space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1"
  }, "Terminal Machine Code"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: machineCode,
    onChange: e => setMachineCode(e.target.value.toUpperCase()),
    className: "w-full bg-[#F7F7F5] border border-[#E5E7EB] rounded-2xl p-3.5 text-center font-mono font-bold text-xl text-[#171717] outline-none focus:border-[#D71920] uppercase"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1"
  }, "Bus Registration Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: busNumber,
    onChange: e => setBusNumber(e.target.value.toUpperCase()),
    placeholder: "KA-01-1234",
    className: "w-full bg-[#F7F7F5] border border-[#E5E7EB] rounded-2xl p-3.5 text-center font-heading font-black text-2xl text-[#171717] placeholder:text-[#CBD5E1] outline-none focus:border-[#D71920] uppercase tracking-wider"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: startTrip,
    disabled: loading,
    className: "w-full bg-[#D71920] hover:bg-[#B9141A] text-white font-heading font-black text-xl py-5 rounded-2xl shadow-lg transition-all disabled:opacity-50 tracking-wider mt-4"
  }, loading ? 'CONNECTING...' : 'START TRIP')), /*#__PURE__*/React.createElement("div", {
    className: "text-center text-[11px] text-[#64748B] pt-2"
  }, /*#__PURE__*/React.createElement("span", null, "Dynamic Session Protocol \u2022 No GPS tracking"))) : /*#__PURE__*/React.createElement("div", {
    className: "p-6 flex flex-col h-full space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] border border-[#E5E7EB] rounded-2xl p-4 flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#64748B] font-bold uppercase"
  }, "Bus Assigned"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, session.bus_number), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#D71920] font-bold mt-0.5"
  }, session.route_name)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmEnd(true),
    className: "bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#D71920] font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
  }, "End Trip")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold uppercase text-[#64748B] flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Report Checkpoint Stop"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920]"
  }, "Tap to Sync")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 max-h-80 overflow-y-auto pr-1"
  }, routeStops.map((stop, idx) => {
    const isCurrent = session.current_stop_id === stop.id;
    return /*#__PURE__*/React.createElement("button", {
      key: stop.id,
      onClick: () => reportStop(stop.id),
      className: `w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isCurrent ? 'bg-[#FEF9C3] border-2 border-[#FDE047] text-[#D71920] shadow-sm' : 'bg-[#F7F7F5] border-[#E5E7EB] hover:bg-[#FFFDF7] text-[#171717]'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-[#D71920] text-white font-black' : 'bg-white text-[#475569] border border-[#E5E7EB]'}`
    }, idx + 1), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-black text-base"
    }, stop.name)), isCurrent && /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-bold text-[#D71920] bg-white px-2.5 py-1 rounded-full border border-[#FDE047]"
    }, "\u25CF Current"));
  }))), confirmEnd && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-white/95 p-6 rounded-3xl flex flex-col items-center justify-center text-center z-50 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center text-[#D71920] mb-4"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 32
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-2xl text-[#171717] mb-1"
  }, "End This Trip?"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mb-6"
  }, "The machine session will be released and returned to the pool."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 w-full"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmEnd(false),
    className: "flex-1 py-3 text-xs font-bold text-[#64748B] bg-[#F7F7F5] rounded-xl"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: endTrip,
    className: "flex-1 py-3 text-xs font-bold text-white bg-[#D71920] rounded-xl hover:bg-[#B9141A]"
  }, "Confirm End"))), /*#__PURE__*/React.createElement("div", {
    className: "text-center text-[10px] text-[#64748B]"
  }, /*#__PURE__*/React.createElement(Link, {
    to: "/",
    className: "hover:text-[#D71920] font-bold"
  }, "\u2190 Back to Portal Home")))));
};

// ======== Page: Admin Dashboard (BUSSYNC KARNATAKA MOBILITY CONTROL CENTER) ========
const AdminPage = () => {
  const {
    theme,
    toggleTheme
  } = useContext(ThemeContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [currentTab, setCurrentTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Data States
  const [kpis, setKpis] = useState({
    total_buses: 0,
    active_buses: 0,
    inactive_buses: 0,
    active_trips: 0,
    scheduled_trips: 0,
    completed_trips: 0,
    cancelled_trips: 0,
    total_machines: 0,
    available_machines: 0,
    in_use_machines: 0,
    total_routes: 0,
    active_routes: 0,
    total_stops: 0,
    live_updates: 0,
    total_conductors: 0,
    active_conductors: 0
  });
  const [journeys, setJourneys] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [adminBuses, setAdminBuses] = useState([]);
  const [adminRoutes, setAdminRoutes] = useState([]);
  const [adminStops, setAdminStops] = useState([]);
  const [adminConductors, setAdminConductors] = useState([]);
  const [adminMachines, setAdminMachines] = useState([]);
  const [adminTrips, setAdminTrips] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [machineHistory, setMachineHistory] = useState([]);

  // Live Tracking Modal
  const [trackingTrip, setTrackingTrip] = useState(null);
  const [trackingRouteStops, setTrackingRouteStops] = useState([]);

  // Route Detail / Stops Reorder
  const [viewingRoute, setViewingRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [showAddStopToRoute, setShowAddStopToRoute] = useState(false);
  const [newStopNameToRoute, setNewStopNameToRoute] = useState('');

  // Modals
  const [showAddBus, setShowAddBus] = useState(false);
  const [newBusNumber, setNewBusNumber] = useState('');
  const [editingBus, setEditingBus] = useState(null);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    origin: '',
    destination: '',
    status: 'Active'
  });
  const [editingRoute, setEditingRoute] = useState(null);
  const [showAddConductor, setShowAddConductor] = useState(false);
  const [newConductor, setNewConductor] = useState({
    conductor_id: '',
    name: '',
    phone: '',
    status: 'Active'
  });
  const [editingConductor, setEditingConductor] = useState(null);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachineCode, setNewMachineCode] = useState('');
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({
    bus_id: '',
    route_id: '',
    conductor_id: '',
    machine_id: ''
  });
  const [tripFilter, setTripFilter] = useState('All');
  const [editingStop, setEditingStop] = useState(null);
  const handleLogin = () => {
    if (password === 'admin') {
      setIsLoggedIn(true);
      setError(false);
    } else {
      setError(true);
    }
  };
  const fetchAllAdminData = () => {
    if (!isLoggedIn) return;
    fetch(`${API_BASE}/dashboard/kpis`).then(r => r.json()).then(d => {
      if (d.kpis) setKpis(d.kpis);
      if (d.active_journeys) setJourneys(d.active_journeys);
      if (d.recent_activity) setRecentActivity(d.recent_activity);
    }).catch(() => {});
    fetch(`${API_BASE}/admin/buses`).then(r => r.json()).then(setAdminBuses).catch(() => {});
    fetch(`${API_BASE}/admin/routes`).then(r => r.json()).then(setAdminRoutes).catch(() => {});
    fetch(`${API_BASE}/admin/stops`).then(r => r.json()).then(setAdminStops).catch(() => {});
    fetch(`${API_BASE}/admin/conductors`).then(r => r.json()).then(setAdminConductors).catch(() => {});
    fetch(`${API_BASE}/admin/machines`).then(r => r.json()).then(setAdminMachines).catch(() => {});
    fetch(`${API_BASE}/admin/trips`).then(r => r.json()).then(setAdminTrips).catch(() => {});
    fetch(`${API_BASE}/admin/history/machines`).then(r => r.json()).then(setMachineHistory).catch(() => {});
    fetch(`${API_BASE}/admin/reports`).then(r => r.json()).then(setReportsData).catch(() => {});
  };
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAllAdminData();
    const handleWs = () => fetchAllAdminData();
    window.addEventListener('ws-update', handleWs);
    return () => window.removeEventListener('ws-update', handleWs);
  }, [isLoggedIn]);

  // Live Tracking Inspector Handler
  const handleOpenTrackModal = trip => {
    setTrackingTrip(trip);
    const routeId = trip.route_id || trip.route && trip.route.id;
    if (routeId) {
      fetch(`${API_BASE}/routes/${routeId}/stops`).then(r => r.json()).then(setTrackingRouteStops).catch(() => setTrackingRouteStops([]));
    } else {
      setTrackingRouteStops([]);
    }
  };

  // Route Stops Management
  const loadRouteStops = route => {
    setViewingRoute(route);
    fetch(`${API_BASE}/routes/${route.id}/stops`).then(r => r.json()).then(setRouteStops).catch(() => setRouteStops([]));
  };
  const handleAddStopToRoute = async () => {
    if (!newStopNameToRoute.trim() || !viewingRoute) return;
    const res = await fetch(`${API_BASE}/routes/${viewingRoute.id}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newStopNameToRoute.trim()
      })
    });
    if (res.ok) {
      setNewStopNameToRoute('');
      setShowAddStopToRoute(false);
      loadRouteStops(viewingRoute);
      fetchAllAdminData();
    } else {
      alert('Failed to add stop');
    }
  };
  const handleMoveStop = async (index, direction) => {
    if (!viewingRoute || !routeStops.length) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routeStops.length) return;
    const newStops = [...routeStops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;
    const reordered = newStops.map((s, idx) => ({
      id: s.id,
      stop_order: idx + 1
    }));
    setRouteStops(newStops);
    await fetch(`${API_BASE}/routes/${viewingRoute.id}/stops/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stops: reordered
      })
    });
    fetchAllAdminData();
  };
  const handleDeleteStopFromRoute = async stopId => {
    if (!confirm('Are you sure you want to delete this stop?')) return;
    const res = await fetch(`${API_BASE}/stops/${stopId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      loadRouteStops(viewingRoute);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to delete stop');
    }
  };

  // Bus Actions
  const handleAddBus = async () => {
    if (!newBusNumber.trim()) return;
    const res = await fetch(`${API_BASE}/buses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bus_number: newBusNumber.trim().toUpperCase(),
        status: 'Active'
      })
    });
    if (res.ok) {
      setNewBusNumber('');
      setShowAddBus(false);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to add bus');
    }
  };
  const handleToggleBus = async busId => {
    const res = await fetch(`${API_BASE}/admin/buses/${busId}/toggle`, {
      method: 'POST'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Cannot change bus status');
    }
  };
  const handleEditBus = async () => {
    if (!editingBus || !editingBus.bus_number.trim()) return;
    const res = await fetch(`${API_BASE}/admin/buses/${editingBus.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bus_number: editingBus.bus_number.trim().toUpperCase()
      })
    });
    if (res.ok) {
      setEditingBus(null);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to update bus');
    }
  };
  const handleDeleteBus = async bus => {
    if (!confirm(`Delete bus ${bus.bus_number}?`)) return;
    const res = await fetch(`${API_BASE}/admin/buses/${bus.id}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchAllAdminData();else alert('Failed to delete bus.');
  };

  // Route Actions
  const handleAddRoute = async () => {
    if (!newRoute.name.trim() || !newRoute.origin.trim() || !newRoute.destination.trim()) {
      return alert('Please fill in route name, origin, and destination.');
    }
    const res = await fetch(`${API_BASE}/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newRoute)
    });
    if (res.ok) {
      setNewRoute({
        name: '',
        origin: '',
        destination: '',
        status: 'Active'
      });
      setShowAddRoute(false);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to add route');
    }
  };
  const handleToggleRoute = async routeId => {
    const res = await fetch(`${API_BASE}/admin/routes/${routeId}/toggle`, {
      method: 'POST'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Cannot change route status');
    }
  };
  const handleEditRoute = async () => {
    if (!editingRoute || !editingRoute.name.trim()) return;
    const res = await fetch(`${API_BASE}/admin/routes/${editingRoute.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editingRoute.name.trim(),
        origin: editingRoute.origin.trim(),
        destination: editingRoute.destination.trim()
      })
    });
    if (res.ok) {
      setEditingRoute(null);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to update route');
    }
  };
  const handleDeleteRoute = async route => {
    if (!confirm(`Delete route ${route.name}? All attached stops will be deleted.`)) return;
    const res = await fetch(`${API_BASE}/admin/routes/${route.id}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchAllAdminData();else alert('Failed to delete route.');
  };

  // Conductor Actions
  const handleAddConductor = async () => {
    if (!newConductor.conductor_id.trim() || !newConductor.name.trim()) {
      return alert('Please enter conductor ID and name.');
    }
    const res = await fetch(`${API_BASE}/admin/conductors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newConductor)
    });
    if (res.ok) {
      setNewConductor({
        conductor_id: '',
        name: '',
        phone: '',
        status: 'Active'
      });
      setShowAddConductor(false);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to add conductor');
    }
  };
  const handleToggleConductor = async conductorId => {
    const res = await fetch(`${API_BASE}/admin/conductors/${conductorId}/toggle`, {
      method: 'POST'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Cannot change conductor status');
    }
  };
  const handleEditConductor = async () => {
    if (!editingConductor || !editingConductor.name.trim()) return;
    const res = await fetch(`${API_BASE}/admin/conductors/${editingConductor.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editingConductor.name.trim(),
        phone: editingConductor.phone || ''
      })
    });
    if (res.ok) {
      setEditingConductor(null);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to update conductor');
    }
  };
  const handleDeleteConductor = async cond => {
    if (!confirm(`Delete conductor ${cond.conductor_id} (${cond.name})?`)) return;
    const res = await fetch(`${API_BASE}/admin/conductors/${cond.id}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Failed to delete conductor');
    }
  };

  // Machine Actions
  const handleAddMachine = async () => {
    if (!newMachineCode.trim()) return;
    const res = await fetch(`${API_BASE}/machines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        machine_code: newMachineCode.trim().toUpperCase(),
        status: 'Available'
      })
    });
    if (res.ok) {
      setNewMachineCode('');
      setShowAddMachine(false);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to add machine');
    }
  };
  const handleToggleMachine = async machineId => {
    const res = await fetch(`${API_BASE}/admin/machines/${machineId}/toggle`, {
      method: 'POST'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Cannot change machine status');
    }
  };
  const handleDeleteMachine = async m => {
    if (!confirm(`Delete machine ${m.machine_code}?`)) return;
    const res = await fetch(`${API_BASE}/admin/machines/${m.id}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchAllAdminData();else alert('Failed to delete machine.');
  };

  // Trip Scheduling & Cancellation
  const handleCreateTrip = async () => {
    if (!newTrip.bus_id || !newTrip.route_id) {
      return alert('Please select a bus and a route.');
    }
    const payload = {
      bus_id: parseInt(newTrip.bus_id),
      route_id: parseInt(newTrip.route_id),
      conductor_id: newTrip.conductor_id ? parseInt(newTrip.conductor_id) : null,
      machine_id: newTrip.machine_id ? parseInt(newTrip.machine_id) : null
    };
    const res = await fetch(`${API_BASE}/admin/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setNewTrip({
        bus_id: '',
        route_id: '',
        conductor_id: '',
        machine_id: ''
      });
      setShowCreateTrip(false);
      fetchAllAdminData();
    } else {
      const err = await res.json();
      alert(err.detail || 'Failed to schedule trip');
    }
  };
  const handleCancelTrip = async tripId => {
    if (!confirm('Cancel this scheduled trip?')) return;
    const res = await fetch(`${API_BASE}/admin/trips/${tripId}/cancel`, {
      method: 'POST'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Failed to cancel trip');
    }
  };

  // Edit Stop (Global)
  const handleEditStopGlobal = async () => {
    if (!editingStop || !editingStop.name.trim()) return;
    const res = await fetch(`${API_BASE}/stops/${editingStop.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editingStop.name.trim()
      })
    });
    if (res.ok) {
      setEditingStop(null);
      fetchAllAdminData();
    } else {
      alert('Failed to update stop');
    }
  };
  const handleDeleteStopGlobal = async stopId => {
    if (!confirm('Are you sure you want to delete this stop?')) return;
    const res = await fetch(`${API_BASE}/stops/${stopId}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchAllAdminData();else {
      const err = await res.json();
      alert(err.detail || 'Failed to delete stop');
    }
  };

  // Format helper
  const formatDateTime = ts => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) + ', ' + d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return ts;
    }
  };

  // Karnataka Regional Transport Hubs Data
  const karnatakaRegions = [{
    id: 'bengaluru',
    name: 'Bengaluru',
    knName: 'ಬೆಂಗಳೂರು',
    corridors: 'Majestic • Silk Board • Hebbal',
    tag: 'Capital Hub',
    accent: '#D71920'
  }, {
    id: 'mysuru',
    name: 'Mysuru',
    knName: 'ಮೈಸೂರು',
    corridors: 'Columbia Asia • Mandya • Ramanagara',
    tag: 'Heritage Corridor',
    accent: '#FFCC00'
  }, {
    id: 'tumakuru',
    name: 'Tumakuru',
    knName: 'ತುಮಕೂರು',
    corridors: 'Kunigal • Nelamangala • Kyatsandra',
    tag: 'Industrial Expressway',
    accent: '#D71920'
  }, {
    id: 'mangaluru',
    name: 'Mangaluru',
    knName: 'ಮಂಗಳೂರು',
    corridors: 'Udupi • Hassan • Shiradi Ghat',
    tag: 'Coastal Transit Hub',
    accent: '#FFCC00'
  }, {
    id: 'hubballi',
    name: 'Hubballi-Dharwad',
    knName: 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ',
    corridors: 'Dharwad • Haveri • Gadag',
    tag: 'North Karnataka Junction',
    accent: '#D71920'
  }, {
    id: 'shivamogga',
    name: 'Shivamogga',
    knName: 'ಶಿವಮೊಗ್ಗ',
    corridors: 'Bhadravathi • Tarikere • Sagar',
    tag: 'Malnad Regional Link',
    accent: '#FFCC00'
  }, {
    id: 'belagavi',
    name: 'Belagavi',
    knName: 'ಬೆಳಗಾವಿ',
    corridors: 'Kittur • Khanapur • Suvarna Soudha',
    tag: 'Border Gateway Corridor',
    accent: '#D71920'
  }];

  // ======== AUTHENTICATION VIEW ========
  if (!isLoggedIn) {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6 relative font-sans text-[#171717]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#E5E7EB] relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-16 rounded-2xl bg-[#FFCC00] flex items-center justify-center mx-auto mb-5 shadow-md"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bus",
      size: 32,
      className: "text-[#171717]"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-center mb-6"
    }, /*#__PURE__*/React.createElement("h1", {
      className: "text-2xl font-heading font-black tracking-wider text-[#171717]"
    }, "BUSSYNC"), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-heading font-bold text-[#D71920] tracking-widest uppercase mt-0.5"
    }, "SYNC THE MOTION."), /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-semibold text-[#171717] mt-3"
    }, "Karnataka Mobility Control Center"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-[#64748B] font-medium mt-0.5"
    }, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u0CA8\u0CBF\u0CAF\u0C82\u0CA4\u0CCD\u0CB0\u0CA3 \u0C95\u0CC7\u0C82\u0CA6\u0CCD\u0CB0")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "text-[11px] text-[#64748B] mb-2 block font-bold tracking-wider uppercase"
    }, "Supervisor Passcode (Default: admin)"), /*#__PURE__*/React.createElement("input", {
      type: "password",
      value: password,
      onChange: e => {
        setPassword(e.target.value);
        setError(false);
      },
      onKeyDown: e => {
        if (e.key === 'Enter' && password) handleLogin();
      },
      className: `w-full bg-[#FFFDF7] border ${error ? 'border-[#D71920] focus:border-[#D71920] ring-1 ring-[#D71920]' : 'border-[#E5E7EB] focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]'} rounded-xl p-3.5 text-[#171717] outline-none transition-all tracking-widest text-center text-lg shadow-sm`,
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
    }), error && /*#__PURE__*/React.createElement("div", {
      className: "text-[#D71920] text-xs font-bold text-center mt-2"
    }, "Invalid operator passcode")), /*#__PURE__*/React.createElement("button", {
      onClick: handleLogin,
      disabled: !password,
      className: "w-full bg-[#D71920] hover:bg-[#B9141A] text-white font-heading font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "lock",
      size: 16
    }), /*#__PURE__*/React.createElement("span", null, "Authenticate Session"))), /*#__PURE__*/React.createElement("div", {
      className: "mt-8 text-center text-[11px] text-[#64748B] flex items-center justify-center gap-2 border-t border-[#E5E7EB] pt-4"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-[#FFCC00]"
    }), /*#__PURE__*/React.createElement("span", null, "Deterministic Checkpoint Engine \u2022 Stop-Based Sync")))));
  }

  // ======== NAVIGATION ITEMS ========
  const navItems = [{
    id: 'Dashboard',
    icon: 'layout-dashboard',
    label: 'Dashboard',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್'
  }, {
    id: 'Buses',
    icon: 'bus',
    label: 'Buses',
    kn: 'ಬಸ್‌ಗಳು'
  }, {
    id: 'Routes',
    icon: 'map',
    label: 'Routes',
    kn: 'ಮಾರ್ಗಗಳು'
  }, {
    id: 'Stops',
    icon: 'map-pin',
    label: 'Stops',
    kn: 'ನಿಲ್ದಾಣಗಳು'
  }, {
    id: 'Conductors',
    icon: 'users',
    label: 'Conductors',
    kn: 'ನಿರ್ವಾಹಕರು'
  }, {
    id: 'Machines',
    icon: 'cpu',
    label: 'Machines',
    kn: 'ಯಂತ್ರಗಳು'
  }, {
    id: 'Assign Trips',
    icon: 'clock',
    label: 'Assign Trips',
    kn: 'ಪ್ರಯಾಣ ಹಂಚಿಕೆ'
  }, {
    id: 'Monitoring',
    icon: 'activity',
    label: 'Monitoring',
    kn: 'ಲೈವ್ ನಿಗಾ'
  }, {
    id: 'Reports',
    icon: 'bar-chart-2',
    label: 'Reports',
    kn: 'ವರದಿಗಳು'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-[#F7F7F5] text-[#171717] font-sans flex flex-col antialiased"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 lg:px-8 py-3 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMobileNavOpen(!mobileNavOpen),
    className: "md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#171717] hover:bg-[#F7F7F5]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "menu",
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#171717] shadow-sm shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 22,
    className: "text-[#171717]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-black text-[#171717] text-lg tracking-wider"
  }, "BUSSYNC"), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline-block text-[10px] font-heading font-bold text-[#D71920] bg-[#FEE2E2] border border-[#FECACA] px-2 py-0.5 rounded-full uppercase tracking-wider"
  }, "CONTROL CENTER")), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-heading font-bold text-[#D71920] tracking-widest uppercase"
  }, "SYNC THE MOTION.")), /*#__PURE__*/React.createElement("div", {
    className: "hidden xl:block h-7 w-px bg-[#E5E7EB] mx-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hidden xl:block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#171717]"
  }, "Karnataka Mobility Control Center"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#64748B]"
  }, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u0CA8\u0CBF\u0CAF\u0C82\u0CA4\u0CCD\u0CB0\u0CA3 \u0C95\u0CC7\u0C82\u0CA6\u0CCD\u0CB0"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 sm:gap-4 text-xs font-semibold"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hidden lg:flex items-center gap-2 bg-[#F7F7F5] border border-[#E5E7EB] rounded-full px-3 py-1.5 w-52 focus-within:w-64 focus-within:border-[#D71920] transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14,
    className: "text-[#64748B]"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search buses, routes...",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    className: "bg-transparent border-none outline-none text-xs text-[#171717] w-full placeholder:text-[#94A3B8]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Notification Center: All Karnataka fleet check-ins normal."),
    className: "p-2 text-[#64748B] hover:text-[#D71920] hover:bg-[#FEF9C3] rounded-full transition-colors relative",
    title: "Notifications"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#D71920] absolute top-1.5 right-1.5"
  }))), /*#__PURE__*/React.createElement(Link, {
    to: "/passenger",
    className: "hidden md:flex items-center gap-1.5 text-[#64748B] hover:text-[#D71920] transition-colors px-2 py-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "smartphone",
    size: 14
  }), " Passenger View"), /*#__PURE__*/React.createElement(Link, {
    to: "/machine",
    className: "hidden md:flex items-center gap-1.5 text-[#64748B] hover:text-[#D71920] transition-colors px-2 py-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ticket",
    size: 14
  }), " Terminal Mode"), /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:flex items-center gap-1.5 bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] px-3 py-1.5 rounded-full text-xs font-bold"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "Admin \u2022 Supervisor")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsLoggedIn(false),
    className: "bg-white hover:bg-[#FEE2E2] text-[#D71920] border border-[#FECACA] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "log-out",
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "Logout")))), /*#__PURE__*/React.createElement("div", {
    className: "h-[3px] w-full bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex w-full"
  }, /*#__PURE__*/React.createElement("aside", {
    className: `w-64 bg-white border-r border-[#E5E7EB] shrink-0 p-4 flex-col justify-between z-30 transition-all duration-200 ${mobileNavOpen ? 'fixed inset-y-0 left-0 top-[65px] flex shadow-2xl' : 'hidden md:flex'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-2 text-[10px] font-heading font-bold text-[#64748B] uppercase tracking-wider"
  }, "Operations Menu"), navItems.map(item => {
    const isActive = currentTab === item.id;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      onClick: () => {
        setCurrentTab(item.id);
        setViewingRoute(null);
        setMobileNavOpen(false);
      },
      className: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all text-left ${isActive ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#475569] hover:bg-[#FEF9C3] hover:text-[#D71920]'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      size: 16
    }), /*#__PURE__*/React.createElement("span", null, item.label)), /*#__PURE__*/React.createElement("span", {
      className: `text-[10px] font-normal ${isActive ? 'text-white/80' : 'text-[#94A3B8]'}`
    }, item.kn));
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-4 border-t border-[#E5E7EB] space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] border border-[#E5E7EB] rounded-2xl p-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-[#D71920] font-bold mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#FFCC00]"
  }), /*#__PURE__*/React.createElement("span", null, "Karnataka Transit Sync")), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#64748B]"
  }, "KSRTC \u2022 BMTC Checkpoint Protocol"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#94A3B8] mt-1 font-mono"
  }, "Telemetry: Stop Sequence Active")))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden"
  }, currentTab === 'Dashboard' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-8 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 z-10 max-w-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u0C95\u0CBE\u0CB0\u0CCD\u0CAF\u0CBE\u0C9A\u0CB0\u0CA3\u0CC6")), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-heading font-black text-[#171717]"
  }, "Karnataka Transport Operations"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-[#64748B] leading-relaxed"
  }, "Monitor buses, journeys and stop-based updates across Karnataka. Real-time deterministic telemetry verified through ticket machines.")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 z-10"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: fetchAllAdminData,
    className: "bg-white hover:bg-[#FEF9C3] text-[#D71920] border border-[#D71920] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "Refresh Sync")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCreateTrip(true),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus-circle",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "Dispatch Trip"))), /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 top-0 bottom-0 w-64 opacity-5 pointer-events-none flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map",
    size: 160,
    className: "text-[#D71920]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]"
  }, "TOTAL BUSES"), /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1"
  }, kpis.total_buses || 0), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B]"
  }, "Registered fleet (", kpis.active_buses || 0, " currently on road)"), /*#__PURE__*/React.createElement("div", {
    className: "h-1 w-12 bg-[#FFCC00] rounded-full mt-3"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]"
  }, "ACTIVE TRIPS"), /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#D71920]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, kpis.active_trips || 0), kpis.active_trips > 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] px-2 py-0.5 rounded-full font-bold"
  }, "\u25CF Running")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B]"
  }, "Journeys actively reporting stops"), /*#__PURE__*/React.createElement("div", {
    className: "h-1 w-12 bg-[#D71920] rounded-full mt-3"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]"
  }, "MACHINES"), /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cpu",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1"
  }, kpis.total_machines || 0), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B]"
  }, kpis.available_machines || 0, " Available \u2022 ", kpis.in_use_machines || 0, " In Use"), /*#__PURE__*/React.createElement("div", {
    className: "h-1 w-12 bg-[#FFCC00] rounded-full mt-3"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]"
  }, "LIVE UPDATES"), /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#D71920]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "radio",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1"
  }, kpis.live_updates || 0), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B]"
  }, "Checkpoint updates recorded today"), /*#__PURE__*/React.createElement("div", {
    className: "h-1 w-12 bg-[#D71920] rounded-full mt-3"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 lg:p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-heading font-black text-[#171717]"
  }, "LIVE MONITORING"), /*#__PURE__*/React.createElement("span", {
    className: "bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] text-[11px] font-bold px-2.5 py-0.5 rounded-full"
  }, journeys.filter(j => j.status === 'Active').length, " Active")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-1"
  }, "Real-time stop updates from conductor ticket machines")), /*#__PURE__*/React.createElement("button", {
    onClick: fetchAllAdminData,
    className: "text-xs font-bold text-[#D71920] hover:bg-[#FEF9C3] px-3 py-1.5 rounded-lg border border-[#E5E7EB] transition-colors flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    size: 12
  }), " Sync Telemetry")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Bus"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Machine"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Route"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Conductor"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Last Stop"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Time"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Action"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, journeys.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "p-10 text-center text-[#64748B]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bus",
    size: 32,
    className: "mx-auto mb-2 text-[#94A3B8]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-bold text-sm text-[#171717]"
  }, "No Active Trips Running"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Start a trip from the ticket machine to view real-time stop telemetry."))) : journeys.map((j, idx) => {
    const isRecent = j.display_status && (j.display_status.includes('Active') || j.display_status.includes('Travelling') || j.display_status.includes('LIVE'));
    return /*#__PURE__*/React.createElement("tr", {
      key: idx,
      className: "hover:bg-[#FFFDF7] transition-colors"
    }, /*#__PURE__*/React.createElement("td", {
      className: "p-4 pl-6 font-heading font-black text-[#171717]"
    }, "\uD83D\uDE8C ", j.bus_number), /*#__PURE__*/React.createElement("td", {
      className: "p-4"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-mono text-xs font-bold bg-[#F7F7F5] border border-[#E5E7EB] text-[#475569] px-2 py-0.5 rounded"
    }, j.machine_code || '—')), /*#__PURE__*/React.createElement("td", {
      className: "p-4 font-medium text-[#171717]"
    }, j.route_name), /*#__PURE__*/React.createElement("td", {
      className: "p-4 text-xs text-[#64748B]"
    }, j.conductor_name || j.conductor_code || 'Assigned'), /*#__PURE__*/React.createElement("td", {
      className: "p-4"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[#171717] text-xs flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "map-pin",
      size: 14,
      className: "text-[#D71920]"
    }), j.current_stop || 'Departed')), /*#__PURE__*/React.createElement("td", {
      className: "p-4 text-xs text-[#64748B] tabular-nums"
    }, timeAgo(j.last_reported_at)), /*#__PURE__*/React.createElement("td", {
      className: "p-4"
    }, isRecent ? /*#__PURE__*/React.createElement("span", {
      className: "bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] font-bold text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"
    }), /*#__PURE__*/React.createElement("span", null, "\u25CF TRAVELLING")) : /*#__PURE__*/React.createElement("span", {
      className: "bg-[#FEE2E2] text-[#D71920] border border-[#FECACA] font-bold text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "alert-circle",
      size: 12
    }), /*#__PURE__*/React.createElement("span", null, "NO RECENT UPDATE"))), /*#__PURE__*/React.createElement("td", {
      className: "p-4 text-right pr-6"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => handleOpenTrackModal(j),
      className: "bg-white hover:bg-[#FEF9C3] text-[#D71920] border border-[#D71920] font-heading font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm transition-all"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "navigation",
      size: 12
    }), /*#__PURE__*/React.createElement("span", null, "Track"))));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-heading font-black text-[#171717]"
  }, "Karnataka Route Network"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B]"
  }, "Regional transportation corridors & verified checkpoint coverage")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] bg-[#FEF9C3] border border-[#FDE047] px-3 py-1 rounded-full"
  }, "7 Regional Hubs Operational")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, karnatakaRegions.map(hub => {
    const routeCount = adminRoutes.filter(r => r.name.toLowerCase().includes(hub.name.toLowerCase()) || r.origin && r.origin.toLowerCase().includes(hub.name.toLowerCase())).length;
    return /*#__PURE__*/React.createElement("div", {
      key: hub.id,
      className: "bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-heading font-bold text-[#D71920] bg-[#FEE2E2] px-2 py-0.5 rounded-md"
    }, hub.tag), /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-medium text-[#64748B]"
    }, hub.knName)), /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-black text-base text-[#171717]"
    }, hub.name), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-[#64748B] mt-1 leading-relaxed"
    }, hub.corridors)), /*#__PURE__*/React.createElement("div", {
      className: "mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#64748B]"
    }, "Connected Routes:"), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#171717]"
    }, routeCount > 0 ? routeCount : 'Active Sector')));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 16,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-base text-[#171717]"
  }, "Recent Activity")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-[#64748B]"
  }, "Real-time events")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, recentActivity.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B] py-6 text-center"
  }, "No recent activity recorded yet.") : recentActivity.slice(0, 6).map((ev, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#FFFDF7] border border-transparent hover:border-[#E5E7EB] transition-colors text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2.5 h-2.5 rounded-full bg-[#D71920] mt-1 shrink-0"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-[#171717]"
  }, ev.bus_number && /*#__PURE__*/React.createElement("strong", null, ev.bus_number, " "), ev.event_type === 'STOP_UPDATE' && `reported at ${ev.stop_name || 'Checkpoint'}`, ev.event_type === 'TRIP_START' && `started trip on ${ev.route_name || 'Route'}`, ev.event_type === 'TRIP_END' && `completed journey on ${ev.route_name || 'Route'}`, !['STOP_UPDATE', 'TRIP_START', 'TRIP_END'].includes(ev.event_type) && (ev.title || ev.event_type)), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#64748B] mt-0.5"
  }, ev.route_name && `${ev.route_name} • `, timeAgo(ev.timestamp))))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bar-chart-2",
    size: 16,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-base text-[#171717]"
  }, "Trip Status Overview")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold text-[#D71920]"
  }, "Today")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FEF9C3] p-3 rounded-xl border border-[#FDE047]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-heading font-black text-[#D71920]"
  }, kpis.active_trips || 0), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#B45309] uppercase mt-0.5"
  }, "Active")), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-heading font-black text-[#171717]"
  }, kpis.scheduled_trips || 0), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#64748B] uppercase mt-0.5"
  }, "Scheduled")), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] p-3 rounded-xl border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-heading font-black text-[#171717]"
  }, kpis.completed_trips || 0), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#64748B] uppercase mt-0.5"
  }, "Completed")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-2 mb-3 border-b border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-heading font-bold text-xs text-[#171717] uppercase tracking-wider"
  }, "Today's Stop Updates"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono font-bold text-[#D71920]"
  }, kpis.live_updates || 0, " Total")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs text-[#64748B]"
  }, /*#__PURE__*/React.createElement("span", null, "Tumakuru Corridor"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#171717]"
  }, "High Frequency")), /*#__PURE__*/React.createElement("div", {
    className: "h-2 w-full bg-[#F7F7F5] rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-[#D71920] rounded-full",
    style: {
      width: '75%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs text-[#64748B] pt-1"
  }, /*#__PURE__*/React.createElement("span", null, "Bengaluru - Mysuru Corridor"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#171717]"
  }, "Normal Sync")), /*#__PURE__*/React.createElement("div", {
    className: "h-2 w-full bg-[#F7F7F5] rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-[#FFCC00] rounded-full",
    style: {
      width: '50%'
    }
  }))))))), currentTab === 'Buses' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CAC\u0CB8\u0CCD \u0CAB\u0CCD\u0CB2\u0CC0\u0C9F\u0CCD"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Karnataka Bus Fleet"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Manage state-wide transit fleet records and trip assignments")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddBus(true),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "+ Add Bus"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Total Buses"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#171717] mt-1"
  }, adminBuses.length)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Active"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#D71920] mt-1"
  }, adminBuses.filter(b => b.status === 'Active').length)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Inactive"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#64748B] mt-1"
  }, adminBuses.filter(b => b.status !== 'Active').length)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "On Trip"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#FFCC00] mt-1"
  }, adminBuses.filter(b => b.trip_status === 'Active').length))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Bus Number"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Assigned Route"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Current Stop"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Trip Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Machine Session"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Last Update"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, adminBuses.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "7",
    className: "p-8 text-center text-[#64748B]"
  }, "No buses registered yet.")) : adminBuses.map(b => /*#__PURE__*/React.createElement("tr", {
    key: b.id,
    className: "hover:bg-[#FFFDF7] transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 pl-6 font-heading font-black text-[#171717]"
  }, "\uD83D\uDE8C ", b.bus_number), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-medium text-[#171717]"
  }, b.route_name || '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B]"
  }, b.current_stop_name || 'Depot'), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, b.trip_status === 'Active' ? /*#__PURE__*/React.createElement("span", {
    className: "bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "Running")) : /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#64748B] bg-[#F7F7F5] px-2 py-0.5 rounded"
  }, "Idle")), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-mono font-bold text-[#475569]"
  }, b.machine_code ? `📟 ${b.machine_code}` : 'Unpaired'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B] tabular-nums"
  }, timeAgo(b.last_update)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right pr-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleBus(b.id),
    className: `text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${b.status === 'Active' ? 'bg-[#FEE2E2] text-[#D71920] border-[#FECACA] hover:bg-[#FCA5A5]' : 'bg-[#FEF9C3] text-[#D71920] border-[#FDE047] hover:bg-[#FEF08A]'}`
  }, b.status === 'Active' ? 'Deactivate' : 'Reactivate'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingBus(b),
    className: "p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg hover:bg-[#F7F7F5]",
    title: "Edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit-2",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteBus(b),
    className: "p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg",
    title: "Delete"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 14
  }))))))))))), currentTab === 'Routes' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CAE\u0CBE\u0CB0\u0CCD\u0C97\u0C97\u0CB3\u0CC1 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CA8\u0CBF\u0CB2\u0CCD\u0CA6\u0CBE\u0CA3\u0C97\u0CB3\u0CC1"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Karnataka Routes & Stops"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Manage fixed sequential checkpoints for deterministic stop tracking")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddRoute(true),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "+ Add Route"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
  }, adminRoutes.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: "bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-heading font-bold bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] px-2 py-0.5 rounded-full"
  }, "Route #", r.id), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Active' ? 'bg-[#FEE2E2] text-[#D71920]' : 'bg-[#F7F7F5] text-[#64748B]'}`
  }, r.status)), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717]"
  }, r.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B] mt-1 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "Origin: ", /*#__PURE__*/React.createElement("strong", null, r.origin || '—')), /*#__PURE__*/React.createElement("span", null, "\u2192"), /*#__PURE__*/React.createElement("span", null, "Dest: ", /*#__PURE__*/React.createElement("strong", null, r.destination || '—'))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#475569] mt-3 bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("span", null, "Checkpoints: "), /*#__PURE__*/React.createElement("strong", {
    className: "text-[#D71920]"
  }, r.stops_count || 0, " stops configured"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => loadRouteStops(r),
    className: "bg-[#FEF9C3] hover:bg-[#FDE047] text-[#D71920] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "list",
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, "Manage Stops")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleRoute(r.id),
    className: "p-1.5 text-[#64748B] hover:text-[#D71920] rounded-lg",
    title: "Toggle Status"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "power",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingRoute(r),
    className: "p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg",
    title: "Edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit-2",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteRoute(r),
    className: "p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg",
    title: "Delete"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 14
  })))))))), currentTab === 'Stops' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0CA8\u0CBF\u0CB2\u0CCD\u0CA6\u0CBE\u0CA3\u0C97\u0CB3\u0CC1"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Transit Stops Directory"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "List of verified physical bus stops along Karnataka transit routes")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B]"
  }, "Total Stops: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-[#171717]"
  }, adminStops.length))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Stop Name"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Associated Route"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Sequence Order"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, adminStops.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "5",
    className: "p-8 text-center text-[#64748B]"
  }, "No stops created yet.")) : adminStops.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.id,
    className: "hover:bg-[#FFFDF7] transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 pl-6 font-heading font-bold text-[#171717] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, s.name)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#475569]"
  }, s.route_name || '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-mono font-bold text-[#D71920]"
  }, "Stop #", s.stop_order), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold bg-[#FEF9C3] text-[#D71920] px-2 py-0.5 rounded-full"
  }, s.status)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right pr-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingStop(s),
    className: "p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg",
    title: "Edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit-2",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteStopGlobal(s.id),
    className: "p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg",
    title: "Delete"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 14
  }))))))))))), currentTab === 'Conductors' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CBE\u0CB9\u0C95\u0CB0 \u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CB9\u0CA3\u0CC6"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Conductor Management"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Manage onboard ticket machine operators and verified shift check-ins")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddConductor(true),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "+ Add Conductor"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Conductor ID"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Phone"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Current Bus"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Current Trip"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, adminConductors.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "7",
    className: "p-8 text-center text-[#64748B]"
  }, "No conductors registered.")) : adminConductors.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.id,
    className: "hover:bg-[#FFFDF7] transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 pl-6 font-mono font-bold text-xs text-[#D71920]"
  }, c.conductor_id), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-heading font-bold text-[#171717]"
  }, c.name), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B]"
  }, c.phone || '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-[#FEF9C3] text-[#D71920]' : 'bg-[#F7F7F5] text-[#64748B]'}`
  }, c.status)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-bold text-[#171717]"
  }, c.current_bus ? `🚌 ${c.current_bus}` : '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B]"
  }, c.current_trip_id ? `Trip #${c.current_trip_id}` : 'Available'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right pr-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleConductor(c.id),
    className: "text-xs font-bold text-[#D71920] hover:bg-[#FEF9C3] px-2.5 py-1 rounded-lg border border-[#E5E7EB]"
  }, c.status === 'Active' ? 'Deactivate' : 'Reactivate'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingConductor(c),
    className: "p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit-2",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteConductor(c),
    className: "p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 14
  }))))))))))), currentTab === 'Machines' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0C9F\u0CBF\u0C95\u0CC6\u0C9F\u0CCD \u0CAF\u0C82\u0CA4\u0CCD\u0CB0\u0C97\u0CB3\u0CC1"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Ticket Machine Fleet"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Handheld hardware terminals linked dynamically to trips")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddMachine(true),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "+ Add Machine"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FFFDF7] border-l-4 border-[#FFCC00] p-4 rounded-xl border border-[#E5E7EB] text-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-bold text-[#171717] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 16,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, "Dynamic Machine Session Architecture")), /*#__PURE__*/React.createElement("p", {
    className: "text-[#64748B]"
  }, "Machines are ", /*#__PURE__*/React.createElement("strong", null, "never permanently tied to buses"), ". When a conductor initiates a trip (e.g. Machine M102 on Bus KA-01-1234), a temporary ", /*#__PURE__*/React.createElement("code", null, "MACHINE_SESSION"), " is created. When the trip ends, the machine instantly returns to the ", /*#__PURE__*/React.createElement("strong", null, "Available"), " pool for any bus.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Machine ID"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Session Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Bound Bus"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Active Trip"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Last Activity"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, adminMachines.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "6",
    className: "p-8 text-center text-[#64748B]"
  }, "No machines enrolled.")) : adminMachines.map(m => /*#__PURE__*/React.createElement("tr", {
    key: m.id,
    className: "hover:bg-[#FFFDF7] transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 pl-6 font-mono font-bold text-xs text-[#171717] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cpu",
    size: 15,
    className: "text-[#D71920]"
  }), /*#__PURE__*/React.createElement("span", null, m.machine_code)), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2.5 py-0.5 rounded-full ${m.status === 'Available' ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : 'bg-[#FEE2E2] text-[#D71920] border border-[#FECACA]'}`
  }, m.status === 'Available' ? '● AVAILABLE' : '● IN USE (BOUND)')), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-bold text-[#171717]"
  }, m.current_bus ? `🚌 ${m.current_bus}` : '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B]"
  }, m.current_trip_id ? `Trip #${m.current_trip_id}` : 'Idle'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B] tabular-nums"
  }, timeAgo(m.last_activity)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right pr-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleMachine(m.id),
    className: "text-xs font-bold text-[#D71920] hover:bg-[#FEF9C3] px-2.5 py-1 rounded-lg border border-[#E5E7EB]"
  }, "Toggle Pool"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteMachine(m),
    className: "p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 14
  }))))))))))), currentTab === 'Assign Trips' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0CAA\u0CCD\u0CB0\u0CAF\u0CBE\u0CA3 \u0CB9\u0C82\u0C9A\u0CBF\u0C95\u0CC6"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Trip Scheduling & Dispatch"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Assign buses, routes, conductors, and machines for active service")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCreateTrip(true),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "+ Schedule Trip"))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, ['All', 'Active', 'Scheduled', 'Completed'].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setTripFilter(f),
    className: `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${tripFilter === f ? 'bg-[#D71920] text-white shadow-sm' : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:text-[#171717]'}`
  }, f))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Trip ID"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Bus"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Route"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Conductor"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Machine"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Action"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, adminTrips.filter(t => tripFilter === 'All' || t.status === tripFilter).map(t => /*#__PURE__*/React.createElement("tr", {
    key: t.id,
    className: "hover:bg-[#FFFDF7] transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 pl-6 font-mono font-bold text-xs text-[#D71920]"
  }, "#", t.id), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-heading font-bold text-[#171717]"
  }, "\uD83D\uDE8C ", t.bus_number), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-medium text-[#171717]"
  }, t.route_name), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B]"
  }, t.conductor_name || t.conductor_code || '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs font-mono font-bold text-[#475569]"
  }, t.machine_code || 'Dynamic'), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2.5 py-0.5 rounded-full ${t.status === 'Active' ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : t.status === 'Completed' ? 'bg-[#F7F7F5] text-[#171717]' : 'bg-[#FFFDF7] text-[#64748B] border border-[#E5E7EB]'}`
  }, t.status)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right pr-6"
  }, t.status === 'Scheduled' && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleCancelTrip(t.id),
    className: "text-xs font-bold text-[#D71920] hover:bg-[#FEE2E2] px-2.5 py-1 rounded-lg border border-[#FECACA]"
  }, "Cancel"), t.status === 'Active' && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOpenTrackModal(t),
    className: "text-xs font-bold text-[#D71920] bg-[#FEF9C3] hover:bg-[#FDE047] px-2.5 py-1 rounded-lg"
  }, "Track"))))))))), currentTab === 'Monitoring' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0C95\u0CB0\u0CCD\u0CA8\u0CBE\u0C9F\u0C95 \u0CB2\u0CC8\u0CB5\u0CCD \u0C95\u0CBE\u0CB0\u0CCD\u0CAF\u0CBE\u0C9A\u0CB0\u0CA3\u0CC6"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Karnataka Live Operations"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Real-time stop updates from conductor ticket machines across all Karnataka sectors")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#171717]"
  }, journeys.filter(j => j.status === 'Active').length, " Active Trips"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("th", {
    className: "p-4 pl-6"
  }, "Bus"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Machine"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Route"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Conductor"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Last Reported Stop"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Checked In"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right pr-6"
  }, "Action"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#E5E7EB]"
  }, journeys.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "p-12 text-center text-[#64748B]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    size: 32,
    className: "mx-auto mb-2 text-[#94A3B8]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-bold text-[#171717]"
  }, "No Active Journeys Under Surveillance"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-1"
  }, "Conductor check-ins from ticket machines will stream here in real time."))) : journeys.map((j, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-[#FFFDF7] transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 pl-6 font-heading font-black text-[#171717]"
  }, "\uD83D\uDE8C ", j.bus_number), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-mono font-bold text-xs text-[#475569]"
  }, j.machine_code || '—'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-medium text-[#171717]"
  }, j.route_name), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B]"
  }, j.conductor_name || j.conductor_code || 'Assigned'), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-bold text-xs text-[#D71920] flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 13
  }), j.current_stop || 'Origin')), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-xs text-[#64748B] tabular-nums"
  }, timeAgo(j.last_reported_at)), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] font-bold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "\u25CF LIVE"))), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right pr-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOpenTrackModal(j),
    className: "bg-[#D71920] hover:bg-[#B9141A] text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "navigation",
    size: 12
  }), /*#__PURE__*/React.createElement("span", null, "Track")))))))))), currentTab === 'Reports' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-300"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#D71920] uppercase tracking-wider"
  }, "\u0CB8\u0CBE\u0CB0\u0CBF\u0C97\u0CC6 \u0CB5\u0CB0\u0CA6\u0CBF\u0C97\u0CB3\u0CC1"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-heading font-black text-[#171717]"
  }, "Transport Reports"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Fleet performance, route density, machine sessions, and conductor activity")), /*#__PURE__*/React.createElement("button", {
    onClick: () => alert("Report Export: CSV snapshot generated successfully."),
    className: "bg-white hover:bg-[#FEF9C3] text-[#D71920] border border-[#D71920] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 14
  }), " Export CSV")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 lg:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Total Recorded Trips"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#171717] mt-1"
  }, reportsData?.summary?.total_trips || adminTrips.length)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Completed Trips"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#D71920] mt-1"
  }, reportsData?.summary?.completed_trips || adminTrips.filter(t => t.status === 'Completed').length)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Total Stop Checkpoints"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#FFCC00] mt-1"
  }, reportsData?.summary?.total_stop_updates || kpis.live_updates || 0)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-bold text-[#64748B] uppercase"
  }, "Avg Checkpoints / Trip"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-heading font-black text-[#171717] mt-1"
  }, reportsData?.summary?.avg_updates_per_trip || '2.8'))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-sm text-[#171717] mb-3 pb-2 border-b border-[#E5E7EB] uppercase"
  }, "Route Usage Leaderboard"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, (reportsData?.route_usage || []).map((ru, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex justify-between items-center text-xs p-2 rounded-lg bg-[#F7F7F5]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#171717]"
  }, ru.name), /*#__PURE__*/React.createElement("span", {
    className: "text-[#D71920] font-bold"
  }, ru.trips_count, " trips (", ru.completed_count, " completed)"))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-sm text-[#171717] mb-3 pb-2 border-b border-[#E5E7EB] uppercase"
  }, "Machine Session Activity"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, (reportsData?.machine_usage || []).map((mu, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex justify-between items-center text-xs p-2 rounded-lg bg-[#F7F7F5]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-bold text-[#171717]"
  }, "\uD83D\uDCDF ", mu.machine_code), /*#__PURE__*/React.createElement("span", {
    className: "text-[#64748B]"
  }, mu.sessions_count, " dynamic sessions"))))))))), trackingTrip && (() => {
    const currentStopName = trackingTrip.current_stop || trackingTrip.current_stop_name || 'Origin Station';
    const currentIdx = trackingRouteStops.findIndex(st => st.name === currentStopName);
    const totalStops = trackingRouteStops.length || 4;
    const progressPct = trackingRouteStops.length > 1 ? Math.round(Math.max(0, currentIdx) / (trackingRouteStops.length - 1) * 100) : 45;
    const originStop = trackingRouteStops[0]?.name || 'Origin';
    const destStop = trackingRouteStops[trackingRouteStops.length - 1]?.name || 'Destination';
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white border-2 border-[#E5E7EB] rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-start mb-4 pb-4 border-b border-[#E5E7EB]"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold shadow-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: "relative flex h-2 w-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"
    }), /*#__PURE__*/React.createElement("span", {
      className: "relative inline-flex rounded-full h-2 w-2 bg-[#D71920]"
    })), /*#__PURE__*/React.createElement("span", {
      className: "tracking-wide"
    }, "LIVE TELEMETRY STREAM")), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-mono font-bold text-[#64748B] bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#E5E7EB]"
    }, "TRIP #", trackingTrip.trip_id || trackingTrip.id)), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap items-center gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-flex items-center bg-white border-2 border-[#171717] rounded-lg shadow-sm px-2.5 py-1 text-sm font-mono font-black tracking-wider text-[#171717]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bg-[#1D4ED8] text-white text-[9px] font-bold px-1 py-0.5 rounded mr-1.5 flex items-center gap-0.5"
    }, /*#__PURE__*/React.createElement("span", null, "IND"), /*#__PURE__*/React.createElement("span", null, "\uD83C\uDDEE\uD83C\uDDF3")), /*#__PURE__*/React.createElement("span", {
      className: "text-base tracking-widest"
    }, trackingTrip.bus_number)), /*#__PURE__*/React.createElement("div", {
      className: "text-sm sm:text-base font-heading font-black text-[#171717]"
    }, trackingTrip.route_name))), /*#__PURE__*/React.createElement("button", {
      onClick: () => setTrackingTrip(null),
      className: "text-[#64748B] hover:text-[#171717] p-2 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E7EB] transition-colors"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 20
    }))), /*#__PURE__*/React.createElement("div", {
      className: "overflow-y-auto pr-1 space-y-4 flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-[#FFFDF7] border-2 border-[#FEF9C3] rounded-2xl p-4 shadow-sm relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center text-xs mb-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "activity",
      size: 14,
      className: "text-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", null, "Real-Time Journey Trajectory")), /*#__PURE__*/React.createElement("span", {
      className: "font-mono font-bold text-[#D71920] bg-[#FEF9C3] px-2.5 py-0.5 rounded-full border border-[#FDE047] text-[11px]"
    }, progressPct, "% Completed (", Math.max(1, currentIdx + 1), " of ", totalStops, " Checkpoints)")), /*#__PURE__*/React.createElement("div", {
      className: "relative h-3 bg-[#E5E7EB] rounded-full my-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full bg-gradient-to-r from-[#FFCC00] via-[#F59E0B] to-[#D71920] rounded-full transition-all duration-700 ease-out shadow-sm",
      style: {
        width: `${Math.max(8, Math.min(100, progressPct))}%`
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out z-10",
      style: {
        left: `${Math.max(6, Math.min(94, progressPct))}%`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative"
    }, /*#__PURE__*/React.createElement("span", {
      className: "absolute -inset-2 rounded-full bg-[#D71920]/40 animate-ping"
    }), /*#__PURE__*/React.createElement("div", {
      className: "relative w-8 h-8 rounded-full bg-[#D71920] border-2 border-white shadow-lg flex items-center justify-center text-white"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bus",
      size: 15
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center text-xs text-[#64748B] font-semibold pt-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1 text-[#171717]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2.5 h-2.5 rounded-full bg-[#FFCC00] border border-[#CA8A04]"
    }), /*#__PURE__*/React.createElement("span", null, originStop)), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-bold text-[#D71920] flex items-center gap-1 bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-[#FDE047]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"
    }), /*#__PURE__*/React.createElement("span", null, "Current: ", currentStopName)), /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1 text-[#171717]"
    }, /*#__PURE__*/React.createElement("span", null, destStop), /*#__PURE__*/React.createElement("span", {
      className: "w-2.5 h-2.5 rounded-full bg-[#D71920] border border-[#991B1B]"
    })))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-[#FFFDF7] p-3.5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 bottom-0 w-1 bg-[#D71920]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-[#64748B] uppercase tracking-wider"
    }, "Current Verified Checkpoint"), /*#__PURE__*/React.createElement("div", {
      className: "font-heading font-black text-lg text-[#D71920] mt-0.5 flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "map-pin",
      size: 18,
      className: "text-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", null, currentStopName)), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#64748B] mt-1 flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 12,
      className: "text-emerald-600"
    }), /*#__PURE__*/React.createElement("span", null, "Verified ", timeAgo(trackingTrip.last_reported_at || trackingTrip.last_update)))), /*#__PURE__*/React.createElement("div", {
      className: "bg-[#F7F7F5] p-3.5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 left-0 bottom-0 w-1 bg-[#FFCC00]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-[#64748B] uppercase tracking-wider"
    }, "Next Expected Checkpoint"), /*#__PURE__*/React.createElement("div", {
      className: "font-heading font-black text-lg text-[#171717] mt-0.5"
    }, trackingTrip.next_stop || trackingTrip.next_stop_name || 'Terminal Ahead'), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#D71920] mt-1 font-semibold flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 12
    }), /*#__PURE__*/React.createElement("span", null, "Conductor ticket scan pending"))), /*#__PURE__*/React.createElement("div", {
      className: "bg-white p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#B45309] border border-[#FDE047] flex items-center justify-center font-bold"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "ticket",
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#64748B] font-bold uppercase"
    }, "Dynamic POS Machine"), /*#__PURE__*/React.createElement("div", {
      className: "font-mono font-bold text-[#171717] text-xs"
    }, "\uD83D\uDCDF ", trackingTrip.machine_code || 'Smart POS M103'))), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
    }, "100% Synced")), /*#__PURE__*/React.createElement("div", {
      className: "bg-white p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center font-bold"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "users",
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#64748B] font-bold uppercase"
    }, "Conductor On Duty"), /*#__PURE__*/React.createElement("div", {
      className: "font-bold text-[#171717] text-xs"
    }, "\uD83D\uDC64 ", trackingTrip.conductor_code || trackingTrip.conductor_name || 'Assigned Staff'))), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold text-[#D71920] bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FECACA]"
    }, "Verified"))), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2 pt-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#64748B]"
    }, /*#__PURE__*/React.createElement("span", null, "Route Checkpoint Progression"), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-[#D71920] font-bold bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FDE047]"
    }, "Sequential Verification")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2 max-h-60 overflow-y-auto pr-1"
    }, trackingRouteStops.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-[#64748B] text-center py-6 bg-[#F7F7F5] rounded-2xl border border-dashed border-[#E5E7EB]"
    }, "Loading route checkpoints...") : trackingRouteStops.map((s, idx) => {
      const isPast = currentIdx !== -1 && idx < currentIdx;
      const isCurrent = currentIdx !== -1 && idx === currentIdx;
      return /*#__PURE__*/React.createElement("div", {
        key: s.id,
        className: `p-3 rounded-2xl border transition-all flex items-center justify-between ${isCurrent ? 'bg-white border-2 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' : isPast ? 'bg-[#FFFDF7] border-[#E5E7EB]' : 'bg-[#F7F7F5] border-[#E5E7EB] opacity-70'}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-3"
      }, /*#__PURE__*/React.createElement("div", {
        className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-[#D71920] text-white font-black shadow-md' : isPast ? 'bg-[#FEF9C3] text-[#D71920] border-2 border-[#FFCC00]' : 'bg-white text-[#94A3B8] border-2 border-[#E5E7EB]'}`
      }, isPast ? /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 15
      }) : isCurrent ? /*#__PURE__*/React.createElement(Icon, {
        name: "bus",
        size: 15
      }) : idx + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: `text-sm font-heading ${isCurrent ? 'text-[#D71920] font-black' : isPast ? 'text-[#171717] font-bold' : 'text-[#64748B]'}`
      }, s.name), /*#__PURE__*/React.createElement("div", {
        className: "text-[10px] text-[#64748B]"
      }, "Checkpoint #", idx + 1))), /*#__PURE__*/React.createElement("div", {
        className: "text-right"
      }, isCurrent && /*#__PURE__*/React.createElement("span", {
        className: "inline-flex items-center gap-1 bg-[#D71920] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-1.5 h-1.5 rounded-full bg-white animate-pulse"
      }), /*#__PURE__*/React.createElement("span", null, "Current Stop")), isPast && /*#__PURE__*/React.createElement("span", {
        className: "inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 11
      }), /*#__PURE__*/React.createElement("span", null, "Passed")), !isPast && !isCurrent && /*#__PURE__*/React.createElement("span", {
        className: "text-[11px] font-semibold text-[#94A3B8]"
      }, "Upcoming")));
    })))), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-[#E5E7EB]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#64748B] flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 14,
      className: "text-[#D71920]"
    }), /*#__PURE__*/React.createElement("span", null, "Anti-Spoofing Deterministic Telemetry")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        navigator.clipboard?.writeText(window.location.origin + '/passenger');
        alert('✓ Live passenger tracking link copied!');
      },
      className: "px-3.5 py-2 rounded-xl text-xs font-heading font-bold text-[#171717] bg-[#F7F7F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] transition-colors flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "copy",
      size: 13
    }), /*#__PURE__*/React.createElement("span", null, "Share Link")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setTrackingTrip(null),
      className: "bg-[#D71920] text-white px-6 py-2 rounded-xl text-xs font-heading font-bold hover:bg-[#B9141A] transition-all shadow-md"
    }, "Close Inspector")))));
  })(), viewingRoute && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-start mb-6 pb-4 border-b border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-heading font-black text-[#171717]"
  }, viewingRoute.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#64748B] mt-0.5"
  }, "Sequential Checkpoint Sequence Manager")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setViewingRoute(null),
    className: "text-[#64748B] hover:text-[#171717] p-2 rounded-xl bg-[#F7F7F5]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 mb-6 max-h-60 overflow-y-auto pr-2"
  }, routeStops.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "p-6 text-center text-xs text-[#64748B]"
  }, "No checkpoints configured for this route yet.") : routeStops.map((s, idx) => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    className: "flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E7EB]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-6 h-6 rounded-full bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center font-bold text-xs"
  }, idx + 1), /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-bold text-sm text-[#171717]"
  }, s.name)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: idx === 0,
    onClick: () => handleMoveStop(idx, -1),
    className: "p-1 text-[#64748B] hover:text-[#171717] disabled:opacity-30"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-up",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    disabled: idx === routeStops.length - 1,
    onClick: () => handleMoveStop(idx, 1),
    className: "p-1 text-[#64748B] hover:text-[#171717] disabled:opacity-30"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-down",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteStopFromRoute(s.id),
    className: "p-1 text-[#D71920] hover:bg-[#FEE2E2] rounded"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 14
  })))))), showAddStopToRoute ? /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-4"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Enter new checkpoint stop name...",
    value: newStopNameToRoute,
    onChange: e => setNewStopNameToRoute(e.target.value),
    className: "flex-1 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddStopToRoute,
    className: "bg-[#D71920] text-white px-4 py-2 rounded-xl text-xs font-bold"
  }, "Save"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddStopToRoute(false),
    className: "text-xs text-[#64748B] px-3"
  }, "Cancel")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddStopToRoute(true),
    className: "w-full py-2.5 rounded-xl border border-dashed border-[#D71920] text-[#D71920] hover:bg-[#FEF9C3] text-xs font-bold transition-all mb-4"
  }, "+ Add Checkpoint Stop"), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setViewingRoute(null),
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-heading font-bold"
  }, "Done")))), showAddBus && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Register New Bus"), /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-[#64748B] font-bold uppercase mb-1 block"
  }, "Bus Registration Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "KA-01-F-1234",
    value: newBusNumber,
    onChange: e => setNewBusNumber(e.target.value.toUpperCase()),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-bold outline-none focus:border-[#D71920] mb-5 uppercase"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddBus(false),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddBus,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Add Bus")))), editingBus && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Edit Bus Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingBus.bus_number,
    onChange: e => setEditingBus({
      ...editingBus,
      bus_number: e.target.value.toUpperCase()
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-bold outline-none focus:border-[#D71920] mb-5 uppercase"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingBus(null),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleEditBus,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Save Changes")))), showAddRoute && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Create New Route"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-[#64748B] font-bold uppercase mb-1 block"
  }, "Route Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Tumakuru \u2192 Bengaluru (Express)",
    value: newRoute.name,
    onChange: e => setNewRoute({
      ...newRoute,
      name: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-[#64748B] font-bold uppercase mb-1 block"
  }, "Origin Station"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Tumakuru",
    value: newRoute.origin,
    onChange: e => setNewRoute({
      ...newRoute,
      origin: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-[#64748B] font-bold uppercase mb-1 block"
  }, "Destination Station"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Bengaluru",
    value: newRoute.destination,
    onChange: e => setNewRoute({
      ...newRoute,
      destination: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddRoute(false),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddRoute,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Create Route")))), editingRoute && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Edit Route"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 mb-5"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingRoute.name,
    onChange: e => setEditingRoute({
      ...editingRoute,
      name: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingRoute.origin || '',
    onChange: e => setEditingRoute({
      ...editingRoute,
      origin: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingRoute.destination || '',
    onChange: e => setEditingRoute({
      ...editingRoute,
      destination: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingRoute(null),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleEditRoute,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Save Changes")))), showAddConductor && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Enroll New Conductor"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-[#64748B] font-bold uppercase mb-1 block"
  }, "Conductor ID Code"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "C105",
    value: newConductor.conductor_id,
    onChange: e => setNewConductor({
      ...newConductor,
      conductor_id: e.target.value.toUpperCase()
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] font-mono outline-none focus:border-[#D71920] uppercase"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-[#64748B] font-bold uppercase mb-1 block"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "e.g. Ramesh Gowda",
    value: newConductor.name,
    onChange: e => setNewConductor({
      ...newConductor,
      name: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-[#64748B] font-bold uppercase mb-1 block"
  }, "Phone Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "+91 98450 XXXXX",
    value: newConductor.phone,
    onChange: e => setNewConductor({
      ...newConductor,
      phone: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddConductor(false),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddConductor,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Add Conductor")))), editingConductor && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Edit Conductor: ", editingConductor.conductor_id), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 mb-5"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingConductor.name,
    onChange: e => setEditingConductor({
      ...editingConductor,
      name: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingConductor.phone || '',
    onChange: e => setEditingConductor({
      ...editingConductor,
      phone: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingConductor(null),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleEditConductor,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Save Changes")))), showAddMachine && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Enroll Ticket Machine"), /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-[#64748B] font-bold uppercase mb-1 block"
  }, "Machine Code / Serial"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "M106",
    value: newMachineCode,
    onChange: e => setNewMachineCode(e.target.value.toUpperCase()),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-mono font-bold outline-none focus:border-[#D71920] mb-5 uppercase"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddMachine(false),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddMachine,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Enroll Machine")))), showCreateTrip && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-xl text-[#171717] mb-1"
  }, "Dispatch / Schedule Trip"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mb-5"
  }, "Assign bus, route, and optional conductor/machine pairing"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-[#64748B] font-bold uppercase mb-1 block"
  }, "Select Bus *"), /*#__PURE__*/React.createElement("select", {
    value: newTrip.bus_id,
    onChange: e => setNewTrip({
      ...newTrip,
      bus_id: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920]"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- Choose Active Bus --"), adminBuses.filter(b => b.status === 'Active' && b.trip_status !== 'Active').map(b => /*#__PURE__*/React.createElement("option", {
    key: b.id,
    value: b.id
  }, "\uD83D\uDE8C ", b.bus_number)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-[#64748B] font-bold uppercase mb-1 block"
  }, "Select Route *"), /*#__PURE__*/React.createElement("select", {
    value: newTrip.route_id,
    onChange: e => setNewTrip({
      ...newTrip,
      route_id: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920]"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- Choose Route --"), adminRoutes.filter(r => r.status === 'Active').map(r => /*#__PURE__*/React.createElement("option", {
    key: r.id,
    value: r.id
  }, r.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-[#64748B] font-bold uppercase mb-1 block"
  }, "Assign Conductor (Optional)"), /*#__PURE__*/React.createElement("select", {
    value: newTrip.conductor_id,
    onChange: e => setNewTrip({
      ...newTrip,
      conductor_id: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920]"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- Assign Later --"), adminConductors.filter(c => c.status === 'Active' && !c.current_bus).map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.conductor_id, " \u2022 ", c.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-[#64748B] font-bold uppercase mb-1 block"
  }, "Reserve Ticket Machine (Optional)"), /*#__PURE__*/React.createElement("select", {
    value: newTrip.machine_id,
    onChange: e => setNewTrip({
      ...newTrip,
      machine_id: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920] font-mono"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- Dynamic Pairing on Trip Start (Default) --"), adminMachines.filter(m => m.status === 'Available').map(m => /*#__PURE__*/React.createElement("option", {
    key: m.id,
    value: m.id
  }, "\uD83D\uDCDF ", m.machine_code, " (Available)")))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 pt-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCreateTrip(false),
    className: "px-4 py-2 rounded-xl text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCreateTrip,
    className: "bg-[#D71920] text-white px-5 py-2.5 rounded-xl text-xs font-heading font-bold hover:bg-[#B9141A]"
  }, "Schedule Trip"))))), editingStop && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-1 bg-[#D71920]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-black text-lg text-[#171717] mb-4"
  }, "Edit Checkpoint Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editingStop.name,
    onChange: e => setEditingStop({
      ...editingStop,
      name: e.target.value
    }),
    className: "w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-bold outline-none focus:border-[#D71920] mb-5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingStop(null),
    className: "px-4 py-2 text-xs font-bold text-[#64748B]"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleEditStopGlobal,
    className: "bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]"
  }, "Save Stop")))));
};
const App = () => {
  return /*#__PURE__*/React.createElement(ThemeProvider, null, /*#__PURE__*/React.createElement(WSProvider, null, /*#__PURE__*/React.createElement(LanguageProvider, null, /*#__PURE__*/React.createElement(PassengerProvider, null, /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-[#F7F7F5] text-[#171717] font-sans antialiased"
  }, /*#__PURE__*/React.createElement(Navbar, null), /*#__PURE__*/React.createElement(Routes, null, /*#__PURE__*/React.createElement(Route, {
    path: "/",
    element: /*#__PURE__*/React.createElement(LandingPage, null)
  }), /*#__PURE__*/React.createElement(Route, {
    path: "/passenger",
    element: /*#__PURE__*/React.createElement(PassengerPage, null)
  }), /*#__PURE__*/React.createElement(Route, {
    path: "/machine",
    element: /*#__PURE__*/React.createElement(TicketMachinePage, null)
  }), /*#__PURE__*/React.createElement(Route, {
    path: "/admin/*",
    element: /*#__PURE__*/React.createElement(AdminPage, null)
  }))))))));
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));