import { getTradingSignals } from "../src/trading.js";

describe("Trading Logic", () => {
    test("should calculate signals for a given price array", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices);
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("ma7");
        expect(signals[0]).toHaveProperty("ma30");
        expect(signals[0]).toHaveProperty("action");
    });

    test("should detect a Golden Cross (BUY)", () => {
        // Create a scenario where MA7 crosses above MA30
        // Initial state: MA7 < MA30
        const prices = [
            ...Array(30).fill(100), // MA30 will be 100, MA7 will be 100
            ...Array(10).fill(200)  // Price jumps to 200, MA7 will rise faster than MA30
        ];
        const signals = getTradingSignals(prices);
        const buySignals = signals.filter(s => s.action === "BUY");
        expect(buySignals.length).toBeGreaterThan(0);
    });

    test("should detect a Death Cross (SELL)", () => {
        // Create a scenario where MA7 crosses below MA30
        const prices = [
            ...Array(30).fill(200), // MA30 will be 200
            ...Array(10).fill(100)  // Price drops to 100
        ];
        const signals = getTradingSignals(prices);
        const sellSignals = signals.filter(s => s.action === "SELL");
        expect(sellSignals.length).toBeGreaterThan(0);
    });
});
