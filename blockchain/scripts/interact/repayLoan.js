const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [, user] = await hre.ethers.getSigners(); // borrower signer

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const counter = await loanManager.loanCounter();
  const latestLoanId = Number(counter) - 1;

  if (latestLoanId < 0) {
    console.log("❌ No loans to repay");
    return;
  }

  await loanManager
    .connect(user)
    .repayLoan(latestLoanId);

  console.log(`✅ Loan ${latestLoanId} repaid by ${user.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
