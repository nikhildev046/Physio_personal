import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, notificationsApi } from "../api/services.js";
import { notify } from "../lib/push.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [therapist, setTherapist] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [unread, setUnread] = useState(0);

  // Restore a dummy session on load (no real persistence — demo convenience).
  useEffect(() => {
    setBooting(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const { therapist } = await authApi.login(credentials);
    setTherapist(therapist);
    setAuthed(true);
    return therapist;
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    setTherapist(null);
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const list = await notificationsApi.list();
      setUnread(list.filter((n) => !n.read).length);
    } catch {
      /* ignore in demo */
    }
  }, []);

  useEffect(() => {
    if (authed) refreshUnread();
  }, [authed, refreshUnread]);

  // Raise an alert: add it to the in-app list AND fire a phone/system
  // notification (no-op if the user hasn't granted permission).
  const pushAlert = useCallback(
    async ({ type = "booking", title, body }) => {
      await notificationsApi.create({ type, title, body });
      await notify(title, { body, tag: type });
      refreshUnread();
    },
    [refreshUnread]
  );

  return (
    <AppContext.Provider
      value={{ therapist, authed, booting, login, logout, unread, refreshUnread, pushAlert }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
