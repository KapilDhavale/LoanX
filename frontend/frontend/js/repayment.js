async function loadRepaymentStats() {
  const total = await contract.loanCounter();

  let repaid = 0;
  let active = 0;
  let missed = 0;

  for (let i = 0; i < total; i++) {
    const loan = await contract.getLoan(i);

    if (loan.borrower.toLowerCase() === userAddress.toLowerCase()) {
      if (loan.repaid) repaid++;
      else if (loan.defaulted) missed++;
      else active++;
    }
  }

  document.getElementById("earlyCount").innerText = repaid;
  document.getElementById("lateCount").innerText = active;
  document.getElementById("missedCount").innerText = missed;
}

loadRepaymentStats();
