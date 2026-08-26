# 🌾 Organic Farm Market - 3D Arcade Idle Tycoon (CrazyGames Ready)

A fast-paced, high-performance 3D casual arcade-idle / store tycoon game built for **CrazyGames.com** using **Three.js** and procedural low-poly aesthetics.

---

## 🎮 How to Play
1. **Move Your Farmer**:
   - **Desktop**: `W`, `A`, `S`, `D` or Arrow Keys (or click & drag the on-screen joystick).
   - **Mobile / Touch**: Touch & drag the virtual joystick.
2. **Harvest Crops**: Walk onto the garden plots (e.g. 🍅 Tomato Patch) to harvest ripe crops onto your backpack stack.
3. **Restock Shelves**: Walk up to the matching display stands to stack your goods for customers.
4. **Checkout Shoppers**: Customers take items, queue up at the Cash Register. Stand behind the register (or hire a cashier) to ring them up!
5. **Collect Cash**: Step into the money collection zone to vacuum up dollar bill stacks.
6. **Expand Your Farm ($ Tiles)**: Step on glowing dollar ground tiles to pour money into new farm plots (🌾 Wheat Field), livestock pens (🐔 Chicken Coop, 🐄 Cow Barn), higher-tier market stands, and hired workers.
7. **Upgrade Abilities**: Open the ⭐ **Upgrades** menu to boost Backpack Capacity, Player Move Speed, and Crop Growth Rates.

---

## 🚀 How to Run Locally

You can run the game with Node.js built-in HTTP server:

```bash
cd organic-farm-mart
npm start
```

Then open your browser to **[http://localhost:8080](http://localhost:8080)**.

---

## 🕹️ CrazyGames.com Publishing Guide
1. **SDK Integration**:
   - `CrazyGames SDK v3` is already configured in `index.html` and wrapped safely in `src/sdk.js`.
   - Supports **Rewarded Ads** (2X Revenue Boost, Instant Harvest) and **Midgame Ads** on major store expansions.
   - Works seamlessly in both offline/local testing and live on CrazyGames iframe.
2. **Export for Submission**:
   - Simply zip all files in this folder (`index.html`, `style.css`, `src/`) and upload the `.zip` archive directly to the **CrazyGames Developer Portal**!