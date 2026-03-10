"use strict";

import { CalendarView } from "./calendar.js";

// Adds a single day to the view date
function addDays(date, delta) {
  const newDay = new Date(date.getTime());
  newDay.setDate(newDay.getDate() + delta);
  return newDay;
}

// Adds a single week to the view date
function addWeeks(date, delta) {
  return addDays(date, 7 * delta);
}

// Adds a single month to the view date
function addMonths(date, delta) {
  const newMonth = new Date(date.getTime());
  newMonth.setMonth(newMonth.getMonth() + delta);
  return newMonth;
}

// Navigates the calendar by one day, week, or month
function navigate(state, direction, onRender) {
  const { calendarView } = state;
  if (calendarView === CalendarView.DAY) {
    state.viewDate = addDays(state.viewDate, direction);
  } else if (calendarView === CalendarView.WEEK) {
    state.viewDate = addWeeks(state.viewDate, direction);
  } else if (calendarView === CalendarView.MONTH) {
    state.viewDate = addMonths(state.viewDate, direction);
  } else {
    state.viewDate = addDays(state.viewDate, direction);
  }
  // Re-render the calendar
  onRender();
}

/**
 * Initializes Previous/Next navigation buttons to move the calendar by one day, week, or month
 * depending on the current calendar view.
 * @param {{ viewDate: Date, calendarView: string }} state - Mutable state; viewDate is updated on nav
 * @param {() => void} onRender - Called after state.viewDate (or view) changes to re-render the calendar
 */
export function initializeCalendarNavigation(state, onRender) {
  const prevBtn = document.getElementById("prevNavButton");
  const nextBtn = document.getElementById("nextNavButton");
  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => {
    navigate(state, -1, onRender);
  });
  nextBtn.addEventListener("click", () => {
    navigate(state, 1, onRender);
  });
}
