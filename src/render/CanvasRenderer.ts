// ========================================
// Canvas2D Renderer with Glow Effects
// Dual-layer compositing for bloom
// ========================================

import type {
  Food,
  GameSettings,
  Particle,
  RenderState,
  SnakeSegment,
  ThemeColors,
} from '../types';
import { THEMES } from '../types';

export interface RendererConfig {
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  dpr: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Offscreen canvas for glow layer
  private glowCanvas: HTMLCanvasElement;
  private glowCtx: CanvasRenderingContext2D;

  private config: RendererConfig;
  private theme: ThemeColors;
  private bloomIntensity: number = 0.6;
  private motionReduce: boolean = false;

  // Performance
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  // Grid animation
  private warpTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    // Create offscreen glow canvas
    this.glowCanvas = document.createElement('canvas');
    this.glowCtx = this.glowCanvas.getContext('2d', { alpha: true })!;

    this.theme = THEMES.cyber;
    this.config = {
      cellSize: 24,
      gridWidth: 20,
      gridHeight: 20,
      dpr: window.devicePixelRatio || 1,
    };
  }

  // ========================================
  // Configuration
  // ========================================

  resize(width: number, height: number): RendererConfig {
    const dpr = window.devicePixelRatio || 1;

    // Calculate optimal cell size based on screen dimensions
    const cellSize = Math.max(16, Math.min(32, Math.floor(Math.min(width, height) / 22)));

    const gridWidth = Math.max(10, Math.min(30, Math.floor((width - 40) / cellSize)));
    const gridHeight = Math.max(10, Math.min(25, Math.floor((height - 100) / cellSize)));

    this.config = { cellSize, gridWidth, gridHeight, dpr };

    // Resize main canvas
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    // Resize glow canvas
    this.glowCanvas.width = width * dpr;
    this.glowCanvas.height = height * dpr;
    this.glowCtx.scale(dpr, dpr);

    return this.config;
  }

  setSettings(settings: GameSettings): void {
    this.theme = THEMES[settings.theme];
    this.bloomIntensity = settings.bloomIntensity;
    this.motionReduce = settings.motionReduce;
  }

  setTheme(theme: ThemeColors): void {
    this.theme = theme;
  }

  getConfig(): RendererConfig {
    return this.config;
  }

  // ========================================
  // Utility Functions
  // ========================================

  private getGridOffset(): { x: number; y: number } {
    const totalWidth = this.config.gridWidth * this.config.cellSize;
    const totalHeight = this.config.gridHeight * this.config.cellSize;
    const canvasWidth = this.canvas.width / this.config.dpr;
    const canvasHeight = this.canvas.height / this.config.dpr;

    return {
      x: (canvasWidth - totalWidth) / 2,
      y: (canvasHeight - totalHeight) / 2 + 20, // Offset for HUD
    };
  }

  private gridToPixel(
    gridX: number,
    gridY: number,
    offset: { x: number; y: number }
  ): { x: number; y: number } {
    return {
      x: offset.x + gridX * this.config.cellSize + this.config.cellSize / 2,
      y: offset.y + gridY * this.config.cellSize + this.config.cellSize / 2,
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // ========================================
  // Rendering
  // ========================================

  render(
    state: RenderState,
    alpha: number, // Interpolation alpha (0-1)
    deltaMs: number
  ): void {
    // FPS calculation
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // Update warp time
    if (!this.motionReduce) {
      this.warpTime += deltaMs * 0.002;
    }

    const ctx = this.ctx;
    const glowCtx = this.glowCtx;
    const offset = this.getGridOffset();

    // Apply screen shake
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;

    // Clear canvases
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);

    // Save and apply shake
    ctx.save();
    glowCtx.save();

    ctx.translate(shakeX, shakeY);
    glowCtx.translate(shakeX, shakeY);

    // Render layers
    this.renderGrid(ctx, offset);
    this.renderFood(ctx, glowCtx, state.food, offset);
    this.renderSnake(ctx, glowCtx, state.snake, state.poppedTail, alpha, offset);
    this.renderParticles(ctx, glowCtx, state.particles, offset);

    ctx.restore();
    glowCtx.restore();

    // Composite glow layer
    if (this.bloomIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = this.bloomIntensity * 0.8;
      ctx.filter = `blur(${8 + this.bloomIntensity * 8}px)`;
      ctx.drawImage(this.glowCanvas, 0, 0);
      ctx.restore();
    }

    // Render vignette
    this.renderVignette(ctx);
  }

  private renderGrid(ctx: CanvasRenderingContext2D, offset: { x: number; y: number }): void {
    const { cellSize, gridWidth, gridHeight } = this.config;

    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1;

    // Draw grid lines with subtle warp effect
    ctx.beginPath();

    // Vertical lines
    for (let x = 0; x <= gridWidth; x++) {
      const baseX = offset.x + x * cellSize;
      ctx.moveTo(baseX, offset.y);
      ctx.lineTo(baseX, offset.y + gridHeight * cellSize);
    }

    // Horizontal lines
    for (let y = 0; y <= gridHeight; y++) {
      const baseY = offset.y + y * cellSize;
      ctx.moveTo(offset.x, baseY);
      ctx.lineTo(offset.x + gridWidth * cellSize, baseY);
    }

    ctx.stroke();

    // Draw border with accent
    ctx.strokeStyle = this.theme.gridAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      offset.x,
      offset.y,
      gridWidth * cellSize,
      gridHeight * cellSize
    );
  }

  private renderFood(
    ctx: CanvasRenderingContext2D,
    glowCtx: CanvasRenderingContext2D,
    food: Food | null,
    offset: { x: number; y: number }
  ): void {
    if (!food) return;

    const pos = this.gridToPixel(food.x, food.y, offset);
    const { cellSize } = this.config;

    // Pulse animation
    const pulse = this.motionReduce
      ? 1
      : 1 + Math.sin(performance.now() / 200) * 0.15;

    // Color based on type
    let color: string;
    switch (food.type) {
      case 'special':
        color = this.theme.foodSpecial;
        break;
      case 'speed':
        color = this.theme.foodSpeed;
        break;
      case 'slow':
        color = this.theme.foodSlow;
        break;
      default:
        color = this.theme.foodNormal;
    }

    const size = (cellSize * 0.7 * pulse) / 2;

    // Glow layer
    glowCtx.fillStyle = color;
    glowCtx.beginPath();
    glowCtx.arc(pos.x, pos.y, size * 1.5, 0, Math.PI * 2);
    glowCtx.fill();

    // Main layer
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(pos.x - size * 0.3, pos.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Expiration indicator for special foods
    if (food.expiresAt) {
      const remaining = food.expiresAt - performance.now();
      const total = 8000;
      const progress = Math.max(0, remaining / total);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        pos.x,
        pos.y,
        size + 4,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress
      );
      ctx.stroke();
    }
  }

  private renderSnake(
    ctx: CanvasRenderingContext2D,
    glowCtx: CanvasRenderingContext2D,
    snake: SnakeSegment[],
    poppedTail: SnakeSegment | null,
    alpha: number,
    offset: { x: number; y: number }
  ): void {
    if (snake.length === 0) return;

    const { cellSize } = this.config;

    // Build interpolated points
    const points: { x: number; y: number }[] = [];

    for (const seg of snake) {
      const x = this.lerp(seg.prevX, seg.x, alpha);
      const y = this.lerp(seg.prevY, seg.y, alpha);
      const pixel = this.gridToPixel(x, y, offset);
      points.push(pixel);
    }

    // Smooth tail extension
    if (poppedTail && snake.length > 0) {
      const last = snake[snake.length - 1];
      const tailX = this.lerp(poppedTail.x, last.prevX, alpha);
      const tailY = this.lerp(poppedTail.y, last.prevY, alpha);
      const tailPixel = this.gridToPixel(tailX, tailY, offset);
      points.push(tailPixel);
    }

    if (points.length < 2) return;

    // Draw body path
    const bodyWidth = cellSize * 0.65;

    // Glow layer
    glowCtx.strokeStyle = this.theme.snakeGlow;
    glowCtx.lineWidth = bodyWidth * 1.3;
    glowCtx.lineCap = 'round';
    glowCtx.lineJoin = 'round';
    this.drawSmoothPath(glowCtx, points);

    // Main body
    ctx.strokeStyle = this.theme.snakeBody;
    ctx.lineWidth = bodyWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.drawSmoothPath(ctx, points);

    // Head highlight
    const head = points[0];

    // Glow for head
    glowCtx.fillStyle = this.theme.snakeHead;
    glowCtx.beginPath();
    glowCtx.arc(head.x, head.y, cellSize * 0.4, 0, Math.PI * 2);
    glowCtx.fill();

    // Main head
    ctx.fillStyle = this.theme.snakeHead;
    ctx.beginPath();
    ctx.arc(head.x, head.y, cellSize * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffset = cellSize * 0.12;
    const eyeSize = cellSize * 0.08;

    ctx.fillStyle = this.theme.background;
    ctx.beginPath();
    ctx.arc(head.x - eyeOffset, head.y - eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.arc(head.x + eyeOffset, head.y - eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSmoothPath(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[]
  ): void {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      // Draw smooth curves through points
      for (let i = 1; i < points.length - 1; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];

        // Calculate corner radius
        const radius = this.config.cellSize * 0.35;

        const v1x = p0.x - p1.x;
        const v1y = p0.y - p1.y;
        const dist1 = Math.sqrt(v1x * v1x + v1y * v1y);

        const v2x = p2.x - p1.x;
        const v2y = p2.y - p1.y;
        const dist2 = Math.sqrt(v2x * v2x + v2y * v2y);

        const r = Math.min(radius, dist1 / 2, dist2 / 2);

        if (r > 0 && dist1 > 0 && dist2 > 0) {
          const startX = p1.x + (v1x / dist1) * r;
          const startY = p1.y + (v1y / dist1) * r;
          const endX = p1.x + (v2x / dist2) * r;
          const endY = p1.y + (v2y / dist2) * r;

          ctx.lineTo(startX, startY);
          ctx.quadraticCurveTo(p1.x, p1.y, endX, endY);
        } else {
          ctx.lineTo(p1.x, p1.y);
        }
      }

      // Connect to last point
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D,
    glowCtx: CanvasRenderingContext2D,
    particles: Particle[],
    offset: { x: number; y: number }
  ): void {
    const { cellSize } = this.config;

    for (const p of particles) {
      const pixelX = offset.x + p.x * cellSize + cellSize / 2;
      const pixelY = offset.y + p.y * cellSize + cellSize / 2;

      if (p.type === 'shockwave') {
        const size = p.size * cellSize * 3;

        glowCtx.strokeStyle = p.color;
        glowCtx.lineWidth = 3;
        glowCtx.globalAlpha = p.life;
        glowCtx.beginPath();
        glowCtx.arc(pixelX, pixelY, size, 0, Math.PI * 2);
        glowCtx.stroke();
        glowCtx.globalAlpha = 1;

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = p.life * 0.5;
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        const size = p.size * cellSize;

        glowCtx.fillStyle = p.color;
        glowCtx.globalAlpha = p.life;
        glowCtx.beginPath();
        glowCtx.arc(
          pixelX + p.vx * cellSize,
          pixelY + p.vy * cellSize,
          size * 1.5,
          0,
          Math.PI * 2
        );
        glowCtx.fill();
        glowCtx.globalAlpha = 1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(
          pixelX + p.vx * cellSize,
          pixelY + p.vy * cellSize,
          size,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  private renderVignette(ctx: CanvasRenderingContext2D): void {
    const width = this.canvas.width / this.config.dpr;
    const height = this.canvas.height / this.config.dpr;

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // ========================================
  // Menu/Overlay Rendering
  // ========================================

  renderMenuBackground(): void {
    const ctx = this.ctx;
    const width = this.canvas.width / this.config.dpr;
    const height = this.canvas.height / this.config.dpr;

    // Animated gradient background
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    const time = performance.now() * 0.001;

    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1;

    const gridSize = 40;
    ctx.beginPath();

    for (let x = 0; x < width; x += gridSize) {
      const wave = this.motionReduce ? 0 : Math.sin(time + x * 0.01) * 2;
      ctx.moveTo(x + wave, 0);
      ctx.lineTo(x - wave, height);
    }

    for (let y = 0; y < height; y += gridSize) {
      const wave = this.motionReduce ? 0 : Math.sin(time + y * 0.01) * 2;
      ctx.moveTo(0, y + wave);
      ctx.lineTo(width, y - wave);
    }

    ctx.stroke();

    this.renderVignette(ctx);
  }

  // ========================================
  // Debug Overlay
  // ========================================

  getFps(): number {
    return this.fps;
  }
}
