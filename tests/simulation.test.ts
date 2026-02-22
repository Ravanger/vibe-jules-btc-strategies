import { generatePrices, randn } from "../src/simulation.js";

describe("Simulation", () => {
    test("randn should return a number", () => {
        const val = randn();
        expect(typeof val).toBe("number");
    });

    test("generatePrices should return the correct number of days", () => {
        const days = 60;
        const prices = generatePrices(days);
        expect(prices.length).toBe(days);
    });

    test("generatePrices should start with the initial price", () => {
        const initialPrice = 50000;
        const prices = generatePrices(10, initialPrice);
        expect(prices[0]).toBe(initialPrice);
    });
});
