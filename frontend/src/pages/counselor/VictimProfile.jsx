import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ReferenceDot, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../utils/api';
import './VictimProfile.css';

// ── Constants ──────────────────────────────────────────────────
const REFRESH_INTERVAL_MS = 60000;
const LIVE_REFRESH_INTERVAL_MS = 3000;

const BAND_COLORS = {
  Low: '#22c55e',
  Moderate: '#eab308',
  High: '#f97316',
  Severe: '#ef4444',
};

const BAND_PILL = {
  Low: 'vp-pill-risk-low',
  Moderate: 'vp-pill-risk-moderate',
  High: 'vp-pill-risk-high',
  Severe: 'vp-pill-risk-severe',
};

const EMOTION_FACES = {
  Fearful: '😰', Anxious: '😟', Sad: '😢', Angry: '😠',
  Calm: '😌', Hopeful: '🌟', Neutral: '😐',
};

const EMOTION_COLORS = {
  Fearful: '#ef4444',
  Anxious: '#eab308',
  Sad: '#6366f1',
  Angry: '#f97316',
  Calm: '#22c55e',
  Hopeful: '#3b82f6',
  Neutral: '#94a3b8',
};

const EMOTION_ORDER = ['Fearful', 'Anxious', 'Sad', 'Angry', 'Calm', 'Hopeful', 'Neutral'];

const bandFor = (score) => {
  if (score == null) return null;
  if (score >= 75) return 'Severe';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Moderate';
  return 'Low';
};

const bandColor = (score) => BAND_COLORS[bandFor(score)] || '#94a3b8';

// ── Formatters ─────────────────────────────────────────────────
const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  : 'N/A';

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'N/A';

const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : 'N/A');

const fmtTrendDay = (iso) => {
  if (!iso) return '';
  const dt = new Date(`${iso}T00:00:00`);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const computeAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

const display = (v) => (v != null && v !== '' ? v : 'N/A');

const fmtDuration = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const WAVE_HEIGHTS = [38, 62, 30, 78, 52, 88, 44, 70, 34, 58, 82, 48, 74, 40, 92, 60, 32, 68, 50, 78, 42, 64, 36, 84, 55, 72, 46, 90, 38, 66];

// ── Small shared bits ──────────────────────────────────────────
function CardHead({ icon, title, sub, right }) {
  return (
    <div className="vp-card-head">
      <h3 className="vp-card-title">
        {icon && <span className="card-icon" aria-hidden="true">{icon}</span>}
        <span>
          {title}
          {sub && <span className="vp-card-sub"> {sub}</span>}
        </span>
      </h3>
      {right}
    </div>
  );
}

// ── Risk gauge (SVG semicircle) ────────────────────────────────
function RiskGauge({ score }) {
  const R = 42;
  const CIRC = Math.PI * R; // semicircle length
  const clamped = Math.max(0, Math.min(100, score ?? 0));
  const filled = (clamped / 100) * CIRC;
  const color = bandColor(clamped);
  return (
    <div style={{ position: 'relative', width: 150, margin: '0 auto' }}>
      <svg viewBox="0 0 100 56" style={{ width: '100%', display: 'block' }}>
        <path
          d={`M 8 50 A ${R} ${R} 0 0 1 92 50`}
          fill="none"
          stroke="#eef2f7"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d={`M 8 50 A ${R} ${R} 0 0 1 92 50`}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRC}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -2,
          textAlign: 'center',
        }}
      >
        <span className="vp-metric-big" style={{ fontSize: 30 }}>{clamped}</span>
        <span className="vp-metric-unit">/100</span>
      </div>
    </div>
  );
}

// ── Trend chart ────────────────────────────────────────────────
function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '8px 12px', boxShadow: '0 6px 18px rgba(15,23,42,0.12)', fontSize: '0.8rem',
    }}>
      <div style={{ fontWeight: 700, color: '#0f172a' }}>
        {p.avgDistressScore} <span style={{ color: '#64748b', fontWeight: 500 }}>({fmtTrendDay(p.date)})</span>
      </div>
      <div style={{ color: bandColor(p.avgDistressScore), fontWeight: 600, marginTop: 2 }}>
        {bandFor(p.avgDistressScore)} risk
      </div>
      <div style={{ color: '#64748b', marginTop: 2 }}>{p.messageCount} messages</div>
    </div>
  );
}

