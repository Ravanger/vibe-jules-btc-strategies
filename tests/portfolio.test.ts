import { Portfolio } from "../src/portfolio.js";
import type { Signal } from "../src/trading.js";

describe("Portfolio", () => {
    test("should initialize with correct balance", () => {
        const p = new Portfolio(1000);
        expect(p.cash).toBe(1000);
        expect(p.btc).toBe(0);
    });

    test("should execute BUY trade", () => {
        const p = new Portfolio(1000);
        const signal: Signal = {
            date: 1,
            price: 100,
            action: "BUY"
        };
        p.executeTrade(signal);
        expect(p.cash).toBe(0);
        expect(p.btc).toBe(10);
    });

    test("should execute SHORT and COVER", () => {
        const p = new Portfolio(1000);
        const shortSignal: Signal = {
            date: 1,
            price: 100,
            action: "SHORT"
        };
        p.executeTrade(shortSignal);
        // Shorting 1000 worth at 100 = 10 BTC
        // Cash becomes 1000 (initial) + 1000 (from short) = 2000
        expect(p.btc).toBe(-10);
        expect(p.cash).toBe(2000);

        const coverSignal: Signal = {
            date: 2,
            price: 50,
            action: "COVER"
        };
        p.executeTrade(coverSignal);
        // Covering 10 BTC at 50 = 500 cost
        // Cash becomes 2000 - 500 = 1500
        expect(p.btc).toBe(0);
        expect(p.cash).toBe(1500);
    });

    test("should handle BTC accumulation goal", () => {
        const p = new Portfolio(1000, "BTC");
        // Final price 100
        const finalPrice = 100;
        // Total value is $1000 (all cash)
        // BTC equivalent is 1000 / 100 = 10 BTC
        const metric = p.getFinalMetric(finalPrice);
        expect(metric.value).toBe(10);
        expect(metric.unit).toBe("BTC");
    });
});
