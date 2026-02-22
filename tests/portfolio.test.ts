import { Portfolio } from "../src/portfolio.js";
import type { Signal } from "../src/trading.js";

describe("Portfolio", () => {
    test("should initialize with USD goal", () => {
        const p = new Portfolio(1000, "USD");
        expect(p.cash).toBe(1000);
        expect(p.asset).toBe(0);
    });

    test("should initialize with ACCUMULATE goal", () => {
        const p = new Portfolio(50000, "ACCUMULATE", 50000);
        expect(p.asset).toBe(1);
        expect(p.cash).toBe(0);
        expect(p.initialValueUSD).toBe(50000);
    });

    test("should execute BUY trade", () => {
        const p = new Portfolio(1000, "USD");
        const signal: Signal = {
            date: 1,
            price: 100,
            action: "BUY",
            reason: "Test Buy"
        };
        p.executeTrade(signal);
        expect(p.cash).toBe(0);
        expect(p.asset).toBe(10);
        expect(p.ledger[0].reason).toBe("Test Buy");
    });

    test("should execute SHORT and COVER", () => {
        const p = new Portfolio(1000, "USD");
        const shortSignal: Signal = {
            date: 1,
            price: 100,
            action: "SHORT",
            reason: "Test Short"
        };
        p.executeTrade(shortSignal);
        expect(p.asset).toBe(-10);
        expect(p.cash).toBe(2000);

        const coverSignal: Signal = {
            date: 2,
            price: 50,
            action: "COVER",
            reason: "Test Cover"
        };
        p.executeTrade(coverSignal);
        expect(p.asset).toBe(0);
        expect(p.cash).toBe(1500);
    });
});
