const bgColor = '#b7b7a4';
const moveSpeed = 6;
const jumpStrength = 28;
const gravity = 4.0;
const animRates = { stop: 12, walk: 18, jump: 20, attack: 14 };
const toolSpeed = 12;

let stopSheet;
let walkSheet;
let jumpSheet;
let attackSheet;
let toolSheet;

const stopFrameData = [
  { x: 3, y: 8, w: 128, h: 195 },
  { x: 140, y: 12, w: 135, h: 188 },
  { x: 285, y: 8, w: 125, h: 195 },
  { x: 424, y: 11, w: 126, h: 190 },
  { x: 563, y: 10, w: 129, h: 192 },
  { x: 700, y: 9, w: 134, h: 193 },
  { x: 843, y: 9, w: 128, h: 193 },
  { x: 986, y: 0, w: 122, h: 212 },
  { x: 1126, y: 9, w: 123, h: 193 },
  { x: 1268, y: 2, w: 118, h: 208 },
  { x: 1408, y: 0, w: 118, h: 211 },
  { x: 1540, y: 6, w: 134, h: 199 },
  { x: 1687, y: 9, w: 120, h: 194 },
  { x: 1825, y: 11, w: 124, h: 190 },
];

const walkFrameData = [
  { x: 16, y: 0, w: 102, h: 198 },
  { x: 139, y: 4, w: 134, h: 190 },
  { x: 301, y: 2, w: 88, h: 194 },
  { x: 445, y: 0, w: 77, h: 197 },
  { x: 569, y: 2, w: 107, h: 194 },
  { x: 698, y: 4, w: 127, h: 190 },
  { x: 851, y: 2, w: 100, h: 193 },
  { x: 1003, y: 1, w: 74, h: 196 },
  { x: 1127, y: 2, w: 104, h: 193 },
];

const jumpFrameData = [
  { x: 14, y: 16, w: 103, h: 155 },
  { x: 137, y: 15, w: 132, h: 157 },
  { x: 274, y: 22, w: 132, h: 144 },
  { x: 415, y: 3, w: 124, h: 182 },
  { x: 552, y: 3, w: 124, h: 182 },
  { x: 703, y: 27, w: 96, h: 133 },
  { x: 840, y: 32, w: 96, h: 123 },
  { x: 977, y: 32, w: 96, h: 123 },
  { x: 1114, y: 27, w: 96, h: 133 },
  { x: 1235, y: 5, w: 128, h: 178 },
  { x: 1370, y: 0, w: 132, h: 188 },
  { x: 1507, y: 22, w: 132, h: 144 },
  { x: 1644, y: 15, w: 132, h: 157 },
  { x: 1782, y: 11, w: 130, h: 165 },
];

const attackFrameData = [
  { x: 8, y: 3, w: 240, h: 139 },
  { x: 261, y: 0, w: 256, h: 146 },
  { x: 535, y: 3, w: 229, h: 139 },
];

const toolFrameData = [
  { x: 0, y: 3, w: 144, h: 12 },
  { x: 168, y: 0, w: 105, h: 19 },
  { x: 307, y: 1, w: 125, h: 17 },
  { x: 451, y: 1, w: 135, h: 16 },
  { x: 618, y: 0, w: 100, h: 19 },
];

let animations = {};
let currentAnim = 'stop';
let frameIndex = 0;
let animClock = 0;
let facingLeft = false;
let posX;
let velX = 0;
let posY;
let groundY;
let velY = 0;
let isJumping = false;
let isAttacking = false;
let attackHold = false;
let toolFrames = [];
let toolFrameIndex = 0;
let toolClock = 0;
let toolProjectiles = [];

function preload() {
  stopSheet = loadImage('stop/stop.png');
  walkSheet = loadImage('walk/walk.png');
  jumpSheet = loadImage('jump/jump.png');
  attackSheet = loadImage('push/push.png');
  toolSheet = loadImage('tool/tool.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  animations.stop = prepareAnimation(stopSheet, stopFrameData);
  animations.walk = prepareAnimation(walkSheet, walkFrameData);
  animations.jump = prepareAnimation(jumpSheet, jumpFrameData);
  animations.attack = prepareAnimation(attackSheet, attackFrameData);
  toolFrames = prepareAnimation(toolSheet, toolFrameData).frames;
  frameRate(24);
  posX = width / 2;
  groundY = height * 0.65;
  posY = groundY;
}

function prepareAnimation(sheet, data) {
  let maxH = 0;
  const frames = data.map((frame) => {
    const img = sheet.get(frame.x, frame.y, frame.w, frame.h);
    if (frame.h > maxH) {
      maxH = frame.h;
    }
    return img;
  });
  return { frames, maxH };
}

function draw() {
  background(bgColor);
  updateMovementState();

  const anim = animations[currentAnim];
  if (!anim || !anim.frames.length) return;

  posX += velX;

  const current = anim.frames[frameIndex];
  const halfW = current.width / 2;
  posX = constrain(posX, halfW, width - halfW);
  handleJumpPhysics();

  const x = posX - halfW;
  const y = posY - current.height;
  drawFrame(current, x, y, facingLeft);

  advanceAnimation();
  updateToolAnimation();
  updateProjectiles();
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    facingLeft = false;
    velX = moveSpeed;
    if (!isJumping && !isAttacking) {
      switchAnim('walk');
    }
  }
  if (keyCode === LEFT_ARROW) {
    facingLeft = true;
    velX = -moveSpeed;
    if (!isJumping && !isAttacking) {
      switchAnim('walk');
    }
  }
  if (keyCode === UP_ARROW) {
    startJump();
  }
  if (key === ' ') {
    attackHold = true;
    startAttack();
  }
}

