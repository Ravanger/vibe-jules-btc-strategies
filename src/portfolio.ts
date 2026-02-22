import type { Signal } from "./trading.js";

export interface Trade {
    day: number;
    type: "BUY" | "SELL" | "SHORT" | "COVER";
    price: number;
    amount: number;
    value: number;
}

export type PortfolioGoal = "USD" | "BTC";

export class Portfolio {
    cash: number;
    btc: number;
    ledger: Trade[];
    initialBalance: number;
    goal: PortfolioGoal;

    constructor(initialBalance: number = 100000, goal: PortfolioGoal = "USD") {
        this.cash = initialBalance;
        this.initialBalance = initialBalance;
        this.btc = 0;
        this.ledger = [];
        this.goal = goal;
    }

    executeTrade(signal: Signal) {
        const action = signal.action;
        const price = signal.price;

        if (action === "BUY") {
            if (this.btc < 0) this.coverShort(price, signal.date);
            if (this.cash > 0) {
                const amountToBuy = this.cash / price;
                this.ledger.push({ day: signal.date, type: "BUY", price, amount: amountToBuy, value: this.cash });
                this.btc += amountToBuy; this.cash = 0;
            }
        } else if (action === "SELL") {
            if (this.btc > 0) {
                const tradeValue = this.btc * price;
                this.ledger.push({ day: signal.date, type: "SELL", price, amount: this.btc, value: tradeValue });
                this.cash += tradeValue; this.btc = 0;
            }
        } else if (action === "SHORT") {
            if (this.btc > 0) this.executeTrade({ ...signal, action: "SELL" });
            if (this.btc === 0 && this.cash > 0) {
                const amountToShort = this.cash / price;
                this.ledger.push({ day: signal.date, type: "SHORT", price, amount: amountToShort, value: this.cash });
                this.cash += this.cash; this.btc -= amountToShort;
            }
        } else if (action === "COVER") {
            this.coverShort(price, signal.date);
        }
    }

    private coverShort(price: number, day: number) {
        if (this.btc < 0) {
            const amountToCover = Math.abs(this.btc);
            const costToCover = amountToCover * price;
            this.ledger.push({ day: day, type: "COVER", price: price, amount: amountToCover, value: costToCover });
            this.cash -= costToCover; this.btc = 0;
        }
    }

    getPortfolioValue(currentPrice: number): number {
        return this.cash + this.btc * currentPrice;
    }

    getFinalMetric(finalPrice: number): { value: number, unit: string } {
        const totalValueUSD = this.getPortfolioValue(finalPrice);
        if (this.goal === "BTC") return { value: totalValueUSD / finalPrice, unit: "BTC" };
        return { value: totalValueUSD, unit: "$" };
    }

    printPerformance(finalPrice: number) {
        const finalValue = this.getPortfolioValue(finalPrice);
        const profit = finalValue - this.initialBalance;
        const returnPct = (profit / this.initialBalance) * 100;
        console.log(`Initial Balance: $${this.initialBalance.toFixed(2)}`);
        console.log(`Final Portfolio Value: $${finalValue.toFixed(2)}`);
        console.log(`Total Profit/Loss: $${profit.toFixed(2)} (${returnPct.toFixed(2)}%)`);
    }

    printLedger() {
        console.log("\n--- Trading Ledger ---");
        this.ledger.forEach(t => {
            console.log(`Day ${t.day}: ${t.type.padEnd(5)} at $${t.price.toFixed(2).padEnd(9)} | Amount: ${t.amount.toFixed(4).padEnd(8)} | Value: $${t.value.toFixed(2)}`);
        });
    }
}
