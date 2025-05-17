        // Lazy Load Map
        let map = null;
        let mapLoaded = false;
        function initMap() {
            if (mapLoaded) return;
            // Safety check for Leaflet
            if (typeof L === 'undefined') {
                console.error('Leaflet library not loaded.');
                showNotification('Gagal memuat peta: Leaflet tidak tersedia.', 'error');
                return;
            }
            try {
                map = L.map('map').setView([-2.5489, 118.0149], 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://osm.org/copyright">OSM</a>'
                }).addTo(map);
                mapLoaded = true;
            } catch (e) {
                console.error('Failed to initialize map:', e);
                showNotification('Gagal memuat peta. Silakan coba lagi nanti.', 'error');
            }
        }

        const mapSection = document.querySelector('#map');
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                initMap();
                observer.unobserve(mapSection);
            }
        }, { threshold: 0.1 });
        observer.observe(mapSection);

        // API Configuration
        const APIs = {
            weather: 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.03.16.2007',
            earthquake: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml',
            historicalQuake: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.xml',
            aqi: 'https://api.openweathermap.org/data/2.5/air_pollution',
            warning: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.xml'
        };

        const AQI_API_KEY = 'e98de5f3705f63f8923b88904e99af9f';

        // Daftar Provinsi untuk Pencarian (dengan kode adm4)
        const provinces = [
            { name: "Aceh", adm4: "11.01.01.2001", lat: 5.5483, lon: 95.3238 },
            { name: "Bali", adm4: "51.71.01.1001", lat: -8.4095, lon: 115.1889 },
            { name: "Banten", adm4: "36.03.01.1001", lat: -6.4058, lon: 106.0640 },
            { name: "Bengkulu", adm4: "17.71.01.1001", lat: -3.8004, lon: 102.2655 },
            { name: "DI Yogyakarta", adm4: "34.71.01.1001", lat: -7.7971, lon: 110.3705 },
            { name: "DKI Jakarta", adm4: "31.71.01.1001", lat: -6.2088, lon: 106.8456 },
            { name: "Gorontalo", adm4: "75.01.01.1001", lat: 0.6999, lon: 122.4467 },
            { name: "Jambi", adm4: "15.71.01.1001", lat: -1.6101, lon: 103.6131 },
            { name: "Jawa Barat", adm4: "32.03.16.2007", lat: -6.9147, lon: 107.6098 },
            { name: "Desa Cisujen, Kec. Takokak, Kab. Cianjur", adm4: "32.03.16.2007", lat: -7.098191543, lon: 107.0186981657 },
            { name: "Jawa Tengah", adm4: "33.74.01.1001", lat: -7.1507, lon: 110.1403 },
            { name: "Jawa Timur", adm4: "35.78.01.1001", lat: -7.5361, lon: 112.2384 },
            { name: "Kalimantan Barat", adm4: "61.71.05.1001", lat: -0.1322, lon: 111.4753 },
            { name: "Kalimantan Selatan", adm4: "63.71.01.1001", lat: -3.3167, lon: 114.5901 },
            { name: "Kalimantan Tengah", adm4: "62.71.01.1001", lat: -1.6815, lon: 113.3824 },
            { name: "Kalimantan Timur", adm4: "64.71.01.1001", lat: 0.5387, lon: 116.4194 },
            { name: "Kalimantan Utara", adm4: "65.71.01.1001", lat: 3.0926, lon: 115.2838 },
            { name: "Kepulauan Bangka Belitung", adm4: "19.01.01.1001", lat: -2.7411, lon: 106.4406 },
            { name: "Kepulauan Riau", adm4: "21.71.10.1001", lat: 3.9457, lon: 108.1429 },
            { name: "Lampung", adm4: "18.71.14.1001", lat: -4.5586, lon: 105.4068 },
            { name: "Maluku", adm4: "81.71.04.2001", lat: -3.2385, lon: 130.1453 },
            { name: "Maluku Utara", adm4: "82.71.02.1001", lat: 1.5700, lon: 127.8088 },
            { name: "Nusa Tenggara Barat", adm4: "52.01.01.1001", lat: -8.6529, lon: 117.3616 },
            { name: "Nusa Tenggara Timur", adm4: "53.71.01.1001", lat: -8.6574, lon: 121.0794 },
            { name: "Papua", adm4: "91.71.01.1001", lat: -4.2699, lon: 138.0804 },
            { name: "Papua Barat", adm4: "92.71.01.1001", lat: -1.3361, lon: 133.1747 },
            { name: "Riau", adm4: "14.71.01.1001", lat: 0.2933, lon: 101.7068 },
            { name: "Sulawesi Barat", adm4: "76.04.01.1001", lat: -2.8440, lon: 119.2321 },
            { name: "Sulawesi Selatan", adm4: "73.04.01.1001", lat: -3.6688, lon: 119.9741 },
            { name: "Sulawesi Tengah", adm4: "72.71.02.1002", lat: -1.4300, lon: 121.4453 },
            { name: "Sulawesi Tenggara", adm4: "74.01.01.1001", lat: -4.1449, lon: 122.1746 },
            { name: "Sulawesi Utara", adm4: "71.71.01.1001", lat: 1.4931, lon: 124.8413 },
            { name: "Sumatera Barat", adm4: "13.71.01.1001", lat: -0.7399, lon: 100.8000 },
            { name: "Sumatera Selatan", adm4: "16.71.01.1001", lat: -3.3199, lon: 103.9146 },
            { name: "Sumatera Utara", adm4: "12.01.01.1001", lat: 2.1154, lon: 99.5451 }
        ];

        let quakes = [], logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        let currentWeatherData = null, currentEarthquakeData = null, currentLocation = '';
        let currentLat = -7.098191543, currentLon = 107.0186981657; // Default to Desa Cisujen, Kec. Takokak, Kab. Cianjur

        const getColor = m => m >= 5 ? '#ef4444' : m >= 4 ? '#f97316' : m >= 3 ? '#eab308' : '#22c55e';

        // Weather Icon Mapping
        const weatherIcons = {
            'Cerah': '☀️', 'Cerah Berawan': '🌤️', 'Berawan': '☁️', 'Berawan Tebal': '🌥️',
            'Hujan Ringan': '🌦️', 'Hujan Sedang': '🌧️', 'Hujan Lebat': '⛈️', 'Hujan Petir': '🌩️',
            'Kabut': '🌫️', 'Asap': '🌫️', 'Udara Kabur': '🌫️'
        };

        // Theme Toggle
        document.getElementById('toggle-theme').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });
        if (localStorage.getItem('theme') === 'light') document.documentElement.classList.remove('dark');

        // Notification
        function showNotification(message, type = 'error') {
            const notif = document.getElementById('notification');
            notif.textContent = message;
            notif.className = `hidden fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg notification z-50`;
            notif.classList.add(type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500');
            notif.classList.remove('hidden');
            setTimeout(() => notif.classList.add('hidden'), 5000);
        }

        // Geolocation
        document.getElementById('locate-me').addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        const { latitude, longitude } = pos.coords;
                        if (mapLoaded) {
                            map.setView([latitude, longitude], 10);
                            L.marker([latitude, longitude], {
                                icon: L.divIcon({ className: 'location-marker', html: '📍', iconSize: [30, 30] })
                            }).addTo(map).bindPopup('Lokasi Anda').openPopup();
                        }
                        currentLat = latitude;
                        currentLon = longitude;
                        fetchAQI(latitude, longitude);
                        showNotification('Lokasi Anda ditemukan', 'success');
                    },
                    () => showNotification('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.')
                );
            } else {
                showNotification('Geolocation tidak didukung di browser Anda.');
            }
        });

        // Update Mini Weather Widget
        function updateMiniWeatherWidget() {
            const widget = document.getElementById('mini-weather-widget');
            if (currentWeatherData && currentLocation) {
                const currentWeather = currentWeatherData[0];
                widget.innerHTML = `
                    <span class="text-lg">${weatherIcons[currentWeather.weather] || '❓'}</span>
                    <span>${currentLocation}: ${currentWeather.weather}, ${currentWeather.temp}, ${currentWeather.humidity}</span>
                `;
                widget.classList.remove('hidden');
            } else {
                widget.classList.add('hidden');
            }
        }

        // Fetch AQI Data
        async function fetchAQI(lat, lon) {
            const aqiDiv = document.getElementById('aqi-data');
            try {
                const response = await fetch(`${APIs.aqi}?lat=${lat}&lon=${lon}&appid=${AQI_API_KEY}`);
                if (!response.ok) throw new Error(`Gagal fetch AQI: ${response.statusText}`);
                const data = await response.json();
                const aqi = data.list[0].main.aqi;
                const aqiLevel = getAQILevel(aqi);
                const aqiRecommendation = getAQIRecommendation(aqi);

                // Ensure DOM is ready before updating
                setTimeout(() => {
                    aqiDiv.innerHTML = `
                        <h3 class="text-lg font-medium mb-2">Kualitas Udara</h3>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-medium">AQI: ${aqi}</span>
                            <span class="${aqiLevel.color} px-2 py-1 rounded-full text-xs font-bold">${aqiLevel.text}</span>
                        </div>
                        <div class="aqi-meter mb-2"></div>
                        <p class="text-sm">${aqiRecommendation}</p>
                    `;
                }, 100); // Small delay to ensure DOM is ready
                logActivity('Pencarian', `Mengambil data AQI untuk koordinat ${lat}, ${lon}`);
            } catch (e) {
                console.error('AQI fetch error:', e);
                aqiDiv.innerHTML = `<p class="text-center text-gray-500 py-2">Data AQI tidak tersedia: ${e.message}</p>`;
            }
        }

        function getAQILevel(aqi) {
            if (aqi <= 50) return { text: 'Baik', color: 'text-green-500' };
            if (aqi <= 100) return { text: 'Sedang', color: 'text-yellow-500' };
            if (aqi <= 150) return { text: 'Tidak Sehat', color: 'text-orange-500' };
            return { text: 'Berbahaya', color: 'text-red-500' };
        }

        function getAQIRecommendation(aqi) {
            if (aqi <= 50) return 'Kualitas udara baik, cocok untuk aktivitas luar ruangan.';
            if (aqi <= 100) return 'Kualitas udara sedang, gunakan masker jika sensitif.';
            if (aqi <= 150) return 'Kualitas udara tidak sehat, hindari aktivitas outdoor lama.';
            return 'Kualitas udara berbahaya, tetap di dalam ruangan dan gunakan masker.';
        }

        // Weather Fetch
        async function fetchWeather(search = '') {
            const weatherDiv = document.getElementById('weather-data');
            const loading = document.getElementById('weather-loading');
            const chartCanvas = document.getElementById('weather-chart').getContext('2d');
            let weatherChart = Chart.getChart(chartCanvas) || null;
            const weatherSection = document.getElementById('weather-section');

            try {
                loading.classList.remove('hidden');
                weatherDiv.innerHTML = '';
                weatherSection.className = 'mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 fade-in weather-bg';

                const province = provinces.find(p => p.name.toLowerCase().includes(search.toLowerCase()));
                if (!province) throw new Error('Wilayah tidak ditemukan');

                const response = await fetch(`${APIs.weather.replace('adm4=32.03.16.2007', `adm4=${province.adm4}`)}`);
                if (!response.ok) throw new Error(`Gagal mengambil data cuaca: ${response.statusText}`);

                const data = await response.json();
                console.log('API Response for', province.name, ':', data); // Debugging: Lihat struktur data

                if (!data || !data.lokasi || !data.data) throw new Error('Data cuaca tidak valid');

                const dailyForecasts = data.data[0]?.cuaca;
                if (!dailyForecasts || !Array.isArray(dailyForecasts) || dailyForecasts.length === 0) {
                    throw new Error(`Data prakiraan cuaca tidak ditemukan atau kosong untuk ${province.name}`);
                }

                // Ambil 3 hari pertama dari array dua dimensi
                const forecasts = [];
                for (let i = 0; i < Math.min(3, dailyForecasts.length); i++) {
                    const dayForecasts = dailyForecasts[i]; // Array prakiraan untuk satu hari
                    if (!Array.isArray(dayForecasts) || dayForecasts.length === 0) continue;

                    const firstPrakiraan = dayForecasts[0]; // Ambil prakiraan pertama untuk hari itu
                    console.log('First Prakiraan for day', i + 1, ':', firstPrakiraan); // Debugging

                    const date = firstPrakiraan.local_datetime.split(' ')[0]; // Ambil tanggal (YYYY-MM-DD)
                    const weatherDesc = firstPrakiraan.weather_desc || 'Tidak diketahui';
                    const temp = firstPrakiraan.t !== undefined ? `${firstPrakiraan.t}°C` : 'N/A';
                    const humidity = firstPrakiraan.hu !== undefined ? `${firstPrakiraan.hu}%` : 'N/A';
                    const windSpeed = firstPrakiraan.ws !== undefined ? `${firstPrakiraan.ws} km/j` : 'N/A';
                    const windDir = firstPrakiraan.wd || 'N/A';
                    const visibility = firstPrakiraan.vs_text || 'N/A';

                    forecasts.push({
                        date,
                        weather: weatherDesc,
                        temp,
                        humidity,
                        windSpeed,
                        windDir,
                        visibility
                    });
                }

                if (forecasts.length === 0) throw new Error('Data cuaca tidak ditemukan untuk wilayah ini');

                currentWeatherData = forecasts;
                currentLocation = province.name;
                currentLat = province.lat;
                currentLon = province.lon;

                // Tampilkan prakiraan cuaca dalam kartu
                weatherDiv.innerHTML = forecasts.map((f, i) => `
                    <div class="card bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-md">
                        <h3 class="text-lg font-medium mb-2">${new Date(f.date).toLocaleDateString('id-ID')}</h3>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-2xl">${weatherIcons[f.weather] || '❓'}</span>
                            <span>${f.weather}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                <p class="text-xs text-gray-500 dark:text-gray-300">Suhu</p>
                                <p class="font-medium">${f.temp}</p>
                            </div>
                            <div class="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                <p class="text-xs text-gray-500 dark:text-gray-300">Kelembapan</p>
                                <p class="font-medium">${f.humidity}</p>
                            </div>
                            <div class="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                <p class="text-xs text-gray-500 dark:text-gray-300">Kecepatan Angin</p>
                                <p class="font-medium">${f.windSpeed}</p>
                            </div>
                            <div class="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                <p class="text-xs text-gray-500 dark:text-gray-300">Arah Angin</p>
                                <p class="font-medium">${f.windDir}</p>
                            </div>
                            <div class="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                <p class="text-xs text-gray-500 dark:text-gray-300">Jarak Pandang</p>
                                <p class="font-medium">${f.visibility}</p>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Perbarui chart suhu
                if (weatherChart) weatherChart.destroy();
                document.getElementById('weather-chart').style.display = 'block';
                weatherChart = new Chart(chartCanvas, {
                    type: 'line',
                    data: {
                        labels: forecasts.map(f => new Date(f.date).toLocaleDateString('id-ID')),
                        datasets: [{
                            label: 'Suhu (°C)',
                            data: forecasts.map(f => parseFloat(f.temp.replace('°C', '')) || 0),
                            backgroundColor: 'rgba(99, 102, 241, 0.7)',
                            borderColor: 'rgba(99, 102, 241, 1)',
                            borderWidth: 1,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
                            x: { grid: { display: false } }
                        },
                        plugins: {
                            legend: { position: 'top', labels: { boxWidth: 12 } },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        maintainAspectRatio: false
                    }
                });

                const currentWeather = forecasts[0].weather.toLowerCase();
                if (currentWeather.includes('hujan')) {
                    weatherSection.classList.add('rain');
                } else if (currentWeather.includes('cerah')) {
                    weatherSection.classList.add('sunny');
                }

                document.getElementById('weather-time').textContent = `Terakhir diperbarui: ${new Date().toLocaleTimeString()}`;
                logActivity('Pencarian', `Mencari cuaca untuk ${search}`);
                updateWhatsAppButton();
                updateMiniWeatherWidget();
                fetchAQI(province.lat, province.lon);

            } catch (e) {
                console.error('Weather fetch error:', e);
                showNotification('Gagal memuat data cuaca. Silakan coba lagi nanti.');
                weatherDiv.innerHTML = '<p class="text-center text-gray-500 col-span-3 py-4">Tidak ada data cuaca tersedia.</p>';
                if (weatherChart) weatherChart.destroy();
                document.getElementById('weather-chart').style.display = 'none';
            } finally {
                loading.classList.add('hidden');
            }
        }
        
        // Earthquake Fetch
        async function fetchQuakes(date = new Date().toISOString().split('T')[0]) {
            const quakeList = document.getElementById('earthquake-list');
            const loading = document.getElementById('quake-loading');
            const apiUrl = date === new Date().toISOString().split('T')[0] ? APIs.earthquake : APIs.historicalQuake;

            try {
                loading.classList.remove('hidden');
                quakeList.innerHTML = '';

                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Gagal mengambil data gempa');

                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');

                const earthquakes = xmlDoc.getElementsByTagName('gempa');
                if (!earthquakes.length) throw new Error('Data gempa tidak ditemukan');

                quakes = [];
                for (let earthquake of earthquakes) {
                    const data = {
                        tanggal: earthquake.getElementsByTagName('Tanggal')[0]?.textContent || 'Tidak tersedia',
                        jam: earthquake.getElementsByTagName('Jam')[0]?.textContent || 'Tidak tersedia',
                        lintang: earthquake.getElementsByTagName('Lintang')[0]?.textContent || '0',
                        bujur: earthquake.getElementsByTagName('Bujur')[0]?.textContent || '0',
                        wilayah: earthquake.getElementsByTagName('Wilayah')[0]?.textContent || 'Tidak tersedia',
                        magnitude: earthquake.getElementsByTagName('Magnitude')[0]?.textContent || '0',
                        kedalaman: earthquake.getElementsByTagName('Kedalaman')[0]?.textContent || 'Tidak tersedia',
                        potensi: earthquake.getElementsByTagName('Potensi')[0]?.textContent || 'Tidak tersedia'
                    };
                    quakes.push(data);

                    if (+data.magnitude >= 5.0 && date === new Date().toISOString().split('T')[0]) {
                        const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
                        audio.play().catch(() => console.log('Audio playback failed'));
                        showNotification(`Peringatan: Gempa ${data.magnitude} SR di ${data.wilayah}!`, 'error');
                    }
                }

                currentEarthquakeData = quakes[0];
                updateQuakes();
                logActivity('Pencarian', `Mencari data gempa untuk tanggal ${date}`);
                document.getElementById('quake-time').textContent = `Terakhir diperbarui: ${new Date().toLocaleTimeString()}`;
                updateWhatsAppButton();

            } catch (e) {
                console.error('Quake fetch error:', e);
                showNotification('Gagal memuat data gempa. Silakan coba lagi nanti.');
                quakeList.innerHTML = '<p class="text-center text-gray-500 py-4">Tidak ada data gempa tersedia.</p>';
            } finally {
                loading.classList.add('hidden');
            }
        }

        // Update Quakes
        function updateQuakes() {
            const minMag = +document.getElementById('magnitude-filter').value;
            const filteredQuakes = quakes.filter(q => minMag === 0 || +q.magnitude >= minMag);
            const quakeList = document.getElementById('earthquake-list');
            quakeList.innerHTML = '';
            if (mapLoaded) {
                map.eachLayer(l => (l instanceof L.Marker || l instanceof L.CircleMarker) && map.removeLayer(l));
            }

            document.getElementById('quake-count').textContent = filteredQuakes.length;
            const strongest = quakes.reduce((max, q) => Math.max(max, +q.magnitude), 0);
            document.getElementById('quake-strongest').textContent = strongest > 0 ? `${strongest} SR` : '-';

            filteredQuakes.forEach(q => {
                const mag = +q.magnitude;
                const color = getColor(mag);

                quakeList.innerHTML += `
                    <div class="card bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-md">
                        <div class="flex justify-between items-start">
                            <h3 class="text-lg font-medium">${q.wilayah}</h3>
                            <span class="px-2 py-1 rounded-full text-xs font-bold" style="background-color: ${color}20; color: ${color}">
                                ${mag} SR
                            </span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-300">Kedalaman</p>
                                <p>${q.kedalaman}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-300">Waktu</p>
                                <p>${q.tanggal} ${q.jam}</p>
                            </div>
                        </div>
                        <div class="mt-2">
                            <p class="text-xs text-gray-500 dark:text-gray-300">Lokasi</p>
                            <p>${q.lintang}, ${q.bujur}</p>
                        </div>
                        <div class="mt-2">
                            <p class="text-xs text-gray-500 dark:text-gray-300">Potensi</p>
                            <p class="${q.potensi.includes('tidak berpotensi') ? 'text-green-500' : 'text-red-500'}">
                                ${q.potensi}
                            </p>
                        </div>
                    </div>
                `;

                const lat = parseFloat(q.lintang);
                const lon = parseFloat(q.bujur);
                if (mapLoaded && lat && lon) {
                    L.circleMarker([lat, lon], {
                        radius: Math.min(mag * 2, 15),
                        color: color,
                        fillColor: color,
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.7
                    }).addTo(map).bindPopup(`
                        <b>${q.wilayah}</b><br>
                        Magnitudo: ${mag} SR<br>
                        Kedalaman: ${q.kedalaman}<br>
                        Waktu: ${q.tanggal} ${q.jam}<br>
                        Potensi: ${q.potensi}
                    `);
                }
            });
        }

        // Log Activity
        function logActivity(type, details) {
            const timestamp = new Date().toLocaleString('id-ID');
            logs.push({ type, details, timestamp });
            localStorage.setItem('activityLogs', JSON.stringify(logs));
            updateLogs();
        }

        // Update Logs
        function updateLogs() {
            const logList = document.getElementById('log-list');
            logList.innerHTML = logs.map(log => `
                <div class="card bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-md">
                    <p class="text-sm">[${log.timestamp}] ${log.type}: ${log.details}</p>
                </div>
            `).join('') || '<p class="text-center text-gray-500 py-4">Belum ada aktivitas.</p>';
        }

        // WhatsApp Notification
        function updateWhatsAppButton() {
            const whatsappBtn = document.getElementById('whatsapp-btn');
            if (currentWeatherData && currentEarthquakeData && currentLocation) {
                whatsappBtn.classList.remove('hidden');
                whatsappBtn.onclick = () => {
                    let message = `*Prakiraan Cuaca & Gempa untuk ${currentLocation}*\n\n`;
                    message += `*Cuaca 3 Hari Ke Depan:*\n`;
                    currentWeatherData.forEach(forecast => {
                        message += `${new Date(forecast.date).toLocaleDateString('id-ID')}\n`;
                        message += `Cuaca: ${forecast.weather}\n`;
                        message += `Suhu: ${forecast.temp} °C\n`;
                        message += `Kelembapan: ${forecast.humidity}%\n`;
                        message += `Kecepatan Angin: ${forecast.windSpeed} km/j\n`;
                        message += `Arah Angin: ${forecast.windDir}\n`;
                        message += `Jarak Pandang: ${forecast.visibility}\n\n`;
                    });
                    message += `*Gempa Terkini:*\n`;
                    message += `Tanggal: ${currentEarthquakeData.tanggal} ${currentEarthquakeData.jam}\n`;
                    message += `Lokasi: ${currentEarthquakeData.lintang}, ${currentEarthquakeData.bujur} - ${currentEarthquakeData.wilayah}\n`;
                    message += `Magnitudo: ${currentEarthquakeData.magnitude}\n`;
                    message += `Kedalaman: ${currentEarthquakeData.kedalaman}\n`;
                    message += `Potensi: ${currentEarthquakeData.potensi}\n`;
                    const encodedMessage = encodeURIComponent(message);
                    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                    window.open(whatsappUrl, '_blank');
                    logActivity('Notifikasi', `Mengirim notifikasi WhatsApp untuk ${currentLocation}`);
                };
            } else {
                whatsappBtn.classList.add('hidden');
            }
        }

        // Event Listeners
        document.getElementById('clear-log').addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus semua log?')) {
                logs = [];
                localStorage.removeItem('activityLogs');
                updateLogs();
                showNotification('Log telah dihapus', 'success');
            }
        });

        document.getElementById('magnitude-filter').addEventListener('change', updateQuakes);

        document.getElementById('quake-date').addEventListener('change', (e) => {
            fetchQuakes(e.target.value);
        });

        document.getElementById('city-search').addEventListener('keypress', e => {
            if (e.key === 'Enter') fetchWeather(e.target.value);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            fetchWeather(document.getElementById('city-search').value);
        });

        document.getElementById('refresh-data').addEventListener('click', () => {
            fetchWeather(currentLocation);
            fetchQuakes(document.getElementById('quake-date').value);
            if (currentLat && currentLon) fetchAQI(currentLat, currentLon);
            showNotification('Data diperbarui', 'success');
        });

        // Auto Update
        function startAutoUpdate() {
            setInterval(() => {
                if (document.visibilityState === 'visible' && currentLocation) {
                    fetchWeather(currentLocation);
                    fetchQuakes(document.getElementById('quake-date').value);
                    if (currentLat && currentLon) fetchAQI(currentLat, currentLon);
                    showNotification('Data diperbarui otomatis', 'success');
                }
            }, 10800000); // Update setiap 3 jam (10800000 ms)
        }

        // Initial Fetch (Default to Desa Cisujen, Kec. Takokak, Kab. Cianjur)
        document.addEventListener('DOMContentLoaded', () => {
            fetchQuakes();
            fetchWeather('Desa Cisujen, Kec. Takokak, Kab. Cianjur'); // Default to Cisujen, Kab. Cianjur
            // Retry AQI fetch if it fails initially
            async function tryFetchAQI() {
                try {
                    await fetchAQI(-7.098191543, 107.0186981657); // Default AQI for Desa Cisujen, Kec. Takokak, Kab. Cianjur
                } catch (e) {
                    console.error('Initial AQI fetch failed, retrying in 5 seconds:', e);
                    setTimeout(tryFetchAQI, 5000); // Retry after 5 seconds
                }
            }
            tryFetchAQI();
            updateLogs();
            startAutoUpdate();
            document.getElementById('weather-time').textContent = `Memuat data cuaca...`;
            document.getElementById('quake-time').textContent = `Memuat data gempa...`;
        });