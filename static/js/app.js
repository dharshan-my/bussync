const { useState, useEffect, useRef, createContext, useContext } = React;
const { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } = ReactRouterDOM;

const API_BASE = '/api';

const getStatusStyle = (status) => {
    if (!status) return 'text-[#64748B] bg-[#F7F7F5] border-[#E5E7EB]';
    if (status.includes('Active') || status.includes('Travelling')) return 'text-[#D71920] bg-[#FEF9C3] border-[#FDE047]';
    if (status.includes('Scheduled') || status.includes('In Use') || status.includes('Delayed')) return 'text-[#171717] bg-[#F7F7F5] border-[#E5E7EB]';
    if (status.includes('Completed') || status.includes('Available')) return 'text-[#171717] bg-[#FFFDF7] border-[#E5E7EB]';
    return 'text-[#64748B] bg-[#F7F7F5] border-[#E5E7EB]';
};

const getStatusBadge = (status, translatedStatus) => {
    if (!status) return null;
    
    if (status.includes('Active') || status.includes('Travelling')) {
        return (
            <div className="flex items-center gap-1.5 bg-[#FEF9C3] px-3 py-1 rounded-full border border-[#FDE047] text-[#D71920]">
                <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse"></span>
                <span className="text-xs font-bold">
                    {translatedStatus ? translatedStatus.replace('🟢 ', '') : status.replace('🟢 ', '')}
                </span>
            </div>
        );
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
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            <Icon name={icon} size={12} className="text-[#D71920]" />
            {cleanText}
        </span>
    );
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = new Date() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `Updated ${mins}m ago`;
    return `Updated ${Math.floor(mins/60)}h ago`;
};

const toPascal = (str) => {
    if (!str) return '';
    return str
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
};

const Icon = ({ name, size = 24, className = '', ...props }) => {
    const iconRef = useRef(null);
    useEffect(() => {
        if (iconRef.current && window.lucide && window.lucide.icons) {
            iconRef.current.innerHTML = '';
            const pascalName = toPascal(name);
            const iconObj = window.lucide.icons[pascalName] || window.lucide.icons[name];
            if (iconObj && typeof iconObj.toSvg === 'function') {
                const iconNode = iconObj.toSvg({ width: size, height: size, class: className, ...props });
                const doc = new DOMParser().parseFromString(iconNode, 'image/svg+xml');
                if (doc.documentElement) {
                    iconRef.current.appendChild(doc.documentElement);
                }
            }
        }
    }, [name, size, className]);
    return <span ref={iconRef} className={`inline-flex items-center justify-center ${className}`}></span>;
};

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });
const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const toggleTheme = () => {};
    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

const WSContext = createContext({ messages: [] });
const WSProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, data]);
            window.dispatchEvent(new CustomEvent('ws-update', { detail: data }));
        };
        return () => ws.close();
    }, []);
    return <WSContext.Provider value={{ messages }}>{children}</WSContext.Provider>;
};

// --- Ambient Background Component (Karnataka Red/Yellow Accents) ---
const AmbientBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FFCC00]/5 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D71920]/5 blur-[120px]"></div>
    </div>
);

const LiveIndicator = ({ label = "LIVE" }) => (
    <div className="inline-flex items-center gap-1.5 text-[#D71920] font-bold tracking-widest uppercase">
        <div className="w-2.5 h-2.5 rounded-full bg-[#D71920] animate-pulse"></div>
        <span>{label}</span>
    </div>
);

const BusLoading = () => (
    <div className="fixed inset-0 bg-[#F7F7F5]/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
        <div className="w-64 h-16 relative overflow-hidden mb-4">
            <div className="absolute inset-0 flex items-center justify-center animate-bus-drive">
                <div className="w-14 h-14 rounded-2xl bg-[#FFCC00] flex items-center justify-center shadow-lg border-2 border-[#D71920]">
                    <Icon name="bus" size={30} className="text-[#171717]" />
                </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 h-1 bg-[#D71920] rounded-full"></div>
        </div>
        <div className="font-heading font-black text-sm text-[#171717] tracking-wider uppercase flex items-center gap-2">
            <span>SYNCHRONIZING FLEET TELEMETRY</span>
        </div>
        <div className="text-xs text-[#D71920] font-bold mt-1">ಕರ್ನಾಟಕ ಸಾರಿಗೆ • ನಿಲ್ದಾಣ ಪರಿಶೀಲನೆ</div>
    </div>
);



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
const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('bussync_lang') || 'en');
    useEffect(() => { localStorage.setItem('bussync_lang', lang); }, [lang]);
    const t = (key) => translations[lang]?.[key] || key;
    
    const translateNotif = (msg) => {
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
    
    const translateStatus = (s) => {
        if (!s) return s;
        return s.replace('Travelling', t('Travelling')).replace('Scheduled', t('Scheduled')).replace('Completed', t('Completed')).replace('No recent update', t('No recent update'));
    };

    return <LanguageContext.Provider value={{ lang, setLang, t, translateNotif, translateStatus }}>{children}</LanguageContext.Provider>;
};

