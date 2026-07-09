  const labels = ['4/24/2026', '4/25/2026', '4/26/2026', '4/27/2026', '4/28/2026', '4/29/2026'];
  const sales  = [6907, 6166, 6857, 9030, 8554, 7757];
  const aov    = [50.05, 48.17, 39.86, 45.84, 49.74, 41.29];

  const gridColor = '#e5e7eb';
  const tickColor = '#8a8f98';
  const textColor = '#1f2430';

  new Chart(document.getElementById('salesChart'), {
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Total sales',
          data: sales,
          backgroundColor: '#4a90e2',
          borderRadius: 3,
          barPercentage: 0.55,
          yAxisID: 'y',
          order: 2
        },
        {
          type: 'line',
          label: 'Sum of AOV',
          data: aov,
          borderColor: '#f5a623',
          backgroundColor: '#f5a623',
          pointBackgroundColor: '#f5a623',
          pointBorderColor: '#f5a623',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: function (ctx) {
              if (ctx.dataset.label === 'Total sales') {
                return ' Total sales: ' + ctx.parsed.y.toLocaleString();
              }
              return ' Sum of AOV: ' + ctx.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor, font: { size: 11 } }
        },
        y: {
          position: 'left',
          min: 0,
          max: 10000,
          title: { display: true, text: 'Total sales', color: tickColor, font: { size: 11 } },
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { size: 11 },
            callback: v => v.toLocaleString()
          }
        },
        y1: {
          position: 'right',
          min: 0,
          max: 60,
          title: { display: true, text: 'Sum of AOV', color: tickColor, font: { size: 11 } },
          grid: { display: false },
          ticks: {
            color: tickColor,
            font: { size: 11 },
            callback: v => v.toFixed(2)
          }
        }
      }
    }
  });

  /* ---------- Shared helper: render a custom legend row ---------- */

function renderLegend(containerId, names, colors) {
  const el = document.getElementById(containerId);
  el.innerHTML = names.map((name, i) =>
    '<span class="legend-item"><span class="legend-swatch" style="background:' + colors[i] + '"></span>' + name + '</span>'
  ).join('');
}

/* ---------- Region wise sales (donut) ---------- */

const regionLabels = ['USA', 'UK', 'CA', 'EU', 'AE'];
const regionValues = [27610, 12171, 3044, 1849, 398];
const regionColors = ['#3b6ba5', '#4a90e2', '#7fb2ea', '#a9cbf0', '#cfe1f7'];

renderLegend('regionLegend', regionLabels, regionColors);

new Chart(document.getElementById('regionChart'), {
  type: 'doughnut',
  data: {
    labels: regionLabels,
    datasets: [{
      data: regionValues,
      backgroundColor: regionColors,
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    layout: { padding: 24 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ' ' + ctx.label + ': ' + ctx.parsed.toLocaleString()
        }
      },
      datalabels: {
        color: '#1f2430',
        backgroundColor: '#ffffff',
        borderColor: '#d7dce3',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
        font: { size: 10, weight: '600' },
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const pct = Math.round((value / total) * 100);
          return value.toLocaleString() + ', ' + pct + '%';
        },
        anchor: 'end',
        align: 'end',
        offset: 8
      }
    }
  },
  plugins: [ChartDataLabels]
});

/* ---------- Channel wise sales (donut) ---------- */

const channelLabels = ['Paid', 'Email', 'Affiliate', 'Non-Attributed', 'Organic'];
const channelValues = [27610, 12171, 1849, 1849, 3044];
const channelColors = ['#3b6ba5', '#4a90e2', '#6ba0e8', '#93bced', '#cfe1f7'];

renderLegend('channelLegend', channelLabels, channelColors);

new Chart(document.getElementById('channelChart'), {
  type: 'doughnut',
  data: {
    labels: channelLabels,
    datasets: [{
      data: channelValues,
      backgroundColor: channelColors,
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    layout: { padding: 24 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ' ' + ctx.label + ': ' + ctx.parsed.toLocaleString()
        }
      },
      datalabels: {
        color: '#1f2430',
        backgroundColor: '#ffffff',
        borderColor: '#d7dce3',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
        font: { size: 10, weight: '600' },
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const pct = Math.round((value / total) * 100);
          return value.toLocaleString() + ', ' + pct + '%';
        },
        anchor: 'end',
        align: 'end',
        offset: 8
      }
    }
  },
  plugins: [ChartDataLabels]
});

/* ---------- Sales line chart ---------- */

const salesLineValues = [90.05, 42.17, 65.86, 75.84, 89.74, 91.29];

new Chart(document.getElementById('salesLineChart'), {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: 'Sales',
      data: salesLineValues,
      borderColor: '#f5a623',
      backgroundColor: '#f5a623',
      pointBackgroundColor: '#f5a623',
      pointBorderColor: '#f5a623',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: ctx => ' Sales: ' + ctx.parsed.y.toFixed(2)
        }
      },
      datalabels: {
        align: 'top',
        anchor: 'end',
        color: '#1f2430',
        font: { size: 10, weight: '600' },
        formatter: v => v.toFixed(2)
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 10 } }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: v => v.toFixed(2)
        }
      }
    }
  },
  plugins: [ChartDataLabels]
});

  /* ---------- Reusable single-line chart builder ---------- */

function createLineChart(canvasId, seriesLabel, data, yMax) {
  new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: seriesLabel,
        data: data,
        borderColor: '#f5a623',
        backgroundColor: '#f5a623',
        pointBackgroundColor: '#f5a623',
        pointBorderColor: '#f5a623',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ' ' + seriesLabel + ': ' + ctx.parsed.y.toFixed(2)
          }
        },
        datalabels: {
          align: 'top',
          anchor: 'end',
          color: '#1f2430',
          font: { size: 10, weight: '600' },
          formatter: v => v.toFixed(2)
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor, font: { size: 10 } }
        },
        y: {
          min: 0,
          max: yMax,
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { size: 10 },
            callback: v => v.toFixed(2)
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

/* ---------- Orders / AOV line charts ---------- */

createLineChart('ordersChart', 'Orders', [56.05, 22.17, 55.86, 55.84, 59.74, 51.29], 10000);
createLineChart('aovLineChart', 'AOV', [34.05, 32.17, 35.86, 35.84, 39.74, 31.29], 10000);
