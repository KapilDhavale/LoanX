const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  // signer[0] is ADMIN (deployer)
  // signer[1] is the borrower
  const [admin, user] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const newScore = 85; // example CBI score

  const tx = await loanManager
    .connect(admin)
    .updateCBIScore(user.address, newScore);

  await tx.wait();

  console.log("📈 CBI score updated successfully");
  console.log("User:", user.address);
  console.log("New Score:", newScore);
}

main().catch(console.error);
