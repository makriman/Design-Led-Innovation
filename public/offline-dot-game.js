(() => {
  const SESSION_HIGH_KEY = "inspire_dot_game_session_high";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const instructionsEl = document.getElementById("instructions");
  const gameOverEl = document.getElementById("game-over");
  const finalScoreEl = document.getElementById("final-score");
  const finalHighScoreEl = document.getElementById("final-high-score");
  const restartButton = document.getElementById("restart-button");
  const reconnectBannerEl = document.getElementById("reconnect-banner");
  const reconnectCountdownEl = document.getElementById("reconnect-countdown");

  let worldWidth = 0;
  let worldHeight = 0;
  let animationFrameId = 0;
  let lastTime = 0;
  let obstacleSpawnTimer = 0;
  let gameStarted = false;
  let gameOver = false;
  let score = 0;
  let highScore = Number(sessionStorage.getItem(SESSION_HIGH_KEY) || "0");
  let reconnecting = false;
  let reconnectIntervalId = 0;

  const player = {
    x: 0,
    y: 0,
    radius: 13,
    velocityY: 0,
  };

  const physics = {
    gravity: 1300,
    jumpVelocity: -430,
  };

  const obstacles = [];
  const obstacleConfig = {
    width: 74,
    speed: 205,
    spawnEveryMs: 1320,
    gapMin: 150,
    gapMax: 190,
    paddingTop: 58,
    paddingBottom: 70,
  };

  function readjustCanvas() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    worldWidth = window.innerWidth;
    worldHeight = window.innerHeight;

    canvas.width = Math.floor(worldWidth * dpr);
    canvas.height = Math.floor(worldHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    player.x = Math.max(80, worldWidth * 0.27);
    if (!gameStarted) {
      player.y = worldHeight * 0.5;
    } else {
      player.y = Math.max(player.radius, Math.min(worldHeight - player.radius, player.y));
    }
  }

  function resetGame() {
    obstacles.length = 0;
    obstacleSpawnTimer = 0;
    gameStarted = false;
    gameOver = false;
    score = 0;
    player.velocityY = 0;
    player.y = worldHeight * 0.5;
    instructionsEl.style.display = "block";
    gameOverEl.style.display = "none";
    updateScoreUI();
  }

  function updateScoreUI() {
    scoreEl.textContent = String(score);
    highScoreEl.textContent = String(highScore);
  }

  function startRunIfNeeded() {
    if (!gameStarted) {
      gameStarted = true;
      instructionsEl.style.display = "none";
    }
  }

  function jump() {
    if (reconnecting) {
      return;
    }

    if (gameOver) {
      resetGame();
      gameStarted = true;
      instructionsEl.style.display = "none";
    }

    startRunIfNeeded();
    player.velocityY = physics.jumpVelocity;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnObstacle() {
    const gapHeight = randomBetween(obstacleConfig.gapMin, obstacleConfig.gapMax);
    const minGapY = obstacleConfig.paddingTop + gapHeight / 2;
    const maxGapY = worldHeight - obstacleConfig.paddingBottom - gapHeight / 2;
    const gapY = randomBetween(minGapY, maxGapY);

    obstacles.push({
      x: worldWidth + obstacleConfig.width + 10,
      width: obstacleConfig.width,
      gapY,
      gapHeight,
      passed: false,
    });
  }

  function collidesCircleRect(circleX, circleY, radius, rectX, rectY, rectW, rectH) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  function update(deltaSeconds) {
    if (!gameStarted || gameOver || reconnecting) {
      return;
    }

    obstacleSpawnTimer += deltaSeconds * 1000;
    if (obstacleSpawnTimer >= obstacleConfig.spawnEveryMs) {
      obstacleSpawnTimer = 0;
      spawnObstacle();
    }

    player.velocityY += physics.gravity * deltaSeconds;
    player.y += player.velocityY * deltaSeconds;

    if (player.y < player.radius || player.y > worldHeight - player.radius) {
      endRun();
      return;
    }

    const speedBoost = Math.min(90, score * 1.7);
    const currentSpeed = obstacleConfig.speed + speedBoost;

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = obstacles[i];
      obstacle.x -= currentSpeed * deltaSeconds;

      const gapTop = obstacle.gapY - obstacle.gapHeight / 2;
      const gapBottom = obstacle.gapY + obstacle.gapHeight / 2;

      const hitTop = collidesCircleRect(
        player.x,
        player.y,
        player.radius,
        obstacle.x,
        0,
        obstacle.width,
        gapTop
      );
      const hitBottom = collidesCircleRect(
        player.x,
        player.y,
        player.radius,
        obstacle.x,
        gapBottom,
        obstacle.width,
        worldHeight - gapBottom
      );

      if (hitTop || hitBottom) {
        endRun();
        return;
      }

      if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
        obstacle.passed = true;
        score += 1;
        updateScoreUI();
      }

      if (obstacle.x + obstacle.width < -12) {
        obstacles.splice(i, 1);
      }
    }
  }

  function endRun() {
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      sessionStorage.setItem(SESSION_HIGH_KEY, String(highScore));
    }
    updateScoreUI();
    finalScoreEl.textContent = String(score);
    finalHighScoreEl.textContent = String(highScore);
    gameOverEl.style.display = "block";
  }

  function drawGradientBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, worldHeight);
    gradient.addColorStop(0, "#2c2cff");
    gradient.addColorStop(0.52, "#1a1aff");
    gradient.addColorStop(1, "#1010c2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, worldWidth, worldHeight);
  }

  function drawObstacleLane(obstacle, laneStartY, laneEndY) {
    if (laneEndY <= laneStartY) {
      return;
    }

    const dotSpacing = 23;
    const dotRadius = 6.4;
    const leftX = obstacle.x + obstacle.width * 0.34;
    const rightX = obstacle.x + obstacle.width * 0.66;

    for (let y = laneStartY + 9; y < laneEndY - 6; y += dotSpacing) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255,255,255,0.45)";
      ctx.arc(leftX, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rightX, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawObstacles() {
    for (const obstacle of obstacles) {
      const gapTop = obstacle.gapY - obstacle.gapHeight / 2;
      const gapBottom = obstacle.gapY + obstacle.gapHeight / 2;

      drawObstacleLane(obstacle, 0, gapTop);
      drawObstacleLane(obstacle, gapBottom, worldHeight);
    }
  }

  function drawPlayer() {
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(255,255,255,0.72)";
    ctx.shadowBlur = 16;
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.arc(player.x - 4, player.y - 4, player.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function draw() {
    drawGradientBackground();
    drawObstacles();
    drawPlayer();
  }

  function tick(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
    }
    const deltaSeconds = Math.min((timestamp - lastTime) / 1000, 0.034);
    lastTime = timestamp;

    update(deltaSeconds);
    draw();
    animationFrameId = requestAnimationFrame(tick);
  }

  function startReconnectCountdown() {
    if (reconnecting) {
      return;
    }
    reconnecting = true;

    reconnectBannerEl.style.display = "block";
    let secondsRemaining = 3;
    reconnectCountdownEl.textContent = String(secondsRemaining);

    reconnectIntervalId = window.setInterval(() => {
      secondsRemaining -= 1;
      reconnectCountdownEl.textContent = String(Math.max(0, secondsRemaining));
      if (secondsRemaining <= 0) {
        window.clearInterval(reconnectIntervalId);
        window.location.replace("/dashboard");
      }
    }, 1000);
  }

  async function probeConnectivity() {
    if (reconnecting || !navigator.onLine) {
      return;
    }

    try {
      const response = await fetch(`/favicon.ico?offline_ping=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
      });
      if (response.ok) {
        startReconnectCountdown();
      }
    } catch {
      // Still offline.
    }
  }

  function addInputHandlers() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
      }
    });

    window.addEventListener("pointerdown", jump);
    restartButton.addEventListener("click", () => {
      resetGame();
      jump();
    });
  }

  function addConnectivityHandlers() {
    window.addEventListener("online", startReconnectCountdown);
    window.setInterval(probeConnectivity, 7000);
    if (navigator.onLine) {
      void probeConnectivity();
    }
  }

  function init() {
    readjustCanvas();
    resetGame();
    updateScoreUI();
    addInputHandlers();
    addConnectivityHandlers();
    window.addEventListener("resize", readjustCanvas);
    animationFrameId = requestAnimationFrame(tick);
  }

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (reconnectIntervalId) {
      window.clearInterval(reconnectIntervalId);
    }
  });

  init();
})();
