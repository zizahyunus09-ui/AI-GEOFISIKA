
"use strict";

// Nama file CSV harus sama dengan nama file di folder proyek.
const CSV_FILE = "./Data_Cuaca_Makassar_Simulasi.csv";

// Kolom numerik yang akan diubah menjadi angka.
const NUMERIC_COLUMNS = [
  "Latitude_demo",
  "Longitude_demo",
  "Suhu_C",
  "Kelembapan_pct",
  "Kecepatan_Angin_kmh",
  "Tutupan_Awan_pct",
  "Jarak_Pandang_km",
  "Curah_Hujan_mm"
];

const $ = (id) => document.getElementById(id);

let weatherData = [];
let trendChart = null;
let conditionChart = null;
let windRainChart = null;
let weatherMap = null;
let mapMarkers = [];

// Mengubah angka ke format Indonesia.
function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

// Menghitung rata-rata.
function average(rows, column) {
  if (rows.length === 0) return 0;

  const total = rows.reduce(
    (sum, row) => sum + Number(row[column] || 0),
    0
  );

  return total / rows.length;
}

// Menghitung jumlah data berdasarkan kategori.
function countBy(rows, column) {
  const counts = {};

  rows.forEach((row) => {
    const category = row[column] || "Tidak diketahui";
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
}

// Mengambil tanggal dari kolom waktu.
function getDate(datetime) {
  return String(datetime).slice(0, 10);
}

// Mengambil jam dan menit.
function getTime(datetime) {
  return String(datetime).slice(11, 16);
}

// Mengubah format tanggal menjadi DD/MM/YYYY.
function formatDate(date) {
  const parts = date.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Mengisi pilihan kecamatan dan tanggal dari CSV.
function populateFilters() {
  const districts = [
    ...new Set(weatherData.map((row) => row.Kecamatan))
  ].sort((a, b) => a.localeCompare(b, "id"));

  const dates = [
    ...new Set(weatherData.map((row) => getDate(row.Waktu_Prakiraan)))
  ].sort();

  const districtSelect = $("districtFilter");
  const dateSelect = $("dateFilter");

  districts.forEach((district) => {
    districtSelect.add(new Option(district, district));
  });

  dates.forEach((date) => {
    dateSelect.add(new Option(formatDate(date), date));
  });
}

// Memilih data sesuai filter yang aktif.
function getFilteredData() {
  const district = $("districtFilter").value;
  const date = $("dateFilter").value;
  const period = $("periodFilter").value;

  return weatherData
    .filter((row) => {
      if (district !== "all" && row.Kecamatan !== district) {
        return false;
      }

      if (date !== "all" && getDate(row.Waktu_Prakiraan) !== date) {
        return false;
      }

      const hour = Number(getTime(row.Waktu_Prakiraan).slice(0, 2));

      if (period === "dini" && !(hour >= 0 && hour <= 5)) {
        return false;
      }

      if (period === "pagi" && !(hour >= 6 && hour <= 11)) {
        return false;
      }

      if (period === "siang" && !(hour >= 12 && hour <= 17)) {
        return false;
      }

      if (period === "malam" && !(hour >= 18 && hour <= 23)) {
        return false;
      }

      return true;
    })
    .sort((a, b) =>
      a.Waktu_Prakiraan.localeCompare(b.Waktu_Prakiraan)
    );
}

// Menghitung rata-rata variabel untuk setiap waktu prakiraan.
function groupByTime(rows, column) {
  const groups = {};

  rows.forEach((row) => {
    const time = getTime(row.Waktu_Prakiraan);

    if (!groups[time]) {
      groups[time] = [];
    }

    groups[time].push(Number(row[column] || 0));
  });

  return Object.keys(groups)
    .sort()
    .map((time) => {
      const values = groups[time];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        time,
        value: Number(mean.toFixed(2))
      };
    });
}

// Pengaturan umum grafik Chart.js.
function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index"
    },
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: "#765d69",
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: "#49333e",
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#8d7883" },
        border: { display: false }
      },
      y: {
        beginAtZero: false,
        grid: { color: "#f2e6ec" },
        ticks: { color: "#8d7883" },
        border: { display: false }
      }
    }
  };
}

