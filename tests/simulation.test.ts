import { fetchBitcoinData } from "../src/simulation.js";

describe("Simulation", () => {
    test("fetchBitcoinData should return an array of prices", async () => {
        const data = await fetchBitcoinData();
        expect(Array.isArray(data)).toBe(true);
        if (data.length > 0) {
            expect(data[0]).toHaveProperty("time");
            expect(data[0]).toHaveProperty("price");
        }
    });
});
