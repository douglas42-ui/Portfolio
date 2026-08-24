
const canvas = document.getElementById('xmbWave');
const ctx = canvas.getContext('2d');

let w, h; 

function viewportSize() {
  if (window.visualViewport) { 
    return { vw: window.visualViewport.width, vh: window.visualViewport.height }; 
  }
  return { vw: window.innerWidth, vh: window.innerHeight };
}

function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2); 
  const { vw, vh } = viewportSize();
  
  w = canvas.width = vw * dpr;
  h = canvas.height = vh * dpr;
  
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);

resizeCanvas();

function envelopeY(x, t, config) {
  const nx = x / w; 
  
  return h * config.yOff
    + Math.sin(nx * Math.PI * 2 * config.freq + t * config.speed + config.phase) * h * config.amp
    + Math.sin(nx * Math.PI * 2 * config.freq * 2.2 - t * config.speed * 1.3 + config.phase) * h * config.amp * 0.3;
}

function lerpColor(c1, c2, mix) {
  const a = c1.split(',').map(Number);
  const b = c2.split(',').map(Number);
  return `${Math.round(a[0] + (b[0]-a[0])*mix)},${Math.round(a[1] + (b[1]-a[1])*mix)},${Math.round(a[2] + (b[2]-a[2])*mix)}`;
}

const TOP = { yOff: 0.40, freq: 0.85, speed: 0.00030, amp: 0.05, phase: 0, color: '35,110,235', alpha: 0.55 };
const BOTTOM = { yOff: 0.63, freq: 0.95, speed: 0.00036, amp: 0.06, phase: 1.3, color: '20,75,180', alpha: 0.42 };

const STRAND_COUNT = 34;
const strands = Array.from({ length: STRAND_COUNT }, (_, j) => {
  const frac = j / (STRAND_COUNT - 1);
  const baseAlpha = 0.07 + 0.12 * Math.sin(frac * Math.PI);
  return {
    frac,
    freqW: 0.9 + (j % 3) * 0.06,
    phaseW: frac * 1.4,
    speedW: 0.00029 + (j % 3) * 0.000015,
    ampW: 0.05 + 0.02 * Math.sin(j * 0.9),
    alpha: ((j % 6 === 2) || (j % 11 === 0)) ? baseAlpha * 2.2 : baseAlpha,
    color: lerpColor(TOP.color, BOTTOM.color, frac) 
  };
});

function drawRibbon(t) {
  const step = Math.max(5, w / 170);
  ctx.globalCompositeOperation = 'lighter';


  [TOP, BOTTOM].forEach(config => {
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      const y = envelopeY(x, t, config);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${config.color}, ${config.alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });


  strands.forEach(s => {
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      const nx = x / w;
      const top = envelopeY(x, t, TOP);
      const gap = envelopeY(x, t, BOTTOM) - top;
      
      const wobble = Math.sin(nx * Math.PI * 2 * s.freqW + s.phaseW + t * s.speedW);
      const fracEff = Math.min(0.98, Math.max(0.02, s.frac + wobble * s.ampW));
      const y = top + gap * fracEff;
      
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${s.color}, ${s.alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.globalCompositeOperation = 'source-over';
}

function drawScene(t) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, w, h);
  drawRibbon(t);
}

function animate(t) {
  drawScene(t);
  requestAnimationFrame(animate);
}

animate(0);