import { EventEmitter } from "events";

/**
 * Manages simulation time and tick progression.
 *
 * The TimeManager controls the simulation's time flow, including pause/resume,
 * speed adjustment, and tick events. It emits a "tick" event on each simulation step.
 *
 * @extends EventEmitter
 *
 * @example
 * ```typescript
 * const timeManager = new TimeManager();
 * timeManager.on('tick', (tick) => {
 *   console.log(`Simulation tick: ${tick}`);
 * });
 * timeManager.start();
 * timeManager.setSpeed(2); // 2x speed
 * ```
 */
export class TimeManager extends EventEmitter {
  private paused: boolean = false;
  private tickRateMultiplier: number = 1;
  private readonly BASE_TICK_RATE: number = 1000; // 1 second
  private intervalId: NodeJS.Timeout | null = null;
  private currentTick: number = 0;

  constructor() {
    super();
  }

  /**
   * Starts the simulation time loop.
   *
   * Begins emitting "tick" events at the configured rate.
   */
  public start(): void {
    this.startLoop();
  }

  /**
   * Stops the simulation time loop.
   *
   * Clears the interval and stops emitting tick events.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Pauses the simulation.
   *
   * The time loop continues running but tick events are not emitted
   * and the tick counter does not advance.
   */
  public pause(): void {
    this.paused = true;
  }

  /**
   * Resumes the simulation from a paused state.
   */
  public resume(): void {
    this.paused = false;
  }

  /**
   * Sets the simulation speed multiplier.
   *
   * @param multiplier - Speed multiplier (1, 2, 4, 8, or 16)
   * @throws Error if multiplier is not one of the allowed values
   *
   * @example
   * ```typescript
   * timeManager.setSpeed(4); // 4x speed (250ms per tick)
   * ```
   */
  public setSpeed(multiplier: number): void {
    if ([1, 2, 4, 8, 16].includes(multiplier)) {
      this.tickRateMultiplier = multiplier;
      this.startLoop(); // Restart with new speed
    } else {
      throw new Error("Invalid speed multiplier");
    }
  }

  /**
   * Manually sets the current tick number.
   *
   * Used for loading saved games or synchronization.
   *
   * @param tick - Tick number to set
   */
  public setTick(tick: number): void {
    this.currentTick = tick;
  }

  /**
   * Gets the current simulation status.
   *
   * @returns Object containing paused state, speed multiplier, and current tick
   */
  public getStatus() {
    return {
      paused: this.paused,
      speed: this.tickRateMultiplier,
      tick: this.currentTick,
    };
  }

  /**
   * Starts or restarts the tick interval loop.
   * @private
   */
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
