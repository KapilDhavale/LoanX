// frontend/js/loans.js

async function loadLoans() {

  const total = await contract.loanCounter();
  const tbody = document.querySelector("#loanTable tbody");

  tbody.innerHTML = "";

  for (let i = 0; i < total; i++) {

    const loan = await contract.getLoan(i);

    if (loan.borrower.toLowerCase() === userAddress.toLowerCase()) {

      const status =
        loan.repaid ? "Repaid" :
        loan.defaulted ? "Defaulted" :
        "Active";

      const row = `
        <tr>
          <td>${loan.id}</td>
          <td>${loan.amount}</td>
          <td>${new Date(loan.dueDate * 1000).toLocaleString()}</td>
          <td>
            ${status}
            ${
              !loan.repaid && !loan.defaulted
                ? `<button onclick="repayLoan(${loan.id})" class="repay-btn">Repay</button>`
                : ""
            }
          </td>
        </tr>
      `;

      tbody.innerHTML += row;
    }
  }
}

async function applyLoan() {

  try {

    const amount = document.getElementById("loanAmount").value;
    const days = document.getElementById("loanDays").value;

    if (!amount || !days) {
      alert("Enter amount and duration");
      return;
    }

    const duration = parseInt(days) * 24 * 60 * 60;

    const tx = await contractWithSigner.requestLoan(
      parseInt(amount),
      duration
    );

    await tx.wait();

    alert("Loan requested successfully!");
    loadLoans();

  } catch (error) {
    console.error("Loan error:", error);
  }
}

async function repayLoan(loanId) {

  try {

    const tx = await contractWithSigner.repayLoan(loanId);
    await tx.wait();

    alert("Loan repaid successfully!");
    loadLoans();

  } catch (error) {
    console.error("Repay error:", error);
  }
}

loadLoans();
