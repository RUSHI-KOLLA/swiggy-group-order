# 🍕 Splitly — Group Food, Sorted.

**Splitly** is a high-fidelity prototype designed for students and groups to eliminate the "awkward math" of group food ordering. Built as a showcase for the **Swiggy Builders Club**, it integrates the concept of AI-native commerce infrastructure into a seamless, social ordering experience.



## ✨ Core Features

### 👥 Collaborative Ordering
- **Group Cart**: Build a unified order from a selected restaurant (e.g., *Spice & Slice*).
- **Crew Management**: Add friends to the order and track who is eating what in real-time.
- **Item Attribution**: Assign specific dishes to individuals or share them among the group.

### 📉 Intelligent Bill Splitting
Switch between two powerful splitting modes:
- **Exact Split**: Users pay only for what they ordered. Delivery fees and taxes are distributed **proportionally** based on the value of their items.
- **Equal Split**: The total bill (including fees and rewards) is divided evenly across all participants.

### 🎂 Birthday Party Mode
A dedicated social feature that celebrates the host:
- **Host Reward**: Toggle "Birthday Mode" to apply a special reward (e.g., ₹150) to the total bill.
- **Social Signaling**: Visually marks the event as a celebration, enhancing the group experience.

### 🤖 Swiggy MCP Simulation
The prototype demonstrates a sophisticated integration boundary with the **Swiggy Builders MCP (Model Context Protocol)**. It simulates the end-to-end journey of a professional AI agent:
1. `get_food_cart` $\rightarrow$ Review current items and payment methods.
2. `place_food_order` $\rightarrow$ Finalize the order on behalf of the host.
3. `track_food_order` $\rightarrow$ Get initial delivery status and ETA.

---

## 🛠️ Technical Stack

- **Frontend**: Pure Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Styling**: Modern CSS featuring CSS Variables, Grid, Flexbox, and Responsive Media Queries.
- **Design**: Minimalist, "Paper & Ink" aesthetic focusing on readability and accessibility (ARIA roles).
- **Architecture**: State-driven rendering loop ensuring a single source of truth for the cart and splits.

---

> **Note:** The checkout demo enforces a **₹1,000 Builder order limit** as a safety guardrail. Orders exceeding this will be blocked with a friendly message.

## 🚀 Getting Started

Since Splitly is a dependency-free browser prototype, you can run it instantly:

### Option 1: Direct Open
Simply open `index.html` in any modern web browser.

### Option 2: Local Server (Recommended)
Use a simple static server to avoid CORS issues with local assets:
```bash
npx serve .
```

---

## 🧮 The Splitting Logic

Splitly employs a fair distribution algorithm for the **Exact Split** mode:

$$\text{Individual Share} = \text{Item Cost} + \left( \frac{\text{Item Cost}}{\text{Subtotal}} \times \text{Fees} \right) - \left( \frac{\text{Item Cost}}{\text{Subtotal}} \times \text{Rewards} \right)$$

*This ensures that the person who orders the most expensive item bears a proportional share of the delivery costs, while those who order nothing pay nothing.*

---

## 🗺️ MCP Tooling Journey

The "Confirm Order" flow simulates the following MCP interaction:

| Stage | Tool Called | Purpose |
| :--- | :--- | :--- |
| **Verification** | `get_food_cart` | Validates final totals and available payment methods. |
| **Execution** | `place_food_order` | Commits the order to the Swiggy Food delivery system. |
| **Tracking** | `track_food_order` | Initializes real-time delivery monitoring. |

---

## 📜 License
Developed as part of the **Swiggy Builders Club** ecosystem.
