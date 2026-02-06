const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [, user] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const tx = await loanManager.connect(user).registerUser();
  await tx.wait();

  console.log("✅ User registered:", user.address);
}

main().catch(console.error);
