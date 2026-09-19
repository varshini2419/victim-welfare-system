import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const ShellSummaryContext = createContext(null);

const POLL_INTERVAL_MS = 30000;

export const ShellSummaryProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState({ victims: 0, pendingRequests: 0, newAlerts: 0, liveCalls: 0, followUps: 0 });
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const timerRef = useRef(null);

  const isCounselor = user?.role === 'counselor' && !!token;

  const refresh = useCallback(async () => {
    if (!isCounselor) return;
    try {
      const res = await api.get('/counselor/summary');
      if (res.data?.success) {
        setSummary({
          victims: res.data.data.victims ?? 0,
          pendingRequests: res.data.data.pendingRequests ?? 0,
          newAlerts: res.data.data.newAlerts ?? 0,
          liveCalls: res.data.data.liveCalls ?? 0,
          followUps: res.data.data.followUps ?? 0,
        });
      }
    } catch {
      // Silent: badges are non-critical; keep last known values
    }
  }, [isCounselor]);

  const refreshNotifications = useCallback(async () => {
    if (!isCounselor) return;
    try {
      const res = await api.get('/counselor/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.items || []);
        setNotificationsLoaded(true);
      }
    } catch {
      // Silent: keep last known list
    }
  }, [isCounselor]);

  useEffect(() => {
    if (!isCounselor) {
      setSummary({ victims: 0, pendingRequests: 0, newAlerts: 0, liveCalls: 0, followUps: 0 });
      setNotifications([]);
      setNotificationsLoaded(false);
      return undefined;
    }
    refresh();
    refreshNotifications();
    timerRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCounselor, refresh, refreshNotifications]);

  const acknowledgeAlert = useCallback(async (alertId) => {
    await api.patch(`/counselor/notifications/alerts/${alertId}/acknowledge`);
    await Promise.all([refresh(), refreshNotifications()]);
  }, [refresh, refreshNotifications]);

  return (
    <ShellSummaryContext.Provider
      value={{ summary, notifications, notificationsLoaded, refresh, refreshNotifications, acknowledgeAlert }}
    >
      {children}
    </ShellSummaryContext.Provider>
  );
};

export const useShellSummary = () => {
  const ctx = useContext(ShellSummaryContext);
  if (!ctx) {
    // Fail soft: pages rendered outside the provider get inert defaults
    return {
      summary: { victims: 0, pendingRequests: 0, newAlerts: 0, liveCalls: 0, followUps: 0 },
      notifications: [],
      notificationsLoaded: false,
      refresh: () => {},
      refreshNotifications: () => {},
      acknowledgeAlert: () => {},
    };
  }
  return ctx;
};
