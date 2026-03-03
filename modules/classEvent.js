import generateUID from "./UIDGenerator.js";

/**
 * Event class represents a calendar event and includes validation for date and time formats.
 * Pass an options object to the constructor with the following properties:
 * - UID: string representing the unique identifier for the event (generated automatically if not provided)
 * - date (required): string in "YYYY-MM-DD" format representing the event date
 * - timeStart (required): string in "HH:MM" 24-hour format representing the event start time
 * - timeEnd (required): string in "HH:MM" 24-hour format representing the event end time
 * - title (required): string representing the event title
 * - description: string representing the event description
 * - address: string representing the event address
 * - color: string representing the event color (e.g. "#FF0000")
 */
export default class Event {
  // Private fields
  #UID;
  #date;
  #timeStart;
  #timeEnd;
  #title;
  #description;
  #address;
  #color;

  // Uses object destructuring to pull named properties off of props object
  constructor({
    UID,
    date,
    timeStart,
    timeEnd,
    title,
    description,
    address,
    color,
  }) {
    // Check that the required properties have been passed to the constructor
    if (!date || !timeStart || !timeEnd || !title) {
      throw new Error(
        "Event construction error: date, timeStart, timeEnd, and title fields are required.",
      );
    }

    // Generate a UID if one isn't provided.
    // Only Events loaded from storage should have a UID passed in.
    // ?? returns the right side if the left side is falsy, e.g. undefined in case of not being passed
    this.#UID = UID ?? generateUID();

    this.date = date;
    this.timeStart = timeStart;
    this.timeEnd = timeEnd;
    validateTimeOrder(timeStart, timeEnd);

    this.title = title;
    this.description = description;
    this.address = address;
    this.color = color;
  }

  // Getter with no setter since UID should be read-only after construction
  get UID() {
    return this.#UID;
  }

  // Calculate difference between timeStart and timeEnd in minutes
  get length() {
    // Grab hours and minutes from timeStart and timeEnd
    const [startHour, startMinute] = this.timeStart.split(":").map(Number);
    const [endHour, endMinute] = this.timeEnd.split(":").map(Number);

    // Convert hours and minutes to total minutes for easier calculation
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Return the difference in minutes between timeEnd and timeStart
    return endTotalMinutes - startTotalMinutes;
  }

  get date() {
    return this.#date;
  }

  set date(newDate) {
    validateDate(newDate);
    this.#date = newDate;
  }

  get timeStart() {
    return this.#timeStart;
  }

  set timeStart(newStart) {
    validateTime(newStart);
    // If timeEnd is already set, validate the order (won't run during constructor)
    if (this.#timeEnd !== undefined) {
      validateTimeOrder(newStart, this.#timeEnd);
    }
    this.#timeStart = newStart;
  }

  get timeEnd() {
    return this.#timeEnd;
  }

  set timeEnd(newEnd) {
    validateTime(newEnd);
    // If timeStart is already set, validate the order (won't run during constructor)
    if (this.#timeStart !== undefined) {
      validateTimeOrder(this.#timeStart, newEnd);
    }
    this.#timeEnd = newEnd;
  }

  get title() {
    return this.#title;
  }

  set title(newTitle) {
    validateStringProperty(newTitle, "title");
    this.#title = newTitle;
  }

  get description() {
    return this.#description;
  }

  set description(newDescription) {
    validateStringProperty(newDescription, "description");
    this.#description = newDescription;
  }

  get address() {
    return this.#address;
  }

  set address(newAddress) {
    validateStringProperty(newAddress, "address");
    this.#address = newAddress;
  }

  get color() {
    return this.#color;
  }

  set color(newColor) {
    validateColor(newColor);
    this.#color = newColor;
  }

  // Used for JSON.stringify(event) so that private variables get passed
  // Attempting to save to localStorage will just save an empty object {} otherwise
  toJSON() {
    return {
      UID: this.#UID,
      date: this.#date,
      timeStart: this.#timeStart,
      timeEnd: this.#timeEnd,
      title: this.#title,
      description: this.#description,
      address: this.#address,
      color: this.#color,
    };
  }
}

// Check that date string passed to Event constructor is in "YYYY-MM-DD" format
// and represents a valid date
function validateDate(date) {
  // If date string doesn't parse to a valid date, throw error
  if (isNaN(Date.parse(date))) {
    throw new Error(`Event assignment error: invalid date format ${date}`);
  }

  // Check that date is in "YYYY-MM-DD" format for the year 2000-2099
  const dateRegex = /^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  if (!dateRegex.test(date)) {
    throw new Error(
      `Event assignment error: date string ${date} is not in "YYYY-MM-DD" format.`,
    );
  }
}

// Check that time strings passed to Event constructor are in "HH:MM" 24-hour format
// and that timeEnd is after timeStart
function validateTime(time) {
  // If time string isn't in 24-hour format, throw error
  const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    throw new Error(
      `Event assignment error: time string ${time} is not in 24-hour format (HH:MM).`,
    );
  }

  // Minutes should only be in 15 minute increments (00, 15, 30, 45)
  const minutes = time.split(":")[1];
  if (!["00", "15", "30", "45"].includes(minutes)) {
    throw new Error(
      `Event assignment error: time string ${time} has invalid minutes. Minutes must be in 15 minute increments (00, 15, 30, 45).`,
    );
  }
}

// Makes sure that timeEnd is after timeStart
function validateTimeOrder(timeStart, timeEnd) {
  const [startHour, startMinute] = timeStart.split(":").map(Number);
  const [endHour, endMinute] = timeEnd.split(":").map(Number);

  if (
    endHour < startHour ||
    (endHour === startHour && endMinute <= startMinute)
  ) {
    throw new Error(
      `Event assignment error: timeEnd ${timeEnd} must be after timeStart ${timeStart}.`,
    );
  }
  return true;
}

// Check that Event properties that should be strings are actually strings.
// Will not throw for undefined properties except for title, which is a required property
function validateStringProperty(prop, propName) {
  if (propName === "title") {
    if (typeof prop !== "string") {
      throw new Error(
        `Event assignment error: ${propName} must be a string. Received type ${typeof prop}.`,
      );
    }
  } else {
    if (typeof prop !== "string" && typeof prop !== "undefined") {
      throw new Error(
        `Event assignment error: ${propName} must be a string. Received type ${typeof prop}.`,
      );
    }
  }
}

// Checks that
function validateColor(color) {
  if (color === undefined) return;
  if (typeof color !== "string") {
    throw new Error(
      `Event assignment error: color must be a string. Received type ${typeof color}.`,
    );
  }

  const testEl = document.createElement("div");
  testEl.style.color = color;
  if (testEl.style.color === "") {
    throw new Error(
      `Event assignment error: "${color}" is not a valid CSS color.`,
    );
  }
}
