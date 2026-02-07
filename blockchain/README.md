# 🧱 Blockchain Layer – Trust-First Micro-Lending Protocol

This folder contains the **blockchain (smart contract) implementation** for the **Trust-First, No-Collateral Micro-Lending System**.

The blockchain layer serves as a **secure, transparent source of truth** for loan activity and trust records, while credit risk and trust computation (CBI) are handled **off-chain**.

---

## 🎯 Purpose of the Blockchain Layer

The blockchain is used to:

* Register users and anchor identities
* Issue micro-loans **without collateral**
* Enforce loan due dates
* Prevent early or unfair defaults
* Record repayment behavior immutably
* Store final trust scores (CBI)
* Emit behavioral events for off-chain analysis

---

## 📦 Core Smart Contract

### `LoanManager.sol`

The central smart contract that manages:

### 👤 User Management

* User registration
* User blacklisting / un-blacklisting
* Storage of CBI trust score

### 💸 Loan Lifecycle

* Loan request (amount + duration)
* Loan repayment
* Loan default (only after due date)

### 🔐 Administrative Controls

* Update CBI score after off-chain computation
* Mark overdue loans as default
* Restrict malicious users

---

## ⏱ Time-Based Enforcement

Each loan includes a **due date** set at the time of creation.

On-chain rules:

* Repayment is allowed at any time
* Default **cannot** occur before the due date
* Default **can only** occur after the due date

This ensures fairness, transparency, and lender protection.

---

## 📡 Behavioral Events (For CBI Engine)

The contract emits structured events that are consumed by the **CBI (Credit Behavior Index) engine**:

* `LoanRequested`
* `RepaymentMade`
* `LoanDefaulted`
* `CBIScoreUpdated`
* `UserBlacklisted`

These events enable off-chain systems to detect:

* Early repayment
* On-time repayment
* Late repayment
* Loan defaults

---

## 🧠 Trust Model (CBI)

* Trust scoring logic runs **off-chain**
* The final trust score is **stored on-chain**
* Blockchain ensures:

  * Immutability
  * Auditability
  * Tamper resistance


## 🧪 Testing

Automated tests cover:

* User registration
* Loan request with duration
* Repayment and timing data
* Default only after due date (using time-travel)
* Admin-only permissions
* Blacklisting logic

Run tests using:

```bash
npx hardhat test
```

---

## 🔗 Interaction Scripts

The `scripts/interact/` directory contains CLI scripts for interacting with the contract:

* `registerUser.js`
* `requestLoan.js`
* `repayLoan.js`
* `updateCBI.js`
* `markDefault.js`
* `blacklistUser.js`

These scripts are used for development, testing, and live demos.

---

## 🎬 Demo Flow (Exact Sequence)

Use the following commands for a live demo:

### 1️⃣ Register user

```bash
npx hardhat run scripts/interact/registerUser.js --network localhost
```

### 2️⃣ Request loan

```bash
npx hardhat run scripts/interact/requestLoan.js --network localhost
```

### 3️⃣ Repay loan

```bash
$env:LOAN_ID=3
npx hardhat run scripts/interact/repayLoan.js --network localhost
```

### 4️⃣ Update trust score

```bash
npx hardhat run scripts/interact/updateCBI.js --network localhost
```

### 5️⃣ View user data

```solidity
getUser(address)
```


## 📄 ABI Usage

After compilation, the contract ABI is generated and shared with:

* CBI engine
* Frontend
* Any off-chain service

The ABI defines the **public interface** for interacting with the contract.

---

## 🌐 Network Notes

* **Local development:** Hardhat local network

  * Contracts are redeployed on each restart
* **Demo / evaluation:** Public testnet (e.g., Sepolia)

  * Single deployment
  * Stable contract address

---
npx hardhat ignition deploy ignition/modules/LoanManagerModule.js --network localhost