// Memperbarui empat kartu statistik.
function updateStatistics(rows) {
  if (rows.length === 0) {
    $("avgTemp").textContent = "—";
    $("avgHumidity").textContent = "—";
    $("avgWind").textContent = "—";
    $("avgRain").textContent = "—";
    $("tempRange").textContent = "Tidak ada data";
    $("windMax").textContent = "Tidak ada data";
    $("rainTotal").textContent = "Tidak ada data";
    $("heroTemp").textContent = "— °C";
    $("heroCondition").textContent = "Tidak ada data";
    return;
  }

  const temperature = average(rows, "Suhu_C");
  const humidity = average(rows, "Kelembapan_pct");
  const wind = average(rows, "Kecepatan_Angin_kmh");
  const rain = average(rows, "Curah_Hujan_mm");

  const minTemp = Math.min(...rows.map((row) => row.Suhu_C));
  const maxTemp = Math.max(...rows.map((row) => row.Suhu_C));
  const maxWind = Math.max(...rows.map((row) => row.Kecepatan_Angin_kmh));
  const totalRain = rows.reduce(
    (sum, row) => sum + Number(row.Curah_Hujan_mm || 0),
    0
  );

  $("avgTemp").textContent = `${formatNumber(temperature)} °C`;
  $("avgHumidity").textContent = `${formatNumber(humidity, 0)}%`;
  $("avgWind").textContent = `${formatNumber(wind)} km/j`;
  $("avgRain").textContent = `${formatNumber(rain)} mm`;

  $("tempRange").textContent =
    `Min ${formatNumber(minTemp)}° / Maks ${formatNumber(maxTemp)}°`;

  $("windMax").textContent =
    `Maksimum ${formatNumber(maxWind)} km/j`;

  $("rainTotal").textContent =
    `Total sampel ${formatNumber(totalRain)} mm`;

  $("heroTemp").textContent = `${formatNumber(temperature)} °C`;

  const conditions = countBy(rows, "Kondisi_Cuaca");
  const mostCommon = Object.keys(conditions).sort(
    (a, b) => conditions[b] - conditions[a]
  )[0];

  $("heroCondition").textContent = mostCommon || "Tidak diketahui";
}

// Membuat ulang grafik tren.
function updateTrendChart(rows) {
  const variable = $("variableFilter").value;

  const variableInfo = {
    Suhu_C: { label: "Suhu (°C)", title: "Tren suhu berdasarkan waktu" },
    Kelembapan_pct: {
      label: "Kelembapan (%)",
      title: "Tren kelembapan berdasarkan waktu"
    },
    Kecepatan_Angin_kmh: {
      label: "Angin (km/jam)",
      title: "Tren kecepatan angin berdasarkan waktu"
    },
    Curah_Hujan_mm: {
      label: "Curah hujan (mm)",
      title: "Tren curah hujan berdasarkan waktu"
    }
  };

  const grouped = groupByTime(rows, variable);
  $("trendTitle").textContent = variableInfo[variable].title;

  if (trendChart) trendChart.destroy();

  trendChart = new Chart($("trendChart"), {
    type: "line",
    data: {
      labels: grouped.map((item) => item.time),
      datasets: [{
        label: variableInfo[variable].label,
        data: grouped.map((item) => item.value),
        borderColor: "#c97698",
        backgroundColor: "rgba(232, 161, 187, 0.22)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2
      }]
    },
    options: chartOptions()
  });
}

// Membuat grafik komposisi kondisi cuaca.
function updateConditionChart(rows) {
  const conditions = countBy(rows, "Kondisi_Cuaca");
  const colors = [
    "#d98eac", "#c7b8ee", "#a7d9c3",
    "#f2c7a9", "#e9b5c8", "#b4cbe9", "#e8dca2"
  ];

  if (conditionChart) conditionChart.destroy();

  conditionChart = new Chart($("conditionChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(conditions),
      datasets: [{
        data: Object.values(conditions),
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 13,
            color: "#765d69",
            font: { size: 10 }
          }
        }
      }
    }
  });
}