function DistressTrend({ trend }) {
  const data = trend || [];
  const last = data[data.length - 1];

  const renderDot = (props) => {
    const { cx, cy, payload, index } = props;
    const isLast = index === data.length - 1;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={isLast ? 6 : 4}
        fill={bandColor(payload.avgDistressScore)}
        stroke={isLast ? '#ffffff' : 'none'}
        strokeWidth={2}
      />
    );
  };

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 12, right: 18, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="vpTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtTrendDay}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<TrendTooltip />} />
          <ReferenceLine y={25} stroke="#eab308" strokeDasharray="5 4" strokeOpacity={0.7} />
          <ReferenceLine y={50} stroke="#f97316" strokeDasharray="5 4" strokeOpacity={0.7} />
          <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="5 4" strokeOpacity={0.75} />
          <Area
            type="monotone"
            dataKey="avgDistressScore"
            stroke="#ef4444"
            strokeWidth={2.4}
            fill="url(#vpTrendFill)"
            dot={renderDot}
            activeDot={{ r: 6 }}
            connectNulls
            isAnimationActive={false}
          />
          {last && (
            <ReferenceDot
              x={last.date}
              y={last.avgDistressScore}
              r={8}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      <div className="vp-threshold-legend">
        <span className="lg-item"><span className="lg-dot" style={{ background: '#ef4444' }} /> Severe (75+)</span>
        <span className="lg-item"><span className="lg-dot" style={{ background: '#f97316' }} /> High (50–74)</span>
        <span className="lg-item"><span className="lg-dot" style={{ background: '#eab308' }} /> Moderate (25–49)</span>
        <span className="lg-item"><span className="lg-dot" style={{ background: '#22c55e' }} /> Low (&lt;25)</span>
      </div>
    </>
  );
}

