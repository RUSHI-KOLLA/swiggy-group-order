# Splitly — Swiggy Group Split + Birthday Host MVP

An interactive, student-focused group food ordering prototype. It lets a group:

- Build a shared food cart
- Attribute items to a person or share them equally
- Toggle between exact and equal bill splits
- Enable Birthday Party Mode and apply a demonstrative host reward
- Send mock UPI payment requests and prepare the host’s combined order

## Run locally

This is a dependency-free browser prototype. Open `index.html` directly, or serve it from the folder:

```bash
npx serve .
```

## Swiggy Builders integration boundary

The prototype does **not** make real Swiggy MCP or UPI calls. In production, the group/session, assignments, bill calculations, birthday verification, and settlement system would be app-owned. The host’s authenticated Swiggy Food session would be used for food discovery, cart updates, coupons, and final order placement.

The UI displays the current Builders v1 ₹1,000 order-cap constraint as a demo guardrail. Birthday rewards are representational unless an eligible coupon is returned by Swiggy.
