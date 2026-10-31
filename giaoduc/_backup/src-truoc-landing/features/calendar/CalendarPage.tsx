import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ClipboardList } from 'lucide-react';
import { calendarApi } from '../../services/featureApi';

import PageHeader from '../../components/ui/PageHeader';
import { CalendarDays } from 'lucide-react';
interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  start: string;
  classroomName: string;
  link: string;
}

type ViewMode = 'month' | 'week' | 'list';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches ? 'list' : 'month'
  );
  const [cursor, setCursor] = useState(() => new Date());
  const navigate = useNavigate();

  const fetchRange = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const res = await calendarApi.getEvents(toIsoDate(from), toIsoDate(to));
      setEvents(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      const from = new Date();
      fetchRange(from, addDays(from, 30));
      return;
    }
    if (view === 'week') {
      const from = startOfWeek(cursor);
      fetchRange(from, addDays(from, 6));
      return;
    }
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    fetchRange(gridStart, addDays(gridStart, 41));
  }, [view, cursor, fetchRange]);

  const eventsForDay = (day: Date) =>
    events.filter((e) => sameDay(new Date(e.start), day));

  const typeColor = (t: string) =>
    t === 'EXAM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';

  const headerLabel = () => {
    if (view === 'week') {
      const from = startOfWeek(cursor);
      const to = addDays(from, 6);
      return `${from.toLocaleDateString('vi-VN')} – ${to.toLocaleDateString('vi-VN')}`;
    }
    return cursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const prev = () => {
    if (view === 'week') setCursor((c) => addDays(c, -7));
    else if (view === 'month') setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  };

  const next = () => {
    if (view === 'week') setCursor((c) => addDays(c, 7));
    else if (view === 'month') setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };

  const renderMonthGrid = () => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

    return (
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[520px] sm:min-w-0">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-vutruNhat py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = eventsForDay(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = sameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-16 sm:min-h-24 p-1 rounded-lg border ${
                    inMonth ? 'bg-white dark:bg-night-surface border-gray-100 dark:border-night-border' : 'bg-gray-50/50 dark:bg-night-elevated/50 border-transparent opacity-50'
                  } ${isToday ? 'ring-2 ring-cam/40' : ''}`}
                >
                  <div className={`text-[10px] sm:text-xs font-bold mb-1 ${isToday ? 'text-camDam' : 'text-vutruNhat'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button
                        key={`${e.type}-${e.id}-${e.start}`}
                        onClick={() => navigate(e.link)}
                        className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate ${typeColor(e.type)}`}
                        title={e.title}
                      >
                        <span className="sm:hidden">{e.type === 'EXAM' ? 'Thi' : 'BT'}</span>
                        <span className="hidden sm:inline">{e.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] text-vutruNhat px-1">+{dayEvents.length - 2}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekGrid = () => {
    const from = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));

    return (
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const isToday = sameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`card min-h-40 ${isToday ? 'ring-2 ring-cam/30' : ''}`}>
              <p className="text-sm font-bold text-vutru mb-2">
                {WEEKDAYS[day.getDay() === 0 ? 6 : day.getDay() - 1]} {day.getDate()}/{day.getMonth() + 1}
              </p>
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-vutruNhat">Không có sự kiện</p>
                ) : (
                  dayEvents.map((e) => (
                    <Link key={`${e.type}-${e.id}-${e.start}`} to={e.link} className="block text-xs p-2 rounded-lg bg-kem dark:bg-night-elevated hover:border-cam border border-transparent">
                      <span className={`inline-block px-1 rounded ${typeColor(e.type)} mr-1`}>{e.type === 'EXAM' ? 'Thi' : 'BT'}</span>
                      <span className="font-semibold">{e.title}</span>
                      <p className="text-vutruNhat mt-0.5">{new Date(e.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader icon={CalendarDays} title="Lịch & Deadline" subtitle={headerLabel()} />
        <div className="flex items-center gap-2 flex-wrap">
          {view !== 'list' && (
            <>
              <button onClick={prev} className="btn btn-phu px-3 py-1.5 text-sm">←</button>
              <button onClick={() => setCursor(new Date())} className="btn btn-phu px-3 py-1.5 text-sm">Hôm nay</button>
              <button onClick={next} className="btn btn-phu px-3 py-1.5 text-sm">→</button>
            </>
          )}
          {(['month', 'week', 'list'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition-colors ${
                view === v ? 'bg-cam text-white' : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat'
              }`}
            >
              {v === 'month' ? 'Tháng' : v === 'week' ? 'Tuần' : 'Danh sách'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-vutruNhat">Đang tải lịch...</div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="card text-center text-vutruNhat py-12">Không có deadline sắp tới</div>
          ) : (
            events.map((e) => (
              <Link key={`${e.type}-${e.id}-${e.start}`} to={e.link} className="card flex items-start sm:items-center gap-3 sm:gap-4 hover:border-cam/40">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                  {e.type === 'EXAM' ? <FileText size={18} /> : <ClipboardList size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-vutru truncate">{e.title}</p>
                  <p className="text-sm text-vutruNhat">{e.classroomName}</p>
                  <p className="text-sm font-semibold text-camDam mt-1 sm:hidden">
                    {new Date(e.start).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="hidden sm:block text-sm font-semibold text-camDam shrink-0">
                  {new Date(e.start).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </Link>
            ))
          )}
        </div>
      ) : view === 'week' ? renderWeekGrid() : renderMonthGrid()}
    </div>
  );
};

export default CalendarPage;
