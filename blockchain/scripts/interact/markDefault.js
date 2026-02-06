const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [admin] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const totalLoans = await loanManager.loanCounter();
  const now = Math.floor(Date.now() / 1000);

  let found = false;

  for (let i = 0; i < totalLoans; i++) {
    const loan = await loanManager.getLoan(i);

    if (!loan.repaid && !loan.defaulted && loan.dueDate < now) {
      await loanManager.connect(admin).markLoanDefault(i);
      console.log(`⚠️ Loan ${i} marked as DEFAULT`);
      found = true;
    }
  }

  if (!found) {
    console.log("ℹ️ No overdue loans found");
  }
}

main().catch(console.error);
