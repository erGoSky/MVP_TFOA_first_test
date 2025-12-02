import { EventEmitter } from "events";

export class TimeManager extends EventEmitter {
  private paused: boolean = false;
  private tickRateMultiplier: number = 1;
  private readonly BASE_TICK_RATE: number = 1000; // 1 second
  private intervalId: NodeJS.Timeout | null = null;
  private currentTick: number = 0;

  constructor() {
    super();
  }

  public start(): void {
    this.startLoop();
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public setSpeed(multiplier: number): void {
    if ([1, 2, 4, 8, 16].includes(multiplier)) {
      this.tickRateMultiplier = multiplier;
      this.startLoop(); // Restart with new speed
    } else {
      throw new Error("Invalid speed multiplier");
    }
  }

  public setTick(tick: number): void {
    this.currentTick = tick;
  }

  public getStatus() {
    return {
      paused: this.paused,
      speed: this.tickRateMultiplier,
      tick: this.currentTick,
    };
  }

  private startLoop(): void {
    this.stop(); // Clear existing interval

    const tickRate = this.BASE_TICK_RATE / this.tickRateMultiplier;
    this.intervalId = setInterval(() => {
      if (!this.paused) {
        this.currentTick++;
        this.emit("tick", this.currentTick);
      }
    }, tickRate);
  }
}
