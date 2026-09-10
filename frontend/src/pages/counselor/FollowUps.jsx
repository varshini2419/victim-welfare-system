<<<<<<< HEAD
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import DistressTrendChart from '../../components/charts/DistressTrendChart';
import {
  BAND_STYLES,
  RiskBadge,
  CrisisBanner,
  TodayEmotionCard,
  fmtDate,
  fmtTime,
  fmtDateTime,
  display,
} from '../../components/counselor/CounselorCommon';

const REFRESH_INTERVAL_MS = 60000; // 60s auto-refresh

const STATUS_THEMES = {
  Overdue:   { bg: '#fdecec', text: '#b91c1c', border: '#fca5a5', badgeBg: '#fee2e2', icon: '🚨' },
  Scheduled: { bg: '#eef2fb', text: '#1e40af', border: '#bfdbfe', badgeBg: '#dbeafe', icon: '📅' },
  Completed: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', badgeBg: '#dcfce7', icon: '✅' },
};

const METHOD_ICONS = {
  'Phone Call': '📞 Phone Call',
  'Call': '📞 Phone Call',
  'In-Person': '🏥 In-Person',
  'Tele-consult': '💻 Tele-Consult',
  'Chat': '💬 Chat/Messaging',
};

export default function FollowUps() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState(null);
  const [victimDashData, setVictimDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const timerRef = useRef(null);

  // Fetch all follow-ups with automatic fallback if /follow-ups route is 404
  const fetchFollowUps = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError('');
    }

    try {
      let list = [];
      try {
        const res = await api.get('/counselor/follow-ups');
        list = res.data.data || [];
      } catch (endpointErr) {
        // Fallback to /counselor/victims + /counselor/appointments if /follow-ups returns 404
        if (endpointErr.response?.status === 404) {
          const [victimsRes, apptsRes] = await Promise.all([
            api.get('/counselor/victims'),
            api.get('/counselor/appointments?range=all').catch(() => ({ data: { data: [] } })),
          ]);
          const victims = victimsRes.data.data || [];
          const appts = apptsRes.data?.data || [];
          const now = new Date();

          list = victims.map((v) => {
            const vId = v._id || v.victimId;
            const victimAppts = appts.filter((a) => (a.victimId?._id || a.victimId)?.toString() === vId?.toString());
            const nextAppt = victimAppts.find((a) => new Date(a.scheduledAt) >= now && a.status === 'scheduled');
            const lastAppt = victimAppts.find((a) => new Date(a.scheduledAt) < now || a.status === 'completed');

            const score = v.distressAnalysis?.distressScore ?? 20;
            const band = v.distressAnalysis?.distressBand || (score >= 75 ? 'Severe' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');
            const intervalDays = band === 'Severe' ? 2 : band === 'High' ? 3 : band === 'Moderate' ? 7 : 14;
            const lastContact = lastAppt?.scheduledAt || v.lastInteractionAt || v.assignedAt || now;

            let nextDue = nextAppt?.scheduledAt;
            if (!nextDue) {
              nextDue = new Date(new Date(lastContact).getTime() + intervalDays * 24 * 60 * 60 * 1000);
            }

            const isOverdue = new Date(nextDue) < now && (!nextAppt || nextAppt.status !== 'completed');
            const method = nextAppt?.mode === 'tele' ? 'Tele-consult' : nextAppt?.mode === 'voice' ? 'Phone Call' : 'In-Person';
            const status = isOverdue ? 'Overdue' : nextAppt?.status === 'completed' ? 'Completed' : 'Scheduled';

            return {
              _id: vId,
              victimId: vId,
              name: v.name || 'Assigned Victim',
              caseId: v.caseId || (vId ? `ARH-${vId.toString().slice(-4).toUpperCase()}` : 'N/A'),
              category: v.category || 'General Counseling',
              district: v.district || 'N/A',
              state: v.state || 'N/A',
              phone: v.phone || 'N/A',
              distressScore: score,
              distressBand: band,
              primaryEmotion: v.distressAnalysis?.primaryEmotion || 'Calm',
              lastContactedAt: lastContact,
              nextFollowUpDue: nextDue,
              method,
              status,
              isOverdue,
              notes: nextAppt?.notes || `Routine ${band.toLowerCase()} risk follow-up check-in.`,
              lastInteractionAt: v.lastInteractionAt || lastContact,
            };
          });

          list.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return (b.distressScore || 0) - (a.distressScore || 0);
          });
        } else {
          throw endpointErr;
        }
      }

      setFollowUps(list);

      // Select first victim if none selected or if selected is not in list
      if (list.length > 0) {
        setSelectedVictimId((prev) => {
          if (prev && list.some((item) => item.victimId === prev)) return prev;
          return list[0].victimId;
        });
      }
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      if (!isRefresh) {
        setError(err.response?.data?.message || 'Failed to load follow-up records.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch detailed dashboard/trend data for selected victim
  const fetchVictimDetails = useCallback(async (victimId) => {
    if (!victimId) return;
    try {
      const res = await api.get(`/counselor/victims/${victimId}/dashboard`);
      setVictimDashData(res.data.data || null);
    } catch (err) {
      console.warn('Could not fetch victim dashboard data for follow-up view:', err);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps(false);
    timerRef.current = setInterval(() => fetchFollowUps(true), REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchFollowUps]);

  useEffect(() => {
    if (selectedVictimId) {
      fetchVictimDetails(selectedVictimId);
    }
  }, [selectedVictimId, fetchVictimDetails]);

  // Find currently active follow-up item
  const currentItem = followUps.find((f) => f.victimId === selectedVictimId) || followUps[0] || null;
  const currentStatus = victimDashData?.currentStatus || (currentItem ? {
    distressBand: currentItem.distressBand,
    distressScore: currentItem.distressScore,
    primaryEmotion: currentItem.primaryEmotion,
    crisisActive: currentItem.isOverdue,
  } : null);

  const todayData = victimDashData?.today || (currentItem ? {
    interactionCount: 1,
    avgDistressScore: currentItem.distressScore,
    dominantEmotion: currentItem.primaryEmotion,
    lastInteractionAt: currentItem.lastInteractionAt,
    selfReportedFeeling: null,
  } : null);

  const dailyTrend = victimDashData?.dailyTrend || [];
  const band = currentStatus?.distressBand || currentItem?.distressBand || 'Low';
  const bandStyle = BAND_STYLES[band] || BAND_STYLES.Low;
  const statusTheme = STATUS_THEMES[currentItem?.status] || STATUS_THEMES.Scheduled;

  const isOverdue = currentItem?.isOverdue || currentItem?.status === 'Overdue';
  const hasCrisis = currentStatus?.crisisActive || (todayData?.crisisMessageCount ?? 0) > 0;

  // Filtered list for the caseload selector table
  const filteredCaseload = followUps.filter((item) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.caseId || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="counselor-page" style={{ padding: '1rem', backgroundColor: '#f5f6fa', minHeight: '100%' }}>
      {/* ── HEADER CARD ─────────────────────────────────────────── */}
      <div
        style={{
          background: '#eef2fb',
          border: '1px solid #d1d5db',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          color: '#1a1a2e',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <Link
              to="/counselor/victims"
              style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}
            >
              &larr; My Victims
            </Link>
            <h1
              style={{
                margin: '0.35rem 0 0 0',
                fontSize: '1.3rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                color: '#1a1a2e',
              }}
            >
              🧠 FOLLOW-UP TRACKING &amp; MONITORING
            </h1>

            {currentItem && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.84rem',
                  color: '#4b5563',
                  display: 'flex',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  fontWeight: 600,
                  alignItems: 'center',
                }}
              >
                {/* Victim Switcher Dropdown */}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>👤 Victim:</span>
                  <select
                    value={selectedVictimId || ''}
                    onChange={(e) => setSelectedVictimId(e.target.value)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#1a1a2e',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {followUps.map((v) => (
                      <option key={v.victimId} value={v.victimId}>
                        {v.name} ({v.caseId}) {v.isOverdue ? '— ⚠ Overdue' : ''}
                      </option>
                    ))}
                  </select>
                </span>

                <span>📋 Case: {currentItem.caseId}</span>
                <span>
                  📅{' '}
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#4b5563' }}>
            {refreshing && <div style={{ color: '#2563eb', marginBottom: 2 }}>🔄 Refreshing...</div>}
            {lastUpdated && <div>Last updated: {fmtTime(lastUpdated)}</div>}
            <div style={{ marginTop: 2, color: '#6b7280' }}>Auto-refresh: 60s</div>
            {bandStyle && (
              <div
                style={{
                  marginTop: '0.5rem',
                  background: bandStyle.bg,
                  color: bandStyle.text,
                  border: `1px solid ${bandStyle.border}`,
                  borderRadius: 20,
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-block',
                }}
              >
                {bandStyle.label} RISK
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Loading follow-up tracking data...</div>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fdecec',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '1rem',
            color: '#991b1b',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !currentItem && (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '3rem 2rem',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e' }}>
            No pending follow-ups required.
          </p>
          <p style={{ fontSize: '0.85rem' }}>Your active caseload is currently up to date.</p>
        </div>
      )}

      {!loading && !error && currentItem && (
        <>
          {/* ── CRISIS / OVERDUE ALERT BANNER ───────────────────────── */}
          {isOverdue && (
            <CrisisBanner
              icon="🚨"
              title={`FOLLOW-UP OVERDUE — ${currentItem.name?.toUpperCase()}`}
              message={`A follow-up session was due on ${fmtDateTime(currentItem.nextFollowUpDue)}. Please initiate contact immediately via ${currentItem.method || 'Phone Call'} to evaluate safety and distress levels.`}
            />
          )}

          {hasCrisis && !isOverdue && (
            <CrisisBanner
              icon="🚨"
              title="CRISIS SIGNAL DETECTED SINCE LAST CHECK-IN"
              message="Chatbot monitoring recorded elevated distress or crisis markers for this victim. Immediate counselor follow-up is recommended."
            />
          )}

          {/* ── THREE-COLUMN CARD ROW ──────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(260px, 1fr) minmax(260px, 1fr)',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Column 1: Distress Trend Chart */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '1.25rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                📈 Distress Trend Tracking (30 Days)
              </h3>
              <DistressTrendChart dailyTrend={dailyTrend} />
              {dailyTrend.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                  Based on {dailyTrend.reduce((s, day) => s + day.messageCount, 0)} messages across {dailyTrend.length} days
                </div>
              )}
            </div>

            {/* Column 2: Follow-Up Status Card (Light tinted amber/blue card) */}
            <div
              style={{
                background: statusTheme.bg,
                border: `1px solid ${statusTheme.border}`,
                borderRadius: 10,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.85rem',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    📋 Follow-Up Status
                  </h3>
                  <span
                    style={{
                      backgroundColor: statusTheme.badgeBg,
                      color: statusTheme.text,
                      border: `1px solid ${statusTheme.border}`,
                      borderRadius: 12,
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {statusTheme.icon} {currentItem.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      Next Follow-Up Due
                    </div>
                    <div style={{ fontWeight: 800, color: statusTheme.text, fontSize: '1.05rem', marginTop: 1 }}>
                      {fmtDate(currentItem.nextFollowUpDue)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      Last Contacted Date
                    </div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {fmtDateTime(currentItem.lastContactedAt)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      Follow-Up Method
                    </div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {METHOD_ICONS[currentItem.method] || currentItem.method || '📞 Phone Call'}
                    </div>
                  </div>

                  {currentItem.notes && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.78rem',
                        color: '#475569',
                      }}
                    >
                      <strong style={{ color: '#1e293b' }}>Notes:</strong> {currentItem.notes}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  onClick={() => navigate(`/counselor/victims/${currentItem.victimId}`)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.55rem 0.85rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  View Full Mental Health Profile &rarr;
                </button>
              </div>
            </div>

            {/* Column 3: Today's Emotion / Latest Self-Report Card */}
            <TodayEmotionCard
              today={todayData}
              title="Today's Emotion &amp; Check-In"
            />
          </div>

          {/* ── CASELOAD FOLLOW-UP ROSTER TABLE ─────────────────────── */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1a1a2e' }}>
                  👥 ALL ASSIGNED FOLLOW-UP SCHEDULES ({followUps.length})
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Click on any victim row to inspect their follow-up metrics and distress trend.
                </p>
              </div>

              <input
                type="text"
                placeholder="Filter follow-up list..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Victim Name</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Case ID</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Risk Level</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Next Follow-Up Due</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Method</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaseload.map((v) => {
                    const isSelected = v.victimId === selectedVictimId;
                    const rowStatus = STATUS_THEMES[v.status] || STATUS_THEMES.Scheduled;

                    return (
                      <tr
                        key={v.victimId}
                        onClick={() => setSelectedVictimId(v.victimId)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isSelected ? '#eef2fb' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#1a1a2e' }}>
                          {v.name}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', color: '#475569' }}>
                          {v.caseId}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <RiskBadge band={v.distressBand} score={v.distressScore} />
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 0.85rem',
                            fontWeight: v.isOverdue ? 800 : 500,
                            color: v.isOverdue ? '#b91c1c' : '#1e293b',
                          }}
                        >
                          {fmtDate(v.nextFollowUpDue)}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', color: '#475569' }}>
                          {v.method}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <span
                            style={{
                              backgroundColor: rowStatus.badgeBg,
                              color: rowStatus.text,
                              border: `1px solid ${rowStatus.border}`,
                              borderRadius: 12,
                              padding: '0.2rem 0.6rem',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                            }}
                          >
                            {rowStatus.icon} {v.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/counselor/victims/${v.victimId}`);
                            }}
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Profile &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
=======
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const fmtDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value))
  : 'N/A';

export default function FollowUps() {
  const [victims, setVictims] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState('');
  const [followUp, setFollowUp] = useState(null);
  const [actionTaken, setActionTaken] = useState({});
  const [error, setError] = useState('');

  const loadVictims = async () => {
    try {
      const response = await api.get('/counselor/follow-ups');
      setVictims(response.data.data || []);
      if (!selectedVictimId && response.data.data?.[0]) setSelectedVictimId(String(response.data.data[0].victimId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned victims.');
    }
  };

  const loadFollowUp = async (victimId) => {
    if (!victimId) return;
    try {
      const response = await api.get(`/counselor/follow-ups/${victimId}`);
      setFollowUp(response.data.data);
      setError('');
    } catch (err) {
      setFollowUp(null);
      setError(err.response?.data?.message || 'Failed to load follow-up details.');
    }
  };

  useEffect(() => { loadVictims(); }, []);
  useEffect(() => { loadFollowUp(selectedVictimId); }, [selectedVictimId]);

  const updateAlertStatus = async (alertId, status) => {
    try {
      await api.patch(`/counselor/follow-ups/alerts/${alertId}/status`, { status });
      await loadFollowUp(selectedVictimId);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update follow-up status.'); }
  };

  const resolveAlert = async (alertId) => {
    const value = actionTaken[alertId]?.trim();
    if (!value) {
      setError('Action taken is required before resolving an alert.');
      return;
    }
    try {
      await api.patch(`/counselor/follow-ups/alerts/${alertId}/resolve`, { actionTaken: value });
      await loadFollowUp(selectedVictimId);
    } catch (err) { setError(err.response?.data?.message || 'Failed to resolve follow-up.'); }
  };

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Follow-Ups</h1>
      </header>

      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: 8 }}>{error}</div>}
      <section style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
        <label>Select assigned victim<select value={selectedVictimId} onChange={(event) => setSelectedVictimId(event.target.value)}><option value="">Select victim</option>{victims.map((victim) => <option key={victim.victimId} value={victim.victimId}>{victim.name} ({victim.caseId})</option>)}</select></label>
      </section>
      {!followUp && <p style={{ color: '#6b7280' }}>Select an assigned victim to view follow-ups.</p>}
      {followUp && <div style={{ display: 'grid', gap: '1rem' }}>
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}><h2>{followUp.victim.name}</h2><p>Case ID: <strong>{followUp.caseInfo.caseId}</strong></p><p>Location: {followUp.victim.district}, {followUp.victim.state}</p></section>
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}><h2>Daily Updates</h2>{followUp.dailyUpdates.length === 0 ? <p>No Daily Updates submitted.</p> : followUp.dailyUpdates.map((update) => <article key={update._id} style={{ borderBottom: '1px solid #e5e7eb', padding: '0.75rem 0' }}><p>{update.content || update.feeling}</p><small>{fmtDateTime(update.createdAt)}</small></article>)}</section>
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}><h2>Emergency / High-Risk Follow-Ups</h2>{followUp.alerts.length === 0 ? <p>No emergency or high-risk follow-ups.</p> : followUp.alerts.map((alert) => <article key={alert._id} style={{ border: '1px solid #e2e8f0', padding: '0.85rem', marginBottom: '0.75rem', borderRadius: 6 }}><p><strong>{alert.alertType}</strong> · {alert.severity} · {alert.source}</p><p>{alert.description}</p><p>Risk: {alert.riskLevel || 'N/A'} {alert.riskScore != null ? `(${alert.riskScore}/100)` : ''}</p><p>Status: <strong>{alert.status}</strong> · Created: {fmtDateTime(alert.createdAt)}</p>{alert.callLogId ? <p>Call: {alert.callLogId.callStatus} · Initiated: {fmtDateTime(alert.callLogId.initiatedAt)}{alert.callLogId.failureReason ? ` · ${alert.callLogId.failureReason}` : ''}</p> : <p>Call record: Not available</p>}{alert.actionTaken && <p>Action taken: {alert.actionTaken}<br />Resolved: {fmtDateTime(alert.resolvedAt)}</p>}{alert.status === 'NEW' && <button type="button" onClick={() => updateAlertStatus(alert._id, 'ACKNOWLEDGED')}>Acknowledge</button>}{alert.status === 'ACKNOWLEDGED' && <button type="button" onClick={() => updateAlertStatus(alert._id, 'IN_PROGRESS')}>Mark In Progress</button>}{alert.status === 'IN_PROGRESS' && <div><textarea placeholder="Action taken" value={actionTaken[alert._id] || ''} onChange={(event) => setActionTaken({ ...actionTaken, [alert._id]: event.target.value })} rows={3} maxLength={2000} /><button type="button" onClick={() => resolveAlert(alert._id)}>Resolve Follow-Up</button></div>}</article>)}</section>
      </div>}
>>>>>>> appointment-scheduling
    </div>
  );
}
