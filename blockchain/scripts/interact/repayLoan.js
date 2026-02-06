const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [, user] = await hre.ethers.getSigners();
  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  // Read loanId from env
  const loanIdEnv = process.env.LOAN_ID;

  if (loanIdEnv !== undefined) {
    const loanId = Number(loanIdEnv);
    const loan = await loanManager.getLoan(loanId);

    if (loan.borrower.toLowerCase() !== user.address.toLowerCase()) {
      console.log("❌ You are not the borrower of this loan");
      return;
    }

    if (loan.repaid) {
      console.log("ℹ️ Loan already repaid");
      return;
    }

    if (loan.defaulted) {
      console.log("❌ Loan already defaulted");
      return;
    }

    await loanManager.connect(user).repayLoan(loanId);
    console.log(`✅ Loan ${loanId} repaid by ${user.address}`);
    return;
  }

  // fallback: auto-detect
  const totalLoans = await loanManager.loanCounter();

  for (let i = Number(totalLoans) - 1; i >= 0; i--) {
    const loan = await loanManager.getLoan(i);

    if (
      loan.borrower.toLowerCase() === user.address.toLowerCase() &&
      !loan.repaid &&
      !loan.defaulted
    ) {
      await loanManager.connect(user).repayLoan(i);
      console.log(`✅ Loan ${i} repaid by ${user.address}`);
      return;
    }
  }

  console.log("❌ No unpaid loan found for this user");
}

main().catch(console.error);
