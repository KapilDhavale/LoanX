async function loadDashboard() {
  const total = await contract.loanCounter();
  document.getElementById("totalLoans").innerText = total;

  let repaid = 0, active = 0, defaulted = 0;

  for (let i = 0; i < total; i++) {
    const loan = await contract.getLoan(i);
    if (loan.borrower.toLowerCase() === userAddress.toLowerCase()) {
      if (loan.repaid) repaid++;
      else if (loan.defaulted) defaulted++;
      else active++;
    }
  }

  document.getElementById("repaidLoans").innerText = repaid;
  document.getElementById("activeLoans").innerText = active;
  document.getElementById("defaultedLoans").innerText = defaulted;
}

loadDashboard();
