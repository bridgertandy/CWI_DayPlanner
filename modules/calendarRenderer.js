"use strict";

import { renderCalendarView } from "./calendar.js";
import StorageManager from "./dataStorage.js";

const allEvents = StorageManager.loadAllEvents();

renderCalendarView(allEvents);
const slotDurationSelect = document.getElementById('slotDurationSelect');
if (slotDurationSelect) {
    slotDurationSelect.addEventListener('change', (event) => {
        console.log("Slot duration changed to: ", event.target.value);
        renderCalendarView(allEvents);
    });
}