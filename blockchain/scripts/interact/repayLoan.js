const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [, user] = await hre.ethers.getSigners(); // borrower

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const loanId = 0;

  const tx = await loanManager
    .connect(user)
    .repayLoan(loanId);

  await tx.wait();

  console.log(`✅ Loan ${loanId} repaid by ${user.address}`);
}

main().catch(console.error);
