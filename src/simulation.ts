import fs from 'fs';

const CACHE_FILE = '.btc_price_cache.json';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Simulates Cryptocurrency price data using real data from CoinCap.
 */
export async function fetchBitcoinData(): Promise<{timestamp: number, price: number}[]> {
    if (fs.existsSync(CACHE_FILE)) {
        const stats = fs.statSync(CACHE_FILE);
        if (Date.now() - stats.mtime.getTime() < CACHE_DURATION) {
            try {
                return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            } catch (e) { /* ignore and fetch new */ }
        }
    }
    try {
        const response = await fetch('https://api.coincap.io/v2/assets/bitcoin/history?interval=d1');
        if (!response.ok) throw new Error('Network response was not ok');
        const data: any = await response.json();
        const prices = data.data.map((d: any) => ({
            timestamp: d.time,
            price: parseFloat(d.priceUsd)
        }));
        fs.writeFileSync(CACHE_FILE, JSON.stringify(prices));
        return prices;
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
