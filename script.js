// Replace with your actual API keys (store them securely in an environment variable)
const WEATHER_API_KEY = 'your-weather-api-key';
const AIRVISUAL_API_KEY = 'your-airvisual-api-key';
let forecastChart;

async function getWeatherData() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  try {
    // Fetch current weather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    if (weatherData.cod !== 200) {
      throw new Error(weatherData.message);
    }

    const { lat, lon } = weatherData.coord; // Get coordinates

    // Fetch forecast data
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const forecastData = await forecastResponse.json();

    if (!forecastData.list || forecastData.list.length === 0) {
      throw new Error("Forecast data not available");
    }

    // Fetch AQI using latitude & longitude
    await getAQI(lat, lon);

    // Update UI with weather & forecast data
    updateWeatherUI(weatherData);
    updateForecastChart(forecastData);
  } catch (error) {
    console.error("Error fetching data:", error);
    alert(`Error: ${error.message}`);
  }
}

// Fetch Air Quality using latitude & longitude (more reliable)
async function getAQI(lat, lon) {
  try {
    const aqiResponse = await fetch(
      `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${AIRVISUAL_API_KEY}`
    );
    const aqiData = await aqiResponse.json();

    if (aqiData.status !== "success" || !aqiData.data?.current?.pollution) {
      throw new Error("AQI data not found for this location");
    }

    updateAQIUI(aqiData.data.current.pollution);
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    alert("Air Quality data is not available for this location.");
  }
}

function updateWeatherUI(data) {
  document.getElementById("temperature").textContent =
    `Temperature: ${Math.round(data.main.temp)}°C`;
  document.getElementById("description").textContent =
    `Weather: ${data.weather[0].description}`;
  document.getElementById("humidity").textContent =
    `Humidity: ${data.main.humidity}%`;
  document.getElementById("wind").textContent =
    `Wind Speed: ${data.wind.speed} m/s`;
}

function updateAQIUI(data) {
  const aqiValue = document.getElementById("aqiValue");
  const aqiDescription = document.getElementById("aqiDescription");
  const aqi = data.aqius;

  aqiValue.textContent = `AQI: ${aqi}`;

  let aqiClass = "good";
  let description = "Good";

  if (aqi > 150) {
    aqiClass = "hazardous";
    description = "Hazardous";
  } else if (aqi > 100) {
    aqiClass = "very-unhealthy";
    description = "Very Unhealthy";
  } else if (aqi > 50) {
    aqiClass = "unhealthy";
    description = "Unhealthy";
  } else if (aqi > 25) {
    aqiClass = "moderate";
    description = "Moderate";
  }

  aqiValue.className = aqiClass;
  aqiDescription.textContent = description;
  aqiDescription.className = aqiClass;
}

function updateForecastChart(data) {
  const dailyTemps = [];
  const seenDates = new Set();

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
    if (!seenDates.has(date)) {
      seenDates.add(date);
      dailyTemps.push({ date, temp: Math.round(item.main.temp) });
    }
  });

  const labels = dailyTemps.slice(0, 5).map(item => item.date);
  const temperatures = dailyTemps.slice(0, 5).map(item => item.temp);

  if (forecastChart) {
    forecastChart.destroy();
  }

  const ctx = document.getElementById("forecastChart").getContext("2d");
  forecastChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temperatures,
          borderColor: "#007bff",
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top"
        },
        title: {
          display: true,
          text: "5-Day Temperature Forecast"
        }
      }
    }
  });
}
