import { fetchBitcoinData } from "./simulation.js";
import { getTradingSignals } from "./trading.js";
import { Portfolio, PortfolioGoal } from "./portfolio.js";
import { runFlappyBird } from "./easterEgg.js";

async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--flappy")) {
        await runFlappyBird();
        return;
    }

    const strategyArg = args.find(a => a.startsWith("--strategy="))?.split("=")[1] || "golden_cross";
    const goalArg = args.find(a => a.startsWith("--goal="))?.split("=")[1] as PortfolioGoal || "USD";
    const shortingArg = args.includes("--shorting");
    const daysArg = parseInt(args.find(a => a.startsWith("--days="))?.split("=")[1] || "60");

    console.log(`Starting Bitcoin Trading Simulation (${daysArg} Days)...`);
    
    const fullData = await fetchBitcoinData();
    if (fullData.length === 0) {
        console.error("Failed to fetch data. Please check your internet connection.");
        return;
    }

    const pricesData = fullData.slice(-daysArg - 200); // Get enough for indicators
    const prices = pricesData.map(d => d.price);
    const signals = getTradingSignals(prices, strategyArg, shortingArg);

    // Slice signals to match the requested days
    const simSignals = signals.slice(-daysArg);
    const portfolio = new Portfolio(100000, goalArg);

    for (const signal of simSignals) {
        portfolio.executeTrade(signal);
    }

    console.log(`\nResults for Strategy: ${strategyArg}, Goal: ${goalArg}, Shorting: ${shortingArg}`);
    portfolio.printPerformance(prices[prices.length - 1]);

    const metric = portfolio.getFinalMetric(prices[prices.length - 1]);
    console.log(`Final Metric (${portfolio.goal}): ${metric.value.toFixed(4)} ${metric.unit}`);

    console.log("\nTip: Run with --flappy to play the easter egg game!");
    console.log("Options: --strategy=[rsi|macd|bollinger|mean_reversion|ema_cross|sma_cross] --goal=[USD|BTC] --shorting --days=60");
}

main().catch(err => {
    console.error("An error occurred:", err);
    process.exit(1);
});
