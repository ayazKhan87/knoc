(() => {
	const canvas = document.getElementById('flappyCanvas');
	const ctx = canvas.getContext('2d');

	function resize() {
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	}
	window.addEventListener('resize', resize);
	resize();

	// Game state
	let running = false;
	let mode = 'menu'; // 'menu' | 'practice' | 'playing' | 'gameover'
	let birdY = 0;
	let birdX = 0;
	let birdVel = 0;
	const gravity = 1200; // px/s^2
	const flapVel = -350; // px/s
	const pipeGap = 160;
	const pipeWidth = 70;
	const pipeSpeed = 180;
	let pipes = [];
	let lastTime = 0;
	let score = 0;
	let best = Number(localStorage.getItem('flappy_best') || 0);
	let groundScroll = 0;
	let clouds = [];
	let wingPhase = 0; // for wing flap animation
	let elapsed = 0; // elapsed time in seconds (current session)
	let earningElapsed = 0; // time that counts toward discount (playing only)
	const earningCapSeconds = 120; // 2 minutes max

	// SFX manager
	const sfx = (() => {
		const files = {
			start: 'start.wav',
			flap: 'flap.wav',
			score: 'score.wav',
			hit: 'hit.wav',
			die: 'die.wav'
		};
		const bases = ['assets/sfx/', 'sfx/', 'assets/'];
		const buffers = {};
		for (const [key, filename] of Object.entries(files)) {
			let src = null;
			for (const base of bases) {
				// Construct path candidates
				const path = base + filename;
				// We cannot synchronously check existence; assign first and rely on error handling
				src = src || path;
			}
			const audio = new Audio();
			audio.src = src;
			audio.preload = 'auto';
			audio.volume = key === 'flap' ? 0.4 : 0.5;
			buffers[key] = audio;
		}
		function play(name) {
			const base = buffers[name];
			if (!base) return;
			try {
				const a = base.cloneNode(true);
				a.currentTime = 0;
				a.play().catch(() => {});
			} catch {}
		}
		return { play };
	})();

	// UI
	const scoreEl = document.getElementById('score');
	const bestEl = document.getElementById('best');
	const restartBtn = document.getElementById('restart');
	const discountEl = document.getElementById('discount');
	const timeEl = document.getElementById('time');
	const overlayMenu = document.getElementById('overlayMenu');
	const overlayResults = document.getElementById('overlayResults');
	const btnPractice = document.getElementById('btnPractice');
	const btnStart = document.getElementById('btnStart');
	const btnPlayAgain = document.getElementById('btnPlayAgain');
	const finalScoreEl = document.getElementById('finalScore');
	const finalTimeEl = document.getElementById('finalTime');
	const finalDiscountEl = document.getElementById('finalDiscount');
	bestEl.textContent = best;

	function reset() {
		const w = canvas.width / window.devicePixelRatio;
		const h = canvas.height / window.devicePixelRatio;
		birdX = Math.floor(w * 0.28);
		birdY = Math.floor(h * 0.5);
		birdVel = 0;
		pipes = [];
		spawnInitialPipes();
		score = 0;
		scoreEl.textContent = '0';
		if (timeEl) timeEl.textContent = '0.0';
		elapsed = 0;
		earningElapsed = 0;
		lastTime = performance.now();
		running = true;
		groundScroll = 0;
		spawnClouds();
	}

	function setMode(next) {
		mode = next;
		if (overlayMenu) overlayMenu.classList.toggle('show', next === 'menu');
		if (overlayResults) overlayResults.classList.toggle('show', next === 'gameover');
	}

	function startPractice() {
		setMode('practice');
		reset();
		sfx.play('start');
	}

	function startGame() {
		setMode('playing');
		reset();
		sfx.play('start');
	}

	function computeDiscount() {
		const seconds = Math.min(earningElapsed, earningCapSeconds);
		return Math.min(40, Math.floor(seconds / 3));
	}

	function endToMenuAfterPractice() {
		running = false;
		setMode('menu');
	}

	function showResults() {
		if (finalScoreEl) finalScoreEl.textContent = String(score);
		if (finalTimeEl) finalTimeEl.textContent = elapsed.toFixed(1);
		if (finalDiscountEl) finalDiscountEl.textContent = String(computeDiscount());
		setMode('gameover');
	}

	function spawnInitialPipes() {
		const w = canvas.width / window.devicePixelRatio;
		let x = w + 200;
		for (let i = 0; i < 4; i++) {
			addPipe(x);
			x += 220;
		}
	}

	function addPipe(x) {
		const h = canvas.height / window.devicePixelRatio;
		const margin = 40;
	// Constrain next gap center relative movement for fairness
	const minCenter = margin + pipeGap / 2;
	const maxCenter = h - 40 - (margin + pipeGap / 2);
	let proposed = Math.random() * (h - margin * 2 - pipeGap) + margin + pipeGap / 2;
	const lastCenter = pipes.length ? pipes[pipes.length - 1].gapCenter : (h * 0.5);
	const maxStep = Math.max(80, pipeGap * 0.75); // limit vertical jump between consecutive pipes
	if (proposed > lastCenter + maxStep) proposed = lastCenter + maxStep;
	if (proposed < lastCenter - maxStep) proposed = lastCenter - maxStep;
	const gapCenter = Math.max(minCenter, Math.min(maxCenter, proposed));
	pipes.push({ x, gapCenter, passed: false });
	}

	function spawnClouds() {
		const w = canvas.width / window.devicePixelRatio;
		const h = canvas.height / window.devicePixelRatio;
		clouds = [];
		for (let i = 0; i < 6; i++) {
			clouds.push({
				x: Math.random() * w,
				y: Math.random() * (h * 0.5),
				s: 0.4 + Math.random() * 0.8 // speed scale
			});
		}
	}

	function flap() {
		if (!running) return;
		if (mode !== 'playing' && mode !== 'practice') return;
		birdVel = flapVel;
		try { if (navigator && navigator.vibrate) navigator.vibrate(20); } catch {}
		sfx.play('flap');
	}

	canvas.addEventListener('mousedown', flap);
	canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
	document.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } });
	restartBtn.addEventListener('click', () => { setMode('menu'); running = false; });
	if (btnPractice) btnPractice.addEventListener('click', () => { startPractice(); });
	if (btnStart) btnStart.addEventListener('click', () => { startGame(); });
	if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => { startGame(); });

	function update(dt) {
		const w = canvas.width / window.devicePixelRatio;
		const h = canvas.height / window.devicePixelRatio;
		if (!running) return;
		
		// Bird physics
		birdVel += gravity * dt;
		birdY += birdVel * dt;
		wingPhase += dt * 10;
		elapsed += dt;
		if (mode === 'playing' && earningElapsed < earningCapSeconds) earningElapsed += dt;
		if (discountEl) discountEl.textContent = String(computeDiscount());
		
		// Pipes movement
		for (let i = pipes.length - 1; i >= 0; i--) {
			pipes[i].x -= pipeSpeed * dt;
			// Recycle pipes
			if (pipes[i].x + pipeWidth < 0) {
				pipes.splice(i, 1);
				addPipe(w + 220);
				continue;
			}
			// Scoring
			if (!pipes[i].passed && pipes[i].x + pipeWidth < birdX) {
				pipes[i].passed = true;
				score++;
				scoreEl.textContent = String(score);
				sfx.play('score');
			}
		}
		
		// Collisions and mode-specific behavior
		if (mode === 'playing') {
			if (birdY < 0 || birdY > h) {
				sfx.play('hit');
				gameOver();
				return;
			}
			for (const p of pipes) {
				const inX = birdX + 24 > p.x && birdX - 24 < p.x + pipeWidth;
				if (inX) {
					const topBottom = p.gapCenter - pipeGap / 2;
					const gapBottom = p.gapCenter + pipeGap / 2;
					if (birdY - 24 < topBottom || birdY + 24 > gapBottom) {
						sfx.play('hit');
						gameOver();
						return;
					}
				}
			}
			// Auto end at 2 minutes
			if (earningElapsed >= earningCapSeconds) {
				gameOver();
				return;
			}
		} else if (mode === 'practice') {
			// Clamp bird inside bounds and ignore collisions
			if (birdY < 20) { birdY = 20; birdVel = 0; }
			if (birdY > h - 60) { birdY = h - 60; birdVel = 0; }
			// Auto-finish practice after 10s
			if (elapsed >= 10) {
				running = false;
				endToMenuAfterPractice();
				return;
			}
		}
		
		// Ground scroll
		groundScroll = (groundScroll + pipeSpeed * dt) % 40;
		
		// Clouds parallax
		for (const c of clouds) {
			c.x -= 20 * c.s * dt;
			if (c.x < -80) {
				c.x = w + Math.random() * 200;
				c.y = Math.random() * (h * 0.5);
			}
		}
	}

	function gameOver() {
		if (mode !== 'playing') return;
		running = false;
		best = Math.max(best, score);
		localStorage.setItem('flappy_best', String(best));
		bestEl.textContent = String(best);
		sfx.play('die');
		try { if (navigator && navigator.vibrate) navigator.vibrate([60, 40, 60]); } catch {}
		showResults();
	}

	function render() {
		const w = canvas.width / window.devicePixelRatio;
		const h = canvas.height / window.devicePixelRatio;
		// Sky gradient
		const sky = ctx.createLinearGradient(0, 0, 0, h);
		sky.addColorStop(0, '#8cd9f3');
		sky.addColorStop(1, '#e8f7ff');
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, w, h);
		// Sun
		ctx.save();
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = '#fff3a3';
		ctx.beginPath();
		ctx.arc(w - 90, 90, 40, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 0.35;
		ctx.fillStyle = '#ffe97a';
		ctx.beginPath();
		ctx.arc(w - 90, 90, 70, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
		// Clouds
		for (const c of clouds) drawCloud(c.x, c.y, 1 + 0.4 * c.s);
		// Ground
		drawGround(w, h);
		// Pipes
		for (const p of pipes) drawPipe(p, h);
		// Bird
		drawBird();

	// HUD: update time
	const timeEl = document.getElementById('time');
	if (timeEl) timeEl.textContent = elapsed.toFixed(1);
		
		// Start/Results overlays handled in HTML
	}

	function drawGround(w, h) {
		ctx.fillStyle = '#c2b872';
		ctx.fillRect(0, h - 40, w, 40);
		// stripes
		ctx.fillStyle = '#b2a95f';
		for (let i = -40; i < w + 40; i += 40) {
			ctx.fillRect(i - groundScroll, h - 20, 20, 6);
		}
		ctx.fillStyle = '#9c934f';
		for (let i = -30; i < w + 40; i += 40) {
			ctx.fillRect(i - groundScroll, h - 10, 16, 4);
		}
	}

	function drawCloud(x, y, scale) {
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(scale, scale);
		ctx.fillStyle = 'rgba(255,255,255,0.9)';
		ctx.beginPath();
		ctx.arc(0, 0, 18, 0, Math.PI * 2);
		ctx.arc(18, -6, 14, 0, Math.PI * 2);
		ctx.arc(36, 0, 20, 0, Math.PI * 2);
		ctx.arc(18, 10, 16, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	function drawPipe(p, h) {
		const topBottom = p.gapCenter - pipeGap / 2;
		const gapBottom = p.gapCenter + pipeGap / 2;
		// body
		const bodyGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
		bodyGrad.addColorStop(0, '#3aa53a');
		bodyGrad.addColorStop(0.5, '#4ec04e');
		bodyGrad.addColorStop(1, '#3aa53a');
		ctx.fillStyle = bodyGrad;
		ctx.fillRect(p.x, 0, pipeWidth, topBottom);
		ctx.fillRect(p.x, gapBottom, pipeWidth, h - gapBottom - 40);
		// stripes
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		for (let y = 10; y < topBottom - 10; y += 18) ctx.fillRect(p.x + 6, y, pipeWidth - 12, 4);
		for (let y = gapBottom + 10; y < h - 50; y += 18) ctx.fillRect(p.x + 6, y, pipeWidth - 12, 4);
		// cap
		ctx.fillStyle = '#2f8b2f';
		ctx.fillRect(p.x - 6, topBottom - 14, pipeWidth + 12, 14);
		ctx.fillRect(p.x - 6, gapBottom, pipeWidth + 12, 14);
	}

	function drawBird() {
		ctx.save();
		ctx.translate(birdX, birdY);
		ctx.rotate(Math.max(-0.4, Math.min(0.6, birdVel / 600)));
		// body
		const bodyGrad = ctx.createLinearGradient(-18, -18, 18, 18);
		bodyGrad.addColorStop(0, '#ffe066');
		bodyGrad.addColorStop(1, '#ffb300');
		ctx.fillStyle = bodyGrad;
		ctx.beginPath();
		ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
		ctx.fill();
		// belly
		ctx.fillStyle = '#fff3cc';
		ctx.beginPath();
		ctx.ellipse(-2, 6, 12, 8, 0.2, 0, Math.PI * 2);
		ctx.fill();
		// wing (flap)
		ctx.save();
		const flap = Math.sin(wingPhase) * 0.6;
		ctx.translate(-2, 2);
		ctx.rotate(-0.6 + flap);
		ctx.fillStyle = '#f5a623';
		ctx.beginPath();
		ctx.ellipse(0, 0, 12, 7, 0.2, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
		// eye
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(8, -4, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#1a1a1a';
		ctx.beginPath();
		ctx.arc(9, -4, 2, 0, Math.PI * 2);
		ctx.fill();
		// beak
		ctx.fillStyle = '#ff7f32';
		ctx.beginPath();
		ctx.moveTo(18, 0);
		ctx.lineTo(28, -3);
		ctx.lineTo(18, 3);
		ctx.closePath();
		ctx.fill();
		// tail
		ctx.fillStyle = '#f5a623';
		ctx.beginPath();
		ctx.moveTo(-16, -2);
		ctx.lineTo(-26, 0);
		ctx.lineTo(-16, 4);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function loop(now) {
		const dtMs = now - lastTime;
		lastTime = now;
		const dt = Math.min(0.033, Math.max(0, dtMs / 1000));
		update(dt);
		render();
		requestAnimationFrame(loop);
	}

	// Start at menu (not running until user starts)
	setMode('menu');
	running = false;
	requestAnimationFrame((t) => { lastTime = t; loop(t); });
})();


