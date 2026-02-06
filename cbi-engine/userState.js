module.exports = function createUserState() {
  return {
    earlyPayments: 0,
    onTimePayments: 0,
    latePayments: 0,
    missedPayments: 0,
    consistentRepayments: 0,
    suspiciousActivity: false,
    lastLoanAmount: null,
    currentLoanAmount: null
  };
};
