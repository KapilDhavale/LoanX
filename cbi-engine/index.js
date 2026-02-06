require("dotenv").config();
const { ethers } = require("ethers");

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
  try {
    const block = await provider.getBlockNumber();
    console.log("⛓ Connected to blockchain at block:", block);
  } catch (err) {
    console.error("❌ Provider connection failed:", err);
    process.exit(1);
  }
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
  console.log("\n🧾 UserRegistered");
  console.log("User:", user);

  getUser(user);
});

/* ===============================
   EVENT: LoanRequested
   =============================== */
loan.on("LoanRequested", (loanId, borrower, amount, dueDate) => {
  console.log("\n📥 LoanRequested");
  console.log({
    loanId: loanId.toString(),
    borrower,
    amount: amount.toString(),
    dueDate: dueDate.toString()
  });

  const user = getUser(borrower);
  user.totalLoans++;
});

/* ===============================
   EVENT: RepaymentMade (CBI CORE)
   =============================== */
loan.on("RepaymentMade", async (loanId, borrower, amount, dueDate, paidAt) => {
  try {
    console.log("\n💰 RepaymentMade");
    console.log({
      loanId: loanId.toString(),
      borrower,
      amount: amount.toString(),
      dueDate: dueDate.toString(),
      paidAt: paidAt.toString()
    });

    const user = getUser(borrower);

    if (paidAt < dueDate) {
      user.earlyPayments++;
      console.log("⚡ Early payment");
    } else if (paidAt === dueDate) {
      user.onTimePayments++;
      console.log("⏰ On-time payment");
    } else {
      user.latePayments++;
      console.log("🐌 Late payment");
    }

    user.consistentRepayments++;

    const newScore = calculateCBI(user);
    console.log("📊 New CBI:", newScore);

    await adminLoan.updateCBIScore(borrower, newScore);
    console.log("✅ CBI updated on-chain");
  } catch (err) {
    console.error("❌ RepaymentMade handler error:", err);
  }
});

/* ===============================
   EVENT: LoanDefaulted (CBI CORE)
   =============================== */
loan.on("LoanDefaulted", async (loanId, borrower, dueDate, defaultedAt) => {
  try {
    console.log("\n❌ LoanDefaulted");
    console.log({
      loanId: loanId.toString(),
      borrower,
      dueDate: dueDate.toString(),
      defaultedAt: defaultedAt.toString()
    });

    const user = getUser(borrower);
    user.missedPayments++;

    const newScore = calculateCBI(user);
    console.log("📉 Penalized CBI:", newScore);

    await adminLoan.updateCBIScore(borrower, newScore);
    console.log("❌ CBI penalty applied on-chain");
  } catch (err) {
    console.error("❌ LoanDefaulted handler error:", err);
  }
});

/* ===============================
   EVENT: CBIScoreUpdated (LOG)
   =============================== */
loan.on("CBIScoreUpdated", (user, oldScore, newScore) => {
  console.log("\n🧠 CBIScoreUpdated");
  console.log({
    user,
    oldScore: oldScore.toString(),
    newScore: newScore.toString()
  });
});

/* ===============================
   EVENT: UserBlacklisted (LOG)
   =============================== */
loan.on("UserBlacklisted", (user, status) => {
  console.log("\n🚫 UserBlacklisted");
  console.log({ user, status });
});

console.log("🚀 CBI Engine fully initialized and listening...");
