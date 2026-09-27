import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './useToast.js';
import { API_CONFIG, getAuthHeaders } from '../config/api.js';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel', 'focus'];

export function useAutoLogout(inactivityMs = 5 * 60 * 1000) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const timerRef = useRef(null);

  const logout = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Auto-logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('activeEventId');
      localStorage.removeItem('clientPassword');
      localStorage.removeItem('deskOperatorPassword');
      localStorage.removeItem('isTempLogin');
      addToast('Signed out after 5 minutes of inactivity.', 'info', 4000);
      navigate('/login', { replace: true });
    }
  }, [navigate, addToast]);

  useEffect(() => {
    // The timer is armed from the activity listeners rather than from a token
    // check at mount, because this hook mounts once on the public page (where
    // there is no token yet) and never re-runs after login. Reading the token
    // on every activity event means the countdown starts as soon as the user
    // signs in, and stays disarmed while nobody is logged in.
    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!localStorage.getItem('authToken')) return;
      timerRef.current = setTimeout(logout, inactivityMs);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [logout, inactivityMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
}