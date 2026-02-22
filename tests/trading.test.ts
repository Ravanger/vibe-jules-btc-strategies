import { getTradingSignals } from "../src/trading.js";

describe("Trading Logic", () => {
    test("should calculate signals for ema_cross", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "ema_cross");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("ema12");
        expect(signals[0]).toHaveProperty("ema26");
    });

    test("should calculate signals for sma_cross", () => {
        const prices = Array.from({ length: 250 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "sma_cross");
        expect(signals.length).toBe(250);
        expect(signals[0]).toHaveProperty("sma50");
        expect(signals[0]).toHaveProperty("sma200");
    });

    test("should support shorting signals", () => {
        // RSI is easier to trigger with few points
        const prices = [
            ...Array(20).fill(100),
            ...Array(20).fill(1000), // Overbought
            ...Array(20).fill(500)  // Drop
        ];
        const signals = getTradingSignals(prices, "rsi", true);
        const shortSignals = signals.filter(s => s.action === "SHORT");
        expect(shortSignals.length).toBeGreaterThan(0);
    });

    test("should calculate RSI signals correctly", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i) * 20);
        const signals = getTradingSignals(prices, "rsi");
        expect(signals[signals.length - 1]).toHaveProperty("rsi");
    });
});
