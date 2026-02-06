const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

/* ------------------ Helpers ------------------ */

function formatTime(ts) {
  return new Date(Number(ts) * 1000).toLocaleString();
}

function secondsToHuman(seconds) {
  if (seconds <= 0) return "Overdue";

  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);

  return `${days}d ${hours}h`;
}

async function getPaidAt(loanManager, loanId) {
  const filter = loanManager.filters.RepaymentMade(loanId);
  const events = await loanManager.queryFilter(filter);

  if (events.length === 0) return null;

  const lastEvent = events[events.length - 1];
  return Number(lastEvent.args.paidAt);
}

/* ------------------ Main ------------------ */

async function main() {
  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const totalLoans = Number(await loanManager.loanCounter());

  if (totalLoans === 0) {
    console.log("📭 No loans found");
    return;
  }

  const latestBlock = await hre.ethers.provider.getBlock("latest");
  const now = latestBlock.timestamp;

  console.log(`\n📄 TOTAL LOANS: ${totalLoans}`);
  console.log("=".repeat(70));

  for (let i = 0; i < totalLoans; i++) {
    const loan = await loanManager.getLoan(i);
    const user = await loanManager.getUser(loan.borrower);

    let status = "ACTIVE";
    if (loan.repaid) status = "REPAID";
    else if (loan.defaulted) status = "DEFAULTED";

    const timeRemaining = Number(loan.dueDate) - now;
    const paidAt = loan.repaid
      ? await getPaidAt(loanManager, i)
      : null;

    console.log(`\n🔹 Loan ID        : ${i}`);
    console.log(`   Status         : ${status}`);
    console.log(`   Borrower       : ${loan.borrower}`);
    console.log(`   Amount         : ${loan.amount.toString()}`);
    console.log(`   Created At     : ${formatTime(loan.createdAt)}`);
    console.log(`   Due Date       : ${formatTime(loan.dueDate)}`);
    console.log(
      `   Paid At        : ${paidAt ? formatTime(paidAt) : "-"}`
    );
    console.log(
      `   Time Remaining : ${
        loan.repaid || loan.defaulted
          ? "-"
          : secondsToHuman(timeRemaining)
      }`
    );
    console.log(`   Repaid         : ${loan.repaid}`);
    console.log(`   Defaulted      : ${loan.defaulted}`);
    console.log(`   Borrower CBI   : ${user.cbiScore}`);
    console.log("-".repeat(70));
  }
}

main().catch(console.error);
