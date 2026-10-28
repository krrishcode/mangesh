"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as FullCalendar,
  type CalendarRef,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import type { DatesSetInfo, EventInput } from "@fullcalendar/react";
import { AdminIcon } from "../ui/AdminIcon";

export interface CalendarAppointment {
  id: number;
  scheduledAt: string;
  status: string;
  occasion: string;
  location: string;
  customerName: string | null;
}

const plugins = [
  dayGridPlugin,
  timeGridPlugin,
  interactionPlugin,
  multiMonthPlugin,
];
const calendarViews = [
  ["dayGridMonth", "Month"],
  ["timeGridWeek", "Week"],
  ["timeGridDay", "Day"],
] as const;

export default function AppointmentCalendar({
  appointments,
  loading,
  onSelect,
}: {
  appointments: CalendarAppointment[];
  loading: boolean;
  onSelect: (appointment: CalendarAppointment) => void;
}) {
  const calendarRef = useRef<CalendarRef>(null);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [view, setView] = useState("dayGridMonth");
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);

  const events = useMemo<EventInput[]>(
    () =>
      appointments.map((appointment) => ({
        id: String(appointment.id),
        title: appointment.occasion,
        start: appointment.scheduledAt,
        extendedProps: { appointment, customerName: appointment.customerName },
      })),
    [appointments],
  );

  useEffect(() => {
    if (!range) return;
    setVisibleCount(
      appointments.filter((appointment) => {
        const start = new Date(appointment.scheduledAt);
        return start >= range.start && start < range.end;
      }).length,
    );
  }, [appointments, range]);

  function dateRangeChanged(info: DatesSetInfo) {
    setTitle(info.view.title);
    const visibleDays = Math.round(
      (info.view.currentEnd.getTime() - info.view.currentStart.getTime()) /
        86400000,
    );
    if (info.view.type === "dayGridMonth") {
      const monthStart = new Date(`${info.view.title} 1`);
      setDays(
        Number.isNaN(monthStart.getTime())
          ? visibleDays
          : new Date(
              monthStart.getFullYear(),
              monthStart.getMonth() + 1,
              0,
            ).getDate(),
      );
    } else {
      setDays(visibleDays);
    }
    setRange({ start: info.start, end: info.end });
    setView(info.view.type);
  }

  const api = () => calendarRef.current?.getApi();
  const event = (id: string) =>
    appointments.find((appointment) => String(appointment.id) === id);

  return (
    <section
      className="admin-calendar"
      aria-label="Appointment calendar"
      aria-busy={loading}
    >
      <div className="admin-calendar-toolbar">
        <div className="admin-calendar-heading">
          <h2>{title || "Appointments"}</h2>
          <p>
            {days || 0} days <span aria-hidden="true">-</span> {visibleCount}{" "}
            appointments{loading ? " · Updating" : ""}
          </p>
        </div>
        <div className="admin-calendar-controls">
          <div
            className="admin-calendar-nav"
            role="group"
            aria-label="Calendar date"
          >
            <button
              type="button"
              aria-label="Previous date range"
              onClick={() => api()?.prev()}
            >
              <AdminIcon name="chevron" />
            </button>
            <button type="button" onClick={() => api()?.today()}>
              Today
            </button>
            <button
              type="button"
              aria-label="Next date range"
              onClick={() => api()?.next()}
            >
              <AdminIcon name="chevron" />
            </button>
          </div>
          <label className="admin-calendar-select-label admin-calendar-view">
            <span className="admin-sr-only">Calendar view</span>
            <select
              aria-label="Calendar view"
              value={view}
              onChange={(e) => api()?.changeView(e.target.value)}
            >
              {calendarViews.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="admin-calendar-grid">
        <FullCalendar
          ref={calendarRef}
          plugins={plugins}
          initialView="dayGridMonth"
          headerToolbar={false}
          height="auto"
          fixedWeekCount={false}
          timeZone="Asia/Kolkata"
          firstDay={0}
          nowIndicator
          dayMaxEvents
          events={events}
          datesSet={dateRangeChanged}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            const appointment = event(info.event.id);
            if (appointment) onSelect(appointment);
          }}
          eventClass={(info) =>
            `appointment-event--${info.event.extendedProps.appointment.status}`
          }
          eventContent={(info) => (
            <span
              className="admin-calendar-event"
              title={
                info.event.extendedProps.customerName
                  ? `${info.event.extendedProps.customerName} · ${info.event.title}`
                  : info.event.title
              }
            >
              <span className="admin-calendar-event-title">{info.event.title}</span>
              <span className="admin-calendar-event-time">{info.timeText}</span>
            </span>
          )}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
          noEventsContent="No appointments in this date range"
          dayHeaderFormat={{ weekday: "short" }}
          views={{
            timeGridWeek: {
              dayHeaderFormat: { weekday: "short", day: "numeric" },
            },
          }}
        />
      </div>
    </section>
  );
}
