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
            ma7: 110,
            ma30: 105,
            action: "BUY"
        };
        p.executeTrade(signal);
        expect(p.cash).toBe(0);
        expect(p.btc).toBe(10);
        expect(p.ledger.length).toBe(1);
        expect(p.ledger[0]?.type).toBe("BUY");
    });

    test("should execute SELL trade", () => {
        const p = new Portfolio(0);
        p.btc = 10;
        const signal: Signal = {
            date: 2,
            price: 150,
            ma7: 140,
            ma30: 145,
            action: "SELL"
        };
        p.executeTrade(signal);
        expect(p.cash).toBe(1500);
        expect(p.btc).toBe(0);
        expect(p.ledger.length).toBe(1);
        expect(p.ledger[0]?.type).toBe("SELL");
    });

    test("should calculate portfolio value correctly", () => {
        const p = new Portfolio(500);
        p.btc = 2;
        // value = 500 + 2 * 250 = 1000
        expect(p.getPortfolioValue(250)).toBe(1000);
    });
});
