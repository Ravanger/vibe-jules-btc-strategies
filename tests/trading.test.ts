import { getTradingSignals } from "../src/trading.js";

describe("Trading Logic", () => {
    test("should calculate signals for ema_cross", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "ema_cross");
        expect(signals.length).toBe(60);
        expect(signals[0]).toHaveProperty("ema12");
    });

    test("should calculate signals for stochastic", () => {
        const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
        const signals = getTradingSignals(prices, "stochastic");
        expect(signals[signals.length - 1]).toHaveProperty("stochK");
    });

    test("should include reasons in signals", () => {
        const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 90, 80, 70, 60, 50, 40, 30, 20, 10];
        const signals = getTradingSignals(prices, "rsi");
        const tradeSignals = signals.filter(s => s.action !== "HOLD");
        if (tradeSignals.length > 0) {
            expect(tradeSignals[0].reason).toBeDefined();
            expect(tradeSignals[0].reason.length).toBeGreaterThan(0);
        }
    });
});