// Membandingkan kecepatan angin dan curah hujan.
function updateWindRainChart(rows) {
  const wind = groupByTime(rows, "Kecepatan_Angin_kmh");
  const rain = groupByTime(rows, "Curah_Hujan_mm");

  const times = [
    ...new Set([
      ...wind.map((item) => item.time),
      ...rain.map((item) => item.time)
    ])
  ].sort();

  const getValue = (groups, time) => {
    const item = groups.find((group) => group.time === time);
    return item ? item.value : 0;
  };

  if (windRainChart) windRainChart.destroy();

  windRainChart = new Chart($("windRainChart"), {
    type: "bar",
    data: {
      labels: times,
      datasets: [
        {
          label: "Angin (km/jam)",
          data: times.map((time) => getValue(wind, time)),
          backgroundColor: "#cbb9ef",
          borderRadius: 5,
          yAxisID: "y"
        },
        {
          label: "Curah hujan (mm)",
          data: times.map((time) => getValue(rain, time)),
          backgroundColor: "#e9a7c1",
          borderRadius: 5,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        x: chartOptions().scales.x,
        y: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          title: { display: true, text: "Angin (km/jam)" },
          grid: { color: "#f2e6ec" }
        },
        y1: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          title: { display: true, text: "Hujan (mm)" },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// Membuat ringkasan rata-rata per kecamatan.
function updateSummaryTable(rows) {
  const groups = {};

  rows.forEach((row) => {
    if (!groups[row.Kecamatan]) groups[row.Kecamatan] = [];
    groups[row.Kecamatan].push(row);
  });

  const districts = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b, "id")
  );

  $("summaryTable").innerHTML = districts.map((district) => {
    const data = groups[district];

    return `
      <tr>
        <td><strong>${district}</strong></td>
        <td>${formatNumber(average(data, "Suhu_C"))} °C</td>
        <td>${formatNumber(average(data, "Kelembapan_pct"), 0)}%</td>
        <td>${formatNumber(average(data, "Kecepatan_Angin_kmh"))} km/j</td>
        <td>${formatNumber(average(data, "Curah_Hujan_mm"))} mm</td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="5">Tidak ada data</td></tr>';
}

// Menampilkan data rincian; maksimal 100 baris agar halaman tetap ringan.
function updateDetailTable(rows) {
  const displayedRows = rows.slice(0, 100);

  $("detailTable").innerHTML = displayedRows.map((row) => `
    <tr>
      <td>${formatDate(getDate(row.Waktu_Prakiraan))} ${getTime(row.Waktu_Prakiraan)}</td>
      <td>${row.Kecamatan}</td>
      <td><span class="weather-badge">${row.Kondisi_Cuaca}</span></td>
      <td>${formatNumber(row.Suhu_C)} °C</td>
      <td>${formatNumber(row.Kelembapan_pct, 0)}%</td>
      <td>${formatNumber(row.Kecepatan_Angin_kmh)} km/j</td>
      <td>${formatNumber(row.Curah_Hujan_mm)} mm</td>
    </tr>
  `).join("") || '<tr><td colspan="7">Tidak ada data</td></tr>';

  $("rowCount").textContent = `${rows.length} BARIS`;

  $("tableNote").textContent = rows.length > 100
    ? "Ditampilkan 100 baris pertama. Gunakan filter untuk mempersempit data."
    : `Seluruh ${rows.length} baris hasil filter ditampilkan.`;
}

// Membuat peta dasar Leaflet.
function initializeMap() {
  if (!window.L) {
    $("weatherMap").innerHTML =
      "Pustaka peta tidak dapat dimuat. Periksa koneksi internet.";
    return;
  }

  weatherMap = L.map("weatherMap").setView([-5.15, 119.42], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(weatherMap);
}

// Memperbarui penanda peta sesuai data yang dipilih.
function updateMap(rows) {
  if (!weatherMap) return;

  mapMarkers.forEach((marker) => weatherMap.removeLayer(marker));
  mapMarkers = [];

  // Gunakan satu titik contoh untuk setiap kecamatan.
  const districtRows = {};

  rows.forEach((row) => {
    if (!districtRows[row.Kecamatan]) {
      districtRows[row.Kecamatan] = row;
    }
  });

  Object.values(districtRows).forEach((row) => {
    const lat = Number(row.Latitude_demo);
    const lon = Number(row.Longitude_demo);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const marker = L.circleMarker([lat, lon], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#c97698",
      fillOpacity: 0.9
    }).addTo(weatherMap);

    marker.bindPopup(`
      <strong>${row.Kecamatan}</strong><br>
      Suhu: ${formatNumber(row.Suhu_C)} °C<br>
      Kelembapan: ${formatNumber(row.Kelembapan_pct, 0)}%<br>
      Kondisi: ${row.Kondisi_Cuaca}<br>
      <small>Data simulasi; koordinat ilustratif.</small>
    `);

    mapMarkers.push(marker);
  });
}

// Memperbarui semua komponen setelah filter berubah.
function renderDashboard() {
  const rows = getFilteredData();

  $("statusMessage").textContent =
    `Menampilkan ${rows.length} dari ${weatherData.length} baris data simulasi.`;

  updateStatistics(rows);
  updateTrendChart(rows);
  updateConditionChart(rows);
  updateWindRainChart(rows);
  updateSummaryTable(rows);
  updateDetailTable(rows);
  updateMap(rows);
}

// Memuat CSV menggunakan Papa Parse.
function loadCSV() {
  if (!window.Papa) {
    $("statusMessage").textContent =
      "Pustaka pembaca CSV gagal dimuat. Periksa koneksi internet.";
    return;
  }

  Papa.parse(CSV_FILE, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function (results) {
      if (results.errors.length > 0) {
        console.warn("Peringatan saat membaca CSV:", results.errors);
      }

      weatherData = results.data
        .filter((row) => row.Waktu_Prakiraan && row.Kecamatan)
        .map((row) => {
          NUMERIC_COLUMNS.forEach((column) => {
            row[column] = Number(row[column]);
          });

          return row;
        });

      if (weatherData.length === 0) {
        $("statusMessage").textContent =
          "Data kosong. Periksa isi CSV dan lokasi file.";
        return;
      }

      populateFilters();
      renderDashboard();
    },

    error: function (error) {
      console.error(error);
      $("statusMessage").textContent =
        "CSV gagal dibaca. Pastikan file CSV berada satu folder dengan index.html dan gunakan Live Server.";
    }
  });
}

// Menghubungkan filter dengan dashboard.
function setupEvents() {
  ["districtFilter", "dateFilter", "periodFilter", "variableFilter"]
    .forEach((id) => {
      $(id).addEventListener("change", renderDashboard);
    });

  $("resetButton").addEventListener("click", () => {
    $("districtFilter").value = "all";
    $("dateFilter").value = "all";
    $("periodFilter").value = "all";
    $("variableFilter").value = "Suhu_C";

    renderDashboard();
  });
}

// Mulai ketika HTML dan pustaka eksternal sudah siap.
document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  initializeMap();
  loadCSV();
});
