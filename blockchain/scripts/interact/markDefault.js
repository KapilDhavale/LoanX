const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [admin] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const loanId = 0; // defaulting loan 0

  const tx = await loanManager
    .connect(admin)
    .markLoanDefault(loanId);

  await tx.wait();

  console.log(`⚠️ Loan ${loanId} marked as DEFAULT`);
}

main().catch(console.error);
