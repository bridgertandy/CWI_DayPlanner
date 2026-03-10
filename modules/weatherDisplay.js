import { weatherKey } from "./weatherKey.js";
import appSettings from "./settings.js";

// weather api key
const API_KEY = weatherKey.key;

// set default city "Boise"
const DEFAULT_CITY = "Boise";

// Set cache time (30 minutes)
const CACHE_TIME = 30 * 60 * 1000;

/**
 * Asynchronously loads and displays weather information for a specified city.
 * @param {string} city - The name of the city to fetch weather data for.
 * Defaults to DEFAULT_CITY if not provided.
 */
export async function loadWeatherDisplay(city = DEFAULT_CITY) {
  const weatherBox = document.getElementById("weatherDisplay");

  try {
    // Check if cached weather data exists
    const cachedWeather = getCachedWeather(city);

    if (cachedWeather) {
      //If cached data exists, display it and return
      displayWeather(cachedWeather);
      return;
    }

    // Fetch new weather data from API
    const weatherData = await fetchWeatherData(city);

    // Save new weather data to cache
    cacheWeather(city, weatherData);

    // Dispaly the result
    displayWeather(weatherData);
  } catch (error) {
    // Catch and log errors (network issues, invalid API key, ...)
    console.error("Weather display failed:", error);

    // Update the display to show a loading message in case of an error
    weatherBox.innerHTML = `<p>Weather loading...</p>`;
  }
}

/**
 * Fetch weather data from WeatherAPI
 * @param city - The name of the city to fetch weather data for.
 */
async function fetchWeatherData(city) {
  // Url for the API request using the provided API key and city name
  const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`;

  // Send fetch request to the API endpoint and wait for the response
  const response = await fetch(url);

  // Check if response was successful, if not throw an error.
  if (!response.ok) {
    throw new Error("Weather API request failure...");
  }

  // Parse the response body as JSON data and wait for the process to complete
  const data = await response.json();

  // Return the parsed JSON data containing the weather information
  return data;
}

/**
 * Display weather API data from WeatherAPI call
 * @param {object} data - The weather data object
 */
function displayWeather(data) {
  const weatherBox = document.getElementById("weatherDisplay");

  const city = data.location.name;
  const condition = data.current.condition.text;
  const iconUrl = "https:" + data.current.condition.icon;

  // choose temperature unit, Celcius or Fahrenheit
  const temperature =
    appSettings.tempUnit === "Celsius"
      ? data.current.temp_c
      : data.current.temp_f;

  // Choose temperature symbol
  const symbol = appSettings.tempUnit == "Celsius" ? "°C" : "°F";

  // Update the display to show weather data from the API endpoint
  weatherBox.innerHTML = `
        <p><img src="${iconUrl}" alt="Weather icon"/></p>
        <p><strong>${city}</strong></p>
        <p>${Math.round(temperature)}${symbol}</p>
        <p><em>${condition}</em></p>
    `;
}

/**
 * Retrieve cached weather data for a specific city if it is valid (within CACHE_TIME).
 * @param {string} city - The name of the city to retrive the weather for.
 * @returns {object|null} The cached weather data or null if not found or expired.
 */
function getCachedWeather(city) {
  // Retrieve the cache data from localStorage
  const cached = localStorage.getItem("weatherCache");

  // Return null if no cache data found
  if (!cached) return null;

  // Parse the JSON string back into an object
  const cacheData = JSON.parse(cached);

  // Check if cache data is still valid based on timestamp
  const valid = Date.now() - cacheData.timestamp < CACHE_TIME;

  // Return the cached data if valid and matches the city.
  if (valid && cacheData.city === city) {
    return cacheData.data;
  }

  return null;
}

/**
 * Save weather data to localStorage with a timestamp.
 * @param {string} city - The name of the city.
 * @param {object} data - The weather data object.
 */
function cacheWeather(city, data) {
  // Create the cache object with city, data, and current timestamp
  const cache = {
    city,
    data,
    timestamp: Date.now(),
  };

  // Save the cache object as a JSON string in localStorage
  localStorage.setItem("weatherCache", JSON.stringify(cache));
}
