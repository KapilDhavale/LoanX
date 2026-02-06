const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const [admin, A, B, C, D] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  console.log("\n🔥 CBI MULTI-USER STRESS TEST (FIXED)\n");

  await registerAll(loanManager, [A, B, C, D]);

  await scenario("A EARLY", loanManager, admin, A, 1, 0);
  await scenario("B ON-TIME", loanManager, admin, B, 1, 1);
  await scenario("C LATE", loanManager, admin, C, 1, 2);
  await scenario("D DEFAULT", loanManager, admin, D, 1, 2, true);

  console.log("\n📊 FINAL CBI REPORT\n");

  await report(loanManager, "A (Early)", A);
  await report(loanManager, "B (On-time)", B);
  await report(loanManager, "C (Late)", C);
  await report(loanManager, "D (Default)", D);

  console.log("\n🎉 STRESS TEST COMPLETED\n");
}

async function scenario(label, contract, admin, user, durationDays, delayDays, shouldDefault = false) {
  console.log(`\n▶ ${label}`);

  const before = Number(await contract.loanCounter());

  await (await contract.connect(user).requestLoan(
    1000,
    durationDays * 24 * 60 * 60
  )).wait();

  const loanId = before;
  console.log(`📥 Loan ${loanId} created`);

  await advanceTime(delayDays);

  if (shouldDefault) {
    await (await contract.connect(admin).markLoanDefault(loanId)).wait();
    console.log(`❌ Loan ${loanId} defaulted`);
  } else {
    await (await contract.connect(user).repayLoan(loanId)).wait();
    console.log(`💰 Loan ${loanId} repaid`);
  }

  // give CBI engine time
  await delay(4000);
}

async function registerAll(contract, users) {
  for (const u of users) {
    await (await contract.connect(u).registerUser()).wait();
  }
}

async function advanceTime(days) {
  if (days === 0) return;
  await hre.network.provider.send("evm_increaseTime", [days * 24 * 60 * 60]);
  await hre.network.provider.send("evm_mine");
}

async function report(contract, label, user) {
  const u = await contract.getUser(user.address);
  console.log(label, "→ CBI:", u.cbiScore.toString());
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(console.error);
