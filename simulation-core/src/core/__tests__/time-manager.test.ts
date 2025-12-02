import { TimeManager } from "../time-manager";

describe("TimeManager", () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    timeManager = new TimeManager();
  });

  afterEach(() => {
    timeManager.stop();
  });

  describe("start and stop", () => {
    it("should start emitting tick events", (done) => {
      let tickCount = 0;

      timeManager.on("tick", (tick) => {
        tickCount++;
        if (tickCount === 2) {
          expect(tick).toBeGreaterThan(0);
          timeManager.stop();
          done();
        }
      });

      timeManager.start();
    });

    it("should stop emitting tick events when stopped", (done) => {
      let tickCount = 0;

      timeManager.on("tick", () => {
        tickCount++;
      });

      timeManager.start();

      setTimeout(() => {
        timeManager.stop();
        const countAtStop = tickCount;

        setTimeout(() => {
          expect(tickCount).toBe(countAtStop);
          done();
        }, 1500);
      }, 1500);
    });
  });

  describe("pause and resume", () => {
    it("should pause tick emission", (done) => {
      let tickCount = 0;

      timeManager.on("tick", () => {
        tickCount++;
      });

      timeManager.start();

      setTimeout(() => {
        timeManager.pause();
        const countAtPause = tickCount;

        setTimeout(() => {
          expect(tickCount).toBe(countAtPause);
          timeManager.stop();
          done();
        }, 1500);
      }, 1500);
    });

    it("should resume tick emission after pause", (done) => {
      let tickCount = 0;

      timeManager.on("tick", () => {
        tickCount++;
      });

      timeManager.start();

      setTimeout(() => {
        timeManager.pause();
        const countAtPause = tickCount;

        setTimeout(() => {
          timeManager.resume();

          setTimeout(() => {
            expect(tickCount).toBeGreaterThan(countAtPause);
            timeManager.stop();
            done();
          }, 1500);
        }, 500);
      }, 1000);
    });
  });

  describe("speed multiplier", () => {
    it("should change tick rate with speed multiplier", (done) => {
      let tickCount = 0;

      timeManager.on("tick", () => {
        tickCount++;
      });

      timeManager.start();

      setTimeout(() => {
        const normalSpeed = tickCount;
        tickCount = 0;

        timeManager.setSpeed(2);

        setTimeout(() => {
          expect(tickCount).toBeGreaterThan(normalSpeed);
          timeManager.stop();
          done();
        }, 2000);
      }, 2000);
    });

    it("should throw error for invalid speed multiplier", () => {
      expect(() => timeManager.setSpeed(3)).toThrow("Invalid speed multiplier");
      expect(() => timeManager.setSpeed(10)).toThrow("Invalid speed multiplier");
    });

    it("should accept valid speed multipliers", () => {
      expect(() => timeManager.setSpeed(1)).not.toThrow();
      expect(() => timeManager.setSpeed(2)).not.toThrow();
      expect(() => timeManager.setSpeed(4)).not.toThrow();
      expect(() => timeManager.setSpeed(8)).not.toThrow();
      expect(() => timeManager.setSpeed(16)).not.toThrow();
    });
  });

  describe("setTick", () => {
    it("should set current tick for state restoration", () => {
      timeManager.setTick(100);
      const status = timeManager.getStatus();
      expect(status.tick).toBe(100);
    });
  });

  describe("getStatus", () => {
    it("should return current status", () => {
      const status = timeManager.getStatus();
      expect(status).toHaveProperty("paused");
      expect(status).toHaveProperty("speed");
      expect(status).toHaveProperty("tick");
      expect(status.paused).toBe(false);
      expect(status.speed).toBe(1);
      expect(status.tick).toBe(0);
    });

    it("should reflect paused state", () => {
      timeManager.pause();
      const status = timeManager.getStatus();
      expect(status.paused).toBe(true);
    });

    it("should reflect speed changes", () => {
      timeManager.setSpeed(4);
      const status = timeManager.getStatus();
      expect(status.speed).toBe(4);
    });
  });
});
