export function bindInteractiveWidgets() {
      const zSlider = document.getElementById('stereo-z-slider');
      const bSlider = document.getElementById('stereo-b-slider');
      if (!zSlider || !bSlider) return;

      const zValEl = document.getElementById('stereo-z-val');
      const bValEl = document.getElementById('stereo-b-val');
      const errValEl = document.getElementById('stereo-err-val');
      const verdictEl = document.getElementById('stereo-verdict');

      function updateStereoMath() {
        const Z = parseFloat(zSlider.value); // meters
        const B_cm = parseFloat(bSlider.value); // cm
        const B = B_cm / 100.0; // meters
        const f = 800; // focal length in px
        const deltaD = 0.5; // disparity noise in px

        // ΔZ = (Z^2 / (B * f)) * Δd (in meters)
        const deltaZ_m = ((Z * Z) / (B * f)) * deltaD;
        const deltaZ_cm = deltaZ_m * 100;

        zValEl.textContent = `${Z.toFixed(1)} m`;
        bValEl.textContent = `${B_cm} cm`;

        if (deltaZ_cm < 100) {
          errValEl.textContent = `± ${deltaZ_cm.toFixed(1)} cm`;
        } else {
          errValEl.textContent = `± ${(deltaZ_cm / 100).toFixed(2)} m`;
        }

        if (deltaZ_cm <= 2.5) {
          verdictEl.className = 'px-2.5 py-1 rounded bg-emerald-600/30 border border-emerald-400 text-emerald-200 text-[11px] font-bold text-right';
          verdictEl.textContent = '示意：估計誤差較小';
        } else if (deltaZ_cm <= 15) {
          verdictEl.className = 'px-2.5 py-1 rounded bg-amber-500/30 border border-amber-400 text-amber-200 text-[11px] font-bold text-right';
          verdictEl.textContent = '示意：估計誤差中等';
        } else {
          verdictEl.className = 'px-2.5 py-1 rounded bg-rose-600/40 border border-rose-400 text-rose-200 text-[11px] font-bold text-right';
          verdictEl.textContent = '示意：估計誤差較大';
        }
      }

      zSlider.addEventListener('input', updateStereoMath);
      bSlider.addEventListener('input', updateStereoMath);
      updateStereoMath();
    }
