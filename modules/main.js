import StorageManager from "./dataStorage.js";
import { initializeEventManager } from "./eventManager.js";
import { renderCalendar } from "./calendar.js";
import appSettings from "./settings.js";

// Load user settings from localStorage when the application starts
appSettings.loadSettings();

// Load all saved calendar events from localStorage when the application starts
const allEvents = StorageManager.loadAllEvents();

// Initialize listeners for the event manager
initializeEventManager();

// Render the day view of the calendar
renderCalendar(allEvents);
// I tried moving this elsewhere but it didn't work
const slotSelect = document.querySelector('#slotDurationSelect');
slotSelect.addEventListener('change', () => {
    renderCalendar(allEvents);
});
