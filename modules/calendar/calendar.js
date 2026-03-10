"use strict";

import { renderSingleDay } from "./dailyCalendar.js";
import { renderSingleWeek } from "./weeklyCalendar.js";
import { renderSingleMonth } from "./monthlyCalendar.js";

/*
   !!! This is the entry point for the calendar module. It is used to render the calendar view based on the calendar view type.
*/

export const CalendarView = {
  // Valid views for the calendar
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
};

// ----------------------Constants (Should be kept the same for all calendars to maintain consistency----------------------
// Day/Week will use all three, Month most likely only use the MINUTES_PER_DAY.
export const MINUTES_PER_DAY = 24 * 60;
export const PIXELS_PER_MINUTE = 1; // 1 pixel per minute
export const DAY_TOTAL_HEIGHT = MINUTES_PER_DAY * PIXELS_PER_MINUTE; // Give the day 24 hours of height

// ----------------------Main Functions----------------------
// Render the calendar view based on the calendar view type
export function renderCalendarView(
  events,
  viewDate = new Date(),
  calendarView = CalendarView.DAY,
) {
  const calendarViewArea = document.getElementById("calendarViewArea");
  if (calendarViewArea)
    calendarViewArea.setAttribute("data-calendar-view", calendarView); // Sets the 'data-calendar-view' attribute so we can show/hide the correct content.
  switch (calendarView) {
    case CalendarView.DAY:
      renderSingleDay(filterEventsForDate(events, viewDate), viewDate);
      break;
    case CalendarView.WEEK:
      renderSingleWeek(events, viewDate);
      break;
    case CalendarView.MONTH:
      renderSingleMonth(events, viewDate);
      break;
    default:
      renderSingleDay(filterEventsForDate(events, viewDate), viewDate);
  }
}

// Formats the time slot time (e.g. 10:00 AM). Not using the event times!
export function formatSlotTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${remainingMinutes.toString().padStart(2, "0")} ${ampm}`;
}

// Filters the events to only include events for the given date.
export function filterEventsForDate(events, viewDate) {
  const year = viewDate.getFullYear();
  const month = String(viewDate.getMonth() + 1).padStart(2, "0");
  const day = String(viewDate.getDate()).padStart(2, "0");
  return events.filter((event) => event.date === `${year}-${month}-${day}`);
}

// Returns true if the given date is today (same calendar day).
export function isToday(date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// Calculates the current time in minutes from midnight.
export function calculateTheCurrentMinutesFromMidnight() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Converts a time string (e.g. "10:00") to the number of minutes since midnight. Use this for event times!
export function timeStringToMinutes(timeString) {
  const [hours, minutes] = timeString.split(":");
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

// Formats a time string (e.g. "10:00") to a human-readable time string (e.g. "10:00 AM"). Use this when formatting event times!
export function formatTime(time) {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
