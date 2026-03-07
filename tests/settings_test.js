import localStorageMock from "./mockStorage.js";

import appSettings from "../modules/settings.js";

function settingsTests() {
  let passed = 0;
  let failed = 0;

  // Replace localStorage with mock version
  localStorageMock.initialize();

  // ─── HELPERS ──────────────────────────────────────────────────────────────────

  function expectValue(label, actual, expected) {
    if (actual === expected) {
      console.log(`✅ PASS — "${label}"`);
      passed++;
    } else {
      console.error(
        `❌ FAIL — "${label}": expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}.`,
      );
      failed++;
    }
  }

  // ─── DEFAULTS ─────────────────────────────────────────────────────────────────

  console.group("restoreDefaults()");

  appSettings.restoreDefaults();
  expectValue("lightMode defaults to 'light'", appSettings.lightMode, "light");
  expectValue(
    "tempUnit defaults to 'Fahrenheit'",
    appSettings.tempUnit,
    "Fahrenheit",
  );
  expectValue("colorTheme defaults to 'blue'", appSettings.colorTheme, "blue");
  expectValue(
    "firstDayOfWeek defaults to 'Sunday'",
    appSettings.firstDayOfWeek,
    "Sunday",
  );
  expectValue(
    "displayHolidays defaults to true",
    appSettings.displayHolidays,
    true,
  );

  console.groupEnd();

  // ─── LIGHTMODE ────────────────────────────────────────────────────────────────

  console.group("lightMode");

  appSettings.restoreDefaults();
  appSettings.lightMode = "fail";
  expectValue(
    "Invalid value does not change lightMode",
    appSettings.lightMode,
    "light",
  );
  appSettings.lightMode = "dark";
  expectValue("Valid value 'dark' is accepted", appSettings.lightMode, "dark");
  appSettings.lightMode = "auto";
  expectValue("Valid value 'auto' is accepted", appSettings.lightMode, "auto");
  appSettings.lightMode = "light";
  expectValue(
    "Valid value 'light' is accepted",
    appSettings.lightMode,
    "light",
  );

  console.groupEnd();

  // ─── TEMPUNIT ─────────────────────────────────────────────────────────────────

  console.group("tempUnit");

  appSettings.restoreDefaults();
  appSettings.tempUnit = "Kelvin";
  expectValue(
    "Invalid value does not change tempUnit",
    appSettings.tempUnit,
    "Fahrenheit",
  );
  appSettings.tempUnit = "Celsius";
  expectValue(
    "Valid value 'Celsius' is accepted",
    appSettings.tempUnit,
    "Celsius",
  );
  appSettings.tempUnit = "Fahrenheit";
  expectValue(
    "Valid value 'Fahrenheit' is accepted",
    appSettings.tempUnit,
    "Fahrenheit",
  );

  console.groupEnd();

  // ─── COLORTHEME ───────────────────────────────────────────────────────────────

  console.group("colorTheme");

  appSettings.restoreDefaults();
  appSettings.colorTheme = "invalid";
  expectValue(
    "Invalid value does not change colorTheme",
    appSettings.colorTheme,
    "blue",
  );
  appSettings.colorTheme = "purple";
  expectValue(
    "Valid value 'purple' is accepted",
    appSettings.colorTheme,
    "purple",
  );
  appSettings.colorTheme = "pink";
  expectValue("Valid value 'pink' is accepted", appSettings.colorTheme, "pink");
  appSettings.colorTheme = "red";
  expectValue("Valid value 'red' is accepted", appSettings.colorTheme, "red");
  appSettings.colorTheme = "orange";
  expectValue(
    "Valid value 'orange' is accepted",
    appSettings.colorTheme,
    "orange",
  );
  appSettings.colorTheme = "yellow";
  expectValue(
    "Valid value 'yellow' is accepted",
    appSettings.colorTheme,
    "yellow",
  );
  appSettings.colorTheme = "green";
  expectValue(
    "Valid value 'green' is accepted",
    appSettings.colorTheme,
    "green",
  );
  appSettings.colorTheme = "blue";
  expectValue("Valid value 'blue' is accepted", appSettings.colorTheme, "blue");

  console.groupEnd();

  // ─── FIRSTDAYOFWEEK ───────────────────────────────────────────────────────────

  console.group("firstDayOfWeek");

  appSettings.restoreDefaults();
  appSettings.firstDayOfWeek = "Tuesday";
  expectValue(
    "Invalid value does not change firstDayOfWeek",
    appSettings.firstDayOfWeek,
    "Sunday",
  );
  appSettings.firstDayOfWeek = "Monday";
  expectValue(
    "Valid value 'Monday' is accepted",
    appSettings.firstDayOfWeek,
    "Monday",
  );
  appSettings.firstDayOfWeek = "Sunday";
  expectValue(
    "Valid value 'Sunday' is accepted",
    appSettings.firstDayOfWeek,
    "Sunday",
  );

  console.groupEnd();

  // ─── DISPLAYHOLIDAYS ──────────────────────────────────────────────────────────

  console.group("displayHolidays");

  appSettings.restoreDefaults();
  appSettings.displayHolidays = "yes";
  expectValue(
    "Invalid value does not change displayHolidays",
    appSettings.displayHolidays,
    true,
  );
  appSettings.displayHolidays = 1;
  expectValue(
    "Truthy non-boolean does not change displayHolidays",
    appSettings.displayHolidays,
    true,
  );
  appSettings.displayHolidays = false;
  expectValue(
    "Valid value false is accepted",
    appSettings.displayHolidays,
    false,
  );
  appSettings.displayHolidays = true;
  expectValue(
    "Valid value true is accepted",
    appSettings.displayHolidays,
    true,
  );

  console.groupEnd();

  // ─── SAVE AND LOAD ────────────────────────────────────────────────────────────

  console.group("saveSettings() and loadSettings()");

  // Set non-default values and save
  appSettings.restoreDefaults();
  appSettings.lightMode = "dark";
  appSettings.tempUnit = "Celsius";
  appSettings.colorTheme = "purple";
  appSettings.firstDayOfWeek = "Monday";
  appSettings.displayHolidays = false;
  appSettings.saveSettings();
  expectValue(
    "Settings key exists in localStorage after save",
    localStorage.getItem("DayPlannerSettings") !== null,
    true,
  );

  // Restore defaults then load — saved values should come back
  appSettings.restoreDefaults();
  appSettings.loadSettings();
  expectValue(
    "lightMode restored to 'dark' after load",
    appSettings.lightMode,
    "dark",
  );
  expectValue(
    "tempUnit restored to 'Celsius' after load",
    appSettings.tempUnit,
    "Celsius",
  );
  expectValue(
    "colorTheme restored to 'purple' after load",
    appSettings.colorTheme,
    "purple",
  );
  expectValue(
    "firstDayOfWeek restored to 'Monday' after load",
    appSettings.firstDayOfWeek,
    "Monday",
  );
  expectValue(
    "displayHolidays restored to false after load",
    appSettings.displayHolidays,
    false,
  );

  // Corrupt the stored JSON and verify loadSettings() handles it gracefully without throwing
  localStorage.setItem("DayPlannerSettings", "this is not valid json {{{");
  try {
    appSettings.loadSettings();
    console.log(
      `✅ PASS — "loadSettings() handles corrupted JSON without throwing"`,
    );
    passed++;
  } catch (e) {
    console.error(
      `❌ FAIL — "loadSettings() handles corrupted JSON without throwing": threw → ${e.message}`,
    );
    failed++;
  }

  // Verify loadSettings() handles missing key gracefully
  localStorage.removeItem("DayPlannerSettings");
  try {
    appSettings.loadSettings();
    console.log(
      `✅ PASS — "loadSettings() handles missing localStorage key without throwing"`,
    );
    passed++;
  } catch (e) {
    console.error(
      `❌ FAIL — "loadSettings() handles missing localStorage key without throwing": threw → ${e.message}`,
    );
    failed++;
  }

  console.groupEnd();

  // ─── SUMMARY ──────────────────────────────────────────────────────────────────

  // Restore localStorage and reset settings to defaults
  localStorageMock.restore();
  appSettings.restoreDefaults();

  console.log(
    `\n📋 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`,
  );
  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.warn(`⚠️  ${failed} test(s) failed. See above for details.`);
  }
}

export default settingsTests;
