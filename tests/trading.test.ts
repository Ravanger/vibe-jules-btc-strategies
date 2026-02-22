import { getTradingSignals } from "../src/trading.js";

describe("Trading Logic", () => {
    test("should calculate signals for a given price array", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "GOLDEN_CROSS");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("maFast");
        expect(signals[0]).toHaveProperty("maSlow");
        expect(signals[0]).toHaveProperty("action");
    });

    test("should detect a Golden Cross (BUY)", () => {
        const prices = [
            ...Array(30).fill(100),
            ...Array(10).fill(200)
        ];
        const signals = getTradingSignals(prices, "GOLDEN_CROSS");
        const buySignals = signals.filter(s => s.action === "BUY");
        expect(buySignals.length).toBeGreaterThan(0);
    });

    test("should detect an SMA Crossover (SELL)", () => {
        const prices = [
            ...Array(50).fill(200),
            ...Array(20).fill(100)
        ];
        const signals = getTradingSignals(prices, "SMA_CROSSOVER");
        const sellSignals = signals.filter(s => s.action === "SELL");
        expect(sellSignals.length).toBeGreaterThan(0);
    });

    test("should detect RSI Oversold (BUY)", () => {
        const prices = [
            ...Array(20).fill(100),
            ...Array(20).fill(50) // RSI should drop
        ];
        const signals = getTradingSignals(prices, "RSI");
        const buySignals = signals.filter(s => s.action === "BUY");
        expect(buySignals.length).toBeGreaterThan(0);
    });
});