function keyReleased() {
  if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) {
    if (!keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) {
      velX = 0;
      if (!isJumping && !isAttacking) {
        switchAnim('stop');
      }
    }
  }
  if (key === ' ') {
    attackHold = false;
  }
}

function switchAnim(name) {
  if (currentAnim !== name && animations[name]) {
    currentAnim = name;
    frameIndex = 0;
    animClock = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  posX = constrain(posX, 0, width);
  groundY = height * 0.65;
  posY = min(posY, groundY);
}

function drawFrame(img, x, y, flip) {
  push();
  if (flip) {
    translate(x + img.width, y);
    scale(-1, 1);
    image(img, 0, 0);
  } else {
    image(img, x, y);
  }
  pop();
}

function updateMovementState() {
  if (isAttacking && !isJumping) {
    return;
  }

  if (keyIsDown(LEFT_ARROW)) {
    facingLeft = true;
    velX = -moveSpeed;
    if (!isJumping) {
      switchAnim('walk');
    }
  } else if (keyIsDown(RIGHT_ARROW)) {
    facingLeft = false;
    velX = moveSpeed;
    if (!isJumping) {
      switchAnim('walk');
    }
  } else if (!isJumping && (velX !== 0 || currentAnim !== 'stop')) {
    velX = 0;
    switchAnim('stop');
  }
}

function startJump() {
  if (!isJumping) {
    isJumping = true;
    velY = -jumpStrength;
    switchAnim('jump');
  }
}

function handleJumpPhysics() {
  if (isJumping || velY !== 0) {
    posY += velY;
    velY += gravity;
    if (posY >= groundY) {
      posY = groundY;
      velY = 0;
      isJumping = false;
      if (isAttacking) {
        // remain attacking until animation ends
      } else if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) {
        switchAnim('walk');
      } else {
        switchAnim('stop');
      }
    }
  }
}

function startAttack() {
  if (!isJumping && !isAttacking) {
    isAttacking = true;
    toolFrameIndex = 0;
    toolClock = 0;
    switchAnim('attack');
    spawnProjectile();
  }
}

function advanceAnimation() {
  const rate = animRates[currentAnim] || 14;
  const frameDuration = 1000 / rate;
  animClock += deltaTime;
  const anim = animations[currentAnim];
  while (animClock >= frameDuration) {
    frameIndex = (frameIndex + 1) % anim.frames.length;
    animClock -= frameDuration;
    if (frameIndex === 0 && currentAnim === 'attack') {
      if (attackHold) {
        spawnProjectile();
      } else {
        isAttacking = false;
        if (!isJumping) {
          if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) {
            switchAnim('walk');
          } else {
            switchAnim('stop');
          }
        }
      }
    }
  }
}

function updateToolAnimation() {
  if (!toolFrames.length) return;
  const frameDuration = 1000 / animRates.attack;
  toolClock += deltaTime;
  while (toolClock >= frameDuration) {
    toolFrameIndex = (toolFrameIndex + 1) % toolFrames.length;
    toolClock -= frameDuration;
  }
}

function spawnProjectile() {
  if (!toolFrames.length) return;
  const dir = facingLeft ? -1 : 1;
  const startX = posX + dir * 80;
  const startY = posY - animations.attack.maxH * 0.55; // launch from belly height
  toolProjectiles.push({
    x: startX,
    y: startY,
    vx: dir * toolSpeed,
    facingLeft: facingLeft,
  });
}

function updateProjectiles() {
  if (!toolFrames.length) return;
  const toolImg = toolFrames[toolFrameIndex];
  toolProjectiles = toolProjectiles.filter((p) => p.x > -toolImg.width * 2 && p.x < width + toolImg.width * 2);
  for (const p of toolProjectiles) {
    p.x += p.vx;
    drawFrame(toolImg, p.x, p.y, p.facingLeft);
  }
}
