const hre = require("hardhat");

async function main() {
  const [admin, borrower] = await hre.ethers.getSigners();

  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  console.log("\n===============================");
  console.log("🚀 CBI END-TO-END FLOW TEST");
  console.log("===============================\n");

  /* -----------------------------
     1. Register User
     ----------------------------- */
  console.log("🧾 Registering user...");
  await (await loanManager.connect(borrower).registerUser()).wait();
  console.log("✅ User registered\n");

  /* -----------------------------
     2. Request Loan #1
     ----------------------------- */
  console.log("📥 Requesting Loan #1...");
  await (
    await loanManager.connect(borrower).requestLoan(
      1000,
      7 * 24 * 60 * 60 // 7 days
    )
  ).wait();
  console.log("✅ Loan #1 requested\n");

  /* -----------------------------
     3. Repay Loan #1 early
     ----------------------------- */
  console.log("💰 Repaying Loan #1 early...");
  await (await loanManager.connect(borrower).repayLoan(0)).wait();
  console.log("✅ Loan #1 repaid early\n");

  console.log("⏳ Waiting for CBI Engine to update score...");
  await delay(3000);

  /* -----------------------------
     4. Request Loan #2
     ----------------------------- */
  console.log("📥 Requesting Loan #2...");
  await (
    await loanManager.connect(borrower).requestLoan(
      1000,
      3 * 24 * 60 * 60 // 3 days
    )
  ).wait();
  console.log("✅ Loan #2 requested\n");

  /* -----------------------------
     5. Fast-forward time
     ----------------------------- */
  console.log("⏩ Advancing blockchain time...");
  await hre.network.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
  await hre.network.provider.send("evm_mine");
  console.log("✅ Time advanced\n");

  /* -----------------------------
     6. Default Loan #2
     ----------------------------- */
  console.log("❌ Defaulting Loan #2...");
  await (await loanManager.connect(admin).markLoanDefault(1)).wait();
  console.log("✅ Loan #2 defaulted\n");

  console.log("⏳ Waiting for CBI Engine to penalize score...");
  await delay(3000);

  /* -----------------------------
     7. Fetch Final CBI Score
     ----------------------------- */
  const user = await loanManager.getUser(borrower.address);

  console.log("\n===============================");
  console.log("📊 FINAL CBI REPORT");
  console.log("===============================");
  console.log("User Address:", borrower.address);
  console.log("Registered:", user.registered);
  console.log("Total Loans:", user.totalLoans.toString());
  console.log("Final CBI Score:", user.cbiScore.toString());
  console.log("Blacklisted:", user.blacklisted);
  console.log("===============================\n");

  console.log("🎉 END-TO-END TEST COMPLETED");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
