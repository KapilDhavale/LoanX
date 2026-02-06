const hre = require("hardhat");
const { CONTRACT_ADDRESS } = require("./config");

async function main() {
  const [admin, user] = await hre.ethers.getSigners();

  const loanManager = await hre.ethers.getContractAt(
    "LoanManager",
    CONTRACT_ADDRESS
  );

  const status = false; // ❌ false = UNBLACKLIST

  const tx = await loanManager
    .connect(admin)
    .blacklistUser(user.address, status);

  await tx.wait();

  console.log(
    status
      ? `🚫 User blacklisted: ${user.address}`
      : `✅ User unblacklisted: ${user.address}`
  );
}

main().catch(console.error);
