const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanManager (CBI-Compatible MVP)", function () {
  let loanManager;
  let admin, user;

  const LOAN_DURATION = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();

    const LoanManager = await ethers.getContractFactory("LoanManager");
    loanManager = await LoanManager.deploy();
    await loanManager.waitForDeployment();
  });

  it("should register a user with default CBI score", async function () {
    await loanManager.connect(user).registerUser();

    const userData = await loanManager.getUser(user.address);
    expect(userData.registered).to.equal(true);
    expect(userData.cbiScore).to.equal(50);
    expect(userData.totalLoans).to.equal(0);
    expect(userData.blacklisted).to.equal(false);
  });

  it("should allow a registered user to request a loan with duration", async function () {
    await loanManager.connect(user).registerUser();

    await loanManager
      .connect(user)
      .requestLoan(1000, LOAN_DURATION);

    const loan = await loanManager.getLoan(0);

    expect(loan.borrower).to.equal(user.address);
    expect(loan.amount).to.equal(1000);
    expect(loan.repaid).to.equal(false);
    expect(loan.defaulted).to.equal(false);
    expect(loan.dueDate).to.be.gt(loan.createdAt);
  });

  it("should allow borrower to repay loan and emit timing data", async function () {
    await loanManager.connect(user).registerUser();

    await loanManager
      .connect(user)
      .requestLoan(500, LOAN_DURATION);

    const tx = await loanManager.connect(user).repayLoan(0);
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log) => log.fragment?.name === "RepaymentMade"
    );

    expect(event).to.not.be.undefined;
    expect(event.args.loanId).to.equal(0);
    expect(event.args.borrower).to.equal(user.address);
    expect(event.args.amount).to.equal(500);
    expect(event.args.paidAt).to.be.gt(0);
  });

  it("should allow admin to update CBI score", async function () {
    await loanManager.connect(user).registerUser();

    await loanManager
      .connect(admin)
      .updateCBIScore(user.address, 85);

    const userData = await loanManager.getUser(user.address);
    expect(userData.cbiScore).to.equal(85);
  });

  it("should mark loan as default by admin after due date", async function () {
    await loanManager.connect(user).registerUser();

    await loanManager
      .connect(user)
      .requestLoan(700, LOAN_DURATION);

    // ⏩ fast-forward time beyond due date
    await ethers.provider.send("evm_increaseTime", [LOAN_DURATION + 1]);
    await ethers.provider.send("evm_mine");

    await loanManager
      .connect(admin)
      .markLoanDefault(0);

    const loan = await loanManager.getLoan(0);
    expect(loan.defaulted).to.equal(true);
  });

  it("should prevent early default before due date", async function () {
    await loanManager.connect(user).registerUser();

    await loanManager
      .connect(user)
      .requestLoan(600, LOAN_DURATION);

    await expect(
      loanManager.connect(admin).markLoanDefault(0)
    ).to.be.revertedWith("Loan not overdue");
  });

  it("should prevent non-admin from updating CBI score", async function () {
    await loanManager.connect(user).registerUser();

    await expect(
      loanManager
        .connect(user)
        .updateCBIScore(user.address, 90)
    ).to.be.revertedWith("Only admin allowed");
  });

  it("should prevent blacklisted user from requesting a loan", async function () {
    await loanManager.connect(user).registerUser();

    await loanManager
      .connect(admin)
      .blacklistUser(user.address, true);

    await expect(
      loanManager
        .connect(user)
        .requestLoan(500, LOAN_DURATION)
    ).to.be.revertedWith("User blacklisted");
  });
});
