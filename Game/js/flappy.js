(() => {
	const canvas = document.getElementById('flappyCanvas');
	const ctx = canvas.getContext('2d');

	// Game configuration from server
	let gameConfig = null;
	let qrUid = null;
	let isOnline = navigator.onLine;
	let isValidationComplete = false;
	let isValidationSuccessful = false;
	let isAlreadyPlayed = false;

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
	let pipeGap = 160; // Will be set dynamically
	let pipeWidth = 70;
	let pipeSpeed = 180; // Will be set dynamically
	let pipes = [];
	let lastTime = 0;
	let score = 0;
	let best = Number(localStorage.getItem('flappy_best') || 0);
	let groundScroll = 0;
	let clouds = [];
	let wingPhase = 0; // for wing flap animation
	let elapsed = 0; // elapsed time in seconds (current session)
	let earningElapsed = 0; // time that counts toward bottle reward (playing only)
	let earningCapSeconds = 60; // Will be set from server config
	let bottleMRP = 20; // Will be set from server config
	let targetScore = 15; // Will be set from server config
	let currentPhase = 0; // Current difficulty phase

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
	const rewardEl = document.getElementById('reward');
	const timeEl = document.getElementById('time');
	const overlayMenu = document.getElementById('overlayMenu');
	const overlayResults = document.getElementById('overlayResults');
	const btnPractice = document.getElementById('btnPractice');
	const btnStart = document.getElementById('btnStart');
	// Removed btnPlayAgain - no longer allowing multiple plays
	const finalScoreEl = document.getElementById('finalScore');
	const finalTimeEl = document.getElementById('finalTime');
	const finalRewardEl = document.getElementById('finalReward');
	const bottleStatusEl = document.getElementById('bottleStatus');
	const claimSectionEl = document.getElementById('claimSection');
	const claimQrInputEl = document.getElementById('claimQrInput');
	const claimRewardBtnEl = document.getElementById('claimRewardBtn');
	const scanQrBtnEl = document.getElementById('scanQrBtn');
	const qrScannerModalEl = document.getElementById('qrScannerModal');
	const closeScannerBtnEl = document.getElementById('closeScannerBtn');
	const qrReaderEl = document.getElementById('qrReader');
	const connectionStatusEl = document.getElementById('connectionStatus');
	const validationStatusEl = document.getElementById('validationStatus');
	const gameContentEl = document.getElementById('gameContent');
	const validationMessageEl = document.getElementById('validationMessage');
	const loadingSpinnerEl = document.getElementById('loadingSpinner');
	const retrySectionEl = document.getElementById('retrySection');
	const btnRetry = document.getElementById('btnRetry');
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
		
		// Update validation UI when showing menu
		if (next === 'menu') {
			updateValidationUI();
		}
	}

	function updateValidationUI() {
		if (!isValidationComplete) {
			// Still validating
			if (validationStatusEl) validationStatusEl.style.display = 'block';
			if (gameContentEl) gameContentEl.style.display = 'none';
			if (validationMessageEl) validationMessageEl.textContent = 'Validating QR code...';
			if (loadingSpinnerEl) loadingSpinnerEl.style.display = 'block';
			if (retrySectionEl) retrySectionEl.style.display = 'none';
		} else if (isAlreadyPlayed) {
			// Already played - hide menu overlay since we show results in overlay
			if (overlayMenu) overlayMenu.classList.remove('show');
		} else if (isValidationSuccessful) {
			// Validation successful
			if (validationStatusEl) validationStatusEl.style.display = 'none';
			if (gameContentEl) gameContentEl.style.display = 'block';
			if (btnPractice) btnPractice.disabled = false;
			if (btnStart) btnStart.disabled = false;
		} else {
			// Validation failed
			if (validationStatusEl) validationStatusEl.style.display = 'block';
			if (gameContentEl) gameContentEl.style.display = 'none';
			if (validationMessageEl) validationMessageEl.textContent = 'QR code validation failed. Please try again.';
			if (loadingSpinnerEl) loadingSpinnerEl.style.display = 'none';
			if (retrySectionEl) retrySectionEl.style.display = 'block';
		}
	}

	function retryValidation() {
		// Reset validation state
		isValidationComplete = false;
		isValidationSuccessful = false;
		isAlreadyPlayed = false;
		
		// Update UI to show loading state
		updateValidationUI();
		
		// Retry validation
		validateQR();
	}

	function startPractice() {
		if (!isValidationComplete || !isValidationSuccessful || isAlreadyPlayed) {
			console.log('Cannot start practice: QR validation not complete, failed, or already played');
			return;
		}
		setMode('practice');
		reset();
		sfx.play('start');
	}

	function startGame() {
		if (!isValidationComplete || !isValidationSuccessful || isAlreadyPlayed) {
			console.log('Cannot start game: QR validation not complete, failed, or already played');
			return;
		}
		setMode('playing');
		reset();
		sfx.play('start');
	}

	// Initialize game from URL
	function initializeGame() {
		const urlParams = new URLSearchParams(window.location.search);
		// Try to get UID from query parameter first, then fallback to path
		qrUid = urlParams.get('uid') || window.location.pathname.split('/').pop();
		
		if (!qrUid || qrUid === 'index.html' || qrUid === 'Game') {
			showError('Invalid QR code - UID parameter missing');
			return;
		}
		
		validateQR();
	}

	// Validate QR code with server
	async function validateQR() {
		if (!isOnline) {
			showError('Internet connection required to play');
			isValidationComplete = true;
			isValidationSuccessful = false;
			updateValidationUI();
			return;
		}

		console.log('Validating QR UID:', qrUid);
		
		try {
			const url = `https://ecmqmpjtsnahmeskjmgs.supabase.co/functions/v1/validate-qr/${qrUid}`;
			console.log('Calling validation URL:', url);
			
			const response = await fetch(url);
			console.log('Response status:', response.status);
			console.log('Response headers:', response.headers);
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log('Validation response:', data);
			
			if (!data.valid) {
				// Check if this is an "already played" case
				if (data.already_played && data.previous_game) {
					showPreviousGameResults(data.previous_game);
					isValidationComplete = true;
					isValidationSuccessful = false;
					isAlreadyPlayed = true;
					updateValidationUI();
					return;
				}
				
				showError(data.error || 'Invalid QR code');
				isValidationComplete = true;
				isValidationSuccessful = false;
				updateValidationUI();
				return;
			}
			
			gameConfig = data.game_config;
			earningCapSeconds = gameConfig.max_game_time || 60;
			bottleMRP = gameConfig.business_settings?.bottle_mrp || 20;
			
			console.log('Game config loaded:', gameConfig);
			
			// Mark validation as successful
			isValidationComplete = true;
			isValidationSuccessful = true;
			
			// Show game menu
			setMode('menu');
			
		} catch (error) {
			console.error('QR validation error:', error);
			showError(`Failed to validate QR code: ${error.message}`);
			isValidationComplete = true;
			isValidationSuccessful = false;
			updateValidationUI();
		}
	}

	function computeReward() {
		if (!gameConfig || !gameConfig.phases) {
			return 0;
		}
		
		let totalReward = 0;
		const phases = gameConfig.phases;
		
		for (let i = 0; i < phases.length; i++) {
			const phase = phases[i];
			const phaseStart = phase.start;
			const phaseEnd = phase.end;
			const rewardRate = phase.reward_rate;
			
			// Calculate time spent in this phase
			const timeInPhase = Math.max(0, Math.min(earningElapsed - phaseStart, phaseEnd - phaseStart));
			
			if (timeInPhase > 0) {
				totalReward += timeInPhase * rewardRate;
			}
		}
		
		// Cap at maximum reward
		return Math.min(totalReward, gameConfig.max_reward || 1.50);
	}

	function hasWonBottle() {
		return score >= targetScore && earningElapsed >= 30; // Must score 15+ and survive 30+ seconds
	}

	function showError(message) {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-overlay';
		errorDiv.innerHTML = `
			<div class="error-panel">
				<h2>Error</h2>
				<p>${message}</p>
				<button onclick="location.reload()" class="btn">Try Again</button>
			</div>
		`;
		document.body.appendChild(errorDiv);
	}

	function showPreviousGameResults(previousGame) {
		const playedDate = new Date(previousGame.played_at).toLocaleString();
		const wonBottle = previousGame.final_score >= targetScore && previousGame.game_duration >= 30;
		const hasReward = previousGame.reward_amount > 0;
		
		const resultsDiv = document.createElement('div');
		resultsDiv.className = 'error-overlay';
		resultsDiv.innerHTML = `
			<div class="error-panel">
				<h2>Game Already Played</h2>
				<p>This QR code has already been used to play the game.</p>
				<div style="background: rgba(0,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
					<h3>Your Previous Results:</h3>
					<p><strong>Score:</strong> ${previousGame.final_score}</p>
					<p><strong>Time Survived:</strong> ${previousGame.game_duration}s</p>
					<p><strong>Reward Earned:</strong> ₹${previousGame.reward_amount.toFixed(2)}</p>
					<p><strong>Played On:</strong> ${playedDate}</p>
					${wonBottle ? '<p style="color: #00ff00; font-weight: bold;">🎉 FREE BOTTLE WON! 🎉</p>' : ''}
				</div>
				${hasReward ? `
					<div style="margin-top: 20px; padding: 15px; background: rgba(0,255,255,0.1); border-radius: 8px;">
						<h3>Claim Your Reward</h3>
						<p>Ask the restaurant staff to scan their claim QR code to process your reward.</p>
						<div style="display: flex; gap: 10px; margin: 10px 0;">
							<input type="text" id="claimQrInputPrevious" placeholder="Enter claim QR code" style="flex: 1; padding: 8px; margin: 0; border: 1px solid #ccc; border-radius: 4px; background: #222; color: #fff;">
							<button id="scanQrBtnPrevious" class="btn" style="padding: 8px 12px;">📷 Scan</button>
						</div>
						<button id="claimRewardBtnPrevious" class="btn" style="width: 100%; margin-top: 10px;">Claim Reward</button>
					</div>
				` : ''}
				<p class="muted">Show this screen at the counter to claim your reward.</p>
				<p class="muted">This QR code has been used and cannot be played again.</p>
			</div>
		`;
		document.body.appendChild(resultsDiv);
		
		// Add claim functionality for previous game results
		if (hasReward) {
			const claimBtn = document.getElementById('claimRewardBtnPrevious');
			const claimQrInput = document.getElementById('claimQrInputPrevious');
			const scanBtn = document.getElementById('scanQrBtnPrevious');
			
			// Add scanner functionality for previous game
			if (scanBtn) {
				scanBtn.addEventListener('click', () => {
					// Create a temporary scanner for this modal
					const tempScanner = new Html5Qrcode("qrReader");
					const config = {
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1.0
					};
					
					// Show the scanner modal
					openQRScannerModal();
					
					// Override the success callback for this specific case
					const originalOnScanSuccess = onScanSuccess;
					window.tempOnScanSuccess = (decodedText, decodedResult) => {
						let claimQrUid = decodedText;
						if (decodedText.includes('/Claim/')) {
							claimQrUid = decodedText.split('/Claim/')[1];
						}
						
						if (claimQrInput) {
							claimQrInput.value = claimQrUid;
						}
						
						closeQRScannerModal();
						alert('QR Code scanned successfully!');
					};
				});
			}
			
			if (claimBtn) {
				claimBtn.addEventListener('click', async () => {
					const claimQr = claimQrInput.value.trim();
					
					if (!claimQr) {
						alert('Please enter claim QR code');
						return;
					}
					
					if (!isOnline) {
						alert('Internet connection required to claim reward');
						return;
					}
					
					try {
						claimBtn.disabled = true;
						claimBtn.textContent = 'Processing...';
						
						const response = await fetch('https://ecmqmpjtsnahmeskjmgs.supabase.co/functions/v1/claim-reward', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								qr_uid: qrUid,
								claim_qr_uid: claimQr
							})
						});
						
						const data = await response.json();
						
						if (data.success) {
							alert(`Reward claimed successfully! Amount: ₹${data.reward_amount}`);
							// Hide the claim section
							const claimSection = claimBtn.closest('div');
							if (claimSection) claimSection.style.display = 'none';
						} else {
							alert(data.error || 'Failed to claim reward');
						}
					} catch (error) {
						console.error('Claim error:', error);
						alert('Failed to claim reward. Please try again.');
					} finally {
						claimBtn.disabled = false;
						claimBtn.textContent = 'Claim Reward';
					}
				});
			}
		}
	}

	function updateDifficulty() {
		if (!gameConfig || !gameConfig.phases || mode !== 'playing') return;
		
		const phases = gameConfig.phases;
		let newPhase = 0;
		
		// Find current phase based on elapsed time
		for (let i = 0; i < phases.length; i++) {
			if (earningElapsed >= phases[i].start && earningElapsed < phases[i].end) {
				newPhase = i;
				break;
			}
		}
		
		// Update difficulty if phase changed
		if (newPhase !== currentPhase) {
			currentPhase = newPhase;
			const phase = phases[currentPhase];
			pipeGap = phase.pipe_gap;
			pipeSpeed = phase.pipe_speed;
		}
	}

	function endToMenuAfterPractice() {
		running = false;
		setMode('menu');
	}

	function showResults() {
		if (finalScoreEl) finalScoreEl.textContent = String(score);
		if (finalTimeEl) finalTimeEl.textContent = elapsed.toFixed(1);
		if (finalRewardEl) finalRewardEl.textContent = computeReward().toFixed(1);
		
		const wonBottle = hasWonBottle();
		if (bottleStatusEl) {
			if (wonBottle) {
				bottleStatusEl.textContent = "🎉 FREE BOTTLE WON! 🎉";
				bottleStatusEl.style.color = "#00ff00";
			} else {
				bottleStatusEl.textContent = `Need ${targetScore - score} more points for free bottle`;
				bottleStatusEl.style.color = "#ffaa00";
			}
		}
		
		// Show claim section if reward > 0
		if (claimSectionEl && computeReward() > 0) {
			claimSectionEl.style.display = 'block';
		}
		
		// Hide restart button after game completion
		if (restartBtn) {
			restartBtn.style.display = 'none';
		}
		
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
	restartBtn.addEventListener('click', () => { 
		// Only allow restart if game hasn't been completed yet
		if (mode !== 'gameover') {
			setMode('menu'); 
			running = false; 
		}
	});
	if (btnPractice) btnPractice.addEventListener('click', () => { startPractice(); });
	if (btnStart) btnStart.addEventListener('click', () => { startGame(); });
	// Removed Play Again functionality - users can only play once
	if (btnRetry) btnRetry.addEventListener('click', () => { retryValidation(); });

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
		if (rewardEl) rewardEl.textContent = computeReward().toFixed(1);
		
		// Update difficulty based on time
		updateDifficulty();
		
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
			// Auto end at 1 minute
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

	async function gameOver() {
		if (mode !== 'playing') return;
		running = false;
		best = Math.max(best, score);
		localStorage.setItem('flappy_best', String(best));
		bestEl.textContent = String(best);
		sfx.play('die');
		try { if (navigator && navigator.vibrate) navigator.vibrate([60, 40, 60]); } catch {}
		
		// Send game results to server
		if (isOnline && qrUid) {
			try {
				const response = await fetch('https://ecmqmpjtsnahmeskjmgs.supabase.co/functions/v1/game-complete', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						qr_uid: qrUid,
						game_duration: Math.floor(earningElapsed),
						final_score: score
					})
				});
				
				const data = await response.json();
				if (data.success) {
					console.log('Game results saved:', data);
				}
			} catch (error) {
				console.error('Failed to save game results:', error);
			}
		}
		
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

	// Online/offline detection
	window.addEventListener('online', () => {
		isOnline = true;
		console.log('Connection restored');
		if (connectionStatusEl) {
			connectionStatusEl.textContent = 'Online';
			connectionStatusEl.className = 'connection-status online';
		}
	});
	
	window.addEventListener('offline', () => {
		isOnline = false;
		console.log('Connection lost');
		if (connectionStatusEl) {
			connectionStatusEl.textContent = 'Offline';
			connectionStatusEl.className = 'connection-status offline';
		}
		if (running && mode === 'playing') {
			// Pause game if connection is lost during play
			showError('Connection lost. Game paused.');
			running = false;
		}
	});

	// QR Scanner functionality
	let html5QrcodeScanner = null;

	function startQRScanner() {
		if (!qrReaderEl) return;
		
		// Clear any existing scanner
		if (html5QrcodeScanner) {
			html5QrcodeScanner.clear();
		}
		
		// Create new scanner
		html5QrcodeScanner = new Html5Qrcode("qrReader");
		
		const config = {
			fps: 10,
			qrbox: { width: 250, height: 250 },
			aspectRatio: 1.0
		};
		
		// Start scanning
		html5QrcodeScanner.start(
			{ facingMode: "environment" }, // Use back camera
			config,
			onScanSuccess,
			onScanFailure
		).catch(err => {
			console.error('QR Scanner error:', err);
			alert('Failed to start camera. Please check permissions.');
		});
	}

	function stopQRScanner() {
		if (html5QrcodeScanner) {
			html5QrcodeScanner.stop().then(() => {
				html5QrcodeScanner.clear();
				html5QrcodeScanner = null;
			}).catch(err => {
				console.error('Error stopping scanner:', err);
			});
		}
	}

	function onScanSuccess(decodedText, decodedResult) {
		console.log('QR Code scanned:', decodedText);
		
		// Extract UID from the scanned URL
		let claimQrUid = decodedText;
		
		// If it's a full URL, extract the UID
		if (decodedText.includes('/Claim/')) {
			claimQrUid = decodedText.split('/Claim/')[1];
		}
		
		// Set the scanned value in the input field
		if (claimQrInputEl) {
			claimQrInputEl.value = claimQrUid;
		}
		
		// Stop scanner and close modal
		stopQRScanner();
		closeQRScannerModal();
		
		// Show success message
		alert('QR Code scanned successfully!');
	}

	function onScanFailure(error) {
		// This is called for every scan attempt, so we don't need to show errors
		// console.log('QR scan failed:', error);
	}

	function openQRScannerModal() {
		if (qrScannerModalEl) {
			qrScannerModalEl.style.display = 'flex';
			// Start scanner after a short delay to ensure modal is visible
			setTimeout(startQRScanner, 100);
		}
	}

	function closeQRScannerModal() {
		stopQRScanner();
		if (qrScannerModalEl) {
			qrScannerModalEl.style.display = 'none';
		}
	}

	// Event listeners for QR scanner
	if (scanQrBtnEl) {
		scanQrBtnEl.addEventListener('click', openQRScannerModal);
	}

	if (closeScannerBtnEl) {
		closeScannerBtnEl.addEventListener('click', closeQRScannerModal);
	}

	// Close scanner when clicking outside the modal
	if (qrScannerModalEl) {
		qrScannerModalEl.addEventListener('click', (e) => {
			if (e.target === qrScannerModalEl) {
				closeQRScannerModal();
			}
		});
	}

	// Claim reward functionality
	if (claimRewardBtnEl) {
		claimRewardBtnEl.addEventListener('click', async () => {
			const claimQr = claimQrInputEl.value.trim();
			
			if (!claimQr) {
				alert('Please enter claim QR code');
				return;
			}
			
			if (!isOnline) {
				alert('Internet connection required to claim reward');
				return;
			}
			
			try {
				claimRewardBtnEl.disabled = true;
				claimRewardBtnEl.textContent = 'Processing...';
				
				const response = await fetch('https://ecmqmpjtsnahmeskjmgs.supabase.co/functions/v1/claim-reward', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						qr_uid: qrUid,
						claim_qr_uid: claimQr
					})
				});
				
				const data = await response.json();
				
				if (data.success) {
					alert(`Reward claimed successfully! Amount: ₹${data.reward_amount}`);
					claimSectionEl.style.display = 'none';
				} else {
					alert(data.error || 'Failed to claim reward');
				}
			} catch (error) {
				console.error('Claim error:', error);
				alert('Failed to claim reward. Please try again.');
			} finally {
				claimRewardBtnEl.disabled = false;
				claimRewardBtnEl.textContent = 'Claim Reward';
			}
		});
	}

	// Initialize game when page loads
	initializeGame();
	updateValidationUI(); // Show initial loading state
	running = false;
	requestAnimationFrame((t) => { lastTime = t; loop(t); });
})();


