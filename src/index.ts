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
    const daysArg = parseInt(args.find(a => a.startsWith("--days="))?.split("=")[1] || "60");

    console.log(`Starting Crypto Trading Strategies Simulation (${daysArg} Days)...`);
    
    const fullData = await fetchBitcoinData();
    if (fullData.length === 0) {
        console.error("Failed to fetch data.");
        return;
    }

    const pricesData = fullData.slice(-daysArg - 200);
    const prices = pricesData.map(d => d.price);
    const dates = pricesData.map(d => d.timestamp);
    const signals = getTradingSignals(prices, strategyArg, dates);

    const simSignals = signals.slice(-daysArg);
    const startPrice = simSignals[0].price;
    const portfolio = new Portfolio(100000, goalArg, startPrice);

    for (const signal of simSignals) {
        portfolio.executeTrade(signal);
    }

    console.log(`\nResults for Strategy: ${strategyArg}, Goal: ${goalArg}`);
    portfolio.printPerformance(prices[prices.length - 1]);

    const metric = portfolio.getFinalMetric(prices[prices.length - 1]);
    console.log(`Final Metric (${portfolio.goal}): ${metric.value.toFixed(4)} ${metric.unit}`);

    portfolio.printLedger();

    console.log("\nTip: Run with --flappy to play the easter egg game!");
}

main().catch(err => {
    console.error("An error occurred:", err);
    process.exit(1);
});
