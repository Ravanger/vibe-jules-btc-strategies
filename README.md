# Bitcoin Trading Simulator & Flappy Bird

A professional-grade, portable Bitcoin trading simulator with real-world data integration, multiple technical strategies, and a hidden Flappy Bird easter egg.

![Bitcoin Trading Simulator](btc_sim_latest.png)

## 🚀 Features

### 📊 Trading Simulation
- **Real-World Data**: Fetches live Bitcoin prices from the [CoinGecko API](https://www.coingecko.com/).
- **Smart Caching**: Implements a 12-hour local storage cache to minimize API hits and ensure smooth performance.
- **Multiple Strategies**:
  - **Golden Cross**: 7/30 Moving Average crossover.
  - **RSI (Relative Strength Index)**: Momentum-based oversold/overbought signals.
  - **MACD**: Trend-following momentum indicator.
  - **Bollinger Bands**: Volatility-based support and resistance levels.
  - **Mean Reversion**: Betting on price returning to its 20-day average.
  - **EMA Cross**: Faster responding Exponential Moving Average crossover (12/26).
  - **SMA Cross**: The classic 50/200 Day "Death/Golden Cross".
- **Short Selling**: Ability to toggle shorting to profit from downward price movements.
- **Portfolio Goals**:
  - **Maximize USD Profit**: Goal is to end with the highest dollar value.
  - **Stack Bitcoin**: Goal is to accumulate the maximum amount of BTC (Accumulation mode).

### 📈 Visualization
- **Interactive Graphing**: Full-width interactive chart powered by [Chart.js](https://www.chartjs.org/).
- **Indicator Overlays**: View all strategy-specific signals (RSI, MACD lines, Moving Averages, Bollinger Bands) directly on the price chart.
- **Buy/Sell Markers**: Clear visual markers for entry (Buy/Cover) and exit (Sell/Short) points.
- **Dark Mode**: Fully themed UI with a contrast-optimized Dark Mode for late-night analysis.

### 🎮 Easter Egg
- **Flappy Bird**: A hidden, physics-adjusted Flappy Bird game to pass the time while the "market" moves. Slowed down for a more relaxing (and playable) experience.

## 🛠️ Setup & Usage

### Web Version (Recommended)
Simply open `index.html` in any modern web browser. No server required!

### CLI Version
If you have Node.js installed, you can run the simulation in your terminal:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Simulation**:
   ```bash
   npm start
   ```

3. **Play Flappy Bird**:
   ```bash
   npm start -- --flappy
   ```

## 🧪 Testing
The project includes a comprehensive Jest test suite to ensure the accuracy of trading signals and portfolio calculations.

```bash
npm test
```

## 📚 Credits & Libraries
- **Data Source**: [CoinGecko](https://www.coingecko.com/)
- **Analysis**: [Danfo.js](https://danfo.jsdata.org/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Developer**: Google Jules

---
*Disclaimer: This is a simulator for educational and entertainment purposes only. Past performance does not guarantee future results.*
