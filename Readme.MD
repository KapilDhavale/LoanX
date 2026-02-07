# 🐯 TigerPayX – LoanX

### Trust-First, On-Chain Micro-Lending Without Collateral

---

## 🔍 Problem Summary

Access to credit remains a major challenge for first-time borrowers, gig workers, small merchants, and creators who lack collateral or formal credit history.

Traditional systems rely on:

* Collateral-heavy underwriting
* Opaque credit decisions
* Slow and exclusionary processes

Meanwhile, most DeFi lending protocols require **over-collateralization**, making them inaccessible to users who need credit the most.

---

## 💡 Our Solution

**LoanX** is a **trust-first micro-lending system** that replaces collateral with **behavioral trust**, using blockchain as a **transparent and immutable trust layer**.

Instead of asking *“What assets do you have?”*, LoanX asks:

> **“How do you behave when given trust?”**

---

## 🧠 Core Idea

* Start users with **limited trust**
* Observe repayment behavior over time
* Dynamically update a **TrustScore (CBI)**
* Expand or restrict credit access based on behavior

Risk is **measured and managed**, not eliminated.

---

## 🏗️ System Architecture

LoanX uses a **hybrid Web2 + Web3 design**:

```
User App (No Wallet)
   ↓
Smart Contract (Loan Events)
   ↓
CBI Engine (Off-Chain Intelligence)
   ↓
Smart Contract (Final Trust State)
```

### Why this design?

* Blockchain ensures **transparency & auditability**
* Off-chain logic ensures **scalability & flexibility**
* Users are not exposed to crypto complexity

---

## 🔐 What Happens On-Chain?

The blockchain stores **trust state**, not money.

### Stored On-Chain:

* User registration status
* TrustScore (CBI)
* Loan metadata (ID, borrower, due date)
* Repayment or default events

### Not Stored On-Chain:

* No INR, ETH, or token transfers
* No collateral
* No user wallets

All transactions use `value = 0 ETH`.

---

## 🧾 Credit Behavior Intelligence (CBI Engine)

The **CBI Engine** is an off-chain service that:

* Listens to on-chain events
* Analyzes borrower behavior:

  * Early repayment
  * On-time repayment
  * Late repayment
  * Defaults
* Computes an updated TrustScore
* Commits the final score on-chain via a trusted authority wallet

Only the **CBI Authority** can update scores, preventing manipulation.

---

## 💳 Loan Lifecycle (End-to-End)

1. User registers
2. User requests a small loan (platform-funded bootstrap)
3. Loan event emitted on-chain
4. User repays or defaults
5. Behavior event emitted on-chain
6. CBI Engine recalculates TrustScore
7. Updated score stored immutably on-chain

---

## 🧪 Demo & Testing

The prototype includes:

* Single-user and multi-user flows
* Early, on-time, late repayment scenarios
* Default handling with penalties
* Stress testing with multiple borrowers

### Observed Outcome:

```
Early repayment   → High TrustScore
On-time repayment → Medium-High TrustScore
Late repayment    → Medium-Low TrustScore
Default           → Low TrustScore
```

This validates that trust diverges correctly based on behavior.

---

## 🦊 Do Users Need MetaMask?

**No.**

* Users do not sign transactions
* Users do not pay gas
* Users do not hold crypto

Blockchain interactions are handled by the backend.
The frontend performs **read-only calls** to display TrustScores.

This design prioritizes **real-world adoption**, especially in India.

---

## ⚙️ Tech Stack

**Smart Contracts**

* Solidity
* Hardhat
* Ethers.js

**Backend**

* Node.js
* Event-driven architecture
* Ethers.js (WebSocket provider)

**Frontend**

* HTML / CSS / JavaScript
* Read-only blockchain access
* No wallet dependency

---

## 🔒 Risk & Lender Protection

* Initial loans are capped and platform-funded
* Defaults are penalized via TrustScore reduction
* Repeat defaulters can be blacklisted
* Trust recovery is possible through consistent repayment

Risk is **controlled, transparent, and auditable**.

---

## 📈 Scalability & Sustainability

* Heavy computation stays off-chain
* Only final trust decisions go on-chain
* Designed for batching and threshold updates
* Easily deployable on L2s (Polygon / Arbitrum)

---

## 🚧 Current Limitations (MVP)

* In-memory trust state (no DB persistence yet)
* No automatic replay on backend restart
* Platform-funded bootstrap assumed

These are **intentional MVP trade-offs**.

---

## 🔮 Future Enhancements

* Persistent storage & replay engine
* Risk-tiered loan limits
* Dynamic pricing / interest models
* DAO or multisig governance
* ZK-based trust proofs
* L2 deployment for near-zero fees

---

## 🎯 Key Takeaway

> **LoanX demonstrates that collateral is not the only way to manage risk.**
> By combining behavioral intelligence with on-chain transparency, we enable inclusive, trust-first lending without sacrificing sustainability.

---

## 👤 Team / Author

**TechShastra**
Members : Mansi Mohite(Leader), Kapil Dhavale, Anushka Shinde, Purvi Prasad
Final-Year Engineering Student
Submission for **TigerPayX – Lending Track**

