"use strict";

// ----------------------Constants----------------------
const CalendarView = { // Valid views for the calendar
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
}
const MINUTES_PER_DAY = 24 * 60;
const PIXELS_PER_MINUTE = 1; // 1 pixel per minute
const DAY_TOTAL_HEIGHT = MINUTES_PER_DAY * PIXELS_PER_MINUTE; // Give the day 24 hours of height

// ----------------------Main Functions----------------------
// Render the calendar view based on the calendar view type
export function renderCalendarView(events, calendarView = CalendarView.DAY) {
    const calendarViewArea = document.getElementById('calendarViewArea');
    if (!calendarViewArea) return;
    switch (calendarView) {
        case CalendarView.DAY:
            renderSingleDay(filterEventsForTheCurrentDay(events));
            break;
        case CalendarView.WEEK:
            renderSingleWeek(events, calendarViewArea);
            break;
        case CalendarView.MONTH:
            renderSingleMonth(events, calendarViewArea);
            break;
        default:
            renderSingleDay(filterEventsForTheCurrentDay(events));
    }

    // Scroll to the active row if it exists (this is to scroll to the current time line)
    const activeRow = calendarViewArea.querySelector('.calendarTimeSlotRow[data-active="true"]');
    if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Render the single day view of the calendar
function renderSingleDay(events) {
    const slotDuration = getSlotDuration();
    const currentMinutesFromMidnight = calculateTheCurrentMinutesFromMidnight();
    const slotHeight = slotDuration * PIXELS_PER_MINUTE;
    const slots = createAllSlotsForDay(slotDuration);
    const dayContentWrapper = document.getElementById('calendarDayContentWrapper');
    if (!dayContentWrapper) return;
    createTimeSlotColumn(slots, currentMinutesFromMidnight, slotDuration, slotHeight);
    createDayGridColumn(events, slots, currentMinutesFromMidnight, slotHeight);
}

// Render the single week view of the calendar
function renderSingleWeek(events) {

}

// Render the single month view of the calendar
function renderSingleMonth(events) {

}

// ----------------------Helper Functions----------------------

// Filters the events to only include events for the current day.
function filterEventsForTheCurrentDay(events) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return events.filter((event) => event.date === `${year}-${month}-${day}`);
}

// Creates the time slot column for the calendar (the left column with the time labels)
function createTimeSlotColumn(slots, currentMinutesFromMidnight, slotDuration, slotHeight) {
    const slotLabelsColumn = document.getElementById('calendarTimeLabelsColumn');
    if (!slotLabelsColumn) return;

    // Clear any existing rows before re-rendering
    slotLabelsColumn.innerHTML = '';

    // Loop through the slots (24 hours) and create a time slot row for each slot
    slots.forEach((slotStart) => {
        const slotEnd = slotStart + slotDuration;
        const isActiveSlot = currentMinutesFromMidnight >= slotStart && currentMinutesFromMidnight < slotEnd;

        const timeSlotRow = document.createElement('div');
        timeSlotRow.id = 'calendarTimeSlotRow';
        timeSlotRow.className = 'calendarTimeSlotRow';
        timeSlotRow.style.height = `${slotHeight}px`; // Set the height of the time slot row to the height of the slot
        timeSlotRow.dataset.active = isActiveSlot ? 'true' : 'false';

        const timeLabel = document.createElement('span');
        timeLabel.id = 'calendarTimeLabel';
        timeLabel.className = 'calendarTimeLabel';
        timeLabel.textContent = `${formatSlotTime(slotStart)}`;
        timeSlotRow.appendChild(timeLabel);

        slotLabelsColumn.appendChild(timeSlotRow);
    });
}

