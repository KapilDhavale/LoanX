const createUserState = require("./userState");
const { calculateCBI } = require("./scoring");

function print(title, score) {
  console.log(title.padEnd(35), "→ CBI:", score);
}

/* ===============================
   TEST 1: First-Time Borrower
================================ */
let user = createUserState();
print("First-time borrower", calculateCBI(user));

/* ===============================
   TEST 2: Early Repayment
================================ */
user = createUserState();
user.earlyPayments = 2;
user.consistentRepayments = 2;
print("2 early repayments", calculateCBI(user));

/* ===============================
   TEST 3: Late Payment
================================ */
user = createUserState();
user.latePayments = 1;
print("1 late payment", calculateCBI(user));

/* ===============================
   TEST 4: Missed Payment (Default)
================================ */
user = createUserState();
user.missedPayments = 1;
print("1 missed payment", calculateCBI(user));

/* ===============================
   TEST 5: Fraud Signal
================================ */
user = createUserState();
user.suspiciousActivity = true;
print("Suspicious activity", calculateCBI(user));

/* ===============================
   TEST 6: Mixed Behavior
================================ */
user = createUserState();
user.earlyPayments = 1;
user.onTimePayments = 1;
user.latePayments = 1;
user.consistentRepayments = 3;
print("Mixed repayment behavior", calculateCBI(user));