// ── Time-of-day chart (Today, IST) ─────────────────────────────
function TimeOfDayChart({ timeOfDay }) {
  const data = [
    { name: 'Morning', distress: timeOfDay?.morning?.avgDistressScore ?? null, interactions: timeOfDay?.morning?.count ?? 0 },
    { name: 'Afternoon', distress: timeOfDay?.afternoon?.avgDistressScore ?? null, interactions: timeOfDay?.afternoon?.count ?? 0 },
    { name: 'Evening', distress: timeOfDay?.evening?.avgDistressScore ?? null, interactions: timeOfDay?.evening?.count ?? 0 },
    { name: 'Night', distress: timeOfDay?.night?.avgDistressScore ?? null, interactions: timeOfDay?.night?.count ?? 0 },
  ];
  const hasAny = data.some((d) => d.distress != null || d.interactions > 0);
  if (!hasAny) {
    return <div className="vp-chat-empty">No chatbot interactions recorded today — time-of-day breakdown unavailable.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          contentStyle={{ fontSize: '0.78rem', borderRadius: 10, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: '0.74rem', color: '#64748b' }} iconType="circle" iconSize={8} />
        <Bar dataKey="distress" name="Distress Level" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="interactions" name="Interactions" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Emotion donut ──────────────────────────────────────────────
function EmotionDonut({ breakdown }) {
  const entries = EMOTION_ORDER
    .map((k) => ({ name: k, value: breakdown?.[k] ?? 0 }))
    .filter((e) => e.value > 0);
  const total = entries.reduce((s, e) => s + e.value, 0);

  if (total === 0) {
    return <div className="vp-chat-empty">No emotion data recorded yet.</div>;
  }

  return (
    <div className="vp-donut-wrap">
      <div style={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              startAngle={90}
              endAngle={-270}
              paddingAngle={entries.length > 1 ? 3 : 0}
              strokeWidth={0}
            >
              {entries.map((e) => (
                <Cell key={e.name} fill={EMOTION_COLORS[e.name] || '#94a3b8'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span className="vp-donut-center-num">{total}</span>
          <span className="vp-donut-center-label">Total</span>
        </div>
      </div>

      <div className="vp-legend">
        {EMOTION_ORDER.map((name) => {
          const count = breakdown?.[name] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div className="vp-legend-row" key={name}>
              <span className="lg-dot" style={{ background: EMOTION_COLORS[name] }} />
              <span>{name}</span>
              <span className="lg-pct">{pct}%</span>
              <span className="lg-count">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat history (compact triage view) ─────────────────────────
function ChatLogs({ victimId, lastUpdated }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchChats() {
      if (!victimId) return;
      try {
        const res = await api.get(`/counselor/victims/${victimId}/chats`);
        if (!cancelled) setChats(res.data.data || []);
      } catch (err) {
        if (!cancelled) setError('Failed to load chat history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchChats();
    return () => { cancelled = true; };
  }, [victimId, lastUpdated]);

  if (loading) return <div className="vp-chat-empty">Loading chat history…</div>;
  if (error) return <div className="vp-chat-empty" style={{ color: '#b91c1c' }}>{error}</div>;
  if (chats.length === 0) return <div className="vp-chat-empty">No chat sessions found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {chats.map((session, index) => {
        const isOpen = expandedSession === session._id;
        const lastMsg = session.messages?.[session.messages.length - 1];
        return (
          <div className="vp-chat-session" key={session._id}>
            <button
              type="button"
              className="vp-chat-session-head"
              onClick={() => setExpandedSession(isOpen ? null : session._id)}
              aria-expanded={isOpen}
            >
              <div>
                <div className="vp-chat-session-title">
                  <span className="rail-dot" />
                  Session {chats.length - index}
                </div>
                <div className="vp-chat-session-meta">
                  {fmtDateTime(session.createdAt)} · {session.messages?.length || 0} message{(session.messages?.length ?? 0) === 1 ? '' : 's'}
                </div>
              </div>
              <span className="vp-chat-session-toggle">{isOpen ? 'Close ▲' : 'Expand ▼'}</span>
            </button>

            {isOpen ? (
              <div className="vp-chat-messages">
                {session.messages?.length > 0 ? (
                  session.messages.map((msg) => {
                    const isUser = msg.senderType === 'user' || msg.senderType === 'victim';
                    const isVoice = msg.metadata?.source === 'voice' || msg.metadata?.source === 'voice_summary';
                    return (
                      <div key={msg._id} className={`vp-chat-msg ${isUser ? 'msg-user' : ''} ${isVoice ? 'msg-voice' : ''}`}>
                        <div className="msg-head">
                          <span>{isUser ? 'Patient' : 'Aarohan AI'}</span>
                          {isVoice && <span>🎙️</span>}
                          <span style={{ fontWeight: 400 }}>{fmtTime(msg.createdAt)}</span>
                          {msg.metadata?.emotion && (
                            <span className="msg-emotion-tag">{msg.metadata.emotion}</span>
                          )}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="vp-chat-empty">No messages recorded in this session.</div>
                )}
              </div>
            ) : (
              lastMsg && (
                <div className="vp-chat-messages" style={{ maxHeight: 'none' }}>
                  <div className={`vp-chat-msg ${lastMsg.senderType === 'victim' || lastMsg.senderType === 'user' ? 'msg-user' : ''}`}>
                    <div className="msg-head">
                      <span>{lastMsg.senderType === 'victim' || lastMsg.senderType === 'user' ? 'Patient' : 'Aarohan AI'}</span>
                      <span style={{ fontWeight: 400 }}>{fmtTime(lastMsg.createdAt)}</span>
                    </div>
                    <div style={{
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420,
                    }}>
                      {lastMsg.content}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function VictimProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  // Admins render this same page under /admin/counselors/:id/victims/:id —
  // breadcrumbs and back targets follow the portal it is mounted in.
  const isAdminPortal = routeLocation.pathname.startsWith('/admin');
  // Admin mounts this page at /admin/victims/:id (primary) and at the
  // /admin/counselors/:counselorId/victims/:id deep link — back target follows.
  const isAdminCounselorPath = /^\/admin\/counselors\//.test(routeLocation.pathname);
  const listBackTo = !isAdminPortal
    ? '/counselor/victims'
    : isAdminCounselorPath
      ? '/admin/counselors'
      : '/admin/victims';
  const backLabel = !isAdminPortal
    ? '← My Victims'
    : isAdminCounselorPath
      ? '← Counselor Management'
      : '← Victims';

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [staleWarning, setStaleWarning] = useState(false);
  const [showCrisisDetails, setShowCrisisDetails] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const timerRef = useRef(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!id) {
      setError('No victim ID provided.');
      setLoading(false);
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
      setStaleWarning(false);
    } else {
      setLoading(true);
      setError('');
    }
    try {
      const res = await api.get(`/counselor/victims/${id}/dashboard`);
      setDashData(res.data.data);
      setLastUpdated(new Date());
      setError('');
      setStaleWarning(false);
    } catch (err) {
      const status = err.response?.status;
      if (!isRefresh) {
        if (status === 403) setError("You are not authorized to view this victim's dashboard.");
        else if (status === 404) setError('Victim not found.');
        else setError(err.response?.data?.message || 'Failed to load dashboard. Please try again.');
      } else {
        setStaleWarning(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  const isCallActive = dashData?.currentStatus?.isVoiceCallActive;

  // Adaptive polling: fast while a live call is in progress
  useEffect(() => {
    const interval = isCallActive ? LIVE_REFRESH_INTERVAL_MS : REFRESH_INTERVAL_MS;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchDashboard(true), interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchDashboard, isCallActive]);

  // Ticker for the live call duration timer
  useEffect(() => {
    if (!isCallActive) return undefined;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isCallActive]);

  const d = dashData;
  const currentStatus = d?.currentStatus;
  const today = d?.today;

  // ── Derived triage values ────────────────────────────────────
  const riskScore = currentStatus?.distressScore ?? today?.avgDistressScore ?? null;
  const band = currentStatus?.distressBand || bandFor(riskScore);
  const currentEmotion = currentStatus?.primaryEmotion || today?.dominantEmotion || null;
  const crisisCount = Math.max(today?.crisisMessageCount ?? 0, d?.alerts?.length ? 1 : 0);
  const hasCrisis = currentStatus?.crisisActive || crisisCount > 0;

  const trend = d?.dailyTrend || [];

  // Two-line AI summary of what's going on right now (under Current Emotion)
  const emotionSummary = useMemo(() => {
    const raw = today?.realtimeSummary;
    if (!raw || typeof raw !== 'string') return null;
    if (/^no interactions|^summary not available|^summary generating/i.test(raw.trim())) return null;
    return raw.trim();
  }, [today?.realtimeSummary]);
  const riskDelta = useMemo(() => {
    if (trend.length < 2) return null;
    const prev = trend[trend.length - 2].avgDistressScore;
    const curr = trend[trend.length - 1].avgDistressScore;
    if (prev == null || curr == null || prev === curr) return null;
    return { diff: curr - prev, up: curr > prev };
  }, [trend]);

  const lastActivityRaw = today?.lastInteractionAt || currentStatus?.lastAnalyzedAt || d?.victim?.updatedAt || null;

  // Live call duration (from the most recent voice log timestamp)
  const liveStart = isCallActive && currentStatus?.recentLog?.length
    ? new Date(currentStatus.recentLog[0].timestamp).getTime()
    : null;
  const liveDuration = liveStart ? fmtDuration(nowTick - liveStart) : null;

  // ── Today's timeline events ──────────────────────────────────
  const timelineEvents = useMemo(() => {
    const events = [];
    if (hasCrisis) {
      const crisisAlert = (d?.alerts || []).find((a) => a.severity === 'CRITICAL') || d?.alerts?.[0];
      events.push({
        time: crisisAlert?.createdAt || today?.lastInteractionAt,
        tone: 'crisis',
        title: 'Crisis signal detected',
        desc: crisisAlert?.description || 'AI detected high-risk interaction (suicidal ideation or severe danger).',
      });
    }
    if (isCallActive) {
      const lastLog = currentStatus?.recentLog?.[0];
      events.push({
        time: lastLog?.timestamp || lastActivityRaw,
        tone: 'live',
        title: 'Live voice call',
        desc: '',
        live: {
          emotion: lastLog?.emotion || currentEmotion,
          score: lastLog?.distressScore ?? riskScore,
        },
      });
    }
    if ((today?.interactionCount ?? 0) > 0) {
      events.push({
        time: today?.lastInteractionAt,
        title: 'Chat interaction',
        desc: `${today.interactionCount} interaction${today.interactionCount !== 1 ? 's' : ''} today`,
      });
    }
    if (today?.selfReportedFeeling) {
      events.push({
        time: today?.selfReportedAt,
        title: 'Self check-in',
        desc: `Patient reported feeling "${today.selfReportedFeeling}"`,
      });
    }
    if (d?.caseInfo?.assignedAt) {
      events.push({
        time: d.caseInfo.assignedAt,
        title: 'Case updated',
        desc: `Case status marked as ${d.caseInfo.status || 'Assigned'}`,
      });
    }
    return events
      .filter((e) => e.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);
  }, [d, hasCrisis, isCallActive, currentStatus, today, currentEmotion, riskScore, lastActivityRaw]);

  // ── Loading / error states ───────────────────────────────────
  if (loading) {
    return (
      <div className="vp-page">
        <div className="vp-loading">Loading mental health dashboard…</div>
      </div>
    );
  }

  if (error && !d) {
    return (
      <div className="vp-page">
        <div className="vp-breadcrumb">
          <Link to={listBackTo}>{backLabel}</Link>
        </div>
        <div className="vp-error-box">{error}</div>
      </div>
    );
  }

  const victimName = d?.victim?.name || 'Assigned Victim';
  const age = computeAge(d?.victim?.dob);
  const location = [d?.victim?.district, d?.victim?.state].filter(Boolean).join(', ') || null;
  const caseId = d?.caseInfo?.caseId || null;
  const statusPillClass = band ? BAND_PILL[band] : 'vp-pill-risk-low';

  return (
    <div className="vp-page">
      {/* ── Breadcrumb ── */}
      <div className="vp-breadcrumb">
        <Link to={listBackTo}>{backLabel}</Link>
        <span>›</span>
        <span className="crumb-current">{victimName}</span>
        {refreshing && <span style={{ color: '#2563eb', marginLeft: 8, fontSize: '0.72rem' }}>⟳ Refreshing…</span>}
        {staleWarning && lastUpdated && (
          <span style={{ color: '#b45309', marginLeft: 8, fontSize: '0.72rem' }}>
            ⚠ Showing data from {fmtTime(lastUpdated)}
          </span>
        )}
      </div>

      {/* ── C. PATIENT HEADER ── */}
      <section className="vp-patient-header">
        <div className="vp-patient-avatar">
          {d?.victim?.userId?.profileImage
            ? <img src={`http://localhost:5000${d.victim.userId.profileImage}`} alt={victimName} onError={(e) => { e.target.style.display = 'none'; }} />
            : <span aria-hidden="true">👩</span>}
        </div>

        <div className="vp-patient-main">
          <div className="vp-patient-title-row">
            <h1 className="vp-patient-name">{victimName}</h1>
            {band && (
              <span className={`vp-pill ${statusPillClass}`}>
                <span className="dot" />
                {band.toUpperCase()} RISK
              </span>
            )}
            <span className="vp-pill vp-pill-active">
              <span className="dot" />
              Active Case
            </span>
          </div>
          <div className="vp-patient-facts">
            {d?.victim?.gender && <span className="fact">⚧ <strong>{d.victim.gender}</strong></span>}
            {age != null && <span className="fact">🎂 <strong>{age} years</strong></span>}
            {caseId && <span className="fact">🗂 <strong>Case ID: {caseId}</strong></span>}
            {location && <span className="fact">📍 {location}</span>}
          </div>
        </div>

        <div className="vp-patient-quote">
          <div className="quote-text">&ldquo;Listen without judgment. You can make a difference.&rdquo;</div>
          <div className="quote-activity">
            Last activity<br />
            <strong>{fmtDateTime(lastActivityRaw)}</strong>
          </div>
        </div>
      </section>

      {/* ── D. CRITICAL SITUATION BANNER ── */}
      {(hasCrisis || isCallActive) && (
        <section className="vp-critical-banner" role="alert">
          <div className="vp-critical-icon" aria-hidden="true">🚨</div>
          <div className="vp-critical-content">
            <h2 className="vp-critical-title">
              {hasCrisis ? 'CRITICAL SITUATION' : 'LIVE VOICE SESSION IN PROGRESS'}
            </h2>
            <div className="vp-critical-sub">
              {hasCrisis
                ? 'AI has detected high-risk indicators in the recent interaction. Immediate attention is required.'
                : 'The patient is currently on a live voice call with the AI assistant. Real-time condition logs are being generated.'}
            </div>
          </div>
          <div className="vp-critical-actions">
            <a className="vp-btn vp-btn-primary-red" href={`tel:${d?.victim?.phone || ''}`}>
              📞 Join Live Call
            </a>
            {hasCrisis && (
              <button
                type="button"
                className="vp-btn vp-btn-outline-red"
                onClick={() => setShowCrisisDetails((v) => !v)}
              >
                {showCrisisDetails ? 'Hide Crisis Details' : 'View Crisis Details'} <span className="arrow">→</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Crisis details panel (evidence behind the banner action) */}
      {showCrisisDetails && (
        <section className="vp-card">
          <CardHead icon="🔔" title={`Open Alerts (${d?.alerts?.length ?? 0})`} />
          {(d?.alerts?.length ?? 0) === 0 ? (
            <div className="vp-chat-empty">✓ No open alerts for this victim</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {d.alerts.map((alert) => (
                <div key={alert._id} style={{
                  border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{
                    background: alert.severity === 'CRITICAL' ? '#fee2e2' : alert.severity === 'HIGH' ? '#ffedd5' : '#fef3c7',
                    color: alert.severity === 'CRITICAL' ? '#b91c1c' : alert.severity === 'HIGH' ? '#c2410c' : '#b45309',
                    borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
                  }}>
                    {alert.severity}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{alert.alertType}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>{alert.description}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                      {fmtDateTime(alert.createdAt)} · Status: {alert.status}
                      {alert.callStatus && <> · Auto-call: <strong>{alert.callStatus}</strong>{alert.callFailureReason ? ` (${alert.callFailureReason})` : ''}</>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── E. RAPID METRIC CARDS ── */}
      <section className="vp-metrics-grid">
        {/* Card 1 — Risk Score */}
        <div className="vp-metric tone-red">
          <div className="vp-metric-head">
            <span className="vp-metric-label"><span className="metric-ico" aria-hidden="true">📈</span> Risk Score</span>
          </div>
          <RiskGauge score={riskScore ?? 0} />
          {band && (
            <div style={{ textAlign: 'center' }}>
              <span className="vp-metric-band">{band.toUpperCase()}</span>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            {riskDelta ? (
              <span className={`vp-metric-delta ${riskDelta.up ? '' : 'delta-down'}`}>
                {riskDelta.up ? '↑' : '↓'} {riskDelta.up ? '+' : ''}{riskDelta.diff} from previous day
              </span>
            ) : (
              <span className="vp-metric-subline">Trend stabilizing</span>
            )}
          </div>
        </div>

        {/* Card 2 — Crisis Signal */}
        <div className={`vp-metric tone-red ${crisisCount > 0 ? 'crisis-card' : ''}`}>
          <div className="vp-metric-head">
            <span className="vp-metric-label"><span className="metric-ico" aria-hidden="true">🚨</span> Crisis Signal</span>
          </div>
          <div className="vp-metric-center">
            <span className="vp-metric-big">{crisisCount}</span>
            <span className="vp-metric-subline">
              {crisisCount > 0 ? 'Detected Today' : 'None Today'}
            </span>
          </div>
          {hasCrisis && (
            <div className="vp-metric-foot" style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="vp-btn vp-btn-outline-red"
                style={{ padding: '7px 14px' }}
                onClick={() => setShowCrisisDetails((v) => !v)}
              >
                View Alerts <span className="arrow">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Card 3 — Current Emotion */}
        <div className="vp-metric tone-purple">
          <div className="vp-metric-head">
            <span className="vp-metric-label"><span className="metric-ico" aria-hidden="true">🧠</span> Current Emotion</span>
          </div>
          <div className="vp-metric-center">
            <span className="vp-emotion-face" aria-hidden="true">
              {EMOTION_FACES[currentEmotion] || '😐'}
            </span>
            <span className="vp-emotion-name">{currentEmotion || 'Unknown'}</span>
            <span className="vp-metric-subline">
              {today?.avgDistressScore != null ? `Avg distress today: ${today.avgDistressScore}/100` : 'Awaiting interaction'}
            </span>
            {emotionSummary && (
              <p className="vp-emotion-summary">{emotionSummary}</p>
            )}
          </div>
        </div>

        {/* Card 4 — Live Session */}
        <div className={`vp-metric ${isCallActive ? 'tone-green' : 'tone-blue'}`}>
          <div className="vp-metric-head">
            <span className="vp-metric-label"><span className="metric-ico" aria-hidden="true">🎙️</span> Live Session</span>
            {isCallActive ? (
              <span className="vp-live-pill"><span className="dot" /> ONGOING</span>
            ) : (
              <span className="vp-live-off">OFFLINE</span>
            )}
          </div>
          <div className="vp-metric-center">
            {isCallActive ? (
              <>
                <div className="vp-waveform" aria-hidden="true">
                  {WAVE_HEIGHTS.slice(0, 14).map((h, i) => (
                    <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.09}s` }} />
                  ))}
                </div>
                <span className="vp-metric-big" style={{ fontSize: 26 }}>{liveDuration || '00:00:00'}</span>
                <span className="vp-metric-subline">Live call duration</span>
              </>
            ) : (
              <>
                <span className="vp-metric-subline" style={{ padding: '14px 0' }}>No ongoing voice session</span>
              </>
            )}
          </div>
          <div className="vp-metric-foot" style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="vp-btn vp-btn-outline-blue"
              style={{ padding: '7px 14px' }}
              onClick={() => navigate(isAdminPortal ? `/admin/victims/${id}/manage` : `/counselor/consultation/${id}`)}
            >
              Open Session <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── F. TREND + TODAY'S TIMELINE ── */}
      <section className="vp-grid-trend-timeline">
        <div className="vp-card">
          <CardHead
            icon="📊"
            title="Distress Trend"
            sub="(Last 30 Days)"
            right={<span className="vp-card-sub">Auto-refresh: {isCallActive ? '3s' : '60s'}</span>}
          />
          {trend.length > 0 ? (
            <>
              <DistressTrend trend={trend} />
              <div className="vp-card-sub" style={{ textAlign: 'right', marginTop: 6 }}>
                Based on {trend.reduce((s, day) => s + (day.messageCount || 0), 0)} messages across {trend.length} day{trend.length !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div className="vp-chat-empty">No distress data recorded in the last 30 days.</div>
          )}
        </div>

        <div className="vp-card">
          <CardHead icon="🕓" title="Today's Timeline" />
          {timelineEvents.length > 0 ? (
            <div className="vp-timeline">
              {timelineEvents.map((ev, i) => (
                <div className="vp-tl-item" key={`${ev.title}-${i}`}>
                  <div className="vp-tl-time">{fmtTime(ev.time)}</div>
                  <div className="vp-tl-rail">
                    <span className={`vp-tl-dot ${ev.tone ? `dot-${ev.tone}` : ''}`} />
                  </div>
                  <div className="vp-tl-body">
                    <div className={`vp-tl-title ${ev.tone === 'crisis' || ev.tone === 'live' ? 'tone-crisis' : ''}`}>
                      {ev.tone === 'crisis' && <span aria-hidden="true">⚠️</span>}
                      {ev.tone === 'live' && <span aria-hidden="true">🎙️</span>}
                      {ev.title}
                    </div>
                    {ev.live ? (
                      <div className="vp-tl-livecard">
                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                          Emotion: <strong>{ev.live.emotion || 'N/A'}</strong>
                          <span className="sep">|</span>
                          Distress: <strong>{ev.live.score ?? 'N/A'}/100</strong>
                          <span className="sep">|</span>
                          Duration: <strong>Ongoing</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="vp-tl-desc">{ev.desc}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="vp-chat-empty">No activity recorded today yet.</div>
          )}
        </div>
      </section>

      {/* ── G. EMOTION / DISTRESS ANALYTICS ── */}
      <section className="vp-grid-analytics">
        <div className="vp-card">
          <CardHead icon="🕐" title="Emotion & Distress Levels" sub="(Today, IST)" />
          <TimeOfDayChart timeOfDay={d?.timeOfDay} />
        </div>

        <div className="vp-card">
          <CardHead icon="🧩" title="Emotion Breakdown" sub="(Overall)" />
          <EmotionDonut breakdown={currentStatus?.emotionsBreakdown} />
        </div>
      </section>

      {/* ── H. VICTIM PROFILE + CASE INFORMATION ── */}
      <section className="vp-grid-profile-case">
        <div className="vp-card">
          <CardHead icon="👤" title="Victim Profile" />
          <div className="vp-info-table">
            <div className="vp-info-row">
              <span className="info-label">Name</span>
              <span className="info-value">{display(d?.victim?.name)}</span>
            </div>
            <div className="vp-info-row">
              <span className="info-label">Gender</span>
              <span className="info-value">{display(d?.victim?.gender)}</span>
            </div>
            <div className="vp-info-row">
              <span className="info-label">Age</span>
              <span className="info-value">{age != null ? `${age} years` : 'N/A'}</span>
            </div>
            <div className="vp-info-row">
              <span className="info-label">Phone</span>
              <span className="info-value">
                {display(d?.victim?.phone)}
                {d?.victim?.phone && (
                  <a className="value-icon" href={`tel:${d.victim.phone}`} title="Call patient">📞</a>
                )}
              </span>
            </div>
            <div className="vp-info-row">
              <span className="info-label">Location</span>
              <span className="info-value">📍 {display(location)}</span>
            </div>
            <div className="vp-info-row">
              <span className="info-label">Social Category</span>
              <span className="info-value">{display(d?.victim?.socialCategory)}</span>
            </div>

            {showFullProfile && (
              <>
                <div className="vp-info-row">
                  <span className="info-label">Address</span>
                  <span className="info-value">{display(d?.victim?.address)}</span>
                </div>
                <div className="vp-info-row">
                  <span className="info-label">PIN Code</span>
                  <span className="info-value">{display(d?.victim?.pinCode)}</span>
                </div>
                <div className="vp-info-row">
                  <span className="info-label">Profession</span>
                  <span className="info-value">{display(d?.victim?.profession)}</span>
                </div>
                {(d?.victim?.emergencyContacts?.length ?? 0) > 0 && (
                  <div className="vp-info-row">
                    <span className="info-label">Emergency Contacts</span>
                    <span className="info-value">
                      {d.victim.emergencyContacts.map((c) => `${c.name} (${c.relationship}) — ${c.phone}`).join(' · ')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            className="vp-btn vp-btn-outline-blue vp-view-all-btn"
            onClick={() => setShowFullProfile((v) => !v)}
          >
            {showFullProfile ? 'Hide Full Profile' : 'View Full Profile'} <span className="arrow">→</span>
          </button>
        </div>

        <div className="vp-card">
          <CardHead icon="🗂" title="Case Information" />
          {d?.caseInfo ? (
            <>
              <div className="vp-info-table">
                <div className="vp-info-row">
                  <span className="info-label">Case ID</span>
                  <span className="info-value">{display(d.caseInfo.caseId)}</span>
                </div>
                <div className="vp-info-row">
                  <span className="info-label">Category</span>
                  <span className="info-value">{display(d.caseInfo.category)}</span>
                </div>
                <div className="vp-info-row">
                  <span className="info-label">Status</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>{display(d.caseInfo.status)}</span>
                </div>
                <div className="vp-info-row">
                  <span className="info-label">Chat Sessions</span>
                  <span className="info-value">{d?.sessionCount ?? 0}</span>
                </div>
              </div>

              {d.caseInfo.firDetails?.firNumber && (
                <>
                  <hr className="vp-card-divider" />
                  <div className="vp-fir-head">📄 FIR Details</div>
                  <div className="vp-info-table">
                    <div className="vp-info-row">
                      <span className="info-label">FIR Number</span>
                      <span className="info-value">{display(d.caseInfo.firDetails.firNumber)}</span>
                    </div>
                    <div className="vp-info-row">
                      <span className="info-label">Police Station</span>
                      <span className="info-value">{display(d.caseInfo.firDetails.policeStation)}</span>
                    </div>
                    <div className="vp-info-row">
                      <span className="info-label">FIR District</span>
                      <span className="info-value">{display(d.caseInfo.firDetails.firDistrict)}</span>
                    </div>
                    <div className="vp-info-row">
                      <span className="info-label">FIR State</span>
                      <span className="info-value">{display(d.caseInfo.firDetails.firState)}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="vp-chat-empty">No case information available</div>
          )}
        </div>
      </section>

      {/* ── I. PATIENT CHAT LOGS + LIVE VOICE LOGS ── */}
      <section className="vp-grid-chat-voice">
        <div className="vp-card">
          <CardHead
            icon="💬"
            title="Patient Chat Logs"
            right={<Link to={listBackTo} className="vp-btn vp-btn-ghost">View All <span className="arrow">→</span></Link>}
          />
          <ChatLogs victimId={id} lastUpdated={lastUpdated} />
        </div>

        <div className="vp-card">
          <CardHead
            icon="🎙️"
            title="Live Voice Logs"
            right={isCallActive ? (
              <span className="vp-active-call-pill"><span className="dot" /> Active Call</span>
            ) : null}
          />

          {isCallActive && (
            <div className="vp-voice-live">
              <div className="vp-voice-live-head">
                <span className="vp-voice-mic" aria-hidden="true">🎤</span>
                <div className="vp-voice-live-title">Live voice session in progress…</div>
              </div>
              <div className="vp-voice-live-stats">
                <span>Emotion: <strong>{currentStatus?.recentLog?.[0]?.emotion || currentEmotion || 'N/A'}</strong></span>
                <span className="stat-sep">|</span>
                <span>Score: <strong>{currentStatus?.recentLog?.[0]?.distressScore ?? riskScore ?? 'N/A'}/100</strong></span>
                <span className="stat-sep">|</span>
                <span>Started: <strong>{currentStatus?.recentLog?.[0] ? fmtTime(currentStatus.recentLog[0].timestamp) : fmtTime(lastActivityRaw)}</strong></span>
              </div>
              <div className="vp-voice-wave" aria-hidden="true">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(currentStatus?.recentLog?.length ?? 0) > 0 ? (
              currentStatus.recentLog.slice(isCallActive ? 1 : 0).map((log, idx) => (
                <div
                  key={idx}
                  className={`vp-voice-row ${log.distressScore >= 75 ? 'tone-red' : log.distressScore >= 50 ? 'tone-amber' : ''}`}
                >
                  <div className="row-msg">{log.message}</div>
                  <div className="row-meta">
                    <span>{log.emotion || 'N/A'}</span>
                    <span>Score: {log.distressScore}/100</span>
                    <span>{fmtTime(log.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              !isCallActive && (
                <div className="vp-chat-empty" style={{ padding: '18px 0' }}>No voice logs recorded yet.</div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── J. AI DISCLAIMER ── */}
      <section className="vp-disclaimer">
        <div className="disc-text">
          <strong>Note:</strong> All metrics shown are AI-derived monitoring indicators based on chatbot interactions and self-reports.
          They are not clinical diagnoses. Counselor intervention should be based on professional judgment.
        </div>
        <span className="vp-together">💚 Together for a Safer India</span>
      </section>
    </div>
  );
}
