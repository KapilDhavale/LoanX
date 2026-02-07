const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [admin] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const totalLoans = Number(await loanManager.loanCounter());

  if (totalLoans === 0) {
    console.log("❌ No loans exist");
    return;
  }

  // Find first ACTIVE loan
  let targetLoanId = null;
  let targetLoan = null;

  for (let i = 0; i < totalLoans; i++) {
    const loan = await loanManager.getLoan(i);

    if (!loan.repaid && !loan.defaulted) {
      targetLoanId = i;
      targetLoan = loan;
      break;
    }
  }

  if (targetLoanId === null) {
    console.log("❌ No active loan found to default");
    return;
  }

  console.log(`🎯 Target Loan ID: ${targetLoanId}`);
  console.log(`Borrower: ${targetLoan.borrower}`);
  console.log(
    `Due Date: ${new Date(Number(targetLoan.dueDate) * 1000).toLocaleString()}`
  );

  // Get current block time
  const latestBlock = await hre.ethers.provider.getBlock("latest");
  const now = latestBlock.timestamp;

  if (now <= Number(targetLoan.dueDate)) {
    const jumpBy = Number(targetLoan.dueDate) - now + 60; // +60s safety buffer

    console.log(`⏩ Advancing blockchain time by ${jumpBy} seconds...`);

    await hre.network.provider.send("evm_increaseTime", [jumpBy]);
    await hre.network.provider.send("evm_mine");
  }

  console.log("⛓ Time advanced. Marking loan as default...");

  const tx = await loanManager
    .connect(admin)
    .markLoanDefault(targetLoanId);

  await tx.wait();

  console.log(`❌ Loan ${targetLoanId} DEFAULTED successfully`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
