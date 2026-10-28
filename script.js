// استدعاء عناصر الـ DOM
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const quickCityBtns = document.querySelectorAll('.city-chip');

const loadingBox = document.getElementById('loading');
const errorBox = document.getElementById('error-box');
const errorMessage = document.getElementById('error-message');
const weatherContent = document.getElementById('weather-content');

// عناصر عرض البيانات
const cityNameEl = document.getElementById('city-name');
const currentDateEl = document.getElementById('current-date');
const weatherIconEl = document.getElementById('weather-icon');
const currentTempEl = document.getElementById('current-temp');
const weatherDescEl = document.getElementById('weather-desc');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const forecastGridEl = document.getElementById('forecast-grid');

// دالة لتحويل كود الطقس العالمي (WMO Code) إلى وصف عربي وأيقونة
function getWeatherInfo(code) {
  const weatherMap = {
    0: { desc: 'سماء صافية ومشمسة', icon: '☀️' },
    1: { desc: 'صافي غالباً', icon: '🌤️' },
    2: { desc: 'غائم جزئياً', icon: '⛅' },
    3: { desc: 'غائم كلياً', icon: '☁️' },
    45: { desc: 'أجواء ضبابية', icon: '🌫️' },
    48: { desc: 'ضباب كثيف', icon: '🌫️' },
    51: { desc: 'رذاذ خفيف', icon: '🌦️' },
    53: { desc: 'رذاذ متوسط', icon: '🌦️' },
    55: { desc: 'رذاذ كثيف', icon: '🌧️' },
    61: { desc: 'أمطار خفيفة', icon: '🌧️' },
    63: { desc: 'أمطار متوسطة', icon: '🌧️' },
    65: { desc: 'أمطار غزيرة', icon: '⛈️' },
    71: { desc: 'ثلوج خفيفة', icon: '❄️' },
    73: { desc: 'ثلوج متوسطة', icon: '❄️' },
    75: { desc: 'ثلوج كثيفة', icon: '❄️' },
    80: { desc: 'زخات مطر خفيفة', icon: '🌦️' },
    81: { desc: 'زخات مطر متوسطة', icon: '🌧️' },
    82: { desc: 'زخات مطر غزيرة', icon: '⛈️' },
    95: { desc: 'عاصفة رعدية', icon: '⛈️' }
  };

  return weatherMap[code] || { desc: 'أجواء معتدلة', icon: '🌤️' };
}

// الدالة الرئيسية لجلب الطقس من الـ API باستخدام async / await
async function fetchWeather(cityQuery) {
  try {
    // 1. إظهار التحميل وإخفاء المحتوى القديم أو الخطأ
    loadingBox.classList.remove('hidden');
    errorBox.classList.add('hidden');
    weatherContent.classList.add('hidden');

    // 2. الخطوة الأولى: تحويل اسم المدينة إلى إحداثيات (Latitude & Longitude)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=ar&format=json`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('لم نتمكن من العثور على هذه المدينة، جرب كتابة اسم مدينة أخرى.');
    }

    const location = geoData.results[0];
    const { latitude, longitude, name, country } = location;

    // 3. الخطوة الثانية: جلب الطقس الحالي وتوقعات الأيام القادمة بناءً على الإحداثيات
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    // 4. تحديث واجهة المستخدم بالبيانات الراجعة من الـ API
    updateUI(name, country, weatherData);

  } catch (error) {
    errorMessage.textContent = error.message || 'حدث خطأ أثناء الاتصال بالخادم.';
    errorBox.classList.remove('hidden');
  } finally {
    loadingBox.classList.add('hidden');
  }
}

// دالة تحديث عناصر الصفحة (DOM) بالبيانات
function updateUI(city, country, data) {
  const current = data.current;
  const daily = data.daily;
  const weatherInfo = getWeatherInfo(current.weather_code);

  // اسم المدينة والتاريخ
  cityNameEl.textContent = `${city}، ${country || ''}`;
  currentDateEl.textContent = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // الحرارة والوصف والأيقونة
  weatherIconEl.textContent = weatherInfo.icon;
  currentTempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  weatherDescEl.textContent = weatherInfo.desc;

  // التفاصيل الإضافية
  feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} كم/س`;
  pressureEl.textContent = `${Math.round(current.surface_pressure)} hPa`;

  // رسم توقعات الـ 5 أيام القادمة
  forecastGridEl.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const dateObj = new Date(daily.time[i]);
    const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
    const dayInfo = getWeatherInfo(daily.weather_code[i]);
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);

    const dayCard = document.createElement('div');
    dayCard.className = 'forecast-day';
    dayCard.innerHTML = `
      <p class="forecast-day-name">${dayName}</p>
      <div class="forecast-icon">${dayInfo.icon}</div>
      <div class="forecast-temps">
        <span class="temp-max">${maxTemp}°</span>
        <span class="temp-min">${minTemp}°</span>
      </div>
    `;
    forecastGridEl.appendChild(dayCard);
  }

  // إظهار المحتوى بعد اكتمال التحديث
  weatherContent.classList.remove('hidden');
}

// تشغيل البحث عند إرسال الفورم
searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city !== '') {
    fetchWeather(city);
    cityInput.value = '';
  }
});

// تشغيل أزرار المدن السريعة
quickCityBtns.forEach(btn => {
  btn.addEventListener('click', function () {
    const city = this.getAttribute('data-city');
    fetchWeather(city);
  });
});

// عرض طقس القاهرة تلقائياً عند فتح التطبيق لأول مرة
fetchWeather('القاهرة');