
(function () {
  const GREEN    = '#2E4F3C';
  const GOLD     = '#D0AB3B';
  const RED      = '#c62828';
  const RED_LIGHT= 'rgba(198,40,40,0.18)';
  const GRID_CLR = 'rgba(0,0,0,0.07)';

  async function load() {
    try {
      const res = await fetch('/api/spotprice');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { prices, updated } = await res.json();
      if (!prices || !prices.length) throw new Error('Keine Preisdaten');

      // KPI-Stats
      const valid   = prices.filter(p => p.priceCtKwh !== null);
      const current = valid[valid.length - 1];
      const minP    = valid.reduce((a, b) => b.priceCtKwh < a.priceCtKwh ? b : a);
      const negCount= valid.filter(p => p.negative).length;

      document.getElementById('kvGrid').innerHTML = `
        <div class="sp-stat-item">
          <div class="sp-stat-number"${current.negative ? ' style="color:#c62828"' : ''}>${fmt(current.priceCtKwh)} ct</div>
          <div class="sp-stat-label">Aktuell (${current.label}&nbsp;Uhr)</div>
        </div>
        <div class="sp-stat-item">
          <div class="sp-stat-number"${minP.negative ? ' style="color:#c62828"' : ''}>${fmt(minP.priceCtKwh)} ct</div>
          <div class="sp-stat-label">Tagesminimum (${minP.label}&nbsp;Uhr)</div>
        </div>
        <div class="sp-stat-item">
          <div class="sp-stat-number"${negCount > 0 ? ' style="color:#c62828"' : ''}>${negCount}</div>
          <div class="sp-stat-label">Negative Preisstunden heute</div>
        </div>`;

      const upd = new Date(updated);
      document.getElementById('updateLabel').textContent =
        'Stand: ' + upd.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · stündlich aktualisiert';

      // Chart
      const labels  = prices.map(p => p.label);
      const data    = prices.map(p => p.priceCtKwh);
      const bgColors= prices.map(p => p.negative ? RED_LIGHT : 'rgba(46,79,60,0.15)');
      const bdColors= prices.map(p => p.negative ? RED : GREEN);

      new Chart(document.getElementById('spotChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'ct/kWh', data, backgroundColor: bgColors, borderColor: bdColors, borderWidth: 1.5, borderRadius: 2 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => fmt(c.parsed.y) + ' ct/kWh' + (c.parsed.y < 0 ? ' (negativ – §51 EEG)' : '') } }
          },
          scales: {
            x: { grid: { color: GRID_CLR }, ticks: { maxTicksLimit: 12, font: { size: 11 }, color: '#6b7280' } },
            y: {
              grid: { color: GRID_CLR },
              ticks: { font: { size: 11 }, color: '#6b7280', callback: v => v + ' ct' },
              afterDataLimits(s) { const p = (s.max - s.min) * 0.08 || 2; s.min -= p; s.max += p; }
            }
          }
        },
        plugins: [{
          id: 'zeroline',
          afterDraw(chart) {
            const { ctx: c, scales: { x, y } } = chart;
            const z = y.getPixelForValue(0);
            c.save(); c.strokeStyle = GOLD; c.lineWidth = 2; c.setLineDash([4, 3]);
            c.beginPath(); c.moveTo(x.left, z); c.lineTo(x.right, z); c.stroke(); c.restore();
          }
        }]
      });

    } catch (err) {
      console.error('Spotpreis:', err);
      document.getElementById('spotChart').style.display = 'none';
      document.getElementById('kvGrid').style.display = 'none';
      document.getElementById('fallback').style.display = 'block';
    }
  }

  function fmt(v) {
    return (v >= 0 ? '' : '−') + new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
  }

  load();
})();
