"use strict";

// CURRENT VIEW VARIABLES FOR USE OUTSIDE
export let currentView = 'day';
export const VALID_VIEWS = ['day', 'week', 'month'];

// For sizing slots and events (fixed 1px per minute)
const PIXELS_PER_MINUTE = 1;
const DAY_TOTAL_HEIGHT_PX = 24 * 60 * PIXELS_PER_MINUTE;

/**
 * Gets the current slot duration from the slot duration select, or 60 if not found.
 * @returns {number} Slot duration in minutes (60 = hourly, 30 = half-hourly).
 */
function getSlotDuration() {
    const value = document.querySelector('#slotDurationSelect')?.value;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 60 : parsed;
}
/** Minimum height for an event block (very short events get this height) */
const EVENT_MIN_HEIGHT_PX = 26;
/** Use compact layout (time + title in one line) when event height is at or below this */
const COMPACT_LAYOUT_MAX_HEIGHT_PX = 44;

/**
 * Sets the current view of the calendar.
 * @param {string} view - The view to set the current view to.
 */
export function setCurrentView(view) {
    currentView = view;
}

/**
 * Gets the current view of the calendar.
 * @returns {string} The current view of the calendar.
 */
export const getCurrentView = () => {
    return currentView;
};

/**
 * Gets the slots for the day.
 * @param {number} slotDuration - Slot duration in minutes.
 * @returns {Array<number>} The slot start times in minutes from midnight.
 */
function getSlotsForDay(slotDuration) {
    const slots = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += slotDuration) {
        slots.push(minutes);
    }

    return slots;
}

/**
 * Converts a time value to minutes from midnight.
 * Accepts either a number (already in minutes) or a string in "HH:MM" 24-hour format.
 * @param {number|string} value - Minutes from midnight, or "HH:MM" string (e.g. "18:15").
 * @returns {number} Minutes from midnight.
 */
function timeToMinutes(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const [hours, minutes] = value.split(':').map(Number);
        return hours * 60 + (minutes ?? 0);
    }
    return 0;
}

/**
 * Normalizes an event so timeStart and timeEnd are always numbers (minutes from midnight).
 * Handles events from storage ("HH:MM" strings).
 * @param {Object} event - Event with timeStart and timeEnd (string or number).
 * @returns {Object} Event with numeric timeStart and timeEnd.
 */
function normalizeEventTimes(event) {
    return {
        UID: event.UID,
        date: event.date,
        title: event.title,
        description: event.description,
        color: event.color,
        timeStart: timeToMinutes(event.timeStart),
        timeEnd: timeToMinutes(event.timeEnd),
    };
}

/**
 * Formats the time slot label in 12 hour format.
 * @param {number} minutes - The minutes to format.
 * @returns {string} The formatted time slot label.
 */
