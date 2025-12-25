# Final Project ELEC3

## Project Type
Solo project

## Description
This project is a collection of four web applications built by a solo student. Each app demonstrates practical use of APIs and interactive web development:

- **Calculator**: A simple, responsive calculator for basic arithmetic operations.
- **Cataas API Playground**: Fetches and displays random cat images using the Cataas API.
- **Stopwatch**: A digital stopwatch with start, stop, and reset functionality.
- **Weather API App**: Displays current weather information for a selected city using a public weather API.

---

## Main Features
- Responsive design for desktop and mobile
- Interactive UI for each app
- Real-time API data fetching (Cataas and Weather)
- Download and copy features for images
- Theme toggle (dark/light) in Cataas app
- Simple and intuitive controls

---

## APIs Used
### Cataas API
- **Base URL:** `https://cataas.com`
- **Endpoints:**
  - `/cat` (Get random cat image)
  - `/cat/:tag` (Get cat image by tag)
- **Parameters:**
  - `tag` (optional, string)
- **Authentication:** None required

### Weather API
- **Base URL:** `https://api.openweathermap.org/data/2.5/weather`
- **Endpoints:**
  - `/weather` (Get current weather by city)
- **Parameters:**
  - `q` (city name)
  - `appid` (API key)
- **Authentication:** API key required

---

## Technologies Used
- HTML
- CSS
- JavaScript

---

## Getting Started
### 1. Clone or Download the Repository
```sh
git clone https://github.com/daniela19-p/final-project-elec3.git
```
Or download the ZIP file and extract it.

### 2. Run the Project Locally
1. Open the project folder.
2. Open any app folder (e.g., `calculator`, `cataas-api`, `stopwatch`, `weather-api`).
3. Double-click `index.html` or open it in your browser.

---

## Credits / API Attribution
- Cat images powered by [Cataas API](https://cataas.com/)
- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)

---

_This README was created for a solo student project submission._
