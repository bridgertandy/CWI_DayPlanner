import { renderCalendarView } from "./calendar/calendar.js";
import StorageManager from "./dataStorage.js";
import { initializeEventManager } from "./eventManager.js";
import { loadWeatherDisplay } from "./weatherDisplay.js";
import appSettings from "./settings.js";

// Load user settings from localStorage when the application starts
appSettings.loadSettings();

// Load all saved calendar events from localStorage when the application starts
const allEvents = StorageManager.loadAllEvents();

// Initialize listeners for the event manager
initializeEventManager();

// load weather data
loadWeatherDisplay();
