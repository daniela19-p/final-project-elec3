const API_KEY = "b1395efd7fba80f4bb52657a7b144f1f";

// APIs (BONUS: multiple API calls combined)
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const errorBox = document.getElementById("errorBox");
const placeSelect = document.getElementById("placeSelect");
const themeToggle = document.getElementById("themeToggle");
const geoBtn = document.getElementById("geoBtn");

const weatherBox = document.getElementById("weatherResult");
const cityNameEl = document.getElementById("cityName");
const countryEl = document.getElementById("country");
const descriptionEl = document.getElementById("description");
const tempEl = document.getElementById("temp");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const forecastBox = document.getElementById("forecastBox");
const forecastGrid = document.getElementById("forecastGrid");

// Meta
const metaRow = document.getElementById("metaRow");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const updatedAtEl = document.getElementById("updatedAt");

// UI helpers
function setLoading(isLoading, msg = "") {
  statusEl.textContent = msg;
  searchBtn.disabled = isLoading;
  cityInput.disabled = isLoading;
  placeSelect.disabled = isLoading;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function hideResults() {
  weatherBox.classList.add("hidden");
  forecastBox.classList.add("hidden");
  forecastGrid.innerHTML = "";
  metaRow.classList.add("hidden");
}

function hidePlaceSelect() {
  placeSelect.classList.add("hidden");
  placeSelect.innerHTML = "";
}

function validateCityInput(value) {
  const city = value.trim();
  if (!city) return { ok: false, message: "Please enter a city/province name." };
  if (city.length < 2) return { ok: false, message: "Please enter at least 2 characters." };

  const allowed = /^[a-zA-ZÀ-ž\s.,'-]+$/;
  if (!allowed.test(city)) return { ok: false, message: "Please use letters and common punctuation only." };

  return { ok: true, city };
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let extra = "";
    try {
      const data = await res.json();
      if (data?.message) extra = ` (${data.message})`;
    } catch {}
    throw new Error(`Request failed: ${res.status} ${res.statusText}${extra}`);
  }
  return res.json();
}

// Geocode: return up to 5 candidate locations
async function geocodeCityOptions(city) {
  const url = `${GEO_URL}?q=${encodeURIComponent(city)}&limit=5&appid=${API_KEY}`;
  const data = await fetchJSON(url);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Location not found. Check spelling.");
  }
  return data;
}

async function getCurrentWeather(lat, lon) {
  const url = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  return fetchJSON(url);
}

async function getForecast(lat, lon) {
  const url = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  return fetchJSON(url);
}

function formatPlace(p) {
  const state = p.state ? `, ${p.state}` : "";
  return `${p.name}${state}, ${p.country}`;
}

function populatePlaceSelect(places) {
  placeSelect.innerHTML = "";
  for (const p of places) {
    const opt = document.createElement("option");
    opt.value = JSON.stringify({
      lat: p.lat,
      lon: p.lon,
      name: p.name,
      state: p.state || "",
      country: p.country || "",
    });
    opt.textContent = formatPlace(p);
    placeSelect.appendChild(opt);
  }
  placeSelect.classList.remove("hidden");
}

function getSelectedPlace() {
  return JSON.parse(placeSelect.value);
}

// Render current weather
function showWeather(data, place) {
  const city = place?.name || data.name || "Unknown";
  const state = place?.state ? `, ${place.state}` : "";
  const country = place?.country || data.sys?.country || "";

  const description = data.weather?.[0]?.description || "N/A";
  const iconCode = data.weather?.[0]?.icon || null;
  const temp = Math.round(data.main?.temp ?? 0);
  const feelsLike = Math.round(data.main?.feels_like ?? 0);
  const humidity = data.main?.humidity ?? 0;
  const wind = data.wind?.speed ?? 0;

  cityNameEl.textContent = `${city}${state}`;
  countryEl.textContent = country ? `Country: ${country}` : "";
  descriptionEl.textContent = description;
  tempEl.textContent = temp;
  feelsLikeEl.textContent = feelsLike;
  humidityEl.textContent = humidity;
  windEl.textContent = wind;

  // Set current weather icon if available
  const iconEl = document.getElementById("weatherIcon");
  if (iconEl) {
    if (iconCode) {
      iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      iconEl.alt = description;
      iconEl.classList.remove("hidden");
    } else {
      iconEl.src = "";
      iconEl.alt = "";
      iconEl.classList.add("hidden");
    }
  }

  weatherBox.classList.remove("hidden");

  // Meta info (sunrise/sunset and updatedAt in local timezone)
  try {
    const tzOffset = (data.timezone ?? 0); // seconds offset from UTC
    const sunrise = data.sys?.sunrise; // unix seconds UTC
    const sunset = data.sys?.sunset;
    const dt = data.dt; // current data time

    if (typeof sunrise === "number" && typeof sunset === "number") {
      sunriseEl.textContent = formatLocalTime(sunrise, tzOffset);
      sunsetEl.textContent = formatLocalTime(sunset, tzOffset);
      updatedAtEl.textContent = formatLocalTime(dt, tzOffset);
      metaRow.classList.remove("hidden");
    }
  } catch {}
}