// Formats the time slot time (e.g. 10:00 AM). Not using the event times!
function formatSlotTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${remainingMinutes.toString().padStart(2, '0')} ${ampm}`;
}

// Creates the day grid column for the calendar (the right column with the hour grid lines and the events)
function createDayGridColumn(events, slots, currentMinutesFromMidnight, slotHeight) {
    createHourGridLines(slots, slotHeight);
    createCurrentTimeLine(currentMinutesFromMidnight);
    createEventsLayer(events);

}

// Creates the hour grid lines for the calendar (the vertical lines)
function createHourGridLines(slots, slotHeight) {
    const hourGridLines = document.getElementById('calendarHourGridLinesContainer');
    if (!hourGridLines) return;
    // Reset and size the container for the full day height
    hourGridLines.innerHTML = '';
    hourGridLines.style.height = `${DAY_TOTAL_HEIGHT}px`;
    slots.forEach(() => {
        const line = document.createElement('div');
        line.className = 'calendarHourGridLine';
        line.style.height = `${slotHeight}px`;
        line.setAttribute('aria-hidden', 'true');
        hourGridLines.appendChild(line);
    });
}

// Creates the current time line for the calendar (the horizontal line)
function createCurrentTimeLine(currentMinutesFromMidnight) {
    const currentTimeLine = document.getElementById('calendarCurrentTimeLineContainer');
    if (!currentTimeLine) return;
    currentTimeLine.style.top = `${currentMinutesFromMidnight * PIXELS_PER_MINUTE}px`;
}

// Creates the events layer for the calendar
function createEventsLayer(events) {
    const eventsLayer = document.getElementById('calendarEventsLayer');
    if (!eventsLayer) return;

    // Clear previous events before re-rendering
    eventsLayer.innerHTML = '';
    eventsLayer.style.height = `${DAY_TOTAL_HEIGHT}px`;

    const assignedLanes = assignLanesForEvents(events);
    // Loop through the events and create an event button for each event
    events.forEach((event, index) => {
        const startTimeMinutes = timeStringToMinutes(event.timeStart);
        const endTimeMinutes = timeStringToMinutes(event.timeEnd);
        const duration = endTimeMinutes - startTimeMinutes;
        const topPosition = startTimeMinutes * PIXELS_PER_MINUTE;
        const durationHeight = duration * PIXELS_PER_MINUTE;
        const maxHeight = Math.max(18, durationHeight);
        const isShort = durationHeight <= 44;

        const laneIndex = assignedLanes.get(event.UID) ?? 0;
        const totalLanes = calculateTotalConcurrentEvents(event, events);
        const width = 100 / totalLanes;
        const leftPosition = width * laneIndex;

        const formattedTimeString = `${formatTime(event.timeStart)} - ${formatTime(event.timeEnd)}`;

        createEventButton(eventsLayer, event, topPosition, maxHeight, isShort, totalLanes, leftPosition, formattedTimeString, index);
    });
}

// Creates an event button for the calendar that displays the basic event information.
function createEventButton(eventsLayer, event, topPosition, maxHeight, isShort, totalLanes, leftPosition, formattedTimeString, index) {
    const eventButton = document.createElement('button');
    eventButton.className = isShort ? 'calendarEventContainer calendarEventContainer--compact' : 'calendarEventContainer';
    eventButton.type = 'button';
    eventButton.dataset.eventId = event.UID;
    eventButton.style.setProperty('--event-color', event.color ?? '#1a73e8');
    eventButton.style.top = `${topPosition}px`;
    eventButton.style.height = `${maxHeight}px`;
    eventButton.style.zIndex = String(index);
    eventButton.style.left = totalLanes <= 1 ? '0' : `calc(${leftPosition}% + ${laneIndex * 2}px)`;
    eventButton.style.width = totalLanes <= 1 ? '100%' : `calc(${width}% - 2px)`;

    if (isShort) {
        eventButton.innerHTML = `
        <span class="calendarEventHeader">
            <span class="calendarEventTime">${formattedTimeString}</span>
            <span class="calendarEventTitle">${event.title}</span>
        </span>
        `;
    } else {
        eventButton.innerHTML = `
        <span class="calendarEventTime">${formattedTimeString}</span>
        <span class="calendarEventTitle">${event.title}</span>
        <span class="calendarEventDescription">${event.description}</span>
        `;
    }

    eventsLayer.appendChild(eventButton);
}

// Assigns a lane to each event based on the duration of the event and the other events that are happening at the same time.
function assignLanesForEvents(events) {
    const assignedLanes = new Map();
    // An inline function to calculate the duration of an event
    const duration = (event) => event.timeEnd - event.timeStart;
    const sortedEvents = events.sort((a, b) => duration(b) - duration(a) || a.timeStart - b.timeStart);
    // Loop through the events and assign a lane to each event
    sortedEvents.forEach((event) => {
        const usedLanes = new Set();
        // Loop through the other events and add the lane of the other event to the used lanes set
        events.forEach((otherEvent) => {
            if (otherEvent.UID !== event.UID && (event.timeStart < event.timeEnd && event.timeEnd > event.timeStart) && assignedLanes.has(otherEvent.UID)) {
                usedLanes.add(assignedLanes.get(otherEvent.UID));
            }
        });

        // Find the lowest available lane
        let lowestAvailableLane = 0;
        while (usedLanes.has(lowestAvailableLane)) {
            lowestAvailableLane++;
        }

        // Set the lane of the event (the key is the event UID and the value is the lane)
        assignedLanes.set(event.UID, lowestAvailableLane);
    })

    return assignedLanes;
}

// Calculates the total number of concurrent events that are happening at the same time.
function calculateTotalConcurrentEvents(event, events) {
    // Filter the events to only include events that are happening at the same time
    const concurrentEvents = events.filter((event) => event.timeStart < event.timeEnd && event.timeEnd > event.timeStart);
    // If there are no concurrent events, return 1
    if (concurrentEvents.length === 0) return 1;

    // Create an array of points (time and delta)
    const points = [];
    // Loop through the concurrent events and add the start and end points to the points array
    concurrentEvents.forEach((concurrentEvent) => {
        points.push({ time: concurrentEvent.timeStart, delta: 1 });
        points.push({ time: concurrentEvent.timeEnd, delta: -1 });
    });

    // Sort the points by time
    points.sort((point1, point2) => point1.time - point2.time || point1.delta - point2.delta);

    // Count the number of concurrent events
    let count = 0;
    // Find the maximum number of concurrent events
    let maxCount = 0;
    points.forEach((point) => {
        count += point.delta;
        maxCount = Math.max(maxCount, count);
    });

    return maxCount;
}

// Converts a time string (e.g. "10:00") to the number of minutes since midnight. Use this for event times!
function timeStringToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':');
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

// Formats a time string (e.g. "10:00") to a human-readable time string (e.g. "10:00 AM"). Use this when formatting event times!
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Creates the full 24 hour slots
function createAllSlotsForDay(slotDuration) {
    const slots = [];
    for (let i = 0; i < MINUTES_PER_DAY; i += slotDuration) {
        slots.push(i);
    }
    return slots;
}

// Calculates the current time in minutes from midnight.
function calculateTheCurrentMinutesFromMidnight() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

// ----------------------Getters----------------------

/**
 * Gets the duration of the time slots in the calendar (in minutes). 60 minutes is default.
 * @returns {number} The duration of the time slots in the calendar (in minutes).
 */
export function getSlotDuration() {
    const value = document.getElementById('slotDurationSelect')?.value;
    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? 60 : parsedValue;
}