function formatSlotLabel(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainderMinutes = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour}:${remainderMinutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Gets the current minutes from midnight.
 * @returns {number} The current minutes from midnight.
 */
function getCurrentMinutesFromMidnight() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Gets today's date as a string in YYYY-MM-DD format.
 * @returns {string} Today's date in YYYY-MM-DD format.
 */
function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Filters events to only those on today's date.
 * Events without a date field are excluded.
 * @param {Array} eventsList - The list of events to filter.
 * @returns {Array} Events that fall on today's date.
 */
function filterEventsForToday(eventsList) {
    const today = getTodayDateString();
    return eventsList.filter((event) => event.date === today);
}

/**
 * Returns true if two events overlap in time.
 */
function eventsOverlap(firstEvent, secondEvent) {
    return firstEvent.timeStart < secondEvent.timeEnd && secondEvent.timeStart < firstEvent.timeEnd;
}

/**
 * Assigns each event a lane index (0, 1, 2...) so that no two overlapping events share a lane.
 * Longest events get lane 0 (left); shorter overlapping events get lanes 1, 2, ... (right).
 * @param {Array} eventsList
 * @returns {Map<string, number>} event UID -> lane index
 */
function assignLanes(eventsList) {
    const lanes = new Map();
    const duration = (event) => event.timeEnd - event.timeStart;
    const sorted = [...eventsList].sort((event1, event2) => duration(event2) - duration(event1) || event1.timeStart - event2.timeStart);

    sorted.forEach((event) => {
        const used = new Set();
        // Find all events that overlap with the current event
        eventsList.forEach((otherEvent) => {
            if (otherEvent.UID !== event.UID && eventsOverlap(event, otherEvent) && lanes.has(otherEvent.UID)) {
                used.add(lanes.get(otherEvent.UID));
            }
        });

        // Find the lowest unused lane index (0, 1, 2, ...)
        let lane = 0;
        while (used.has(lane)) lane++;
        lanes.set(event.UID, lane); // Assign the event to the lane
    });

    return lanes;
}

/**
 * For the given event's time range, returns the maximum number of events concurrent at any moment.
 * Used to compute how many lanes (columns) to divide the width into.
 * @param {Object} event - The event to get the maximum number of concurrent lanes for.
 * @param {Array} eventsList - The list of events to get the maximum number of concurrent lanes for.
 * @returns {number} The maximum number of concurrent lanes.
 */
function getMaxConcurrentLanes(event, eventsList) {
    const overlapping = eventsList.filter((otherEvent) => eventsOverlap(event, otherEvent));
    if (overlapping.length === 0) return 1;
    const points = [];
    overlapping.forEach((otherEvent) => {
        points.push({ t: otherEvent.timeStart, delta: 1 }); // Add a point when the other event starts
        points.push({ t: otherEvent.timeEnd, delta: -1 }); // Add a point when the other event ends
    });

    // Sort the points by time and then by delta
    points.sort((point1, point2) => point1.t - point2.t || point1.delta - point2.delta);

    // Count the number of concurrent events at each point in time
    let count = 0;
    let maxCount = 0;
    points.forEach((point) => {
        count += point.delta;
        maxCount = Math.max(maxCount, count);
    });

    return maxCount;
}

/**
 * Renders the calendar view.
 * @param {Array} eventsList - The list of events to render.
 */
export function renderCalendar(eventsList) {
    const container = document.querySelector('#calendarViewArea');
    if (!container) return;
    switch (currentView) {
        case 'day':
            renderDayView(filterEventsForToday(eventsList), container);
            break;
        case 'week':
            renderWeekView(eventsList, container); // Will need to filter events for a specific week
            break;
        case 'month':
            renderMonthView(eventsList, container); // Will need to filter events for a whole month
            break;
        default:
            renderDayView(filterEventsForToday(eventsList), container);
    }
}

/**
* Renders the day view of the calendar.
* @param {Array} eventsList - The list of events to render.
* @param {Element} containerElement - The element to render the day view into.
*/
function renderDayView(eventsList, containerElement) {
    const safeEventsList = (eventsList ?? []).map(normalizeEventTimes);
    console.log(safeEventsList);
    const slotDuration = getSlotDuration();
    const slotHeightPx = slotDuration * PIXELS_PER_MINUTE;
    const slots = getSlotsForDay(slotDuration);
    const currentMinutes = getCurrentMinutesFromMidnight();
    containerElement.innerHTML = '';

    // Wrapper for two-column layout (scrollable content height = full day)
    const dayContent = document.createElement('div');
    dayContent.className = 'calendarDayContent';
    dayContent.style.height = `${DAY_TOTAL_HEIGHT_PX}px`;

    // Column 1: Narrow time labels (fixed height per hour)
    const timeLabelsColumn = document.createElement('div');
    timeLabelsColumn.className = 'calendarTimeLabelsColumn';

    // Create each time slot row
    slots.forEach((slotStart) => {
        const slotEnd = slotStart + slotDuration;
        const isActiveSlot = currentMinutes >= slotStart && currentMinutes < slotEnd;

        const slotRow = document.createElement('div');
        slotRow.className = 'calendarTimeSlotRow';
        slotRow.style.height = `${slotHeightPx}px`;
        slotRow.dataset.active = isActiveSlot ? 'true' : 'false';

        const label = document.createElement('span');
        label.className = 'calendarTimeLabel';
        label.textContent = formatSlotLabel(slotStart);
        slotRow.appendChild(label);

        timeLabelsColumn.appendChild(slotRow);
    });

    dayContent.appendChild(timeLabelsColumn);

    // Column 2: Day grid (grid lines + now line + events)
    const dayGridColumn = document.createElement('div');
    dayGridColumn.className = 'calendarDayGridColumn';

    // Hour grid lines (fixed height)
    const gridLines = document.createElement('div');
    gridLines.className = 'calendarDayGridLines';
    gridLines.style.height = `${DAY_TOTAL_HEIGHT_PX}px`;
    slots.forEach(() => {
        const line = document.createElement('div');
        line.className = 'calendarDayGridLine';
        line.style.height = `${slotHeightPx}px`;
        gridLines.appendChild(line);
    });
    dayGridColumn.appendChild(gridLines);

    // Current time indicator line
    const nowLine = document.createElement('div');
    nowLine.className = 'calendarNowLine';
    nowLine.style.top = `${currentMinutes * PIXELS_PER_MINUTE}px`;
    nowLine.setAttribute('aria-hidden', 'true');
    dayGridColumn.appendChild(nowLine);

    // Events layer: lanes (columns) for overlapping events; z-index so later-added events appear on top
    const laneMap = assignLanes(safeEventsList);
    const GAP_PX = 4;

    const eventsLayer = document.createElement('div');
    eventsLayer.className = 'calendarEventsLayer';
    eventsLayer.style.height = `${DAY_TOTAL_HEIGHT_PX}px`;

    safeEventsList.forEach((event, index) => {
        const durationMinutes = event.timeEnd - event.timeStart;
        // Calculate the top position of the event in pixels
        const topPx = event.timeStart * PIXELS_PER_MINUTE;
        // Calculate the natural height of the event in pixels (which is really just the duration in height pixels)
        const naturalHeightPx = durationMinutes * PIXELS_PER_MINUTE;
        // Calculate the height of the event in pixels, ensuring it is at least the minimum height
        const heightPx = Math.max(EVENT_MIN_HEIGHT_PX, naturalHeightPx);
        // Determine if the event is short (less than or equal to the compact layout maximum height)
        const isShort = naturalHeightPx <= COMPACT_LAYOUT_MAX_HEIGHT_PX;

        // Get the lane index for the event by their UID
        const laneIndex = laneMap.get(event.UID) ?? 0;
        // Get the total(max) number of events concurrent at any moment to determine the width of the event
        const totalLanes = getMaxConcurrentLanes(event, safeEventsList);
        // Calculate the width of the event as a percentage of the total number of lanes
        const widthPercent = 100 / totalLanes;
        // Calculate the left position of the event as a percentage of the total number of lanes
        const leftPercent = laneIndex * widthPercent;

        const timeStr = `${formatSlotLabel(event.timeStart)} &ndash; ${formatSlotLabel(event.timeEnd)}`;

        // Create the event button
        const eventButton = document.createElement('button');
        eventButton.className = isShort ? 'calendarEventContainer calendarEventContainer--compact' : 'calendarEventContainer';
        eventButton.type = 'button';
        eventButton.dataset.eventId = event.UID;
        eventButton.style.setProperty('--event-color', event.color ?? '#1a73e8');
        eventButton.style.top = `${topPx}px`;
        eventButton.style.height = `${heightPx}px`;
        eventButton.style.zIndex = String(index);
        const gapHalf = GAP_PX / 2;
        eventButton.style.left = totalLanes <= 1 ? '0' : `calc(${leftPercent}% + ${laneIndex * gapHalf}px)`;
        eventButton.style.width = totalLanes <= 1 ? '100%' : `calc(${widthPercent}% - ${gapHalf}px)`;

        // For events with a short duration, show the time and title in a single line
        if (isShort) {
            eventButton.innerHTML = `
                <span class="calendarEventHeader">
                    <span class="calendarEventTime">${timeStr}</span>
                    <span class="calendarEventTitle">${event.title}</span>
                </span>
            `;
        } else {
            // For events with a long duration, show the time, title, and description
            eventButton.innerHTML = `
                <span class="calendarEventTime">${timeStr}</span>
                <span class="calendarEventTitle">${event.title}</span>
                ${event.description ? `<span class="calendarEventDescription">${event.description}</span>` : ''}
            `;
        }

        eventsLayer.appendChild(eventButton);
    });

    dayGridColumn.appendChild(eventsLayer);
    dayContent.appendChild(dayGridColumn);

    containerElement.appendChild(dayContent);

    // Scroll to current time (active slot based on current time)
    const activeRow = containerElement.querySelector('.calendarTimeSlotRow[data-active="true"]');
    if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Renders the weekly view calendar.
 * @param {Array} eventsList - The list of events to render.
 * @param {Element} containerElement - The element to render the week view into.
 */
function renderWeekView(eventsList, containerElement) {
    // TODO: Implement week view
}

/**
 * Renders the monthly view calendar.
 * @param {Array} eventsList - The list of events to render.
 * @param {Element} containerElement - The element to render the month view into.
 */
function renderMonthView(eventsList, containerElement) {
    // TODO: Implement month view
}