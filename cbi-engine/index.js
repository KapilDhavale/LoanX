// require("dotenv").config();
// const { ethers } = require("ethers");

// console.log("🔧 Starting CBI Engine...");
// console.log("📍 CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

// const { provider, wallet } = require("./config");
// const { calculateCBI } = require("./scoring");
// const createUserState = require("./userState");

// // ✅ Load full ABI from artifacts
// const loanABI = require("./abi/LoanManager.json").abi;

// // ---- Provider sanity check ----
// (async () => {
//   try {
//     const block = await provider.getBlockNumber();
//     console.log("⛓ Connected to blockchain at block:", block);
//   } catch (err) {
//     console.error("❌ Provider connection failed:", err);
//   }
// })();

// // ---- Contract setup ----
// const loan = new ethers.Contract(
//   process.env.CONTRACT_ADDRESS,
//   loanABI,
//   provider
// );

// console.log("📄 Contract instance created");

// const adminLoan = loan.connect(wallet);
// console.log("👑 Admin wallet connected:", wallet.address);

// // In-memory user store
// const users = {};

// function getUser(address) {
//   if (!users[address]) {
//     users[address] = createUserState();
//     console.log("🆕 New user state created for:", address);
//   }
//   return users[address];
// }

// /* ==========================================
//    REPAYMENT EVENT LISTENER
// ========================================== */
// loan.on("RepaymentMade", async (
//   loanId,
//   borrower,
//   amount,
//   dueDate,
//   paidAt
// ) => {
//   try {

//     console.log("\n💰 RepaymentMade Event Detected");
//     console.log("Loan ID:", loanId.toString());
//     console.log("Borrower:", borrower);
//     console.log("Amount:", amount.toString());

//     const user = getUser(borrower);

//     if (paidAt.lt(dueDate)) {
//       user.earlyPayments++;
//       console.log("⚡ Early payment");
//     } else if (paidAt.eq(dueDate)) {
//       user.onTimePayments++;
//       console.log("⏰ On-time payment");
//     } else {
//       user.latePayments++;
//       console.log("🐢 Late payment");
//     }

//     user.consistentRepayments++;

//     const score = calculateCBI(user);
//     console.log("📊 New calculated CBI:", score);

//     const tx = await adminLoan.updateCBIScore(borrower, score);
//     await tx.wait();

//     console.log(`✅ CBI updated on-chain for ${borrower}: ${score}`);

//   } catch (error) {
//     console.error("❌ Error in Repayment listener:", error);
//   }
// });

// /* ==========================================
//    DEFAULT EVENT LISTENER
// ========================================== */
// loan.on("LoanDefaulted", async (
//   loanId,
//   borrower,
//   dueDate,
//   defaultedAt
// ) => {
//   try {

//     console.log("\n❌ LoanDefaulted Event Detected");
//     console.log("Loan ID:", loanId.toString());
//     console.log("Borrower:", borrower);

//     const user = getUser(borrower);
//     user.missedPayments++;

//     const score = calculateCBI(user);
//     console.log("📉 New calculated CBI:", score);

//     const tx = await adminLoan.updateCBIScore(borrower, score);
//     await tx.wait();

//     console.log(`❌ CBI penalized on-chain for ${borrower}: ${score}`);

//   } catch (error) {
//     console.error("❌ Error in Default listener:", error);
//   }
// });

// console.log("🚀 CBI Engine fully initialized and listening...");


require("dotenv").config();
const { ethers } = require("ethers");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database");

const { provider, wallet } = require("./config");
const { calculateCBI } = require("./scoring");
const createUserState = require("./userState");

console.log("🔧 Starting CBI Engine...");
console.log("📍 CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

/* =================================================
   EXPRESS SERVER
================================================= */

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Deposit API
app.post("/deposit", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  db.serialize(() => {
    db.run(
      "UPDATE pool SET balance = balance + ? WHERE id = 1",
      [amount]
    );

    db.run(
      "INSERT INTO transactions (type, amount) VALUES (?, ?)",
      ["deposit", amount]
    );
  });

  console.log("💰 Deposit added:", amount);
  res.json({ message: "Deposit successful" });
});

// Get Pool Balance
app.get("/pool", (req, res) => {
  db.get("SELECT balance FROM pool WHERE id = 1", [], (err, row) => {
    if (err) return res.status(500).json(err);
    res.json({ balance: row.balance });
  });
});

app.listen(4000, () => {
  console.log("🌐 Bank backend running at http://localhost:4000");
});

/* =================================================
   BLOCKCHAIN SETUP
================================================= */

const loanABI = require("./abi/LoanManager.json").abi;

(async () => {
  try {
    const block = await provider.getBlockNumber();
    console.log("⛓ Connected to blockchain at block:", block);
  } catch (err) {
    console.error("❌ Provider connection failed:", err);
  }
})();

const loan = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  loanABI,
  provider
);

