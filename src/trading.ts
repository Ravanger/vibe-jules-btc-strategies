import * as dfd from "danfojs-node";

export interface Signal {
    date: number;
    time?: number;
    price: number;
    maFast?: number;
    maSlow?: number;
    rsi?: number;
    action: "BUY" | "SELL" | "HOLD";
}

export type StrategyType = "GOLDEN_CROSS" | "SMA_CROSSOVER" | "RSI";

/**
 * Custom rolling mean implementation.
 */
function rollingMean(values: number[], window: number): number[] {
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
 * Custom RSI implementation.
 */
function calculateRSI(values: number[], window: number = 14): number[] {
    const rsi: number[] = new Array(values.length).fill(NaN);
    if (values.length <= window) return rsi;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= window; i++) {
        const diff = values[i] - values[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / window;
    let avgLoss = losses / window;

    for (let i = window + 1; i < values.length; i++) {
        const diff = values[i] - values[i - 1];
        let currentGain = 0;
        let currentLoss = 0;
        if (diff >= 0) currentGain = diff;
        else currentLoss = -diff;

        avgGain = (avgGain * (window - 1) + currentGain) / window;
        avgLoss = (avgLoss * (window - 1) + currentLoss) / window;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + rs));
    }

    return rsi;
}

/**
 * Calculates trading signals based on the selected strategy.
 */
export function getTradingSignals(prices: number[], strategy: StrategyType = "GOLDEN_CROSS"): Signal[] {
    const signals: Signal[] = [];

    let fastWindow = 7;
    let slowWindow = 30;

    if (strategy === "SMA_CROSSOVER") {
        fastWindow = 20;
        slowWindow = 50;
    }

    const maFast = rollingMean(prices, fastWindow);
    const maSlow = rollingMean(prices, slowWindow);
    const rsiValues = strategy === "RSI" ? calculateRSI(prices, 14) : [];

    for (let i = 0; i < prices.length; i++) {
        let action: "BUY" | "SELL" | "HOLD" = "HOLD";

        if (strategy === "GOLDEN_CROSS" || strategy === "SMA_CROSSOVER") {
            const currentFast = maFast[i];
            const currentSlow = maSlow[i];
            const prevFast = i > 0 ? maFast[i - 1] : NaN;
            const prevSlow = i > 0 ? maSlow[i - 1] : NaN;

            if (!isNaN(currentFast) && !isNaN(currentSlow) && !isNaN(prevFast) && !isNaN(prevSlow)) {
                if (prevFast <= prevSlow && currentFast > currentSlow) {
                    action = "BUY";
                } else if (prevFast >= prevSlow && currentFast < currentSlow) {
                    action = "SELL";
                }
            }
        } else if (strategy === "RSI") {
            const currentRsi = rsiValues[i];
            const prevRsi = i > 0 ? rsiValues[i - 1] : NaN;

            if (!isNaN(currentRsi) && !isNaN(prevRsi)) {
                if (prevRsi >= 30 && currentRsi < 30) {
                    action = "BUY";
                } else if (prevRsi <= 70 && currentRsi > 70) {
                    action = "SELL";
                }
            }
        }

        signals.push({
            date: i,
            price: prices[i],
            maFast: maFast[i],
            maSlow: maSlow[i],
            rsi: rsiValues[i],
            action
        });
    }

    return signals;
}
