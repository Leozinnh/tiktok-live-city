export class Time {
  constructor() {
    this.lastTime = performance.now();
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  update() {
    const now = performance.now();
    let rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp delta time to avoid large jumps if tab was backgrounded or frame rate dropped
    this.deltaTime = Math.min(rawDelta, 0.1);
    this.elapsedTime += this.deltaTime;

    // Calculate FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    return this.deltaTime;
  }
}
