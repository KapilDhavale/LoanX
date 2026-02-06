require("dotenv").config();
const { ethers } = require("ethers");

console.log("🔧 Starting CBI Engine...");
console.log("📍 CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

const { provider, wallet } = require("./config");
const { calculateCBI } = require("./scoring");
const createUserState = require("./userState");

const loanABI = require("./abi/LoanManager.json").abi;

// ---- Provider sanity check ----
(async () => {
  try {
    const block = await provider.getBlockNumber();
    console.log("⛓ Connected to blockchain at block:", block);
  } catch (err) {
    console.error("❌ Provider connection failed:", err);
  }
})();

// ---- Contract setup ----
const loan = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  loanABI,
  provider
);

console.log("📄 Contract instance created");

const adminLoan = loan.connect(wallet);
console.log("👑 Admin wallet connected:", wallet.address);

// In-memory user behavior store (MVP)
const users = {};

function getUser(address) {
  if (!users[address]) {
    users[address] = createUserState();
    console.log("🆕 New user state created for:", address);
  }
  return users[address];
}

/* ===============================
   RAW EVENT LOGGER (CRITICAL)
   =============================== */
loan.on("*", (...args) => {
  console.log("📡 RAW EVENT RECEIVED:", args);
});

/* ===============================
   REPAYMENT EVENT
   =============================== */
loan.on(
  "RepaymentMade",
  async (loanId, borrower, amount, dueDate, paidAt) => {
    console.log("💰 RepaymentMade event detected");
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
      console.log("⚡ Early payment detected");
    } else if (paidAt === dueDate) {
      user.onTimePayments++;
      console.log("⏰ On-time payment detected");
    } else {
      user.latePayments++;
      console.log("🐢 Late payment detected");
    }

    user.consistentRepayments++;

    const score = calculateCBI(user);
    console.log("📊 New calculated CBI:", score);

    await adminLoan.updateCBIScore(borrower, score);
    console.log(`✅ CBI updated on-chain for ${borrower}: ${score}`);
  }
);

/* ===============================
   DEFAULT EVENT
   =============================== */
loan.on(
  "LoanDefaulted",
  async (loanId, borrower, dueDate, defaultedAt) => {
    console.log("❌ LoanDefaulted event detected");
    console.log({
      loanId: loanId.toString(),
      borrower,
      dueDate: dueDate.toString(),
      defaultedAt: defaultedAt.toString()
    });

    const user = getUser(borrower);
    user.missedPayments++;

    const score = calculateCBI(user);
    console.log("📉 New calculated CBI after default:", score);

    await adminLoan.updateCBIScore(borrower, score);
    console.log(`❌ CBI penalized on-chain for ${borrower}: ${score}`);
  }
);

console.log("🚀 CBI Engine fully initialized and listening...");
