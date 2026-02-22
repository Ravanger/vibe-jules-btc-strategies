/**
 * Generates random numbers with a normal distribution using the Box-Muller transform.
 */
export function randn(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Simulates Bitcoin price data using Geometric Brownian Motion.
 * 
 * @param days Number of days to simulate.
 * @param initialPrice The starting price.
 * @param drift Daily drift (expected return).
 * @param volatility Daily volatility.
 * @returns An array of simulated daily prices.
 */
export function generatePrices(
    days: number,
    initialPrice: number = 60000,
    drift: number = 0.0005,
    volatility: number = 0.05
): number[] {
    const prices: number[] = [initialPrice];
    let currentPrice = initialPrice;

    for (let i = 1; i < days; i++) {
        const shock = drift - 0.5 * Math.pow(volatility, 2) + volatility * randn();
        currentPrice = currentPrice * Math.exp(shock);
        prices.push(currentPrice);
    }

    return prices;
}
