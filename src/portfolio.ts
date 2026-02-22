import type { Signal } from "./trading.js";

export interface Trade {
    day: number;
    type: "BUY" | "SELL";
    price: number;
    amount: number;
    value: number;
}

export class Portfolio {
    cash: number;
    btc: number;
    ledger: Trade[];
    initialBalance: number;

    constructor(initialBalance: number = 100000) {
        this.cash = initialBalance;
        this.initialBalance = initialBalance;
        this.btc = 0;
        this.ledger = [];
    }

    executeTrade(signal: Signal) {
        if (signal.action === "BUY" && this.cash > 0) {
            const amountToBuy = this.cash / signal.price;
            const tradeValue = this.cash;
            this.ledger.push({
                day: signal.date,
                type: "BUY",
                price: signal.price,
                amount: amountToBuy,
                value: tradeValue
            });
            this.btc += amountToBuy;
            this.cash = 0;
        } else if (signal.action === "SELL" && this.btc > 0) {
            const tradeValue = this.btc * signal.price;
            this.ledger.push({
                day: signal.date,
                type: "SELL",
                price: signal.price,
                amount: this.btc,
                value: tradeValue
            });
            this.cash += tradeValue;
            this.btc = 0;
        }
    }

    getPortfolioValue(currentPrice: number): number {
        return this.cash + this.btc * currentPrice;
    }

    printLedger() {
        console.log("\n--- Trading Ledger ---");
        if (this.ledger.length === 0) {
            console.log("No trades were executed during this period.");
            console.log("------------------------------------------\n");
            return;
        }
        console.log("Day | Type | Price     | Amount   | Value");
        console.log("------------------------------------------");
        this.ledger.forEach(trade => {
            console.log(
                `${trade.day.toString().padEnd(3)} | ` +
                `${trade.type.padEnd(4)} | ` +
                `${trade.price.toFixed(2).padEnd(9)} | ` +
                `${trade.amount.toFixed(4).padEnd(8)} | ` +
                `${trade.value.toFixed(2)}`
            );
        });
        console.log("------------------------------------------\n");
    }

    printPerformance(finalPrice: number) {
        const finalValue = this.getPortfolioValue(finalPrice);
        const profit = finalValue - this.initialBalance;
        const returnPct = (profit / this.initialBalance) * 100;

        console.log("--- Portfolio Performance ---");
        console.log(`Initial Balance: $${this.initialBalance.toFixed(2)}`);
        console.log(`Final Portfolio Value: $${finalValue.toFixed(2)}`);
        console.log(`Total Profit/Loss: $${profit.toFixed(2)} (${returnPct.toFixed(2)}%)`);
        console.log("------------------------------\n");
    }
}
