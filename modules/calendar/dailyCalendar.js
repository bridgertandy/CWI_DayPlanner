"use strict";

import * as Calendar from "./calendar.js";

// Render the single day view of the calendar
export function renderSingleDay(events, viewDate) {
  const slotDuration = getSlotDuration();
  const currentMinutesFromMidnight = Calendar.isToday(viewDate)
    ? Calendar.calculateTheCurrentMinutesFromMidnight()
    : null;
  const slotHeight = slotDuration * Calendar.PIXELS_PER_MINUTE;
  const slots = createAllSlotsForDay(slotDuration);
  const dayContentWrapper = document.getElementById(
    "calendarDayContentWrapper",
  );
  if (!dayContentWrapper) return;
  createTimeSlotColumn(
    slots,
    currentMinutesFromMidnight,
    slotDuration,
    slotHeight,
  );
  createDayGridColumn(events, slots, currentMinutesFromMidnight, slotHeight);

  // Scroll to the active row only when viewing today
  const calendarViewArea = document.getElementById("calendarViewArea");
  if (!calendarViewArea) return;
  const activeRow = calendarViewArea.querySelector(
    '.calendarTimeSlotRow[data-active="true"]',
  );
  if (activeRow && Calendar.isToday(viewDate)) {
    activeRow.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Creates the time slot column for the calendar (the left column with the time labels)
function createTimeSlotColumn(
  slots,
  currentMinutesFromMidnight,
  slotDuration,
  slotHeight,
) {
  const slotLabelsColumn = document.getElementById("calendarTimeLabelsColumn");
  if (!slotLabelsColumn) return;

  // Clear any existing rows before re-rendering
  slotLabelsColumn.innerHTML = "";

  // Loop through the slots (24 hours) and create a time slot row for each slot
  slots.forEach((slotStart) => {
    const slotEnd = slotStart + slotDuration;
    const isActiveSlot =
      currentMinutesFromMidnight != null &&
      currentMinutesFromMidnight >= slotStart &&
      currentMinutesFromMidnight < slotEnd;

    const timeSlotRow = document.createElement("div");
    timeSlotRow.id = "calendarTimeSlotRow";
    timeSlotRow.className = "calendarTimeSlotRow";
    timeSlotRow.style.height = `${slotHeight}px`; // Set the height of the time slot row to the height of the slot
    timeSlotRow.dataset.active = isActiveSlot ? "true" : "false";

    const timeLabel = document.createElement("span");
    timeLabel.id = "calendarTimeLabel";
    timeLabel.className = "calendarTimeLabel";
    timeLabel.textContent = `${Calendar.formatSlotTime(slotStart)}`;
    timeSlotRow.appendChild(timeLabel);

    slotLabelsColumn.appendChild(timeSlotRow);
  });

  return slotLabelsColumn;
}

// Creates the day grid column for the calendar (the right column with the hour grid lines and the events)
function createDayGridColumn(
  events,
  slots,
  currentMinutesFromMidnight,
  slotHeight,
) {
  createHourGridLines(slots, slotHeight);
  createCurrentTimeLine(currentMinutesFromMidnight);
  createEventsLayer(events);
}

// Creates the hour grid lines for the calendar (the vertical lines)
function createHourGridLines(slots, slotHeight) {
  const hourGridLines = document.getElementById(
    "calendarHourGridLinesContainer",
  );
  if (!hourGridLines) return;
  // Reset and size the container for the full day height
  hourGridLines.innerHTML = "";
  hourGridLines.style.height = `${Calendar.DAY_TOTAL_HEIGHT}px`;
  slots.forEach(() => {
    const line = document.createElement("div");
    line.className = "calendarHourGridLine";
    line.style.height = `${slotHeight}px`;
    line.setAttribute("aria-hidden", "true");
    hourGridLines.appendChild(line);
  });
}

// Creates the current time line for the calendar (the horizontal line). Hidden when viewing another day.
function createCurrentTimeLine(currentMinutesFromMidnight) {
  const currentTimeLine = document.getElementById(
    "calendarCurrentTimeLineContainer",
  );
  if (!currentTimeLine) return;
  if (currentMinutesFromMidnight == null) {
    currentTimeLine.style.visibility = "hidden";
  } else {
    currentTimeLine.style.visibility = "visible";
    currentTimeLine.style.top = `${currentMinutesFromMidnight * Calendar.PIXELS_PER_MINUTE}px`;
  }
}

// Creates the events layer for the calendar
function createEventsLayer(events) {
  const eventsLayer = document.getElementById("calendarEventsLayer");
  if (!eventsLayer) return;

  // Clear previous events before re-rendering
  eventsLayer.innerHTML = "";
  eventsLayer.style.height = `${Calendar.DAY_TOTAL_HEIGHT}px`;

  // We want to assign the lanes before looping through the events so that we can use the assigned lanes in the button creation.
  const assignedLanes = assignLanesForEvents(events);

  // Loop through the events and create an event button for each event
  events.forEach((event, index) => {
    createEventButton(eventsLayer, events, event, index, assignedLanes);
  });
}

// Creates an event button for the calendar that displays the basic event information.
function createEventButton(eventsLayer, events, event, index, assignedLanes) {
  // Button calculations
  const startTimeMinutes = Calendar.timeStringToMinutes(event.timeStart);
  const endTimeMinutes = Calendar.timeStringToMinutes(event.timeEnd);
  const duration = endTimeMinutes - startTimeMinutes;
  const topPosition = startTimeMinutes * Calendar.PIXELS_PER_MINUTE;
  const durationHeight = duration * Calendar.PIXELS_PER_MINUTE;
  const maxHeight = Math.max(18, durationHeight);
  const isShort = durationHeight <= 44;

  // Lane calculations
  const laneIndex = assignedLanes.get(event.UID) ?? 0;
  const totalLanes = calculateTotalConcurrentEvents(event, events);
  const width = 100 / totalLanes;
  const leftPosition = width * laneIndex;

  const formattedTimeString = `${Calendar.formatTime(event.timeStart)} - ${Calendar.formatTime(event.timeEnd)}`;

  const eventButton = document.createElement("button");
  eventButton.className = isShort
    ? "calendarEventContainer calendarEventContainer--compact"
    : "calendarEventContainer";
  eventButton.type = "button";
  eventButton.dataset.eventId = event.UID;
  eventButton.style.setProperty("--event-color", event.color ?? "#1a73e8");
  eventButton.style.top = `${topPosition}px`;
  eventButton.style.height = `${maxHeight}px`;
  eventButton.style.zIndex = String(index);
  eventButton.style.left =
    totalLanes <= 1 ? "0" : `calc(${leftPosition}% + ${laneIndex * 2}px)`;
  eventButton.style.width = totalLanes <= 1 ? "100%" : `calc(${width}% - 2px)`;

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
  // Inline functions to calculate the duration and tranlsate time strings to minutes
  const durationMinutes = (event) =>
    Calendar.timeStringToMinutes(event.timeEnd) -
    Calendar.timeStringToMinutes(event.timeStart);
  const startMinutes = (event) => Calendar.timeStringToMinutes(event.timeStart);
  // Sort the events by duration and start time
  const sortedEvents = [...events].sort(
    (event1, event2) =>
      durationMinutes(event2) - durationMinutes(event1) ||
      startMinutes(event1) - startMinutes(event2),
  );

  // Loop through the sortedevents and assign a lane to each event
  sortedEvents.forEach((event) => {
    const eventStart = Calendar.timeStringToMinutes(event.timeStart);
    const eventEnd = Calendar.timeStringToMinutes(event.timeEnd);
    const usedLanes = new Set();
    // Loop through the other events and add the lane of the other event to the used lanes set if it overlaps with the current event
    events.forEach((otherEvent) => {
      if (otherEvent.UID === event.UID || !assignedLanes.has(otherEvent.UID))
        return;
      const otherStart = Calendar.timeStringToMinutes(otherEvent.timeStart);
      const otherEnd = Calendar.timeStringToMinutes(otherEvent.timeEnd);
      const overlaps = eventStart < otherEnd && eventEnd > otherStart;
      if (overlaps) usedLanes.add(assignedLanes.get(otherEvent.UID));
    });

    // Find the lowest available lane
    let lowestAvailableLane = 0;
    while (usedLanes.has(lowestAvailableLane)) {
      lowestAvailableLane++;
    }

    // Set the lane of the event (the key is the event UID and the value is the lane)
    assignedLanes.set(event.UID, lowestAvailableLane);
  });

  return assignedLanes;
}

// Calculates the total number of concurrent events overlapping the given event's time range.
function calculateTotalConcurrentEvents(event, events) {
  const eventStart = Calendar.timeStringToMinutes(event.timeStart);
  const eventEnd = Calendar.timeStringToMinutes(event.timeEnd);
  // Filter the events to only include events that overlap with the given event's time range
  const concurrentEvents = events.filter((other) => {
    const otherStart = Calendar.timeStringToMinutes(other.timeStart);
    const otherEnd = Calendar.timeStringToMinutes(other.timeEnd);
    return eventStart < otherEnd && eventEnd > otherStart;
  });
  // If there are no concurrent events, return 1
  if (concurrentEvents.length === 0) return 1;

  // Create an array of points (time and delta)
  const points = [];
  // Loop through the concurrent events and add the start and end points to the points array
  concurrentEvents.forEach((concurrentEvent) => {
    points.push({
      time: Calendar.timeStringToMinutes(concurrentEvent.timeStart),
      delta: 1,
    });
    points.push({
      time: Calendar.timeStringToMinutes(concurrentEvent.timeEnd),
      delta: -1,
    });
  });

  // Sort the points by time
  points.sort(
    (point1, point2) =>
      point1.time - point2.time || point1.delta - point2.delta,
  );

  // Count the number of concurrent events
  let count = 0;
  // Find the maximum number of concurrent events
  let maxCount = 0;
  points.forEach((point) => {
    count += point.delta;
    maxCount = Math.max(maxCount, count);
  });
  return Math.max(1, maxCount);
}

// Creates the full 24 hour slots
function createAllSlotsForDay(slotDuration) {
  const slots = [];
  for (let i = 0; i < Calendar.MINUTES_PER_DAY; i += slotDuration) {
    slots.push(i);
  }
  return slots;
}

/**
 * Gets the duration of the time slots in the calendar (in minutes). 60 minutes is default.
 * @returns {number} The duration of the time slots in the calendar (in minutes).
 */
function getSlotDuration() {
  const value = document.getElementById("slotDurationSelect")?.value;
  const parsedValue = parseInt(value, 10);
  return Number.isNaN(parsedValue) ? 60 : parsedValue;
}
