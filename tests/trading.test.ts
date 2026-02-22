import { getTradingSignals } from "../src/trading.js";

describe("Trading Logic", () => {
    test("should calculate signals for golden_cross", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "golden_cross");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("ma7");
        expect(signals[0]).toHaveProperty("ma30");
    });

    test("should calculate signals for rsi", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "rsi");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("rsi");
    });

    test("should calculate signals for macd", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "macd");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("macd");
    });

    test("should calculate signals for bollinger", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "bollinger");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("upper");
        expect(signals[0]).toHaveProperty("lower");
    });

    test("should calculate signals for mean_reversion", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "mean_reversion");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("ma20");
    });
});
