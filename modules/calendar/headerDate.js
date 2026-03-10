"use strict";

import { CalendarView } from "./calendar.js";

/**
 * Updates the header date element to reflect the current view date and calendar view.
 * @param {{ viewDate: Date, calendarView: string }} state
 */
export function updateHeaderDate(state) {
  const headerElement = document.getElementById("headerDateContainer");
  if (!headerElement) return;
  // Get the viewing date
  const viewingDate = state.viewDate;
  if (state.calendarView === CalendarView.DAY) {
    // Format the viewing date as a full date for day view
    headerElement.textContent = viewingDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else if (state.calendarView === CalendarView.WEEK) {
    // Format the viewing date as a range of dates for week view
    const end = new Date(viewingDate);
    end.setDate(end.getDate() + 6);
    headerElement.textContent = `${viewingDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  } else if (state.calendarView === CalendarView.MONTH) {
    // Format the viewing date as a full month for month view
    headerElement.textContent = viewingDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
}
