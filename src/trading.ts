import * as dfd from "danfojs-node";

export interface Signal {
    date: number;
    price: number;
    ma7: number;
    ma30: number;
    action: "BUY" | "SELL" | "HOLD";
}

/**
 * Custom rolling mean implementation since it's missing in danfojs-node v1.
 */
function rollingMean(series: dfd.Series, window: number): number[] {
    const values = series.values as number[];
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        if (i < window - 1) {
            result.push(NaN);
        } else {
            const slice = values.slice(i - window + 1, i + 1);
            const sum = slice.reduce((a, b) => a + b, 0);
            result.push(sum / window);
        }
    }
    return result;
}

/**
 * Calculates trading signals based on the Golden Cross strategy.
 * 
 * @param prices Array of daily prices.
 * @returns Array of signals for each day.
 */
export function getTradingSignals(prices: number[]): Signal[] {
    const df = new dfd.DataFrame({ price: prices });
    
    // Calculate Moving Averages manually but using Danfo.js Series
    const priceSeries = df["price"] as dfd.Series;
    const ma7Values = rollingMean(priceSeries, 7);
    const ma30Values = rollingMean(priceSeries, 30);

    const signals: Signal[] = [];

    for (let i = 0; i < prices.length; i++) {
        const currentMa7 = ma7Values[i]!;
        const currentMa30 = ma30Values[i]!;
        
        let action: "BUY" | "SELL" | "HOLD" = "HOLD";

        if (!isNaN(currentMa7) && !isNaN(currentMa30)) {
            const prevMa7 = i > 0 ? ma7Values[i - 1]! : NaN;
            const prevMa30 = i > 0 ? ma30Values[i - 1]! : NaN;

            if (!isNaN(prevMa7) && !isNaN(prevMa30)) {
                if (prevMa7 <= prevMa30 && currentMa7 > currentMa30) {
                    action = "BUY";
                } else if (prevMa7 >= prevMa30 && currentMa7 < currentMa30) {
                    action = "SELL";
                }
            }
        }

        signals.push({
            date: i,
            price: prices[i]!,
            ma7: currentMa7,
            ma30: currentMa30,
            action
        });
    }

    return signals;
}
