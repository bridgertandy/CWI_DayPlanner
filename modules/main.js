import StorageManager from "./dataStorage.js";
import appSettings from "./settings.js";

import { renderCalendarView, CalendarView } from "./calendar/calendar.js";
import { updateHeaderDate } from "./calendar/headerDate.js";
import { initializeCalendarNavigation } from "./calendar/calendarNavigationButtons.js";
import { initializeCalendarDisplayButtons } from "./calendar/calendarDisplayButtons.js";
import { initializeEventManager } from "./eventManager.js";
import initTodayButton from "./todayButton.js";

import { loadWeatherDisplay } from "./weatherDisplay.js";

appSettings.loadSettings();
const allEvents = StorageManager.loadAllEvents();

initializeEventManager();

// Initialize todayButton listeners
initTodayButton();

{
  const viewDate = new Date();
  viewDate.setHours(0, 0, 0, 0);

  renderCalendarView(allEvents, viewDate);
  const slotDurationSelect = document.getElementById("slotDurationSelect");
  if (slotDurationSelect) {
    slotDurationSelect.addEventListener("change", () => {
      renderCalendarView(allEvents, viewDate);
    });
  }
}

loadWeatherDisplay();

{
  const viewDate = new Date();
  viewDate.setHours(0, 0, 0, 0);
  const calendarState = { viewDate, calendarView: CalendarView.DAY };

  // Renders the calendar
  function render() {
    renderCalendarView(
      allEvents,
      calendarState.viewDate,
      calendarState.calendarView,
    );
    updateHeaderDate(calendarState); // Updates the header date
  }

  render();
  document
    .getElementById("slotDurationSelect")
    ?.addEventListener("change", render); // Event listener for the slot duration select
  initializeCalendarNavigation(calendarState, render); // Initializes the calendar navigation buttons
  initializeCalendarDisplayButtons(calendarState, render); // Initializes the calendar display buttons
}
