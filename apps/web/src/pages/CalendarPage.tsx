import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventClickArg, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import { api } from '../api/client.ts';

interface CalendarEvent {
  id:     string;
  title:  string;
  start:  string;
  end?:   string;
  color:  string;
  type:   'gantt_phase' | 'ot' | 'ar_meeting' | 'project';
  href:   string;
}

const TYPE_LABEL: Record<CalendarEvent['type'], string> = {
  gantt_phase: 'Fase GANTT',
  ot:          'Orden de Trabajo',
  ar_meeting:  'Reunión',
  project:     'Proyecto',
};

const LEGEND = [
  { color: '#B95D34', label: 'Fase GANTT / Proyecto activo' },
  { color: '#7A8C47', label: 'Orden de Trabajo' },
  { color: '#5B7FA6', label: 'Reunión AR / Garantía' },
  { color: '#4A6A2A', label: 'Proyecto completado' },
  { color: '#6B5A3A', label: 'En cotización' },
];

// CSS overrides injected once
const CAL_CSS = `
.fc { font-family: 'IBM Plex Mono', monospace !important; color: #E8DFCF; }
.fc-toolbar-title { font-family: Fraunces, serif !important; font-style: italic; font-size: 22px !important; font-weight: 400 !important; color: #E8DFCF !important; }
.fc .fc-button { background: #1E1B17 !important; border: 1px solid #2A2520 !important; color: #A8A098 !important; font-family: 'IBM Plex Mono', monospace !important; font-size: 9px !important; letter-spacing: 0.12em !important; text-transform: uppercase !important; box-shadow: none !important; border-radius: 0 !important; padding: 5px 12px !important; }
.fc .fc-button:hover { background: #252118 !important; color: #E8DFCF !important; border-color: #3A3530 !important; }
.fc .fc-button-active, .fc .fc-button:active { background: #B95D34 !important; border-color: #B95D34 !important; color: #fff !important; }
.fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: #2A2520 !important; }
.fc .fc-daygrid-day { background: #161310; }
.fc .fc-daygrid-day:hover { background: #1A1714; }
.fc .fc-daygrid-day.fc-day-today { background: #1E1B17 !important; }
.fc .fc-daygrid-day-number { color: #7A7068 !important; font-size: 10px !important; }
.fc .fc-day-today .fc-daygrid-day-number { color: #B95D34 !important; font-weight: 700 !important; }
.fc .fc-col-header-cell-cushion { color: #4A4540 !important; font-size: 8px !important; letter-spacing: 0.18em !important; text-transform: uppercase !important; text-decoration: none !important; }
.fc-event { border-radius: 0 !important; border: none !important; cursor: pointer !important; font-size: 9px !important; }
.fc-event:hover { filter: brightness(1.15); }
.fc-daygrid-event-dot { display: none; }
.fc-event-title { font-family: 'IBM Plex Mono', monospace !important; }
.fc-more-link { color: #7A7068 !important; font-size: 8px !important; }
`;

export function CalendarPage() {
  const navigate  = useNavigate();
  const calRef    = useRef<FullCalendar>(null);

  const [events,   setEvents]   = useState<CalendarEvent[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState<CalendarEvent['type'] | 'all'>('all');
  const [rangeKey, setRangeKey] = useState('');

  const fetchRange = useCallback(async (start: string, end: string) => {
    const key = `${start}|${end}`;
    if (key === rangeKey) return;
    setLoading(true);
    try {
      const d = await api.calendar.events(start, end) as { events: CalendarEvent[] };
      setEvents(d.events);
      setRangeKey(key);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [rangeKey]);

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    fetchRange(info.startStr.slice(0, 10), info.endStr.slice(0, 10));
  }, [fetchRange]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const ev = events.find(e => e.id === info.event.id);
    if (ev) navigate(ev.href);
  }, [events, navigate]);

  const displayed = filter === 'all' ? events : events.filter(e => e.type === filter);

  const fcEvents = displayed.map(e => ({
    id:              e.id,
    title:           e.title,
    start:           e.start,
    ...(e.end ? { end: e.end } : {}),
    backgroundColor: e.color,
    borderColor:     e.color,
    textColor:       '#fff',
  }));

  return (
    <>
      <style>{CAL_CSS}</style>
      <div style={{
        padding: '48px 48px 80px',
        fontFamily: "'IBM Plex Mono', monospace",
        color: '#E8DFCF',
        maxWidth: 1200,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#4A4540', margin: '0 0 10px' }}>
            Vista de empresa
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: '#E8DFCF', lineHeight: 1.0, margin: 0 }}>
              Calendario
            </h1>
            {loading && (
              <span style={{ fontSize: 8, color: '#4A4540', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Cargando...
              </span>
            )}
          </div>
        </div>

        {/* Filter chips + legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'gantt_phase', 'ot', 'ar_meeting', 'project'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  background: filter === t ? '#B95D34' : '#1E1B17',
                  border: `1px solid ${filter === t ? '#B95D34' : '#2A2520'}`,
                  color: filter === t ? '#fff' : '#7A7068',
                  padding: '4px 10px', fontSize: 8, letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace",
                  cursor: 'pointer',
                }}
              >
                {t === 'all' ? 'Todo' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {LEGEND.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#7A7068' }}>
                <div style={{ width: 10, height: 10, background: l.color, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div style={{ background: '#161310', border: '1px solid #2A2520', padding: '20px 16px' }}>
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            locale="es"
            firstDay={1}
            headerToolbar={{
              left:   'prev,next today',
              center: 'title',
              right:  'dayGridMonth,dayGridWeek',
            }}
            buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana' }}
            height="auto"
            events={fcEvents}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            eventContent={renderEvent}
            dayMaxEvents={4}
            moreLinkContent={({ num }) => `+${num} más`}
          />
        </div>

        {/* Event count */}
        {events.length > 0 && (
          <p style={{ fontSize: 8, color: '#4A4540', marginTop: 12, letterSpacing: '0.12em' }}>
            {displayed.length} evento{displayed.length !== 1 ? 's' : ''} en este período
          </p>
        )}
      </div>
    </>
  );
}

function renderEvent(info: EventContentArg) {
  return (
    <div style={{
      padding: '1px 4px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      fontSize: 9,
      fontFamily: "'IBM Plex Mono', monospace",
      color: '#fff',
      width: '100%',
    }}>
      {info.event.title}
    </div>
  );
}
