import { createContext, useContext, useState, useEffect } from 'react';
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

  const setActiveEventId = (id) => {
    setActiveEventIdState(id);
    if (id) {
      localStorage.setItem('activeEventId', id);
    } else {
      localStorage.removeItem('activeEventId');
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.EVENTS);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.results || data || []);
        return data.results || data || [];
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
    return [];
  };

  const refreshActiveEvent = (eventList) => {
    const list = eventList && eventList.length ? eventList : events;
    const found = list.find((e) => e.id === activeEventId) || list[0] || null;
    setActiveEvent(found);
  };

  useEffect(() => {
    if (activeEventId) {
      const found = events.find((e) => e.id === activeEventId);
      setActiveEvent(found || null);
    } else {
      setActiveEvent(null);
    }
  }, [activeEventId, events]);

  return (
    <EventContext.Provider
      value={{
        activeEventId,
        setActiveEventId,
        activeEvent,
        setActiveEvent,
        events,
        setEvents,
        loadEvents,
        refreshActiveEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