// Forecast helpers (3-hour intervals)
function pickDailyFrom3HourList(list) {
  const byDay = new Map();

  for (const item of list) {
    const dt = new Date(item.dt * 1000);
    const dayKey = dt.toISOString().slice(0, 10);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey).push(item);
  }

  const days = Array.from(byDay.entries()).slice(0, 5);
  const chosen = [];

  for (const [, items] of days) {
    let best = items[0];
    let bestDist = Infinity;

    for (const it of items) {
      const d = new Date(it.dt * 1000);
      const dist = Math.abs(d.getUTCHours() - 12);
      if (dist < bestDist) {
        bestDist = dist;
        best = it;
      }
    }
    chosen.push(best);
  }

  return chosen;
}

function formatDayLabel(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function showForecast(forecastData) {
  const list = forecastData.list || [];
  if (!list.length) return;

  const daily = pickDailyFrom3HourList(list);
  forecastGrid.innerHTML = "";

  for (const item of daily) {
    const temp = Math.round(item.main?.temp ?? 0);
    const desc = item.weather?.[0]?.description || "N/A";
    const icon = item.weather?.[0]?.icon || null;
    const day = formatDayLabel(item.dt);

    const card = document.createElement("div");
    card.className = "forecast-card";
    const iconHtml = icon ? `<img class="f-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />` : "";
    card.innerHTML = `
      ${iconHtml}
      <p class="f-day">${day}</p>
      <p class="f-temp">${temp}°C</p>
      <p class="f-desc">${desc}</p>
    `;
    forecastGrid.appendChild(card);
  }

  forecastBox.classList.remove("hidden");
}

// Run fetch for a selected place
async function fetchForPlace(place) {
  hideResults();
  clearError();

  try {
    setLoading(true, "Loading weather...");

    const current = await getCurrentWeather(place.lat, place.lon);
    showWeather(current, place);

    setLoading(true, "Loading 5-day forecast...");
    const forecast = await getForecast(place.lat, place.lon);
    showForecast(forecast);

    setLoading(false, "");
  } catch (err) {
    console.error(err);
    setLoading(false, "");
    showError(err.message || "Failed to fetch weather.");
  }
}

// Main search
async function runSearch() {
  clearError();
  hideResults();
  hidePlaceSelect();

  const check = validateCityInput(cityInput.value);
  if (!check.ok) {
    showError(check.message);
    return;
  }

  try {
    setLoading(true, "Searching location...");

    const places = await geocodeCityOptions(check.city);
    populatePlaceSelect(places);

    setLoading(false, "");
    await fetchForPlace(getSelectedPlace());
  } catch (err) {
    console.error(err);
    setLoading(false, "");
    showError(err.message || "Failed to find location.");
  }
}

// Theme toggle
function initTheme() {
  const saved = localStorage.getItem("weather_theme");
  const theme = saved || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  themeToggle.textContent = theme === "light" ? "🌙" : "☀️";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("weather_theme", next);
  updateThemeIcon(next);
}

// Time helpers
function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  // Convert to milliseconds and adjust by timezone offset
  const utcMs = unixSeconds * 1000;
  const date = new Date(utcMs + tzOffsetSeconds * 1000);
  // Use 24h by default; browser locale formatting
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Geolocation feature
function useMyLocation() {
  clearError();
  hidePlaceSelect();
  setLoading(true, "Getting your location...");

  if (!navigator.geolocation) {
    setLoading(false, "");
    showError("Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    try {
      // Fetch current weather to derive display name; then forecast
      setLoading(true, "Loading weather...");
      const current = await getCurrentWeather(lat, lon);

      // Build a synthetic place using API-returned city/country
      const place = {
        lat, lon,
        name: current.name || "Your Location",
        state: "",
        country: (current.sys && current.sys.country) || "",
      };

      showWeather(current, place);

      setLoading(true, "Loading 5-day forecast...");
      const forecast = await getForecast(lat, lon);
      showForecast(forecast);

      setLoading(false, "");
    } catch (err) {
      console.error(err);
      setLoading(false, "");
      showError(err.message || "Failed to fetch weather.");
    }
  }, (err) => {
    console.error(err);
    setLoading(false, "");
    const msg = err && err.code === err.PERMISSION_DENIED
      ? "Location permission denied. Please allow access or search by city."
      : "Failed to get your location.";
    showError(msg);
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
}

// Events
searchBtn.addEventListener("click", runSearch);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

placeSelect.addEventListener("change", () => {
  fetchForPlace(getSelectedPlace());
});

themeToggle.addEventListener("click", toggleTheme);
geoBtn.addEventListener("click", useMyLocation);

// Initialize
initTheme();
