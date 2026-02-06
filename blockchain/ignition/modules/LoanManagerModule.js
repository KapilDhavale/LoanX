const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LoanManagerModule", (m) => {
  const loanManager = m.contract("LoanManager");
  return { loanManager };
});
