import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { API_CONFIG, fetchWithAuth } from '../config/api.js';

const EventContext = createContext();

export function EventProvider({ children }) {
  const [activeEventId, setActiveEventIdState] = useState(() => {
    try {
      return localStorage.getItem('activeEventId') || null;
    } catch {
      return null;
    }
  });
  const [activeEvent, setActiveEvent] = useState(null);
  const [events, setEvents] = useState([]);

  const setActiveEventId = useCallback((id) => {
    setActiveEventIdState(id);
    if (id) {
      localStorage.setItem('activeEventId', id);
    } else {
      localStorage.removeItem('activeEventId');
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      console.log('Loading events from backend...');
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.EVENTS);
      console.log('Events response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Events data:', data);
        setEvents(data.results || data || []);
        return data.results || data || [];
      } else {
        const errorData = await response.json();
        console.error('Failed to load events:', errorData);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
    return [];
  }, []);

  const refreshActiveEvent = useCallback((eventList) => {
    const list = eventList && eventList.length ? eventList : events;
    const found = list.find((e) => e.id === activeEventId) || list[0] || null;
    setActiveEvent(found);
  }, [events, activeEventId]);

  useEffect(() => {
    if (activeEventId) {
      const found = events.find((e) => e.id === activeEventId);
      setActiveEvent(found || null);
    } else {
      setActiveEvent(null);
    }
  }, [activeEventId, events]);

  const value = useMemo(
    () => ({
      activeEventId,
      setActiveEventId,
      activeEvent,
      setActiveEvent,
      events,
      setEvents,
      loadEvents,
      refreshActiveEvent,
    }),
    [activeEventId, setActiveEventId, activeEvent, events, loadEvents, refreshActiveEvent]
  );

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
