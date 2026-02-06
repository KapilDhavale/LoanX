const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [, user] = await hre.ethers.getSigners(); // borrower

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const amount = 1000;
  const duration = 7 * 24 * 60 * 60; // 7 days

  const tx = await loanManager
    .connect(user)
    .requestLoan(amount, duration);

  await tx.wait();

  console.log("💸 Loan requested");
  console.log("Borrower:", user.address);
  console.log("Amount:", amount);
  console.log("Duration (seconds):", duration);
}

main().catch(console.error);
