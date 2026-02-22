/**
 * Simulates Bitcoin price data using real data from CoinGecko.
 */

export async function fetchBitcoinData(): Promise<{timestamp: number, price: number}[]> {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily');
        if (!response.ok) throw new Error('Network response was not ok');
        const data: any = await response.json();
        return data.prices.map((d: any) => ({
            timestamp: d[0],
            price: d[1]
        }));
    } catch (error) {
        console.error("Failed to fetch Bitcoin data:", error);
        return [];
    }
}

/**
 * @deprecated GBM is no longer used. Use fetchBitcoinData instead.
 */
export function generatePrices(days: number): number[] {
    console.warn("generatePrices (GBM) is deprecated. Use fetchBitcoinData.");
    return new Array(days).fill(60000);
}
