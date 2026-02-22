import { generatePrices } from "./simulation.js";
import { getTradingSignals } from "./trading.js";
import { Portfolio } from "./portfolio.js";
import { runFlappyBird } from "./easterEgg.js";

async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--flappy")) {
        await runFlappyBird();
        return;
    }

    console.log("Starting Bitcoin Trading Simulation (60 Days)...");

    const days = 60;
    const prices = generatePrices(days);
    const signals = getTradingSignals(prices);
    
    const portfolio = new Portfolio(100000);

    for (const signal of signals) {
        portfolio.executeTrade(signal);
    }

    portfolio.printLedger();
    portfolio.printPerformance(prices[days - 1]);

    console.log("Tip: Run with --flappy to play the easter egg game!");
}

main().catch(err => {
    console.error("An error occurred:", err);
    process.exit(1);
});