const PassengerContext = createContext();
const PassengerProvider = ({ children }) => {
    const { t, translateNotif } = useContext(LanguageContext) || {};
    const [passengerId, setPassengerId] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [toast, setToast] = useState(null);

    const fetchNotifications = async (pid) => {
        try {
            const res = await fetch(`${API_BASE}/passenger/${pid}/notifications`);
            if (res.ok) setNotifications(await res.json());
        } catch(e) {}
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
        const handleWs = (e) => {
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

    const markAsRead = async (id) => {
        try {
            await fetch(`${API_BASE}/passenger/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: 1} : n));
        } catch(e) {}
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_BASE}/passenger/${passengerId}/notifications/read-all`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({...n, is_read: 1})));
        } catch(e) {}
    };

    return (
        <PassengerContext.Provider value={{ passengerId, notifications, markAsRead, markAllAsRead }}>
            {children}
            {toast && (
                <div 
                    className="fixed top-24 right-6 bg-white border-2 border-[#D71920] p-4 rounded-2xl shadow-[0_10px_40px_rgba(215,25,32,0.15)] z-[100] animate-in slide-in-from-right-8 fade-in flex gap-4 w-80 group cursor-pointer" 
                    onClick={() => { markAsRead(toast.id); setToast(null); }}
                >
                    <div className="bg-[#FEF9C3] text-[#D71920] p-3 rounded-xl self-start border border-[#FDE047]">
                        <Icon name="bell-ring" size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="font-heading font-bold text-sm text-[#171717] mb-1">{translateNotif ? translateNotif(toast.title) : toast.title}</div>
                        <div className="text-xs text-[#64748B] leading-relaxed">{translateNotif ? translateNotif(toast.message) : toast.message}</div>
                        <div className="text-[10px] font-bold text-[#D71920] uppercase tracking-widest mt-2">{t ? t('Just now') : 'Just now'}</div>
                    </div>
                </div>
            )}
        </PassengerContext.Provider>
    );
};

// ======== COMPONENT: NAVBAR (KARNATAKA THEME) ========
const Navbar = () => {
    const location = useLocation();
    const { notifications, markAsRead, markAllAsRead } = useContext(PassengerContext);
    const { lang, setLang, t, translateNotif } = useContext(LanguageContext);
    const [showDropdown, setShowDropdown] = useState(false);
    
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/machine')) return null;
    
    const unread = notifications.filter(n => !n.is_read).length;

    const timeAgo = (dateStr) => {
        const diff = new Date() - new Date(dateStr);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('Just now');
        if (mins < 60) return `${mins}m ${t('ago')}`;
        return `${Math.floor(mins/60)}h ${t('ago')}`;
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
            <nav className="bg-white/95 backdrop-blur-xl border border-[#E5E7EB] shadow-md rounded-2xl px-6 py-3.5 flex justify-between items-center transition-all duration-300">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="bg-[#FFCC00] p-2 rounded-xl shadow-sm text-[#171717] group-hover:scale-105 transition-all">
                        <Icon name="bus" size={22} className="text-[#171717]" />
                    </div>
                    <div>
                        <span className="text-xl font-heading font-black tracking-wider text-[#171717]">BUSSYNC</span>
                        <div className="text-[10px] font-heading font-bold text-[#D71920] tracking-widest uppercase">SYNC THE MOTION.</div>
                    </div>
                </Link>
                
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden md:flex gap-6 text-xs font-bold text-[#475569]">
                        <Link to="/" className="hover:text-[#D71920] transition-colors">{t('Home')}</Link>
                        <Link to="/passenger" className="hover:text-[#D71920] transition-colors">{t('Passenger')}</Link>
                        <Link to="/admin" className="hover:text-[#D71920] transition-colors">{t('Admin')}</Link>
                        <Link to="/machine" className="hover:text-[#D71920] transition-colors">{t('Ticket Machine')}</Link>
                    </div>
                    
                    {/* Notifications */}
                    <div className="relative">
                        <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-[#64748B] hover:text-[#D71920] transition-colors bg-[#F7F7F5] rounded-full hover:bg-[#FEF9C3] flex items-center justify-center border border-[#E5E7EB]">
                            <Icon name="bell" size={18} />
                            {unread > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D71920] rounded-full border-2 border-white animate-pulse"></span>}
                        </button>
                        
                        {showDropdown && (
                            <div className="absolute right-0 mt-3 w-[340px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4">
                                <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FFFDF7]">
                                    <span className="font-heading font-bold text-sm text-[#171717]">{t('Notifications')}</span>
                                    {unread > 0 && <button onClick={markAllAsRead} className="text-xs text-[#D71920] hover:underline font-bold">{t('Mark all read')}</button>}
                                </div>
                                <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-[#64748B] text-xs">{t('No notifications yet.')}</div>
                                    ) : notifications.map(n => (
                                        <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3.5 hover:bg-[#FFFDF7] transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-[#FEF9C3]/40' : ''}`}>
                                            <div className={`mt-0.5 ${!n.is_read ? 'text-[#D71920]' : 'text-[#94A3B8]'}`}><Icon name={n.type==='TRIP_STARTED'?'play-circle':n.type==='DESTINATION_REACHED'?'check-circle':'map-pin'} size={18}/></div>
                                            <div className="flex-1">
                                                <div className={`text-xs font-bold mb-0.5 ${!n.is_read ? 'text-[#171717]' : 'text-[#475569]'}`}>{translateNotif(n.title)}</div>
                                                <div className="text-[11px] text-[#64748B]">{translateNotif(n.message)}</div>
                                                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1">{timeAgo(n.created_at)}</div>
                                            </div>
                                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#D71920] self-center ml-auto"></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center gap-1 text-xs font-bold bg-[#F7F7F5] rounded-full p-1 border border-[#E5E7EB]">
                        <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full transition-all ${lang === 'en' ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#64748B] hover:text-[#171717]'}`}>English</button>
                        <button onClick={() => setLang('kn')} className={`px-3 py-1 rounded-full transition-all ${lang === 'kn' ? 'bg-[#D71920] text-white shadow-sm' : 'text-[#64748B] hover:text-[#171717]'}`}>ಕನ್ನಡ</button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

// ======== COMPONENT: LANDING PAGE (KARNATAKA THEME) ========
const LandingPage = () => {
    const { t } = useContext(LanguageContext);
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

    const demoStops = [
        { id: 1, name: 'Tumakuru', tag: 'Origin', time: '08:30 AM' },
        { id: 2, name: 'Kunigal', tag: 'Checkpoint 1', time: '08:52 AM' },
        { id: 3, name: 'Nelamangala', tag: 'Checkpoint 2', time: 'ETA 09:18 AM' },
        { id: 4, name: 'Yeshwanthpur', tag: 'Checkpoint 3', time: 'ETA 09:40 AM' },
        { id: 5, name: 'Bengaluru', tag: 'Destination', time: 'ETA 10:05 AM' }
    ];

    const fetchLandingData = () => {
        fetch(`${API_BASE}/dashboard/kpis`)
            .then(r => r.json())
            .then(data => {
                if (data && data.kpis) setKpis(data.kpis);
            })
            .catch(() => {});

        fetch(`${API_BASE}/passenger/buses/active`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setActiveBuses(data);
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchLandingData();
        const interval = setInterval(fetchLandingData, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#F7F7F5] text-[#171717] font-sans selection:bg-[#FEF9C3] selection:text-[#D71920]">
            <AmbientBackground />

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 px-6 lg:px-20 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6 text-center lg:text-left z-10">
                    
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold tracking-wide shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse"></span>
                        <span>ಕರ್ನಾಟಕ ಸಾರಿಗೆ • INTELLIGENT TRANSIT TELEMETRY</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-[#171717] leading-[1.12]">
                        My Bus, <span className="text-[#D71920]">My Journey.</span>
                        <span className="block text-2xl sm:text-3xl lg:text-4xl text-[#171717] font-bold mt-3 tracking-normal">
                            Karnataka's Next-Gen <span className="text-[#D71920] underline decoration-[#FFCC00] decoration-wavy decoration-2">Intelligent Bus Monitoring.</span>
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                        Deterministic, stop-based journey tracking for passengers, conductors, and administrators across Karnataka. 100% verified through ticket machines without unreliable GPS hardware.
                    </p>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                        <Link 
                            to="/passenger" 
                            className="bg-[#D71920] hover:bg-[#B9141A] text-white px-8 py-4 rounded-2xl font-heading font-bold text-sm tracking-wide shadow-md transition-all flex items-center gap-3 group"
                        >
                            <span>Track Bus Live</span>
                            <Icon name="arrow-right" size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link 
                            to="/admin" 
                            className="bg-white hover:bg-[#FFFDF7] text-[#171717] border border-[#E5E7EB] hover:border-[#D71920] px-8 py-4 rounded-2xl font-heading font-bold text-sm transition-all shadow-sm flex items-center gap-2.5"
                        >
                            <Icon name="shield" size={18} className="text-[#D71920]" />
                            <span>Control Center</span>
                        </Link>
                    </div>

                    {/* Live Fleet Ticker */}
                    <div className="pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs text-[#64748B]">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D71920]"></span>
                        </span>
                        {activeBuses.length > 0 ? (
                            <span>
                                <strong className="text-[#171717]">{activeBuses[0].bus_number}</strong> is live on <span className="text-[#D71920] font-bold">{activeBuses[0].route_name}</span> (Last stop: <span className="text-[#171717] font-bold">{activeBuses[0].current_stop_name || 'Departed'}</span>)
                            </span>
                        ) : (
                            <span>Active fleet verified • 21 verified checkpoints operating across Karnataka transit routes</span>
                        )}
                    </div>
                </div>

                {/* Right Hero: Interactive Demo Card (Next-Gen Telemetry HUD) */}
                <div className="flex-1 w-full max-w-lg relative z-10">
                    <div className="bg-white/95 backdrop-blur-xl border-2 border-[#E5E7EB] p-5 sm:p-7 rounded-3xl shadow-2xl relative overflow-hidden">
                        
                        {/* Top Dual Red & Yellow Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>

                        {/* Top Cockpit Header */}
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#E5E7EB]">
                            <div>
                                <div className="text-[10px] font-heading font-bold tracking-widest text-[#D71920] uppercase mb-1.5 flex items-center gap-1.5">
                                    <Icon name="radio" size={13} className="animate-pulse" />
                                    <span>LIVE CHECKPOINT TELEMETRY</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    {/* Embossed HSRP License Plate */}
                                    <div className="inline-flex items-center bg-[#F7F7F5] border-2 border-[#171717] rounded-lg shadow-sm px-2.5 py-1 text-xs font-mono font-black tracking-wider text-[#171717]">
                                        <span className="bg-[#1D4ED8] text-white text-[8px] font-bold px-1 rounded mr-1">IND</span>
                                        <span>KA-01-F-1234</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#64748B] bg-[#F7F7F5] px-2 py-0.5 rounded-full border border-[#E5E7EB]">Express #07</span>
                                </div>
                                <div className="text-xs text-[#475569] mt-1 font-semibold flex items-center gap-1">
                                    <span>Tumakuru</span>
                                    <Icon name="arrow-right" size={12} className="text-[#D71920]" />
                                    <span>Bengaluru</span>
                                    <span className="text-[10px] text-[#64748B] font-normal">(72 km Corridor)</span>
                                </div>
                            </div>
                            <div className="bg-[#FEF9C3] border border-[#FDE047] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D71920]"></span>
                                </span>
                                <span className="text-xs font-bold text-[#D71920]">Travelling</span>
                            </div>
                        </div>

                        {/* Dynamic Journey Progress Ribbon */}
                        <div className="bg-[#FFFDF7] border border-[#E5E7EB] rounded-2xl p-3.5 mb-4 shadow-sm">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                                    <Icon name="activity" size={12} className="text-[#D71920]" />
                                    <span>Journey Pipeline</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#D71920] bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-[#FDE047]">
                                    {Math.round((demoStep / (demoStops.length - 1)) * 100)}% Cleared (Stop {demoStep + 1} of {demoStops.length})
                                </span>
                            </div>

                            {/* Animated Visual Ribbon Track */}
                            <div className="relative h-2.5 bg-[#E5E7EB] rounded-full my-2.5">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#FFCC00] to-[#D71920] rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${Math.max(10, Math.min(100, (demoStep / (demoStops.length - 1)) * 100))}%` }}
                                ></div>
                                {/* Animated Bus Glyph */}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-10"
                                    style={{ left: `${Math.max(8, Math.min(94, (demoStep / (demoStops.length - 1)) * 100))}%` }}
                                >
                                    <div className="relative">
                                        <span className="absolute -inset-1 rounded-full bg-[#D71920]/40 animate-ping"></span>
                                        <div className="relative w-6 h-6 rounded-full bg-[#D71920] border-2 border-white shadow-md flex items-center justify-center text-white">
                                            <Icon name="bus" size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-[#64748B] pt-0.5 font-semibold">
                                <span>🏁 Tumakuru</span>
                                <span className="text-[#D71920] font-bold">Now at: {demoStops[demoStep].name}</span>
                                <span>🎯 Bengaluru</span>
                            </div>
                        </div>

                        {/* Telemetry HUD Cockpit (2-column) */}
                        <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                            <div className="bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E7EB]">
                                <div className="text-[10px] font-bold text-[#64748B] uppercase">Current Checkpoint</div>
                                <div className="font-heading font-black text-sm text-[#D71920] mt-0.5 flex items-center gap-1">
                                    <Icon name="map-pin" size={14} />
                                    <span>{demoStops[demoStep].name}</span>
                                </div>
                                <div className="text-[10px] text-[#64748B] mt-0.5">Verified at {demoStops[demoStep].time}</div>
                            </div>
                            <div className="bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E7EB]">
                                <div className="text-[10px] font-bold text-[#64748B] uppercase">Next Checkpoint</div>
                                <div className="font-heading font-bold text-sm text-[#171717] mt-0.5">
                                    {demoStep < demoStops.length - 1 ? demoStops[demoStep + 1].name : 'Terminal Reached'}
                                </div>
                                <div className="text-[10px] text-[#D71920] mt-0.5">
                                    {demoStep < demoStops.length - 1 ? demoStops[demoStep + 1].time : 'Journey Completed'}
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Machine Binding Badge */}
                        <div className="bg-[#FFFDF7] border border-[#E5E7EB] p-2.5 rounded-xl mb-4 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309]">
                                    <Icon name="ticket" size={14} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-[#171717]">Dynamic POS Terminal M102</div>
                                    <div className="text-[10px] text-[#64748B]">Ticket check-in verification</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-[#D71920] flex items-center gap-1 bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FDE047]">
                                <Icon name="zap" size={11} /> 100% Synced
                            </span>
                        </div>

                        {/* Interactive Stop Progression Visualizer */}
                        <div className="space-y-2 mb-4 relative">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex justify-between items-center">
                                <span>Sequential Checkpoints</span>
                                <span className="text-[10px] text-[#D71920] font-bold bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#FDE047]">
                                    👉 Tap stop to test
                                </span>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {demoStops.map((stop, idx) => {
                                    const isPassed = idx < demoStep;
                                    const isCurrent = idx === demoStep;
                                    return (
                                        <div 
                                            key={stop.id}
                                            onClick={() => setDemoStep(idx)}
                                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                                isCurrent 
                                                    ? 'bg-white border-2 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' 
                                                    : isPassed
                                                    ? 'bg-[#FFFDF7] border-[#E5E7EB]'
                                                    : 'bg-[#F7F7F5] border-[#E5E7EB] opacity-65'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isCurrent ? 'bg-[#D71920] text-white font-black' : isPassed ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : 'bg-white text-[#94A3B8] border border-[#E5E7EB]'
                                                }`}>
                                                    {isPassed ? <Icon name="check" size={13} /> : idx + 1}
                                                </div>
                                                <div>
                                                    <div className={`text-xs font-heading ${isCurrent ? 'font-black text-[#D71920]' : 'font-bold text-[#171717]'}`}>
                                                        {stop.name}
                                                    </div>
                                                    <div className="text-[9px] text-[#64748B]">{stop.tag}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[11px] font-mono font-bold ${isCurrent ? 'text-[#D71920]' : 'text-[#64748B]'}`}>
                                                    {stop.time}
                                                </div>
                                                {isCurrent && (
                                                    <span className="text-[9px] font-bold text-[#D71920] uppercase tracking-wider">● Current Bus Location</span>
                                                )}
                                                {isPassed && (
                                                    <span className="text-[9px] font-semibold text-[#64748B]">Passed</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-[#64748B] pt-2.5 border-t border-[#E5E7EB]">
                            <span>Deterministic Stop Checkpoint Protocol</span>
                            <span className="text-[#D71920] font-bold">Zero-GPS Drift</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURE SHOWCASE TABS */}
            <section className="py-20 px-6 lg:px-20 max-w-7xl mx-auto border-t border-[#E5E7EB]">
                <div className="text-center mb-12">
                    <div className="text-xs font-heading font-bold tracking-widest text-[#D71920] uppercase mb-2">HOW IT WORKS</div>
                    <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#171717]">Architected for Karnataka Public Transit</h2>
                    <p className="text-[#64748B] text-sm mt-2 max-w-xl mx-auto">Eliminating expensive GPS tracking hardware by leveraging existing conductor ticketing workflows.</p>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-12">
                    {[
                        { title: 'Deterministic Checkpoints', kn: 'ನಿಲ್ದಾಣ ಪರಿಶೀಲನೆ', desc: 'Stops are verified sequentially by the ticket machine, preventing false movement.' },
                        { title: 'Conductor POS Terminal', kn: 'ನಿರ್ವಾಹಕರ ಯಂತ್ರ', desc: 'Tactile 72px thumb buttons designed for conductors operating on bumpy roads.' },
                        { title: 'Passenger Telemetry', kn: 'ಪ್ರಯಾಣಿಕರ ನೆರವು', desc: 'Live stop timelines, accurate arrival estimates, and push notifications.' },
                        { title: 'Control Center', kn: 'ನಿಯಂತ್ರಣ ಕೇಂದ್ರ', desc: 'Central transport operations dashboard monitoring routes and fleet metrics.' }
                    ].map((feat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all">
                            <div className="w-8 h-8 rounded-xl bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center font-bold text-xs mb-3">
                                0{i + 1}
                            </div>
                            <div className="text-[11px] font-bold text-[#D71920] mb-0.5">{feat.kn}</div>
                            <h3 className="font-heading font-black text-base text-[#171717] mb-1.5">{feat.title}</h3>
                            <p className="text-xs text-[#64748B] leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* COMPARISON MATRIX: GPS VS BUSSYNC */}
            <section className="py-16 px-6 lg:px-20 max-w-7xl mx-auto border-t border-[#E5E7EB]">
                <div className="text-center mb-12">
                    <div className="text-xs font-heading font-bold tracking-widest text-[#D71920] uppercase mb-2">WHY NO-GPS?</div>
                    <h2 className="text-3xl font-heading font-black text-[#171717]">The Deterministic Checkpoint Advantage</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
                        <div className="flex items-center gap-3 text-[#D71920] font-heading font-bold text-lg">
                            <Icon name="x-circle" size={24} />
                            <span>Traditional GPS Bus Tracking</span>
                        </div>
                        <ul className="space-y-3 text-[#64748B] text-sm">
                            <li className="flex items-start gap-2.5">
                                <span className="text-[#D71920] font-bold">✕</span>
                                <span>GPS drift in urban corridors and complete signal loss inside ghats or tunnels</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-[#D71920] font-bold">✕</span>
                                <span>High hardware installation and ongoing maintenance costs for state-wide fleets</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-[#D71920] font-bold">✕</span>
                                <span>High battery drain on commuter devices and erratic arrival estimates in traffic</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-8 rounded-3xl bg-white border-2 border-[#D71920] shadow-md space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#D71920] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            Recommended
                        </div>
                        <div className="flex items-center gap-3 text-[#D71920] font-heading font-bold text-lg">
                            <Icon name="check-circle" size={24} />
                            <span>BusSync Checkpoint Architecture</span>
                        </div>
                        <ul className="space-y-3 text-[#171717] text-sm">
                            <li className="flex items-start gap-2.5">
                                <span className="text-[#D71920] font-bold">✓</span>
                                <span>100% deterministic: Bus location updates only when conductor logs the physical stop</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-[#D71920] font-bold">✓</span>
                                <span>Zero additional hardware cost: Leverages existing handheld ticketing machines</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-[#D71920] font-bold">✓</span>
                                <span>Guaranteed reliability: Lightweight WebSocket streaming requires minimal mobile data</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-[#E5E7EB] bg-white py-12 px-6 lg:px-20 text-[#64748B] text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#171717]">
                            <Icon name="bus" size={18} />
                        </div>
                        <div>
                            <span className="font-heading font-black text-base text-[#171717]">BUSSYNC</span>
                            <span className="text-xs text-[#64748B] ml-2">Karnataka Transit Platform</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-semibold text-[#475569]">
                        <Link to="/passenger" className="hover:text-[#D71920] transition-colors">Passenger App</Link>
                        <Link to="/machine" className="hover:text-[#D71920] transition-colors">Conductor Terminal</Link>
                        <Link to="/admin" className="hover:text-[#D71920] transition-colors">Admin Control Center</Link>
                    </div>

                    <div className="text-xs text-[#64748B] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D71920]"></span>
                        <span>Engine v2.4 • All Karnataka Systems Synchronized</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// ======== COMPONENT: PASSENGER APP (KARNATAKA THEME) ========
const PassengerPage = () => {
    const { passengerId } = useContext(PassengerContext);
    const { t, translateStatus } = useContext(LanguageContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [buses, setBuses] = useState([]);
    const [routesSearch, setRoutesSearch] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list');
    const [selectedBus, setSelectedBus] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeBuses, setRouteBuses] = useState([]);

    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyPrefs, setNotifyPrefs] = useState({ notify_trip_start: false, notify_my_stop: false, notify_destination: false, selected_stop_id: '' });
    const [hasActiveSub, setHasActiveSub] = useState(false);
    const [savedBuses, setSavedBuses] = useState(() => JSON.parse(localStorage.getItem('bussync_saved')) || []);

    const fetchActiveBuses = async () => {
        setLoading(true);
        const res = await fetch(`${API_BASE}/passenger/buses/active`);
        setBuses(await res.json());
        setRoutesSearch([]);
        setLoading(false);
    };

    const handleSearch = async (query) => {
        if (!query.trim()) return fetchActiveBuses();
        setLoading(true);
        const res = await fetch(`${API_BASE}/passenger/search_routes?q=${query}`);
        setRoutesSearch(await res.json());
        setBuses([]);
        setLoading(false);
    };

    useEffect(() => { fetchActiveBuses(); }, []);
    const toggleSaveBus = (bus_number) => {
        const newSaved = savedBuses.includes(bus_number) ? savedBuses.filter(b => b !== bus_number) : [...savedBuses, bus_number];
        setSavedBuses(newSaved);
        localStorage.setItem('bussync_saved', JSON.stringify(newSaved));
    };

    useEffect(() => {
        const handleWs = (e) => {
            const data = e.detail;
            if (['STOP_UPDATED', 'TRIP_STARTED', 'TRIP_ENDED', 'ADMIN_UPDATE', 'PASSENGER_UPDATE'].includes(data.type)) {
                if (view === 'bus_detail' && selectedBus && data.bus_number === selectedBus.bus_number) {
                    fetch(`${API_BASE}/passenger/bus/${selectedBus.bus_number}`)
                        .then(r => r.json())
                        .then(d => d.active_trip ? setSelectedBus(d.active_trip) : setView('list'));
                } else if (view === 'route_buses' && selectedRoute) {
                    fetchRouteBuses(selectedRoute);
                } else if (view === 'list') {
                    if (!searchQuery) fetchActiveBuses();
                    else handleSearch(searchQuery);
                }
            }
        };
        window.addEventListener('ws-update', handleWs);
        return () => window.removeEventListener('ws-update', handleWs);
    }, [view, selectedBus, selectedRoute, searchQuery]);

    useEffect(() => {
        if (view === 'bus_detail' && selectedBus) {
            fetch(`${API_BASE}/passenger/${passengerId}/subscription/${selectedBus.trip_id}`)
                .then(r => r.json())
                .then(data => {
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
                        setNotifyPrefs({ notify_trip_start: false, notify_my_stop: false, notify_destination: false, selected_stop_id: '' });
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
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        setShowNotifyModal(false);
        const isActive = notifyPrefs.notify_trip_start || notifyPrefs.notify_my_stop || notifyPrefs.notify_destination;
        setHasActiveSub(isActive);
        alert(isActive ? `✓ Notifications enabled for ${selectedBus.bus_number}` : `✓ Notifications disabled for ${selectedBus.bus_number}`);
    };

    const fetchRouteBuses = async (route) => {
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
        const progressPct = stopsList.length > 1 
            ? Math.round((Math.max(0, currentIdx) / (stopsList.length - 1)) * 100) 
            : 50;
        const originStop = stopsList[0]?.name || 'Origin';
        const destStop = stopsList[stopsList.length - 1]?.name || 'Destination';

        return (
            <div className="min-h-screen bg-[#F7F7F5] text-[#171717] pt-24 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Navigation & Controls */}
                    <div className="flex justify-between items-center mb-6">
                        <button 
                            onClick={() => { setSelectedBus(null); setView(selectedRoute ? 'route_buses' : 'list'); }} 
                            className="flex items-center gap-2 text-[#475569] hover:text-[#D71920] font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-[#E5E7EB] shadow-sm"
                        >
                            <Icon name="arrow-left" size={18} />
                            <span>Back to Buses</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    navigator.clipboard?.writeText(window.location.href);
                                    alert('✓ Live bus tracking link copied!');
                                }}
                                className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-white text-[#171717] border border-[#E5E7EB] hover:border-[#D71920] shadow-sm transition-all"
                            >
                                <Icon name="copy" size={14} className="text-[#D71920]" />
                                <span className="hidden sm:inline">Share</span>
                            </button>

                            <button 
                                onClick={() => setShowNotifyModal(true)} 
                                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${hasActiveSub ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : 'bg-white text-[#171717] border border-[#E5E7EB] hover:border-[#D71920]'}`}
                            >
                                <Icon name="bell" size={15} className={hasActiveSub ? "text-[#D71920] animate-pulse" : "text-[#64748B]"} /> 
                                {hasActiveSub ? 'Alerts Active' : 'Notify Me'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Next-Gen Live Journey Cockpit HUD Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E5E7EB] shadow-2xl relative overflow-hidden mb-8">
                        {/* Top Dual Red & Yellow Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>

                        {/* Live Telemetry Status Header */}
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-5 border-b border-[#E5E7EB]">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold shadow-sm">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D71920]"></span>
                                        </span>
                                        <span className="tracking-wide">LIVE TELEMETRY STREAM</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                        VERIFIED HARDWARE LINK
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {/* HSRP Plate Badge */}
                                    <div className="inline-flex items-center bg-white border-2 border-[#171717] rounded-lg shadow-sm px-3 py-1 text-sm font-mono font-black tracking-wider text-[#171717]">
                                        <span className="bg-[#1D4ED8] text-white text-[9px] font-bold px-1 py-0.5 rounded mr-1.5 flex items-center gap-0.5">
                                            <span>IND</span>
                                            <span>🇮🇳</span>
                                        </span>
                                        <span className="text-xl tracking-widest">{selectedBus.bus_number}</span>
                                    </div>

                                    <div>
                                        <div className="text-base sm:text-lg font-heading font-black text-[#171717]">
                                            {selectedBus.route_name}
                                        </div>
                                        <div className="text-xs text-[#64748B]">Karnataka State Road Transport • Express Corridor</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {getStatusBadge(selectedBus.status, translateStatus(selectedBus.status))}
                            </div>
                        </div>

                        {/* 1. Dynamic Journey Progress Ribbon */}
                        <div className="bg-[#FFFDF7] border-2 border-[#FEF9C3] rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
                            <div className="flex justify-between items-center text-xs mb-2">
                                <span className="font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon name="activity" size={14} className="text-[#D71920]" />
                                    <span>Journey Trajectory</span>
                                </span>
                                <span className="font-mono font-bold text-[#D71920] bg-[#FEF9C3] px-2.5 py-0.5 rounded-full border border-[#FDE047] text-[11px]">
                                    {progressPct}% Completed ({Math.max(1, currentIdx + 1)} of {totalStops} Checkpoints)
                                </span>
                            </div>

                            {/* Progress Bar with Gliding Bus Node */}
                            <div className="relative h-3.5 bg-[#E5E7EB] rounded-full my-3">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#FFCC00] via-[#F59E0B] to-[#D71920] rounded-full transition-all duration-700 ease-out shadow-sm"
                                    style={{ width: `${Math.max(8, Math.min(100, progressPct))}%` }}
                                ></div>
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out z-10"
                                    style={{ left: `${Math.max(6, Math.min(94, progressPct))}%` }}
                                >
                                    <div className="relative">
                                        <span className="absolute -inset-2 rounded-full bg-[#D71920]/40 animate-ping"></span>
                                        <div className="relative w-8 h-8 rounded-full bg-[#D71920] border-2 border-white shadow-lg flex items-center justify-center text-white">
                                            <Icon name="bus" size={15} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-[#64748B] font-semibold pt-1">
                                <span className="flex items-center gap-1 text-[#171717]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] border border-[#CA8A04]"></span>
                                    <span>{originStop}</span>
                                </span>
                                <span className="text-[11px] font-bold text-[#D71920] flex items-center gap-1 bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-[#FDE047]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                    <span>At: {currentStopName}</span>
                                </span>
                                <span className="flex items-center gap-1 text-[#171717]">
                                    <span>{destStop}</span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#D71920] border border-[#991B1B]"></span>
                                </span>
                            </div>
                        </div>

                        {/* 2. Cockpit Telemetry Cards (2x2 Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            <div className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#D71920]"></div>
                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Current Checkpoint</div>
                                <div className="font-heading font-black text-xl text-[#D71920] mt-1 flex items-center gap-1.5">
                                    <Icon name="map-pin" size={18} />
                                    <span>{currentStopName}</span>
                                </div>
                                <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                                    <Icon name="check-circle" size={13} className="text-emerald-600" />
                                    <span>Verified by Conductor Terminal</span>
                                </div>
                            </div>

                            <div className="bg-[#F7F7F5] p-4 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#FFCC00]"></div>
                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Next Station Ahead</div>
                                <div className="font-heading font-black text-xl text-[#171717] mt-1">
                                    {currentIdx !== -1 && currentIdx < stopsList.length - 1 ? stopsList[currentIdx + 1].name : 'Terminal Reached'}
                                </div>
                                <div className="text-xs text-[#D71920] mt-1 font-semibold flex items-center gap-1">
                                    <Icon name="clock" size={13} />
                                    <span>{currentIdx !== -1 && currentIdx < stopsList.length - 1 ? 'Approaching Next Station' : 'Journey Completed'}</span>
                                </div>
                            </div>

                            <div className="bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs sm:col-span-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#B45309] border border-[#FDE047] flex items-center justify-center font-bold">
                                        <Icon name="ticket" size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-[#171717]">Dynamic POS Terminal: {selectedBus.machine_code || 'Smart POS M102'}</div>
                                        <div className="text-[10px] text-[#64748B]">Deterministic stop check-in verification • Anti-spoofing enabled</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    100% Synced
                                </span>
                            </div>
                        </div>

                        {/* 3. Sequential Route Checkpoint Progression Timeline */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                <span>Route Checkpoint Progression</span>
                                <span className="text-[10px] text-[#D71920] font-bold bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FDE047]">
                                    Live Sequence
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {stopsList.length === 0 ? (
                                    <div className="text-xs text-[#64748B] text-center py-6 bg-[#F7F7F5] rounded-2xl border border-dashed border-[#E5E7EB]">
                                        Loading route checkpoints...
                                    </div>
                                ) : (
                                    stopsList.map((s, idx) => {
                                        const isPast = currentIdx !== -1 && idx < currentIdx;
                                        const isCurrent = currentIdx !== -1 && idx === currentIdx;

                                        return (
                                            <div 
                                                key={s.id} 
                                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                                                    isCurrent 
                                                        ? 'bg-white border-2 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' 
                                                        : isPast 
                                                        ? 'bg-[#FFFDF7] border-[#E5E7EB]' 
                                                        : 'bg-[#F7F7F5] border-[#E5E7EB] opacity-70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isCurrent 
                                                            ? 'bg-[#D71920] text-white font-black shadow-md' 
                                                            : isPast 
                                                            ? 'bg-[#FEF9C3] text-[#D71920] border-2 border-[#FFCC00]' 
                                                            : 'bg-white text-[#94A3B8] border-2 border-[#E5E7EB]'
                                                    }`}>
                                                        {isPast ? <Icon name="check" size={15} /> : isCurrent ? <Icon name="bus" size={15} /> : idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-heading ${isCurrent ? 'text-[#D71920] font-black' : isPast ? 'text-[#171717] font-bold' : 'text-[#64748B]'}`}>
                                                            {s.name}
                                                        </div>
                                                        <div className="text-[10px] text-[#64748B]">Checkpoint #{idx + 1}</div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    {isCurrent && (
                                                        <span className="inline-flex items-center gap-1.5 bg-[#D71920] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                            <span>Current Location</span>
                                                        </span>
                                                    )}
                                                    {isPast && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            <Icon name="check" size={12} />
                                                            <span>Passed</span>
                                                        </span>
                                                    )}
                                                    {!isPast && !isCurrent && (
                                                        <span className="text-[11px] font-semibold text-[#94A3B8]">
                                                            Upcoming
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Notification Subscription Modal */}
                {showNotifyModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E5E7EB] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                            <h3 className="font-heading font-black text-lg text-[#171717] mb-2">Arrival Alerts</h3>
                            <p className="text-xs text-[#64748B] mb-5">Receive instant alerts when {selectedBus.bus_number} updates its checkpoint</p>

                            <div className="space-y-4 mb-6 text-xs">
                                <div>
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Alert on Checkpoint</label>
                                    <select
                                        value={notifyPrefs.selected_stop_id}
                                        onChange={e => setNotifyPrefs({ ...notifyPrefs, selected_stop_id: e.target.value, notify_my_stop: true })}
                                        className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                    >
                                        <option value="">-- Choose Arrival Stop --</option>
                                        {selectedBus.stops && selectedBus.stops.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={notifyPrefs.notify_trip_start}
                                        onChange={e => setNotifyPrefs({ ...notifyPrefs, notify_trip_start: e.target.checked })}
                                        className="accent-[#D71920]"
                                    />
                                    <span className="font-semibold text-[#171717]">Alert when trip departs</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={notifyPrefs.notify_destination}
                                        onChange={e => setNotifyPrefs({ ...notifyPrefs, notify_destination: e.target.checked })}
                                        className="accent-[#D71920]"
                                    />
                                    <span className="font-semibold text-[#171717]">Alert on final terminal arrival</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowNotifyModal(false)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                                <button onClick={saveNotifications} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Save Preferences</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F7F5] text-[#171717] pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
            {/* Header Title */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse"></span>
                    <span>ಕರ್ನಾಟಕ ಸಾರಿಗೆ • PASSENGER LIVE TELEMETRY</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#171717]">Track Your Bus Live</h1>
                <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">Real-time stop verification directly updated from conductor ticket machines across Karnataka.</p>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                {['All Active Buses', 'Bengaluru Corridors', 'Express Routes', 'Airport Links', 'Mysuru Line'].map((filter, i) => (
                    <button key={i} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-[#D71920] text-white shadow-sm' : 'bg-white text-[#171717] border border-[#E5E7EB] hover:border-[#D71920]'}`}>
                        {filter}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative mb-8">
                <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input 
                    type="text" 
                    placeholder="Search bus number (e.g. KA-01-1234), route, or destination..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#E5E7EB] text-sm text-[#171717] font-medium outline-none focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/10 shadow-sm transition-all"
                />
            </div>

            {/* Content View */}
            {view === 'route_buses' && selectedRoute && (
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                        <button onClick={() => { setSelectedRoute(null); setView('list'); }} className="text-xs font-bold text-[#475569] flex items-center gap-1.5 hover:text-[#D71920]">
                            <Icon name="arrow-left" size={14} /> Back to all routes
                        </button>
                        <span className="text-xs font-bold text-[#D71920]">{routeBuses.length} Active Bus(es) on this route</span>
                    </div>

                    <div className="grid gap-4">
                        {routeBuses.map(b => (
                            <div key={b.bus_id} onClick={() => { setSelectedBus(b); setView('bus_detail'); }} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#D71920] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center">
                                        <Icon name="bus" size={24} />
                                    </div>
                                    <div>
                                        <div className="font-heading font-black text-lg text-[#171717]">{b.bus_number}</div>
                                        <div className="text-xs text-[#64748B]">Last reported stop: <strong className="text-[#D71920]">{b.current_stop_name || 'In Transit'}</strong></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-[#D71920] flex items-center gap-1">
                                        <span>Track Live</span>
                                        <Icon name="arrow-right" size={14} />
                                    </div>
                                    <div className="text-[10px] text-[#94A3B8] mt-1">{timeAgo(b.last_update)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'list' && (
                <div className="space-y-4">
                    {loading && (
                        <div className="text-center py-12 text-[#64748B] text-sm">
                            <Icon name="refresh-cw" size={24} className="animate-spin text-[#D71920] mx-auto mb-2" />
                            <span>Updating live fleet locations...</span>
                        </div>
                    )}

                    {!loading && buses.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-[#F7F7F5] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 text-[#94A3B8]">
                                <Icon name="bus" size={32} />
                            </div>
                            <h3 className="font-heading font-black text-lg text-[#171717] mb-1">No Active Buses Matching Search</h3>
                            <p className="text-xs text-[#64748B]">Try searching for other routes or clear your search query.</p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        {buses.map(b => (
                            <div key={b.bus_id} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#D71920] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-heading font-black text-lg text-[#171717] flex items-center gap-2">
                                                <span>{b.bus_number}</span>
                                                <button onClick={() => toggleSaveBus(b.bus_number)} className="text-[#94A3B8] hover:text-[#D71920]">
                                                    <Icon name="bookmark" size={14} className={savedBuses.includes(b.bus_number) ? "fill-[#D71920] text-[#D71920]" : ""} />
                                                </button>
                                            </div>
                                            <div className="text-xs font-semibold text-[#D71920]">{b.route_name}</div>
                                        </div>
                                        {getStatusBadge(b.status, translateStatus(b.status))}
                                    </div>

                                    <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#E5E7EB] mb-4 text-xs">
                                        <div className="text-[10px] text-[#64748B] font-bold uppercase">Current Reported Checkpoint</div>
                                        <div className="font-heading font-bold text-sm text-[#171717] mt-0.5 flex items-center gap-1.5">
                                            <Icon name="map-pin" size={14} className="text-[#D71920]" />
                                            <span>{b.current_stop_name || 'En Route'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                                    <span className="text-[11px] text-[#64748B]">{timeAgo(b.last_update)}</span>
                                    <button 
                                        onClick={() => { setSelectedBus(b); setView('bus_detail'); }} 
                                        className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                        <span>Track Live</span>
                                        <Icon name="arrow-right" size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
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
            if (data.active) { setSession(data); fetchStops(data.route_id); }
        });
    }, [machineCode]);

    const fetchStops = (routeId) => fetch(`${API_BASE}/routes/${routeId}/stops`).then(r => r.json()).then(setRouteStops);

    const startTrip = async () => {
        if (!busNumber.trim()) return alert("Enter bus number");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/trip/start`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ machine_code: machineCode, bus_number: busNumber.toUpperCase() })
            });
            const data = await res.json();
            if (res.ok) {
                const sRes = await fetch(`${API_BASE}/machine-session/${machineCode}`);
                const sData = await sRes.json();
                setSession(sData);
                fetchStops(sData.route_id);
            } else alert(data.detail);
        } catch (err) { alert("Error starting trip"); }
        setLoading(false);
    };

    const reportStop = async (stopId) => {
        setConfirmStop(null);
        const res = await fetch(`${API_BASE}/trip/update`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ machine_code: machineCode, stop_id: stopId })
        });
        if (res.ok) {
            setSession(prev => ({...prev, current_stop_id: stopId}));
            setToast(`✓ CHECKPOINT REPORTED:${routeStops.find(s=>s.id===stopId)?.name} synced.`);
            setTimeout(() => setToast(null), 2500);
        } else alert((await res.json()).detail);
    };

    const endTrip = async () => {
        const res = await fetch(`${API_BASE}/trip/end`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ machine_code: machineCode })
        });
        if (res.ok) { 
            setConfirmEnd(false);
            setSession(null); 
            setBusNumber(''); 
            setToast("✓ TRIP COMPLETED:Machine returned to available pool.");
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-3 md:p-6 text-[#171717] font-sans">
            <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header (Karnataka Hardware Terminal Styling) */}
                <div className="bg-[#171717] p-4 flex justify-between items-center text-white relative">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#171717] shadow-sm">
                            <Icon name="bus" size={20} />
                        </div>
                        <div>
                            <div className="font-heading font-black text-base tracking-wider text-white">BUSSYNC POS</div>
                            <div className="text-[10px] text-[#FFCC00] font-bold tracking-widest uppercase">KARNATAKA TICKET MACHINE</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">{machineCode}</div>
                        <div className="text-[10px] font-bold tracking-wider uppercase flex items-center justify-end gap-1.5 text-[#FFCC00]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] animate-pulse"></span> Connected
                        </div>
                    </div>
                </div>
                
                {/* Dual Stripe Accent */}
                <div className="h-1 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>

                {toast && (
                    <div className="absolute top-20 left-4 right-4 bg-[#FEF9C3] border-2 border-[#FDE047] text-[#D71920] font-bold px-4 py-3 rounded-2xl shadow-xl z-50 text-center animate-in fade-in">
                        <div className="font-heading text-sm">{toast.split(':')[0]}</div>
                        {toast.split(':')[1] && <div className="text-xs font-medium text-[#171717] mt-0.5">{toast.split(':')[1]}</div>}
                    </div>
                )}

                {!session ? (
                    <div className="p-6 md:p-8 flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#D71920] mb-2 shadow-sm">
                            <Icon name="ticket" size={36} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-heading font-black text-[#171717]">Start Conductor Shift</h2>
                            <p className="text-xs text-[#64748B] mt-1">Bind this terminal dynamically to an active Karnataka bus</p>
                        </div>

                        <div className="w-full space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Terminal Machine Code</label>
                                <input 
                                    type="text" 
                                    value={machineCode} 
                                    onChange={e=>setMachineCode(e.target.value.toUpperCase())} 
                                    className="w-full bg-[#F7F7F5] border border-[#E5E7EB] rounded-2xl p-3.5 text-center font-mono font-bold text-xl text-[#171717] outline-none focus:border-[#D71920] uppercase" 
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Bus Registration Number</label>
                                <input 
                                    type="text" 
                                    value={busNumber} 
                                    onChange={e=>setBusNumber(e.target.value.toUpperCase())} 
                                    placeholder="KA-01-1234" 
                                    className="w-full bg-[#F7F7F5] border border-[#E5E7EB] rounded-2xl p-3.5 text-center font-heading font-black text-2xl text-[#171717] placeholder:text-[#CBD5E1] outline-none focus:border-[#D71920] uppercase tracking-wider" 
                                />
                            </div>

                            <button 
                                onClick={startTrip} 
                                disabled={loading} 
                                className="w-full bg-[#D71920] hover:bg-[#B9141A] text-white font-heading font-black text-xl py-5 rounded-2xl shadow-lg transition-all disabled:opacity-50 tracking-wider mt-4"
                            >
                                {loading ? 'CONNECTING...' : 'START TRIP'}
                            </button>
                        </div>

                        <div className="text-center text-[11px] text-[#64748B] pt-2">
                            <span>Dynamic Session Protocol • No GPS tracking</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col h-full space-y-5">
                        
                        {/* Trip Summary Card */}
                        <div className="bg-[#FFFDF7] border border-[#E5E7EB] rounded-2xl p-4 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-[#64748B] font-bold uppercase">Bus Assigned</div>
                                <div className="text-2xl font-heading font-black text-[#171717]">{session.bus_number}</div>
                                <div className="text-xs text-[#D71920] font-bold mt-0.5">{session.route_name}</div>
                            </div>
                            <button
                                onClick={() => setConfirmEnd(true)}
                                className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#D71920] font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                            >
                                End Trip
                            </button>
                        </div>

                        {/* Sequential Checkpoints Selector (Massive Tactile Buttons) */}
                        <div className="space-y-2 flex-1">
                            <div className="text-xs font-bold uppercase text-[#64748B] flex justify-between">
                                <span>Report Checkpoint Stop</span>
                                <span className="text-[#D71920]">Tap to Sync</span>
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {routeStops.map((stop, idx) => {
                                    const isCurrent = session.current_stop_id === stop.id;
                                    return (
                                        <button
                                            key={stop.id}
                                            onClick={() => reportStop(stop.id)}
                                            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                                isCurrent 
                                                    ? 'bg-[#FEF9C3] border-2 border-[#FDE047] text-[#D71920] shadow-sm'
                                                    : 'bg-[#F7F7F5] border-[#E5E7EB] hover:bg-[#FFFDF7] text-[#171717]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isCurrent ? 'bg-[#D71920] text-white font-black' : 'bg-white text-[#475569] border border-[#E5E7EB]'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-heading font-black text-base">{stop.name}</span>
                                            </div>
                                            {isCurrent && (
                                                <span className="text-xs font-bold text-[#D71920] bg-white px-2.5 py-1 rounded-full border border-[#FDE047]">
                                                    ● Current
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* End Trip Confirmation Modal */}
                        {confirmEnd && (
                            <div className="absolute inset-0 bg-white/95 p-6 rounded-3xl flex flex-col items-center justify-center text-center z-50 animate-in fade-in">
                                <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center text-[#D71920] mb-4">
                                    <Icon name="alert-triangle" size={32} />
                                </div>
                                <h3 className="font-heading font-black text-2xl text-[#171717] mb-1">End This Trip?</h3>
                                <p className="text-xs text-[#64748B] mb-6">The machine session will be released and returned to the pool.</p>
                                <div className="flex gap-3 w-full">
                                    <button onClick={() => setConfirmEnd(false)} className="flex-1 py-3 text-xs font-bold text-[#64748B] bg-[#F7F7F5] rounded-xl">Cancel</button>
                                    <button onClick={endTrip} className="flex-1 py-3 text-xs font-bold text-white bg-[#D71920] rounded-xl hover:bg-[#B9141A]">Confirm End</button>
                                </div>
                            </div>
                        )}

                        <div className="text-center text-[10px] text-[#64748B]">
                            <Link to="/" className="hover:text-[#D71920] font-bold">← Back to Portal Home</Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// ======== Page: Admin Dashboard (BUSSYNC KARNATAKA MOBILITY CONTROL CENTER) ========
const AdminPage = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
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
    const [newRoute, setNewRoute] = useState({ name: '', origin: '', destination: '', status: 'Active' });
    const [editingRoute, setEditingRoute] = useState(null);

    const [showAddConductor, setShowAddConductor] = useState(false);
    const [newConductor, setNewConductor] = useState({ conductor_id: '', name: '', phone: '', status: 'Active' });
    const [editingConductor, setEditingConductor] = useState(null);

    const [showAddMachine, setShowAddMachine] = useState(false);
    const [newMachineCode, setNewMachineCode] = useState('');

    const [showCreateTrip, setShowCreateTrip] = useState(false);
    const [newTrip, setNewTrip] = useState({ bus_id: '', route_id: '', conductor_id: '', machine_id: '' });
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
        fetch(`${API_BASE}/dashboard/kpis`)
            .then(r => r.json())
            .then(d => {
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
    const handleOpenTrackModal = (trip) => {
        setTrackingTrip(trip);
        const routeId = trip.route_id || (trip.route && trip.route.id);
        if (routeId) {
            fetch(`${API_BASE}/routes/${routeId}/stops`)
                .then(r => r.json())
                .then(setTrackingRouteStops)
                .catch(() => setTrackingRouteStops([]));
        } else {
            setTrackingRouteStops([]);
        }
    };

    // Route Stops Management
    const loadRouteStops = (route) => {
        setViewingRoute(route);
        fetch(`${API_BASE}/routes/${route.id}/stops`)
            .then(r => r.json())
            .then(setRouteStops)
            .catch(() => setRouteStops([]));
    };

    const handleAddStopToRoute = async () => {
        if (!newStopNameToRoute.trim() || !viewingRoute) return;
        const res = await fetch(`${API_BASE}/routes/${viewingRoute.id}/stops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newStopNameToRoute.trim() })
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
        
        const reordered = newStops.map((s, idx) => ({ id: s.id, stop_order: idx + 1 }));
        setRouteStops(newStops);

        await fetch(`${API_BASE}/routes/${viewingRoute.id}/stops/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stops: reordered })
        });
        fetchAllAdminData();
    };

    const handleDeleteStopFromRoute = async (stopId) => {
        if (!confirm('Are you sure you want to delete this stop?')) return;
        const res = await fetch(`${API_BASE}/stops/${stopId}`, { method: 'DELETE' });
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bus_number: newBusNumber.trim().toUpperCase(), status: 'Active' })
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

    const handleToggleBus = async (busId) => {
        const res = await fetch(`${API_BASE}/admin/buses/${busId}/toggle`, { method: 'POST' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Cannot change bus status');
        }
    };

    const handleEditBus = async () => {
        if (!editingBus || !editingBus.bus_number.trim()) return;
        const res = await fetch(`${API_BASE}/admin/buses/${editingBus.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bus_number: editingBus.bus_number.trim().toUpperCase() })
        });
        if (res.ok) {
            setEditingBus(null);
            fetchAllAdminData();
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to update bus');
        }
    };

    const handleDeleteBus = async (bus) => {
        if (!confirm(`Delete bus ${bus.bus_number}?`)) return;
        const res = await fetch(`${API_BASE}/admin/buses/${bus.id}`, { method: 'DELETE' });
        if (res.ok) fetchAllAdminData();
        else alert('Failed to delete bus.');
    };

    // Route Actions
    const handleAddRoute = async () => {
        if (!newRoute.name.trim() || !newRoute.origin.trim() || !newRoute.destination.trim()) {
            return alert('Please fill in route name, origin, and destination.');
        }
        const res = await fetch(`${API_BASE}/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoute)
        });
        if (res.ok) {
            setNewRoute({ name: '', origin: '', destination: '', status: 'Active' });
            setShowAddRoute(false);
            fetchAllAdminData();
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to add route');
        }
    };

    const handleToggleRoute = async (routeId) => {
        const res = await fetch(`${API_BASE}/admin/routes/${routeId}/toggle`, { method: 'POST' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Cannot change route status');
        }
    };

    const handleEditRoute = async () => {
        if (!editingRoute || !editingRoute.name.trim()) return;
        const res = await fetch(`${API_BASE}/admin/routes/${editingRoute.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

    const handleDeleteRoute = async (route) => {
        if (!confirm(`Delete route ${route.name}? All attached stops will be deleted.`)) return;
        const res = await fetch(`${API_BASE}/admin/routes/${route.id}`, { method: 'DELETE' });
        if (res.ok) fetchAllAdminData();
        else alert('Failed to delete route.');
    };

    // Conductor Actions
    const handleAddConductor = async () => {
        if (!newConductor.conductor_id.trim() || !newConductor.name.trim()) {
            return alert('Please enter conductor ID and name.');
        }
        const res = await fetch(`${API_BASE}/admin/conductors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConductor)
        });
        if (res.ok) {
            setNewConductor({ conductor_id: '', name: '', phone: '', status: 'Active' });
            setShowAddConductor(false);
            fetchAllAdminData();
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to add conductor');
        }
    };

    const handleToggleConductor = async (conductorId) => {
        const res = await fetch(`${API_BASE}/admin/conductors/${conductorId}/toggle`, { method: 'POST' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Cannot change conductor status');
        }
    };

    const handleEditConductor = async () => {
        if (!editingConductor || !editingConductor.name.trim()) return;
        const res = await fetch(`${API_BASE}/admin/conductors/${editingConductor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

    const handleDeleteConductor = async (cond) => {
        if (!confirm(`Delete conductor ${cond.conductor_id} (${cond.name})?`)) return;
        const res = await fetch(`${API_BASE}/admin/conductors/${cond.id}`, { method: 'DELETE' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Failed to delete conductor');
        }
    };

    // Machine Actions
    const handleAddMachine = async () => {
        if (!newMachineCode.trim()) return;
        const res = await fetch(`${API_BASE}/machines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ machine_code: newMachineCode.trim().toUpperCase(), status: 'Available' })
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

    const handleToggleMachine = async (machineId) => {
        const res = await fetch(`${API_BASE}/admin/machines/${machineId}/toggle`, { method: 'POST' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Cannot change machine status');
        }
    };

    const handleDeleteMachine = async (m) => {
        if (!confirm(`Delete machine ${m.machine_code}?`)) return;
        const res = await fetch(`${API_BASE}/admin/machines/${m.id}`, { method: 'DELETE' });
        if (res.ok) fetchAllAdminData();
        else alert('Failed to delete machine.');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setNewTrip({ bus_id: '', route_id: '', conductor_id: '', machine_id: '' });
            setShowCreateTrip(false);
            fetchAllAdminData();
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to schedule trip');
        }
    };

    const handleCancelTrip = async (tripId) => {
        if (!confirm('Cancel this scheduled trip?')) return;
        const res = await fetch(`${API_BASE}/admin/trips/${tripId}/cancel`, { method: 'POST' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Failed to cancel trip');
        }
    };

    // Edit Stop (Global)
    const handleEditStopGlobal = async () => {
        if (!editingStop || !editingStop.name.trim()) return;
        const res = await fetch(`${API_BASE}/stops/${editingStop.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingStop.name.trim() })
        });
        if (res.ok) {
            setEditingStop(null);
            fetchAllAdminData();
        } else {
            alert('Failed to update stop');
        }
    };

    const handleDeleteStopGlobal = async (stopId) => {
        if (!confirm('Are you sure you want to delete this stop?')) return;
        const res = await fetch(`${API_BASE}/stops/${stopId}`, { method: 'DELETE' });
        if (res.ok) fetchAllAdminData();
        else {
            const err = await res.json();
            alert(err.detail || 'Failed to delete stop');
        }
    };

    // Format helper
    const formatDateTime = (ts) => {
        if (!ts) return '—';
        try {
            const d = new Date(ts);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch { return ts; }
    };

    // Karnataka Regional Transport Hubs Data
    const karnatakaRegions = [
        {
            id: 'bengaluru',
            name: 'Bengaluru',
            knName: 'ಬೆಂಗಳೂರು',
            corridors: 'Majestic • Silk Board • Hebbal',
            tag: 'Capital Hub',
            accent: '#D71920'
        },
        {
            id: 'mysuru',
            name: 'Mysuru',
            knName: 'ಮೈಸೂರು',
            corridors: 'Columbia Asia • Mandya • Ramanagara',
            tag: 'Heritage Corridor',
            accent: '#FFCC00'
        },
        {
            id: 'tumakuru',
            name: 'Tumakuru',
            knName: 'ತುಮಕೂರು',
            corridors: 'Kunigal • Nelamangala • Kyatsandra',
            tag: 'Industrial Expressway',
            accent: '#D71920'
        },
        {
            id: 'mangaluru',
            name: 'Mangaluru',
            knName: 'ಮಂಗಳೂರು',
            corridors: 'Udupi • Hassan • Shiradi Ghat',
            tag: 'Coastal Transit Hub',
            accent: '#FFCC00'
        },
        {
            id: 'hubballi',
            name: 'Hubballi-Dharwad',
            knName: 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ',
            corridors: 'Dharwad • Haveri • Gadag',
            tag: 'North Karnataka Junction',
            accent: '#D71920'
        },
        {
            id: 'shivamogga',
            name: 'Shivamogga',
            knName: 'ಶಿವಮೊಗ್ಗ',
            corridors: 'Bhadravathi • Tarikere • Sagar',
            tag: 'Malnad Regional Link',
            accent: '#FFCC00'
        },
        {
            id: 'belagavi',
            name: 'Belagavi',
            knName: 'ಬೆಳಗಾವಿ',
            corridors: 'Kittur • Khanapur • Suvarna Soudha',
            tag: 'Border Gateway Corridor',
            accent: '#D71920'
        }
    ];

    // ======== AUTHENTICATION VIEW ========
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6 relative font-sans text-[#171717]">
                <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-6">
                    <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#E5E7EB] relative overflow-hidden">
                        {/* Top Dual Accent Stripe */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>
                        
                        <div className="w-16 h-16 rounded-2xl bg-[#FFCC00] flex items-center justify-center mx-auto mb-5 shadow-md">
                            <Icon name="bus" size={32} className="text-[#171717]" />
                        </div>

                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-heading font-black tracking-wider text-[#171717]">
                                BUSSYNC
                            </h1>
                            <div className="text-[11px] font-heading font-bold text-[#D71920] tracking-widest uppercase mt-0.5">
                                SYNC THE MOTION.
                            </div>
                            <div className="text-sm font-semibold text-[#171717] mt-3">
                                Karnataka Mobility Control Center
                            </div>
                            <div className="text-xs text-[#64748B] font-medium mt-0.5">
                                ಕರ್ನಾಟಕ ಸಾರಿಗೆ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ
                            </div>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-[11px] text-[#64748B] mb-2 block font-bold tracking-wider uppercase">
                                    Supervisor Passcode (Default: admin)
                                </label>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => { setPassword(e.target.value); setError(false); }} 
                                    onKeyDown={e => { if (e.key === 'Enter' && password) handleLogin(); }} 
                                    className={`w-full bg-[#FFFDF7] border ${error ? 'border-[#D71920] focus:border-[#D71920] ring-1 ring-[#D71920]' : 'border-[#E5E7EB] focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]'} rounded-xl p-3.5 text-[#171717] outline-none transition-all tracking-widest text-center text-lg shadow-sm`} 
                                    placeholder="••••••••" 
                                />
                                {error && <div className="text-[#D71920] text-xs font-bold text-center mt-2">Invalid operator passcode</div>}
                            </div>
                            <button 
                                onClick={handleLogin} 
                                disabled={!password} 
                                className="w-full bg-[#D71920] hover:bg-[#B9141A] text-white font-heading font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                            >
                                <Icon name="lock" size={16} />
                                <span>Authenticate Session</span>
                            </button>
                        </div>
                        
                        <div className="mt-8 text-center text-[11px] text-[#64748B] flex items-center justify-center gap-2 border-t border-[#E5E7EB] pt-4">
                            <span className="w-2 h-2 rounded-full bg-[#FFCC00]"></span>
                            <span>Deterministic Checkpoint Engine • Stop-Based Sync</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ======== NAVIGATION ITEMS ========
    const navItems = [
        { id: 'Dashboard', icon: 'layout-dashboard', label: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
        { id: 'Buses', icon: 'bus', label: 'Buses', kn: 'ಬಸ್‌ಗಳು' },
        { id: 'Routes', icon: 'map', label: 'Routes', kn: 'ಮಾರ್ಗಗಳು' },
        { id: 'Stops', icon: 'map-pin', label: 'Stops', kn: 'ನಿಲ್ದಾಣಗಳು' },
        { id: 'Conductors', icon: 'users', label: 'Conductors', kn: 'ನಿರ್ವಾಹಕರು' },
        { id: 'Machines', icon: 'cpu', label: 'Machines', kn: 'ಯಂತ್ರಗಳು' },
        { id: 'Assign Trips', icon: 'clock', label: 'Assign Trips', kn: 'ಪ್ರಯಾಣ ಹಂಚಿಕೆ' },
        { id: 'Monitoring', icon: 'activity', label: 'Monitoring', kn: 'ಲೈವ್ ನಿಗಾ' },
        { id: 'Reports', icon: 'bar-chart-2', label: 'Reports', kn: 'ವರದಿಗಳು' }
    ];

    return (
        <div className="min-h-screen bg-[#F7F7F5] text-[#171717] font-sans flex flex-col antialiased">
            
            {/* 1. TOP HEADER (Clean White with Red + Yellow Accent Stripe) */}
            <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-sm">
                <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
                    
                    {/* Left Branding */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setMobileNavOpen(!mobileNavOpen)}
                            className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#171717] hover:bg-[#F7F7F5]"
                        >
                            <Icon name="menu" size={20} />
                        </button>

                        <div className="w-10 h-10 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#171717] shadow-sm shrink-0">
                            <Icon name="bus" size={22} className="text-[#171717]" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-heading font-black text-[#171717] text-lg tracking-wider">BUSSYNC</span>
                                <span className="hidden sm:inline-block text-[10px] font-heading font-bold text-[#D71920] bg-[#FEE2E2] border border-[#FECACA] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    CONTROL CENTER
                                </span>
                            </div>
                            <div className="text-[10px] font-heading font-bold text-[#D71920] tracking-widest uppercase">
                                SYNC THE MOTION.
                            </div>
                        </div>

                        <div className="hidden xl:block h-7 w-px bg-[#E5E7EB] mx-2"></div>

                        <div className="hidden xl:block">
                            <div className="text-xs font-bold text-[#171717]">Karnataka Mobility Control Center</div>
                            <div className="text-[11px] text-[#64748B]">ಕರ್ನಾಟಕ ಸಾರಿಗೆ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ</div>
                        </div>
                    </div>

                    {/* Right Tools */}
                    <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
                        
                        {/* Search Bar */}
                        <div className="hidden lg:flex items-center gap-2 bg-[#F7F7F5] border border-[#E5E7EB] rounded-full px-3 py-1.5 w-52 focus-within:w-64 focus-within:border-[#D71920] transition-all">
                            <Icon name="search" size={14} className="text-[#64748B]" />
                            <input 
                                type="text"
                                placeholder="Search buses, routes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-[#171717] w-full placeholder:text-[#94A3B8]"
                            />
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button 
                                onClick={() => alert("Notification Center: All Karnataka fleet check-ins normal.")}
                                className="p-2 text-[#64748B] hover:text-[#D71920] hover:bg-[#FEF9C3] rounded-full transition-colors relative"
                                title="Notifications"
                            >
                                <Icon name="bell" size={16} />
                                <span className="w-2 h-2 rounded-full bg-[#D71920] absolute top-1.5 right-1.5"></span>
                            </button>
                        </div>

                        {/* Public App Links */}
                        <Link to="/passenger" className="hidden md:flex items-center gap-1.5 text-[#64748B] hover:text-[#D71920] transition-colors px-2 py-1">
                            <Icon name="smartphone" size={14} /> Passenger View
                        </Link>

                        <Link to="/machine" className="hidden md:flex items-center gap-1.5 text-[#64748B] hover:text-[#D71920] transition-colors px-2 py-1">
                            <Icon name="ticket" size={14} /> Terminal Mode
                        </Link>

                        {/* Supervisor Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] px-3 py-1.5 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse"></span>
                            <span>Admin • Supervisor</span>
                        </div>

                        {/* Logout */}
                        <button 
                            onClick={() => setIsLoggedIn(false)}
                            className="bg-white hover:bg-[#FEE2E2] text-[#D71920] border border-[#FECACA] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                        >
                            <Icon name="log-out" size={13} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Subtle Karnataka Red + Yellow Horizontal Accent Line */}
                <div className="h-[3px] w-full bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>
            </header>

            {/* BODY WRAPPER: SIDEBAR + MAIN CONTENT */}
            <div className="flex-1 flex w-full">
                
                {/* 2. SIDEBAR (Clean White with Red Active & Yellow Hover) */}
                <aside className={`w-64 bg-white border-r border-[#E5E7EB] shrink-0 p-4 flex-col justify-between z-30 transition-all duration-200 ${mobileNavOpen ? 'fixed inset-y-0 left-0 top-[65px] flex shadow-2xl' : 'hidden md:flex'}`}>
                    <div className="space-y-1">
                        <div className="px-3 py-2 text-[10px] font-heading font-bold text-[#64748B] uppercase tracking-wider">
                            Operations Menu
                        </div>

                        {navItems.map(item => {
                            const isActive = currentTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { 
                                        setCurrentTab(item.id); 
                                        setViewingRoute(null);
                                        setMobileNavOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all text-left ${
                                        isActive
                                            ? 'bg-[#D71920] text-white shadow-sm'
                                            : 'text-[#475569] hover:bg-[#FEF9C3] hover:text-[#D71920]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon name={item.icon} size={16} />
                                        <span>{item.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-normal ${isActive ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                                        {item.kn}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sidebar Footer Info Card */}
                    <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                        <div className="bg-[#FFFDF7] border border-[#E5E7EB] rounded-2xl p-3 text-xs">
                            <div className="flex items-center gap-2 text-[#D71920] font-bold mb-1">
                                <span className="w-2 h-2 rounded-full bg-[#FFCC00]"></span>
                                <span>Karnataka Transit Sync</span>
                            </div>
                            <div className="text-[11px] text-[#64748B]">KSRTC • BMTC Checkpoint Protocol</div>
                            <div className="text-[10px] text-[#94A3B8] mt-1 font-mono">Telemetry: Stop Sequence Active</div>
                        </div>
                    </div>
                </aside>

                {/* 3. MAIN CONTENT AREA */}
                <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
                    
                    {/* ========================================================= */}
                    {/* TAB 1: DASHBOARD */}
                    {/* ========================================================= */}
                    {currentTab === 'Dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            
                            {/* Dashboard Hero Banner */}
                            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1.5 z-10 max-w-2xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold">
                                        <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse"></span>
                                        <span>ಕರ್ನಾಟಕ ಸಾರಿಗೆ ಕಾರ್ಯಾಚರಣೆ</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#171717]">
                                        Karnataka Transport Operations
                                    </h1>
                                    <p className="text-sm text-[#64748B] leading-relaxed">
                                        Monitor buses, journeys and stop-based updates across Karnataka. Real-time deterministic telemetry verified through ticket machines.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 z-10">
                                    <button 
                                        onClick={fetchAllAdminData}
                                        className="bg-white hover:bg-[#FEF9C3] text-[#D71920] border border-[#D71920] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                                    >
                                        <Icon name="refresh-cw" size={14} />
                                        <span>Refresh Sync</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowCreateTrip(true)}
                                        className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                                    >
                                        <Icon name="plus-circle" size={14} />
                                        <span>Dispatch Trip</span>
                                    </button>
                                </div>

                                {/* Subtle Red/Yellow Watermark Shapes */}
                                <div className="absolute right-0 top-0 bottom-0 w-64 opacity-5 pointer-events-none flex items-center justify-center">
                                    <Icon name="map" size={160} className="text-[#D71920]" />
                                </div>
                            </div>

                            {/* 4 Large Premium KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                
                                {/* Card 1: Total Buses (Yellow Accent) */}
                                <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]">TOTAL BUSES</span>
                                        <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309]">
                                            <Icon name="bus" size={20} />
                                        </div>
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1">
                                        {kpis.total_buses || 0}
                                    </div>
                                    <div className="text-xs text-[#64748B]">Registered fleet ({kpis.active_buses || 0} currently on road)</div>
                                    <div className="h-1 w-12 bg-[#FFCC00] rounded-full mt-3"></div>
                                </div>

                                {/* Card 2: Active Trips (Red Accent) */}
                                <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]">ACTIVE TRIPS</span>
                                        <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#D71920]">
                                            <Icon name="activity" size={20} />
                                        </div>
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1 flex items-center gap-2">
                                        <span>{kpis.active_trips || 0}</span>
                                        {kpis.active_trips > 0 && (
                                            <span className="text-[10px] bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] px-2 py-0.5 rounded-full font-bold">
                                                ● Running
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-[#64748B]">Journeys actively reporting stops</div>
                                    <div className="h-1 w-12 bg-[#D71920] rounded-full mt-3"></div>
                                </div>

                                {/* Card 3: Machines (Yellow Accent) */}
                                <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]">MACHINES</span>
                                        <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309]">
                                            <Icon name="cpu" size={20} />
                                        </div>
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1">
                                        {kpis.total_machines || 0}
                                    </div>
                                    <div className="text-xs text-[#64748B]">{kpis.available_machines || 0} Available • {kpis.in_use_machines || 0} In Use</div>
                                    <div className="h-1 w-12 bg-[#FFCC00] rounded-full mt-3"></div>
                                </div>

                                {/* Card 4: Live Updates (Red Accent) */}
                                <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#64748B]">LIVE UPDATES</span>
                                        <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#D71920]">
                                            <Icon name="radio" size={20} />
                                        </div>
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-heading font-black text-[#171717] tabular-nums mb-1">
                                        {kpis.live_updates || 0}
                                    </div>
                                    <div className="text-xs text-[#64748B]">Checkpoint updates recorded today</div>
                                    <div className="h-1 w-12 bg-[#D71920] rounded-full mt-3"></div>
                                </div>
                            </div>

                            {/* Section: Live Monitoring Table */}
                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="p-5 lg:p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                            <h2 className="text-lg font-heading font-black text-[#171717]">LIVE MONITORING</h2>
                                            <span className="bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                                {journeys.filter(j => j.status === 'Active').length} Active
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#64748B] mt-1">Real-time stop updates from conductor ticket machines</p>
                                    </div>
                                    <button 
                                        onClick={fetchAllAdminData}
                                        className="text-xs font-bold text-[#D71920] hover:bg-[#FEF9C3] px-3 py-1.5 rounded-lg border border-[#E5E7EB] transition-colors flex items-center gap-1.5"
                                    >
                                        <Icon name="refresh-cw" size={12} /> Sync Telemetry
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Bus</th>
                                                <th className="p-4">Machine</th>
                                                <th className="p-4">Route</th>
                                                <th className="p-4">Conductor</th>
                                                <th className="p-4">Last Stop</th>
                                                <th className="p-4">Time</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right pr-6">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {journeys.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="p-10 text-center text-[#64748B]">
                                                        <Icon name="bus" size={32} className="mx-auto mb-2 text-[#94A3B8]" />
                                                        <div className="font-heading font-bold text-sm text-[#171717]">No Active Trips Running</div>
                                                        <p className="text-xs text-[#64748B] mt-0.5">Start a trip from the ticket machine to view real-time stop telemetry.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                journeys.map((j, idx) => {
                                                    const isRecent = j.display_status && (j.display_status.includes('Active') || j.display_status.includes('Travelling') || j.display_status.includes('LIVE'));
                                                    return (
                                                        <tr key={idx} className="hover:bg-[#FFFDF7] transition-colors">
                                                            <td className="p-4 pl-6 font-heading font-black text-[#171717]">
                                                                🚌 {j.bus_number}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="font-mono text-xs font-bold bg-[#F7F7F5] border border-[#E5E7EB] text-[#475569] px-2 py-0.5 rounded">
                                                                    {j.machine_code || '—'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 font-medium text-[#171717]">{j.route_name}</td>
                                                            <td className="p-4 text-xs text-[#64748B]">
                                                                {j.conductor_name || j.conductor_code || 'Assigned'}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="font-heading font-bold text-[#171717] text-xs flex items-center gap-1.5">
                                                                    <Icon name="map-pin" size={14} className="text-[#D71920]" />
                                                                    {j.current_stop || 'Departed'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-xs text-[#64748B] tabular-nums">
                                                                {timeAgo(j.last_reported_at)}
                                                            </td>
                                                            <td className="p-4">
                                                                {isRecent ? (
                                                                    <span className="bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] font-bold text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                                                        <span>● TRAVELLING</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-[#FEE2E2] text-[#D71920] border border-[#FECACA] font-bold text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                                                                        <Icon name="alert-circle" size={12} />
                                                                        <span>NO RECENT UPDATE</span>
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right pr-6">
                                                                <button
                                                                    onClick={() => handleOpenTrackModal(j)}
                                                                    className="bg-white hover:bg-[#FEF9C3] text-[#D71920] border border-[#D71920] font-heading font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm transition-all"
                                                                >
                                                                    <Icon name="navigation" size={12} />
                                                                    <span>Track</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section: Karnataka Route Network (Regional Transit Hubs) */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <h2 className="text-lg font-heading font-black text-[#171717]">Karnataka Route Network</h2>
                                        <p className="text-xs text-[#64748B]">Regional transportation corridors & verified checkpoint coverage</p>
                                    </div>
                                    <div className="text-xs font-bold text-[#D71920] bg-[#FEF9C3] border border-[#FDE047] px-3 py-1 rounded-full">
                                        7 Regional Hubs Operational
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {karnatakaRegions.map(hub => {
                                        const routeCount = adminRoutes.filter(r => r.name.toLowerCase().includes(hub.name.toLowerCase()) || (r.origin && r.origin.toLowerCase().includes(hub.name.toLowerCase()))).length;
                                        return (
                                            <div key={hub.id} className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-heading font-bold text-[#D71920] bg-[#FEE2E2] px-2 py-0.5 rounded-md">
                                                            {hub.tag}
                                                        </span>
                                                        <span className="text-xs font-medium text-[#64748B]">{hub.knName}</span>
                                                    </div>
                                                    <h3 className="font-heading font-black text-base text-[#171717]">{hub.name}</h3>
                                                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{hub.corridors}</p>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                                                    <span className="text-[#64748B]">Connected Routes:</span>
                                                    <span className="font-bold text-[#171717]">{routeCount > 0 ? routeCount : 'Active Sector'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section: Recent Activity & Analytics Dual Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Left: Recent Activity Feed */}
                                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
                                        <div className="flex items-center gap-2">
                                            <Icon name="clock" size={16} className="text-[#D71920]" />
                                            <h3 className="font-heading font-black text-base text-[#171717]">Recent Activity</h3>
                                        </div>
                                        <span className="text-[11px] text-[#64748B]">Real-time events</span>
                                    </div>

                                    <div className="space-y-3">
                                        {recentActivity.length === 0 ? (
                                            <div className="text-xs text-[#64748B] py-6 text-center">No recent activity recorded yet.</div>
                                        ) : (
                                            recentActivity.slice(0, 6).map((ev, i) => (
                                                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#FFFDF7] border border-transparent hover:border-[#E5E7EB] transition-colors text-xs">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#D71920] mt-1 shrink-0"></div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-[#171717]">
                                                            {ev.bus_number && <strong>{ev.bus_number} </strong>}
                                                            {ev.event_type === 'STOP_UPDATE' && `reported at ${ev.stop_name || 'Checkpoint'}`}
                                                            {ev.event_type === 'TRIP_START' && `started trip on ${ev.route_name || 'Route'}`}
                                                            {ev.event_type === 'TRIP_END' && `completed journey on ${ev.route_name || 'Route'}`}
                                                            {!['STOP_UPDATE','TRIP_START','TRIP_END'].includes(ev.event_type) && (ev.title || ev.event_type)}
                                                        </div>
                                                        <div className="text-[11px] text-[#64748B] mt-0.5">{ev.route_name && `${ev.route_name} • `}{timeAgo(ev.timestamp)}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Right: Trip Status Overview & Stop Updates */}
                                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
                                            <div className="flex items-center gap-2">
                                                <Icon name="bar-chart-2" size={16} className="text-[#D71920]" />
                                                <h3 className="font-heading font-black text-base text-[#171717]">Trip Status Overview</h3>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#D71920]">Today</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="bg-[#FEF9C3] p-3 rounded-xl border border-[#FDE047]">
                                                <div className="text-xl font-heading font-black text-[#D71920]">{kpis.active_trips || 0}</div>
                                                <div className="text-[10px] font-bold text-[#B45309] uppercase mt-0.5">Active</div>
                                            </div>
                                            <div className="bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E7EB]">
                                                <div className="text-xl font-heading font-black text-[#171717]">{kpis.scheduled_trips || 0}</div>
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase mt-0.5">Scheduled</div>
                                            </div>
                                            <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#E5E7EB]">
                                                <div className="text-xl font-heading font-black text-[#171717]">{kpis.completed_trips || 0}</div>
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase mt-0.5">Completed</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E7EB]">
                                            <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">Today's Stop Updates</h4>
                                            <span className="text-xs font-mono font-bold text-[#D71920]">{kpis.live_updates || 0} Total</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-[#64748B]">
                                                <span>Tumakuru Corridor</span>
                                                <span className="font-bold text-[#171717]">High Frequency</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#F7F7F5] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#D71920] rounded-full" style={{ width: '75%' }}></div>
                                            </div>

                                            <div className="flex justify-between text-xs text-[#64748B] pt-1">
                                                <span>Bengaluru - Mysuru Corridor</span>
                                                <span className="font-bold text-[#171717]">Normal Sync</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#F7F7F5] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#FFCC00] rounded-full" style={{ width: '50%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: BUSES */}
                    {/* ========================================================= */}
                    {currentTab === 'Buses' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            {/* Header Bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ಕರ್ನಾಟಕ ಬಸ್ ಫ್ಲೀಟ್</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Karnataka Bus Fleet</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Manage state-wide transit fleet records and trip assignments</p>
                                </div>
                                <button
                                    onClick={() => setShowAddBus(true)}
                                    className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Icon name="plus" size={14} />
                                    <span>+ Add Bus</span>
                                </button>
                            </div>

                            {/* Stat Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Total Buses</div>
                                    <div className="text-2xl font-heading font-black text-[#171717] mt-1">{adminBuses.length}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Active</div>
                                    <div className="text-2xl font-heading font-black text-[#D71920] mt-1">
                                        {adminBuses.filter(b => b.status === 'Active').length}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Inactive</div>
                                    <div className="text-2xl font-heading font-black text-[#64748B] mt-1">
                                        {adminBuses.filter(b => b.status !== 'Active').length}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">On Trip</div>
                                    <div className="text-2xl font-heading font-black text-[#FFCC00] mt-1">
                                        {adminBuses.filter(b => b.trip_status === 'Active').length}
                                    </div>
                                </div>
                            </div>

                            {/* Buses Table */}
                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Bus Number</th>
                                                <th className="p-4">Assigned Route</th>
                                                <th className="p-4">Current Stop</th>
                                                <th className="p-4">Trip Status</th>
                                                <th className="p-4">Machine Session</th>
                                                <th className="p-4">Last Update</th>
                                                <th className="p-4 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {adminBuses.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-[#64748B]">No buses registered yet.</td>
                                                </tr>
                                            ) : (
                                                adminBuses.map(b => (
                                                    <tr key={b.id} className="hover:bg-[#FFFDF7] transition-colors">
                                                        <td className="p-4 pl-6 font-heading font-black text-[#171717]">
                                                            🚌 {b.bus_number}
                                                        </td>
                                                        <td className="p-4 text-xs font-medium text-[#171717]">{b.route_name || '—'}</td>
                                                        <td className="p-4 text-xs text-[#64748B]">{b.current_stop_name || 'Depot'}</td>
                                                        <td className="p-4">
                                                            {b.trip_status === 'Active' ? (
                                                                <span className="bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                                                    <span>Running</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-[#64748B] bg-[#F7F7F5] px-2 py-0.5 rounded">Idle</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-xs font-mono font-bold text-[#475569]">
                                                            {b.machine_code ? `📟 ${b.machine_code}` : 'Unpaired'}
                                                        </td>
                                                        <td className="p-4 text-xs text-[#64748B] tabular-nums">{timeAgo(b.last_update)}</td>
                                                        <td className="p-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleToggleBus(b.id)}
                                                                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                                        b.status === 'Active'
                                                                            ? 'bg-[#FEE2E2] text-[#D71920] border-[#FECACA] hover:bg-[#FCA5A5]'
                                                                            : 'bg-[#FEF9C3] text-[#D71920] border-[#FDE047] hover:bg-[#FEF08A]'
                                                                    }`}
                                                                >
                                                                    {b.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingBus(b)}
                                                                    className="p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg hover:bg-[#F7F7F5]"
                                                                    title="Edit"
                                                                >
                                                                    <Icon name="edit-2" size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBus(b)}
                                                                    className="p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
                                                                    title="Delete"
                                                                >
                                                                    <Icon name="trash" size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: ROUTES */}
                    {/* ========================================================= */}
                    {currentTab === 'Routes' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ಕರ್ನಾಟಕ ಮಾರ್ಗಗಳು ಮತ್ತು ನಿಲ್ದಾಣಗಳು</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Karnataka Routes & Stops</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Manage fixed sequential checkpoints for deterministic stop tracking</p>
                                </div>
                                <button
                                    onClick={() => setShowAddRoute(true)}
                                    className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Icon name="plus" size={14} />
                                    <span>+ Add Route</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {adminRoutes.map(r => (
                                    <div key={r.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-heading font-bold bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] px-2 py-0.5 rounded-full">
                                                    Route #{r.id}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Active' ? 'bg-[#FEE2E2] text-[#D71920]' : 'bg-[#F7F7F5] text-[#64748B]'}`}>
                                                    {r.status}
                                                </span>
                                            </div>
                                            <h3 className="font-heading font-black text-lg text-[#171717]">{r.name}</h3>
                                            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
                                                <span>Origin: <strong>{r.origin || '—'}</strong></span>
                                                <span>→</span>
                                                <span>Dest: <strong>{r.destination || '—'}</strong></span>
                                            </div>
                                            <div className="text-xs text-[#475569] mt-3 bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E5E7EB]">
                                                <span>Checkpoints: </span>
                                                <strong className="text-[#D71920]">{r.stops_count || 0} stops configured</strong>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => loadRouteStops(r)}
                                                className="bg-[#FEF9C3] hover:bg-[#FDE047] text-[#D71920] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                                            >
                                                <Icon name="list" size={13} />
                                                <span>Manage Stops</span>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleToggleRoute(r.id)}
                                                    className="p-1.5 text-[#64748B] hover:text-[#D71920] rounded-lg"
                                                    title="Toggle Status"
                                                >
                                                    <Icon name="power" size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingRoute(r)}
                                                    className="p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Icon name="edit-2" size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoute(r)}
                                                    className="p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: STOPS */}
                    {/* ========================================================= */}
                    {currentTab === 'Stops' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ನಿಲ್ದಾಣಗಳು</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Transit Stops Directory</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">List of verified physical bus stops along Karnataka transit routes</p>
                                </div>
                                <div className="text-xs text-[#64748B]">Total Stops: <strong className="text-[#171717]">{adminStops.length}</strong></div>
                            </div>

                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Stop Name</th>
                                                <th className="p-4">Associated Route</th>
                                                <th className="p-4">Sequence Order</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {adminStops.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="p-8 text-center text-[#64748B]">No stops created yet.</td>
                                                </tr>
                                            ) : (
                                                adminStops.map(s => (
                                                    <tr key={s.id} className="hover:bg-[#FFFDF7] transition-colors">
                                                        <td className="p-4 pl-6 font-heading font-bold text-[#171717] flex items-center gap-2">
                                                            <Icon name="map-pin" size={14} className="text-[#D71920]" />
                                                            <span>{s.name}</span>
                                                        </td>
                                                        <td className="p-4 text-xs text-[#475569]">{s.route_name || '—'}</td>
                                                        <td className="p-4 text-xs font-mono font-bold text-[#D71920]">
                                                            Stop #{s.stop_order}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-[10px] font-bold bg-[#FEF9C3] text-[#D71920] px-2 py-0.5 rounded-full">
                                                                {s.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setEditingStop(s)}
                                                                    className="p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg"
                                                                    title="Edit"
                                                                >
                                                                    <Icon name="edit-2" size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStopGlobal(s.id)}
                                                                    className="p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
                                                                    title="Delete"
                                                                >
                                                                    <Icon name="trash" size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: CONDUCTORS */}
                    {/* ========================================================= */}
                    {currentTab === 'Conductors' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ನಿರ್ವಾಹಕರ ನಿರ್ವಹಣೆ</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Conductor Management</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Manage onboard ticket machine operators and verified shift check-ins</p>
                                </div>
                                <button
                                    onClick={() => setShowAddConductor(true)}
                                    className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Icon name="plus" size={14} />
                                    <span>+ Add Conductor</span>
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Conductor ID</th>
                                                <th className="p-4">Name</th>
                                                <th className="p-4">Phone</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4">Current Bus</th>
                                                <th className="p-4">Current Trip</th>
                                                <th className="p-4 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {adminConductors.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-[#64748B]">No conductors registered.</td>
                                                </tr>
                                            ) : (
                                                adminConductors.map(c => (
                                                    <tr key={c.id} className="hover:bg-[#FFFDF7] transition-colors">
                                                        <td className="p-4 pl-6 font-mono font-bold text-xs text-[#D71920]">
                                                            {c.conductor_id}
                                                        </td>
                                                        <td className="p-4 font-heading font-bold text-[#171717]">{c.name}</td>
                                                        <td className="p-4 text-xs text-[#64748B]">{c.phone || '—'}</td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-[#FEF9C3] text-[#D71920]' : 'bg-[#F7F7F5] text-[#64748B]'}`}>
                                                                {c.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs font-bold text-[#171717]">{c.current_bus ? `🚌 ${c.current_bus}` : '—'}</td>
                                                        <td className="p-4 text-xs text-[#64748B]">{c.current_trip_id ? `Trip #${c.current_trip_id}` : 'Available'}</td>
                                                        <td className="p-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleToggleConductor(c.id)}
                                                                    className="text-xs font-bold text-[#D71920] hover:bg-[#FEF9C3] px-2.5 py-1 rounded-lg border border-[#E5E7EB]"
                                                                >
                                                                    {c.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingConductor(c)}
                                                                    className="p-1.5 text-[#64748B] hover:text-[#171717] rounded-lg"
                                                                >
                                                                    <Icon name="edit-2" size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteConductor(c)}
                                                                    className="p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
                                                                >
                                                                    <Icon name="trash" size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 6: MACHINES */}
                    {/* ========================================================= */}
                    {currentTab === 'Machines' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ಟಿಕೆಟ್ ಯಂತ್ರಗಳು</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Ticket Machine Fleet</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Handheld hardware terminals linked dynamically to trips</p>
                                </div>
                                <button
                                    onClick={() => setShowAddMachine(true)}
                                    className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Icon name="plus" size={14} />
                                    <span>+ Add Machine</span>
                                </button>
                            </div>

                            {/* Educational Dynamic Machine Session Banner */}
                            <div className="bg-[#FFFDF7] border-l-4 border-[#FFCC00] p-4 rounded-xl border border-[#E5E7EB] text-xs space-y-1">
                                <div className="font-heading font-bold text-[#171717] flex items-center gap-2">
                                    <Icon name="info" size={16} className="text-[#D71920]" />
                                    <span>Dynamic Machine Session Architecture</span>
                                </div>
                                <p className="text-[#64748B]">
                                    Machines are <strong>never permanently tied to buses</strong>. When a conductor initiates a trip (e.g. Machine M102 on Bus KA-01-1234), a temporary <code>MACHINE_SESSION</code> is created. When the trip ends, the machine instantly returns to the <strong>Available</strong> pool for any bus.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Machine ID</th>
                                                <th className="p-4">Session Status</th>
                                                <th className="p-4">Bound Bus</th>
                                                <th className="p-4">Active Trip</th>
                                                <th className="p-4">Last Activity</th>
                                                <th className="p-4 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {adminMachines.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center text-[#64748B]">No machines enrolled.</td>
                                                </tr>
                                            ) : (
                                                adminMachines.map(m => (
                                                    <tr key={m.id} className="hover:bg-[#FFFDF7] transition-colors">
                                                        <td className="p-4 pl-6 font-mono font-bold text-xs text-[#171717] flex items-center gap-2">
                                                            <Icon name="cpu" size={15} className="text-[#D71920]" />
                                                            <span>{m.machine_code}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${m.status === 'Available' ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : 'bg-[#FEE2E2] text-[#D71920] border border-[#FECACA]'}`}>
                                                                {m.status === 'Available' ? '● AVAILABLE' : '● IN USE (BOUND)'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs font-bold text-[#171717]">{m.current_bus ? `🚌 ${m.current_bus}` : '—'}</td>
                                                        <td className="p-4 text-xs text-[#64748B]">{m.current_trip_id ? `Trip #${m.current_trip_id}` : 'Idle'}</td>
                                                        <td className="p-4 text-xs text-[#64748B] tabular-nums">{timeAgo(m.last_activity)}</td>
                                                        <td className="p-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleToggleMachine(m.id)}
                                                                    className="text-xs font-bold text-[#D71920] hover:bg-[#FEF9C3] px-2.5 py-1 rounded-lg border border-[#E5E7EB]"
                                                                >
                                                                    Toggle Pool
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMachine(m)}
                                                                    className="p-1.5 text-[#D71920] hover:bg-[#FEE2E2] rounded-lg"
                                                                >
                                                                    <Icon name="trash" size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 7: ASSIGN TRIPS */}
                    {/* ========================================================= */}
                    {currentTab === 'Assign Trips' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ಪ್ರಯಾಣ ಹಂಚಿಕೆ</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Trip Scheduling & Dispatch</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Assign buses, routes, conductors, and machines for active service</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateTrip(true)}
                                    className="bg-[#D71920] hover:bg-[#B9141A] text-white px-4 py-2.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Icon name="plus" size={14} />
                                    <span>+ Schedule Trip</span>
                                </button>
                            </div>

                            {/* Trip Filters */}
                            <div className="flex gap-2">
                                {['All', 'Active', 'Scheduled', 'Completed'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTripFilter(f)}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${tripFilter === f ? 'bg-[#D71920] text-white shadow-sm' : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:text-[#171717]'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Trip ID</th>
                                                <th className="p-4">Bus</th>
                                                <th className="p-4">Route</th>
                                                <th className="p-4">Conductor</th>
                                                <th className="p-4">Machine</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right pr-6">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {adminTrips
                                                .filter(t => tripFilter === 'All' || t.status === tripFilter)
                                                .map(t => (
                                                    <tr key={t.id} className="hover:bg-[#FFFDF7] transition-colors">
                                                        <td className="p-4 pl-6 font-mono font-bold text-xs text-[#D71920]">#{t.id}</td>
                                                        <td className="p-4 font-heading font-bold text-[#171717]">🚌 {t.bus_number}</td>
                                                        <td className="p-4 text-xs font-medium text-[#171717]">{t.route_name}</td>
                                                        <td className="p-4 text-xs text-[#64748B]">{t.conductor_name || t.conductor_code || '—'}</td>
                                                        <td className="p-4 text-xs font-mono font-bold text-[#475569]">{t.machine_code || 'Dynamic'}</td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${t.status === 'Active' ? 'bg-[#FEF9C3] text-[#D71920] border border-[#FDE047]' : t.status === 'Completed' ? 'bg-[#F7F7F5] text-[#171717]' : 'bg-[#FFFDF7] text-[#64748B] border border-[#E5E7EB]'}`}>
                                                                {t.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            {t.status === 'Scheduled' && (
                                                                <button
                                                                    onClick={() => handleCancelTrip(t.id)}
                                                                    className="text-xs font-bold text-[#D71920] hover:bg-[#FEE2E2] px-2.5 py-1 rounded-lg border border-[#FECACA]"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                            {t.status === 'Active' && (
                                                                <button
                                                                    onClick={() => handleOpenTrackModal(t)}
                                                                    className="text-xs font-bold text-[#D71920] bg-[#FEF9C3] hover:bg-[#FDE047] px-2.5 py-1 rounded-lg"
                                                                >
                                                                    Track
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 8: MONITORING */}
                    {/* ========================================================= */}
                    {currentTab === 'Monitoring' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ಕರ್ನಾಟಕ ಲೈವ್ ಕಾರ್ಯಾಚರಣೆ</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Karnataka Live Operations</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Real-time stop updates from conductor ticket machines across all Karnataka sectors</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                    <span className="text-xs font-bold text-[#171717]">{journeys.filter(j=>j.status==='Active').length} Active Trips</span>
                                </div>
                            </div>

                            {/* Full Monitoring Feed */}
                            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-[#F7F7F5] text-[#64748B] border-b border-[#E5E7EB] text-[11px] font-heading font-bold uppercase tracking-wider">
                                                <th className="p-4 pl-6">Bus</th>
                                                <th className="p-4">Machine</th>
                                                <th className="p-4">Route</th>
                                                <th className="p-4">Conductor</th>
                                                <th className="p-4">Last Reported Stop</th>
                                                <th className="p-4">Checked In</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right pr-6">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {journeys.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="p-12 text-center text-[#64748B]">
                                                        <Icon name="activity" size={32} className="mx-auto mb-2 text-[#94A3B8]" />
                                                        <div className="font-heading font-bold text-[#171717]">No Active Journeys Under Surveillance</div>
                                                        <p className="text-xs text-[#64748B] mt-1">Conductor check-ins from ticket machines will stream here in real time.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                journeys.map((j, i) => (
                                                    <tr key={i} className="hover:bg-[#FFFDF7] transition-colors">
                                                        <td className="p-4 pl-6 font-heading font-black text-[#171717]">🚌 {j.bus_number}</td>
                                                        <td className="p-4 font-mono font-bold text-xs text-[#475569]">{j.machine_code || '—'}</td>
                                                        <td className="p-4 font-medium text-[#171717]">{j.route_name}</td>
                                                        <td className="p-4 text-xs text-[#64748B]">{j.conductor_name || j.conductor_code || 'Assigned'}</td>
                                                        <td className="p-4">
                                                            <span className="font-heading font-bold text-xs text-[#D71920] flex items-center gap-1">
                                                                <Icon name="map-pin" size={13} />
                                                                {j.current_stop || 'Origin'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs text-[#64748B] tabular-nums">{timeAgo(j.last_reported_at)}</td>
                                                        <td className="p-4">
                                                            <span className="bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] font-bold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                                                <span>● LIVE</span>
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <button
                                                                onClick={() => handleOpenTrackModal(j)}
                                                                className="bg-[#D71920] hover:bg-[#B9141A] text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                                                            >
                                                                <Icon name="navigation" size={12} />
                                                                <span>Track</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 9: REPORTS */}
                    {/* ========================================================= */}
                    {currentTab === 'Reports' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="text-xs font-bold text-[#D71920] uppercase tracking-wider">ಸಾರಿಗೆ ವರದಿಗಳು</div>
                                    <h2 className="text-2xl font-heading font-black text-[#171717]">Transport Reports</h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">Fleet performance, route density, machine sessions, and conductor activity</p>
                                </div>
                                <button
                                    onClick={() => alert("Report Export: CSV snapshot generated successfully.")}
                                    className="bg-white hover:bg-[#FEF9C3] text-[#D71920] border border-[#D71920] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                                >
                                    <Icon name="download" size={14} /> Export CSV
                                </button>
                            </div>

                            {/* Summary KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Total Recorded Trips</div>
                                    <div className="text-2xl font-heading font-black text-[#171717] mt-1">
                                        {reportsData?.summary?.total_trips || adminTrips.length}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Completed Trips</div>
                                    <div className="text-2xl font-heading font-black text-[#D71920] mt-1">
                                        {reportsData?.summary?.completed_trips || adminTrips.filter(t=>t.status==='Completed').length}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Total Stop Checkpoints</div>
                                    <div className="text-2xl font-heading font-black text-[#FFCC00] mt-1">
                                        {reportsData?.summary?.total_stop_updates || kpis.live_updates || 0}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase">Avg Checkpoints / Trip</div>
                                    <div className="text-2xl font-heading font-black text-[#171717] mt-1">
                                        {reportsData?.summary?.avg_updates_per_trip || '2.8'}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Grid: Route Usage & Machine Sessions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                    <h3 className="font-heading font-black text-sm text-[#171717] mb-3 pb-2 border-b border-[#E5E7EB] uppercase">
                                        Route Usage Leaderboard
                                    </h3>
                                    <div className="space-y-3">
                                        {(reportsData?.route_usage || []).map((ru, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[#F7F7F5]">
                                                <span className="font-bold text-[#171717]">{ru.name}</span>
                                                <span className="text-[#D71920] font-bold">{ru.trips_count} trips ({ru.completed_count} completed)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                    <h3 className="font-heading font-black text-sm text-[#171717] mb-3 pb-2 border-b border-[#E5E7EB] uppercase">
                                        Machine Session Activity
                                    </h3>
                                    <div className="space-y-3">
                                        {(reportsData?.machine_usage || []).map((mu, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[#F7F7F5]">
                                                <span className="font-mono font-bold text-[#171717]">📟 {mu.machine_code}</span>
                                                <span className="text-[#64748B]">{mu.sessions_count} dynamic sessions</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                        </div>
                    )}

                </main>
            </div>

            {/* ========================================================= */}
            {/* NEXT-GEN LIVE TRACKING INSPECTOR HUD (KARNATAKA TELEMETRY) */}
            {/* ========================================================= */}
            {trackingTrip && (() => {
                const currentStopName = trackingTrip.current_stop || trackingTrip.current_stop_name || 'Origin Station';
                const currentIdx = trackingRouteStops.findIndex(st => st.name === currentStopName);
                const totalStops = trackingRouteStops.length || 4;
                const progressPct = trackingRouteStops.length > 1 
                    ? Math.round((Math.max(0, currentIdx) / (trackingRouteStops.length - 1)) * 100) 
                    : 45;
                const originStop = trackingRouteStops[0]?.name || 'Origin';
                const destStop = trackingRouteStops[trackingRouteStops.length - 1]?.name || 'Destination';

                return (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
                        <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
                            
                            {/* Top Dual Red & Yellow Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>

                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#E5E7EB]">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9C3] border border-[#FDE047] text-[#D71920] text-xs font-bold shadow-sm">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D71920]"></span>
                                            </span>
                                            <span className="tracking-wide">LIVE TELEMETRY STREAM</span>
                                        </div>
                                        <span className="text-[11px] font-mono font-bold text-[#64748B] bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#E5E7EB]">
                                            TRIP #{trackingTrip.trip_id || trackingTrip.id}
                                        </span>
                                    </div>

                                    {/* HSRP License Plate & Route Header */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center bg-white border-2 border-[#171717] rounded-lg shadow-sm px-2.5 py-1 text-sm font-mono font-black tracking-wider text-[#171717]">
                                            <span className="bg-[#1D4ED8] text-white text-[9px] font-bold px-1 py-0.5 rounded mr-1.5 flex items-center gap-0.5">
                                                <span>IND</span>
                                                <span>🇮🇳</span>
                                            </span>
                                            <span className="text-base tracking-widest">{trackingTrip.bus_number}</span>
                                        </div>

                                        <div className="text-sm sm:text-base font-heading font-black text-[#171717]">
                                            {trackingTrip.route_name}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setTrackingTrip(null)}
                                    className="text-[#64748B] hover:text-[#171717] p-2 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E7EB] transition-colors"
                                >
                                    <Icon name="x" size={20} />
                                </button>
                            </div>

                            {/* Scrollable Cockpit Content */}
                            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                                
                                {/* 1. Next-Gen Visual Journey Trajectory Pipeline */}
                                <div className="bg-[#FFFDF7] border-2 border-[#FEF9C3] rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                        <span className="font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                                            <Icon name="activity" size={14} className="text-[#D71920]" />
                                            <span>Real-Time Journey Trajectory</span>
                                        </span>
                                        <span className="font-mono font-bold text-[#D71920] bg-[#FEF9C3] px-2.5 py-0.5 rounded-full border border-[#FDE047] text-[11px]">
                                            {progressPct}% Completed ({Math.max(1, currentIdx + 1)} of {totalStops} Checkpoints)
                                        </span>
                                    </div>

                                    {/* Glowing Progress Ribbon Track with Animated Bus Glyph */}
                                    <div className="relative h-3 bg-[#E5E7EB] rounded-full my-3">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#FFCC00] via-[#F59E0B] to-[#D71920] rounded-full transition-all duration-700 ease-out shadow-sm"
                                            style={{ width: `${Math.max(8, Math.min(100, progressPct))}%` }}
                                        ></div>
                                        {/* Animated Gliding Bus Node */}
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out z-10"
                                            style={{ left: `${Math.max(6, Math.min(94, progressPct))}%` }}
                                        >
                                            <div className="relative">
                                                <span className="absolute -inset-2 rounded-full bg-[#D71920]/40 animate-ping"></span>
                                                <div className="relative w-8 h-8 rounded-full bg-[#D71920] border-2 border-white shadow-lg flex items-center justify-center text-white">
                                                    <Icon name="bus" size={15} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-[#64748B] font-semibold pt-1">
                                        <span className="flex items-center gap-1 text-[#171717]">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] border border-[#CA8A04]"></span>
                                            <span>{originStop}</span>
                                        </span>
                                        <span className="text-[11px] font-bold text-[#D71920] flex items-center gap-1 bg-[#FEF9C3] px-2 py-0.5 rounded-full border border-[#FDE047]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse"></span>
                                            <span>Current: {currentStopName}</span>
                                        </span>
                                        <span className="flex items-center gap-1 text-[#171717]">
                                            <span>{destStop}</span>
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#D71920] border border-[#991B1B]"></span>
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Cockpit Telemetry HUD Metrics (2x2 Grid) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-[#FFFDF7] p-3.5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#D71920]"></div>
                                        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Current Verified Checkpoint</div>
                                        <div className="font-heading font-black text-lg text-[#D71920] mt-0.5 flex items-center gap-1.5">
                                            <Icon name="map-pin" size={18} className="text-[#D71920]" />
                                            <span>{currentStopName}</span>
                                        </div>
                                        <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
                                            <Icon name="check-circle" size={12} className="text-emerald-600" />
                                            <span>Verified {timeAgo(trackingTrip.last_reported_at || trackingTrip.last_update)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-[#F7F7F5] p-3.5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#FFCC00]"></div>
                                        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Next Expected Checkpoint</div>
                                        <div className="font-heading font-black text-lg text-[#171717] mt-0.5">
                                            {trackingTrip.next_stop || trackingTrip.next_stop_name || 'Terminal Ahead'}
                                        </div>
                                        <div className="text-[11px] text-[#D71920] mt-1 font-semibold flex items-center gap-1">
                                            <Icon name="clock" size={12} />
                                            <span>Conductor ticket scan pending</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#B45309] border border-[#FDE047] flex items-center justify-center font-bold">
                                                <Icon name="ticket" size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-[#64748B] font-bold uppercase">Dynamic POS Machine</div>
                                                <div className="font-mono font-bold text-[#171717] text-xs">
                                                    📟 {trackingTrip.machine_code || 'Smart POS M103'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            100% Synced
                                        </span>
                                    </div>

                                    <div className="bg-white p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center font-bold">
                                                <Icon name="users" size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-[#64748B] font-bold uppercase">Conductor On Duty</div>
                                                <div className="font-bold text-[#171717] text-xs">
                                                    👤 {trackingTrip.conductor_code || trackingTrip.conductor_name || 'Assigned Staff'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#D71920] bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                                            Verified
                                        </span>
                                    </div>
                                </div>

                                {/* 3. Next-Gen Checkpoint Route Progression Timeline */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                        <span>Route Checkpoint Progression</span>
                                        <span className="text-[10px] text-[#D71920] font-bold bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FDE047]">
                                            Sequential Verification
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {trackingRouteStops.length === 0 ? (
                                            <div className="text-xs text-[#64748B] text-center py-6 bg-[#F7F7F5] rounded-2xl border border-dashed border-[#E5E7EB]">
                                                Loading route checkpoints...
                                            </div>
                                        ) : (
                                            trackingRouteStops.map((s, idx) => {
                                                const isPast = currentIdx !== -1 && idx < currentIdx;
                                                const isCurrent = currentIdx !== -1 && idx === currentIdx;

                                                return (
                                                    <div 
                                                        key={s.id} 
                                                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                                            isCurrent 
                                                                ? 'bg-white border-2 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' 
                                                                : isPast 
                                                                ? 'bg-[#FFFDF7] border-[#E5E7EB]' 
                                                                : 'bg-[#F7F7F5] border-[#E5E7EB] opacity-70'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Node Badge */}
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                isCurrent 
                                                                    ? 'bg-[#D71920] text-white font-black shadow-md' 
                                                                    : isPast 
                                                                    ? 'bg-[#FEF9C3] text-[#D71920] border-2 border-[#FFCC00]' 
                                                                    : 'bg-white text-[#94A3B8] border-2 border-[#E5E7EB]'
                                                            }`}>
                                                                {isPast ? <Icon name="check" size={15} /> : isCurrent ? <Icon name="bus" size={15} /> : idx + 1}
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-heading ${isCurrent ? 'text-[#D71920] font-black' : isPast ? 'text-[#171717] font-bold' : 'text-[#64748B]'}`}>
                                                                    {s.name}
                                                                </div>
                                                                <div className="text-[10px] text-[#64748B]">Checkpoint #{idx + 1}</div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            {isCurrent && (
                                                                <span className="inline-flex items-center gap-1 bg-[#D71920] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                                    <span>Current Stop</span>
                                                                </span>
                                                            )}
                                                            {isPast && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                    <Icon name="check" size={11} />
                                                                    <span>Passed</span>
                                                                </span>
                                                            )}
                                                            {!isPast && !isCurrent && (
                                                                <span className="text-[11px] font-semibold text-[#94A3B8]">
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-[#E5E7EB]">
                                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                                    <Icon name="shield" size={14} className="text-[#D71920]" />
                                    <span>Anti-Spoofing Deterministic Telemetry</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard?.writeText(window.location.origin + '/passenger');
                                            alert('✓ Live passenger tracking link copied!');
                                        }}
                                        className="px-3.5 py-2 rounded-xl text-xs font-heading font-bold text-[#171717] bg-[#F7F7F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] transition-colors flex items-center gap-1.5"
                                    >
                                        <Icon name="copy" size={13} />
                                        <span>Share Link</span>
                                    </button>

                                    <button
                                        onClick={() => setTrackingTrip(null)}
                                        className="bg-[#D71920] text-white px-6 py-2 rounded-xl text-xs font-heading font-bold hover:bg-[#B9141A] transition-all shadow-md"
                                    >
                                        Close Inspector
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                );
            })()}

            {/* ========================================================= */}
            {/* MODAL: MANAGE ROUTE STOPS (REORDER / ADD / DELETE) */}
            {/* ========================================================= */}
            {viewingRoute && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>

                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#E5E7EB]">
                            <div>
                                <h3 className="text-xl font-heading font-black text-[#171717]">{viewingRoute.name}</h3>
                                <div className="text-xs text-[#64748B] mt-0.5">Sequential Checkpoint Sequence Manager</div>
                            </div>
                            <button
                                onClick={() => setViewingRoute(null)}
                                className="text-[#64748B] hover:text-[#171717] p-2 rounded-xl bg-[#F7F7F5]"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>

                        {/* Reorderable Stops List */}
                        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                            {routeStops.length === 0 ? (
                                <div className="p-6 text-center text-xs text-[#64748B]">No checkpoints configured for this route yet.</div>
                            ) : (
                                routeStops.map((s, idx) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E7EB]">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#FEF9C3] text-[#D71920] border border-[#FDE047] flex items-center justify-center font-bold text-xs">
                                                {idx + 1}
                                            </span>
                                            <span className="font-heading font-bold text-sm text-[#171717]">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={idx === 0}
                                                onClick={() => handleMoveStop(idx, -1)}
                                                className="p-1 text-[#64748B] hover:text-[#171717] disabled:opacity-30"
                                            >
                                                <Icon name="arrow-up" size={14} />
                                            </button>
                                            <button
                                                disabled={idx === routeStops.length - 1}
                                                onClick={() => handleMoveStop(idx, 1)}
                                                className="p-1 text-[#64748B] hover:text-[#171717] disabled:opacity-30"
                                            >
                                                <Icon name="arrow-down" size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStopFromRoute(s.id)}
                                                className="p-1 text-[#D71920] hover:bg-[#FEE2E2] rounded"
                                            >
                                                <Icon name="trash" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Stop Form */}
                        {showAddStopToRoute ? (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Enter new checkpoint stop name..."
                                    value={newStopNameToRoute}
                                    onChange={e => setNewStopNameToRoute(e.target.value)}
                                    className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                />
                                <button
                                    onClick={handleAddStopToRoute}
                                    className="bg-[#D71920] text-white px-4 py-2 rounded-xl text-xs font-bold"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setShowAddStopToRoute(false)}
                                    className="text-xs text-[#64748B] px-3"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddStopToRoute(true)}
                                className="w-full py-2.5 rounded-xl border border-dashed border-[#D71920] text-[#D71920] hover:bg-[#FEF9C3] text-xs font-bold transition-all mb-4"
                            >
                                + Add Checkpoint Stop
                            </button>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setViewingRoute(null)}
                                className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-heading font-bold"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ADD BUS */}
            {/* ========================================================= */}
            {showAddBus && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Register New Bus</h3>
                        <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Bus Registration Number</label>
                        <input
                            type="text"
                            placeholder="KA-01-F-1234"
                            value={newBusNumber}
                            onChange={e => setNewBusNumber(e.target.value.toUpperCase())}
                            className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-bold outline-none focus:border-[#D71920] mb-5 uppercase"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddBus(false)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleAddBus} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Add Bus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: EDIT BUS */}
            {/* ========================================================= */}
            {editingBus && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Edit Bus Number</h3>
                        <input
                            type="text"
                            value={editingBus.bus_number}
                            onChange={e => setEditingBus({ ...editingBus, bus_number: e.target.value.toUpperCase() })}
                            className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-bold outline-none focus:border-[#D71920] mb-5 uppercase"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingBus(null)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleEditBus} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ADD ROUTE */}
            {/* ========================================================= */}
            {showAddRoute && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Create New Route</h3>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-[11px] text-[#64748B] font-bold uppercase mb-1 block">Route Name</label>
                                <input
                                    type="text"
                                    placeholder="Tumakuru → Bengaluru (Express)"
                                    value={newRoute.name}
                                    onChange={e => setNewRoute({ ...newRoute, name: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[11px] text-[#64748B] font-bold uppercase mb-1 block">Origin Station</label>
                                    <input
                                        type="text"
                                        placeholder="Tumakuru"
                                        value={newRoute.origin}
                                        onChange={e => setNewRoute({ ...newRoute, origin: e.target.value })}
                                        className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-[#64748B] font-bold uppercase mb-1 block">Destination Station</label>
                                    <input
                                        type="text"
                                        placeholder="Bengaluru"
                                        value={newRoute.destination}
                                        onChange={e => setNewRoute({ ...newRoute, destination: e.target.value })}
                                        className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddRoute(false)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleAddRoute} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Create Route</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: EDIT ROUTE */}
            {/* ========================================================= */}
            {editingRoute && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Edit Route</h3>
                        <div className="space-y-3 mb-5">
                            <input
                                type="text"
                                value={editingRoute.name}
                                onChange={e => setEditingRoute({ ...editingRoute, name: e.target.value })}
                                className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={editingRoute.origin || ''}
                                    onChange={e => setEditingRoute({ ...editingRoute, origin: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                />
                                <input
                                    type="text"
                                    value={editingRoute.destination || ''}
                                    onChange={e => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingRoute(null)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleEditRoute} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ADD CONDUCTOR */}
            {/* ========================================================= */}
            {showAddConductor && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Enroll New Conductor</h3>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-[11px] text-[#64748B] font-bold uppercase mb-1 block">Conductor ID Code</label>
                                <input
                                    type="text"
                                    placeholder="C105"
                                    value={newConductor.conductor_id}
                                    onChange={e => setNewConductor({ ...newConductor, conductor_id: e.target.value.toUpperCase() })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] font-mono outline-none focus:border-[#D71920] uppercase"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-[#64748B] font-bold uppercase mb-1 block">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ramesh Gowda"
                                    value={newConductor.name}
                                    onChange={e => setNewConductor({ ...newConductor, name: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-[#64748B] font-bold uppercase mb-1 block">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="+91 98450 XXXXX"
                                    value={newConductor.phone}
                                    onChange={e => setNewConductor({ ...newConductor, phone: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddConductor(false)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleAddConductor} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Add Conductor</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: EDIT CONDUCTOR */}
            {/* ========================================================= */}
            {editingConductor && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Edit Conductor: {editingConductor.conductor_id}</h3>
                        <div className="space-y-3 mb-5">
                            <input
                                type="text"
                                value={editingConductor.name}
                                onChange={e => setEditingConductor({ ...editingConductor, name: e.target.value })}
                                className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                            />
                            <input
                                type="text"
                                value={editingConductor.phone || ''}
                                onChange={e => setEditingConductor({ ...editingConductor, phone: e.target.value })}
                                className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-[#171717] outline-none focus:border-[#D71920]"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingConductor(null)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleEditConductor} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ADD MACHINE */}
            {/* ========================================================= */}
            {showAddMachine && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Enroll Ticket Machine</h3>
                        <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Machine Code / Serial</label>
                        <input
                            type="text"
                            placeholder="M106"
                            value={newMachineCode}
                            onChange={e => setNewMachineCode(e.target.value.toUpperCase())}
                            className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-mono font-bold outline-none focus:border-[#D71920] mb-5 uppercase"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddMachine(false)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleAddMachine} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Enroll Machine</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: CREATE / SCHEDULE TRIP */}
            {/* ========================================================= */}
            {showCreateTrip && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D71920] via-[#FFCC00] to-[#D71920]"></div>
                        
                        <h3 className="font-heading font-black text-xl text-[#171717] mb-1">Dispatch / Schedule Trip</h3>
                        <p className="text-xs text-[#64748B] mb-5">Assign bus, route, and optional conductor/machine pairing</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Select Bus *</label>
                                <select
                                    value={newTrip.bus_id}
                                    onChange={e => setNewTrip({ ...newTrip, bus_id: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920]"
                                >
                                    <option value="">-- Choose Active Bus --</option>
                                    {adminBuses.filter(b => b.status === 'Active' && b.trip_status !== 'Active').map(b => (
                                        <option key={b.id} value={b.id}>🚌 {b.bus_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Select Route *</label>
                                <select
                                    value={newTrip.route_id}
                                    onChange={e => setNewTrip({ ...newTrip, route_id: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920]"
                                >
                                    <option value="">-- Choose Route --</option>
                                    {adminRoutes.filter(r => r.status === 'Active').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Assign Conductor (Optional)</label>
                                <select
                                    value={newTrip.conductor_id}
                                    onChange={e => setNewTrip({ ...newTrip, conductor_id: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920]"
                                >
                                    <option value="">-- Assign Later --</option>
                                    {adminConductors.filter(c => c.status === 'Active' && !c.current_bus).map(c => (
                                        <option key={c.id} value={c.id}>{c.conductor_id} • {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Reserve Ticket Machine (Optional)</label>
                                <select
                                    value={newTrip.machine_id}
                                    onChange={e => setNewTrip({ ...newTrip, machine_id: e.target.value })}
                                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-[#171717] text-sm outline-none focus:border-[#D71920] font-mono"
                                >
                                    <option value="">-- Dynamic Pairing on Trip Start (Default) --</option>
                                    {adminMachines.filter(m => m.status === 'Available').map(m => (
                                        <option key={m.id} value={m.id}>📟 {m.machine_code} (Available)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button onClick={() => setShowCreateTrip(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B]">Cancel</button>
                                <button onClick={handleCreateTrip} className="bg-[#D71920] text-white px-5 py-2.5 rounded-xl text-xs font-heading font-bold hover:bg-[#B9141A]">Schedule Trip</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: EDIT STOP (GLOBAL) */}
            {/* ========================================================= */}
            {editingStop && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920]"></div>
                        <h3 className="font-heading font-black text-lg text-[#171717] mb-4">Edit Checkpoint Name</h3>
                        <input
                            type="text"
                            value={editingStop.name}
                            onChange={e => setEditingStop({ ...editingStop, name: e.target.value })}
                            className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#171717] font-bold outline-none focus:border-[#D71920] mb-5"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingStop(null)} className="px-4 py-2 text-xs font-bold text-[#64748B]">Cancel</button>
                            <button onClick={handleEditStopGlobal} className="bg-[#D71920] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#B9141A]">Save Stop</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <WSProvider>
                <LanguageProvider>
                    <PassengerProvider>
                        <BrowserRouter>
                            <div className="min-h-screen bg-[#F7F7F5] text-[#171717] font-sans antialiased">
                                <Navbar />
                                <Routes>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/passenger" element={<PassengerPage />} />
                                    <Route path="/machine" element={<TicketMachinePage />} />
                                    <Route path="/admin/*" element={<AdminPage />} />
                                </Routes>
                            </div>
                        </BrowserRouter>
                    </PassengerProvider>
                </LanguageProvider>
            </WSProvider>
        </ThemeProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