const adminLoan = loan.connect(wallet);

console.log("📄 Contract instance created");
console.log("👑 Admin wallet connected:", wallet.address);

/* =================================================
   IN-MEMORY USER STATE
================================================= */

const users = {};

function getUser(address) {
  if (!users[address]) {
    users[address] = createUserState();
    console.log("🆕 New user state created for:", address);
  }
  return users[address];
}

/* =================================================
   DASHBOARD PRINTER
================================================= */

function printDashboard({
  borrower,
  type,
  score,
  previousScore,
  userStats
}) {

  const arrow =
    previousScore !== undefined
      ? score > previousScore
        ? "⬆️"
        : score < previousScore
        ? "⬇️"
        : "➡️"
      : "";

  db.get("SELECT balance FROM pool WHERE id = 1", [], (err, row) => {

    const poolBalance = row ? row.balance : 0;

    console.log("\n========================================");
    console.log("📊        CBI ENGINE DASHBOARD");
    console.log("========================================");
    console.log("User:", borrower);
    console.log("Event Type:", type);
    console.log("----------------------------------------");
    console.log("Early Payments :", userStats.earlyPayments);
    console.log("On-Time        :", userStats.onTimePayments);
    console.log("Late Payments  :", userStats.latePayments);
    console.log("Missed Payments:", userStats.missedPayments);
    console.log("Consistent     :", userStats.consistentRepayments);
    console.log("----------------------------------------");
    console.log("Previous Score :", previousScore ?? "N/A");
    console.log("New Score      :", score, arrow);
    console.log("----------------------------------------");
    console.log("🏦 Pool Balance :", poolBalance);
    console.log("========================================\n");
  });
}

/* =================================================
   LOAN REQUESTED EVENT
================================================= */

loan.on("LoanRequested", async (loanId, borrower, amount) => {
  try {

    const loanAmount = parseInt(amount.toString());

    console.log("\n🏦 LoanRequested Event");
    console.log("Borrower:", borrower);
    console.log("Amount:", loanAmount);

    db.get("SELECT balance FROM pool WHERE id = 1", [], (err, row) => {

      if (err) {
        console.error("DB error:", err);
        return;
      }

      if (!row || row.balance < loanAmount) {
        console.log("❌ Insufficient pool balance!");
        return;
      }

      db.serialize(() => {
        db.run(
          "UPDATE pool SET balance = balance - ? WHERE id = 1",
          [loanAmount]
        );

        db.run(
          "INSERT INTO transactions (type, amount) VALUES (?, ?)",
          ["loan", loanAmount]
        );
      });

      console.log("📉 Pool reduced after loan");
    });

  } catch (error) {
    console.error("❌ LoanRequested listener error:", error);
  }
});

/* =================================================
   REPAYMENT EVENT
================================================= */

loan.on("RepaymentMade", async (
  loanId,
  borrower,
  amount,
  dueDate,
  paidAt
) => {
  try {

    const repayAmount = parseInt(amount.toString());

    console.log("\n💰 RepaymentMade Event");
    console.log("Borrower:", borrower);
    console.log("Amount:", repayAmount);

    // Increase Pool
    db.serialize(() => {
      db.run(
        "UPDATE pool SET balance = balance + ? WHERE id = 1",
        [repayAmount]
      );

      db.run(
        "INSERT INTO transactions (type, amount) VALUES (?, ?)",
        ["repayment", repayAmount]
      );
    });

    const user = getUser(borrower);

    const previousScore = calculateCBI(user);

    if (paidAt.lt(dueDate)) {
      user.earlyPayments++;
    } else if (paidAt.eq(dueDate)) {
      user.onTimePayments++;
    } else {
      user.latePayments++;
    }

    user.consistentRepayments++;

    const score = calculateCBI(user);

    printDashboard({
      borrower,
      type: "Repayment",
      score,
      previousScore,
      userStats: user
    });

    const tx = await adminLoan.updateCBIScore(borrower, score);
    await tx.wait();

    console.log("✅ CBI updated on blockchain\n");

  } catch (error) {
    console.error("❌ Repayment listener error:", error);
  }
});

/* =================================================
   DEFAULT EVENT
================================================= */

loan.on("LoanDefaulted", async (
  loanId,
  borrower,
  dueDate,
  defaultedAt
) => {
  try {

    console.log("\n❌ LoanDefaulted Event");

    const user = getUser(borrower);

    const previousScore = calculateCBI(user);

    user.missedPayments++;

    const score = calculateCBI(user);

    printDashboard({
      borrower,
      type: "Loan Default",
      score,
      previousScore,
      userStats: user
    });

    const tx = await adminLoan.updateCBIScore(borrower, score);
    await tx.wait();

    console.log("❌ CBI penalty updated on blockchain\n");

  } catch (error) {
    console.error("❌ Default listener error:", error);
  }
});

console.log("🚀 CBI Engine fully initialized and listening...");
