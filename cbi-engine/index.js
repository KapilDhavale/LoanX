require("dotenv").config();
const { ethers } = require("ethers");

/* ===============================
   CRASH GUARDS (VERY IMPORTANT)
   =============================== */
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

console.log("🔧 Starting CBI Engine...");
console.log("📍 CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

/* ===============================
   IMPORTS
   =============================== */
const { provider, wallet } = require("./config");
const { calculateCBI } = require("./scoring");
const createUserState = require("./userState");
const loanABI = require("./abi/LoanManager.json").abi;

/* ===============================
   PROVIDER SANITY CHECK
   =============================== */
(async () => {
  const block = await provider.getBlockNumber();
  console.log("⛓ Connected to blockchain at block:", block);
})();

/* ===============================
   CONTRACT SETUP
   =============================== */
const loan = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  loanABI,
  provider
);

const adminLoan = loan.connect(wallet);

console.log("📄 Contract instance created");
console.log("👑 Admin wallet connected:", wallet.address);

/* ===============================
   IN-MEMORY USER STATE (MVP)
   =============================== */
const users = {};

function getUser(address) {
  if (!users[address]) {
    users[address] = createUserState();
    console.log("🆕 New user state created for:", address);
  }
  return users[address];
}

/* ===============================
   EVENT: UserRegistered
   =============================== */
loan.on("UserRegistered", (user) => {
  console.log("\n🧾 UserRegistered:", user);
  getUser(user);
});

/* ===============================
   EVENT: LoanRequested
   =============================== */
loan.on("LoanRequested", (loanId, borrower, amount, dueDate) => {
  console.log("\n📥 LoanRequested", {
    loanId: loanId.toString(),
    borrower,
    amount: amount.toString(),
    dueDate: dueDate.toString()
  });

  getUser(borrower).totalLoans++;
});

/* ===============================
   EVENT: RepaymentMade
   =============================== */
loan.on("RepaymentMade", async (loanId, borrower, amount, dueDate, paidAt) => {
  try {
    console.log("\n💰 RepaymentMade", loanId.toString());

    const user = getUser(borrower);

    if (paidAt < dueDate) user.earlyPayments++;
    else if (paidAt === dueDate) user.onTimePayments++;
    else user.latePayments++;

    user.consistentRepayments++;

    const newScore = calculateCBI(user);
    console.log("📊 Calculated CBI:", newScore);

    const tx = await adminLoan.updateCBIScore(borrower, newScore);
    await tx.wait();

    console.log("✅ CBI updated on-chain");
  } catch (err) {
    console.error("❌ Repayment handler failed:", err.reason || err);
  }
});

/* ===============================
   EVENT: LoanDefaulted
   =============================== */
loan.on("LoanDefaulted", async (loanId, borrower) => {
  try {
    console.log("\n❌ LoanDefaulted", loanId.toString());

    const user = getUser(borrower);
    user.missedPayments++;

    const newScore = calculateCBI(user);
    console.log("📉 Penalized CBI:", newScore);

    const tx = await adminLoan.updateCBIScore(borrower, newScore);
    await tx.wait();

    console.log("❌ CBI penalty applied");
  } catch (err) {
    console.error("❌ Default handler failed:", err.reason || err);
  }
});

/* ===============================
   LOG EVENTS
   =============================== */
loan.on("CBIScoreUpdated", (user, oldScore, newScore) => {
  console.log("🧠 CBIScoreUpdated:", {
    user,
    old: oldScore.toString(),
    new: newScore.toString()
  });
});

console.log("🚀 CBI Engine running & listening...");
