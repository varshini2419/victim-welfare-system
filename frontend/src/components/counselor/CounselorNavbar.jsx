import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useShellSummary } from '../../context/ShellSummaryContext';
import api from '../../utils/api';
import './CounselorLayout.css';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'C';
};

const fmtSearchDate = (d) => (d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  : '');

export default function CounselorNavbar() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { summary } = useShellSummary();
  const navigate = useNavigate();

  const displayName = useMemo(() => user?.name || 'Counselor', [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // ── Global search ──
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = idle, {} = loading/loaded
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runSearch = (value) => {
    const q = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults(null);
      setSearchOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/counselor/search?q=${encodeURIComponent(q)}`);
        setResults(res.data?.data || { victims: [], appointments: [] });
        setSearchOpen(true);
      } catch {
        setResults({ victims: [], appointments: [] });
        setSearchOpen(true);
      }
    }, 250);
  };

  const goToVictim = (userId) => {
    setSearchOpen(false);
    setQuery('');
    setResults(null);
    navigate(`/counselor/victims/${userId}`);
  };

  const hasResults = results && (results.victims?.length > 0 || results.appointments?.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="counselor-navbar">
      {/* ── Left: Government identity ── */}
      <div className="navbar-left">
        <img src="/images/emblem.png" alt="Government of India Emblem" className="navbar-logo" />
        <div className="brand-text">
          <span className="brand-title">{t('govTitle')}</span>
          <span className="brand-subtitle">{t('govSubtitle')}</span>
        </div>
      </div>

      {/* ── Center: Portal identity ── */}
      <div className="navbar-center">
        <h1>
          AAROHAN<span className="portal-divider">|</span>Counselor Portal
        </h1>
        <div className="navbar-tagline">
          Care<span className="tag-dot">•</span>Listen<span className="tag-dot">•</span>Support<span className="tag-dot">•</span>Prevent
        </div>
      </div>

      {/* ── Right: search, notifications, profile ── */}
      <div className="navbar-right">
        <div className="nav-search" role="search" ref={searchBoxRef} style={{ position: 'relative' }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search cases, name, or ID…"
            aria-label="Search cases"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              runSearch(e.target.value);
            }}
            onFocus={() => { if (hasResults) setSearchOpen(true); }}
          />

          {searchOpen && results && (
            <div className="nav-search-results">
              {!hasResults ? (
                <div className="search-empty">No matches in your caseload.</div>
              ) : (
                <>
                  {results.victims.length > 0 && (
                    <>
                      <div className="search-group-label">Victims</div>
                      {results.victims.map((v) => (
                        <button
                          key={v.userId}
                          type="button"
                          className="search-result-row"
                          onClick={() => goToVictim(v.userId)}
                        >
                          <span className="sr-avatar">{(v.name || 'V').slice(0, 1).toUpperCase()}</span>
                          <span className="sr-main">
                            <span className="sr-name">{v.name}</span>
                            <span className="sr-meta">
                              {[v.caseIds?.[0] ? `Case ${v.caseIds[0]}` : null, v.district].filter(Boolean).join(' · ') || 'Assigned victim'}
                            </span>
                          </span>
                          <span className="sr-arrow">→</span>
                        </button>
                      ))}
                    </>
                  )}
                  {results.appointments.length > 0 && (
                    <>
                      <div className="search-group-label">Appointments</div>
                      {results.appointments.map((a) => (
                        <button
                          key={a._id}
                          type="button"
                          className="search-result-row"
                          onClick={() => (a.victimId ? goToVictim(a.victimId) : navigate('/counselor/appointments'))}
                        >
                          <span className="sr-avatar sr-avatar-apt">📅</span>
                          <span className="sr-main">
                            <span className="sr-name">{a.title || a.victimName}</span>
                            <span className="sr-meta">{a.victimName} · {fmtSearchDate(a.scheduledAt)}</span>
                          </span>
                          <span className="sr-arrow">→</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <Link to="/counselor/notifications" className="nav-bell" title="Notifications" aria-label={`Notifications${summary.newAlerts ? `, ${summary.newAlerts} unread` : ''}`}>
          <BellIcon />
          {summary.newAlerts > 0 && (
            <span className="nav-bell-badge">{summary.newAlerts > 9 ? '9+' : summary.newAlerts}</span>
          )}
        </Link>

        <div className="nav-user" tabIndex={0}>
          <div className="nav-avatar">{initials}</div>
          <div className="nav-user-meta">
            <span className="nav-user-name">{displayName}</span>
            <span className="nav-user-role">Counselor</span>
          </div>
          <span className="nav-chevron" aria-hidden="true">▼</span>

          <div className="nav-user-menu" role="menu">
            <div className="menu-header">
              <div className="menu-name">{displayName}</div>
              <div className="menu-role">{user?.email || 'Counselor'}</div>
            </div>
            <Link to="/counselor/profile" role="menuitem">👤 My Profile</Link>
            <Link to="/counselor/notifications" role="menuitem">🔔 Notifications</Link>
            <button type="button" onClick={handleLogout} role="menuitem">⎋ Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}
