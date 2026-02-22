import type { Signal } from "./trading.js";

export interface Trade {
    date: number;
    action: "BUY" | "SELL" | "SHORT" | "COVER";
    price: number;
    amount: number;
    value: number;
    postCash: number;
    postAsset: number;
    reason?: string;
}

export type PortfolioGoal = "USD" | "ACCUMULATE";

export class Portfolio {
    cash: number;
    asset: number;
    ledger: Trade[];
    initialBalance: number;
    initialValueUSD: number;
    goal: PortfolioGoal;

    constructor(initialBalance: number = 100000, goal: PortfolioGoal = "USD", startPrice: number = 0) {
        this.initialBalance = initialBalance;
        this.goal = goal;
        this.ledger = [];

        if (goal === "ACCUMULATE") {
            this.asset = initialBalance;
            this.cash = 0;
            this.initialValueUSD = initialBalance * startPrice;
        } else {
            this.cash = initialBalance;
            this.asset = 0;
            this.initialValueUSD = initialBalance;
        }
    }

    executeTrade(signal: Signal) {
        const action = signal.action;
        const price = signal.price;
        const reason = signal.reason;

        if (action === "BUY") {
            if (this.asset < 0) this.coverShort(price, signal.date, "Auto-covering for buy");
            if (this.cash > 0) {
                const amountToBuy = this.cash / price;
                this.asset += amountToBuy;
                this.cash = 0;
                this.ledger.push({ date: signal.date, action: "BUY", price, amount: amountToBuy, value: amountToBuy * price, postCash: this.cash, postAsset: this.asset, reason });
            }
        } else if (action === "SELL") {
            if (this.asset > 0) {
                const tradeValue = this.asset * price;
                this.cash += tradeValue;
                const soldAsset = this.asset;
                this.asset = 0;
                this.ledger.push({ date: signal.date, action: "SELL", price, amount: soldAsset, value: tradeValue, postCash: this.cash, postAsset: this.asset, reason });
            }
        } else if (action === "SHORT") {
            if (this.asset > 0) this.executeTrade({ ...signal, action: "SELL", reason: "Closing long before shorting" });
            if (this.asset === 0 && this.cash > 0) {
                const amountToShort = this.cash / price;
                this.cash += this.cash; // Collateralized
                this.asset -= amountToShort;
                this.ledger.push({ date: signal.date, action: "SHORT", price, amount: amountToShort, value: amountToShort * price, postCash: this.cash, postAsset: this.asset, reason });
            }
        } else if (action === "COVER") {
            this.coverShort(price, signal.date, reason);
        }
    }

    private coverShort(price: number, date: number, reason?: string) {
        if (this.asset < 0) {
            const amountToCover = Math.abs(this.asset);
            const costToCover = amountToCover * price;
            this.cash -= costToCover;
            this.asset = 0;
            this.ledger.push({ date, action: "COVER", price: price, amount: amountToCover, value: costToCover, postCash: this.cash, postAsset: this.asset, reason });
        }
    }

    getPortfolioValue(currentPrice: number): number {
        return this.cash + this.asset * currentPrice;
    }

    getFinalMetric(finalPrice: number): { value: number, unit: string } {
        const totalValueUSD = this.getPortfolioValue(finalPrice);
        if (this.goal === "ACCUMULATE") return { value: totalValueUSD / finalPrice, unit: "Assets" };
        return { value: totalValueUSD, unit: "$" };
    }

    printPerformance(finalPrice: number) {
        const finalValue = this.getPortfolioValue(finalPrice);
        const profit = finalValue - this.initialValueUSD;
        const returnPct = (profit / this.initialValueUSD) * 100;
        console.log(`Initial Value: $${this.initialValueUSD.toFixed(2)}`);
        console.log(`Final Portfolio Value: $${finalValue.toFixed(2)}`);
        console.log(`Total Profit/Loss: $${profit.toFixed(2)} (${returnPct.toFixed(2)}%)`);
    }

    printLedger() {
        console.log("\n--- Trading Ledger ---");
        this.ledger.forEach(t => {
            const dateStr = typeof t.date === 'number' ? new Date(t.date).toLocaleDateString() : t.date;
            console.log(`Date ${dateStr}: ${t.action.padEnd(5)} at $${t.price.toFixed(2).padEnd(9)} | Amount: ${t.amount.toFixed(4).padEnd(8)} | Value: $${t.value.toFixed(2).padEnd(10)} | Bal($): $${t.postCash.toFixed(2).padEnd(10)} | Stack: ${t.postAsset.toFixed(4)} | Reason: ${t.reason}`);
        });
    }
}
