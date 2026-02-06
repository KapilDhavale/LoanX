const { BASE_SCORE, POSITIVE, NEGATIVE, LIMITS } = require("./constants");

function calculateCBI(u) {
  let score = BASE_SCORE;

  score += u.earlyPayments * POSITIVE.EARLY_PAYMENT;
  score += u.onTimePayments * POSITIVE.ON_TIME_PAYMENT;
  score += u.consistentRepayments * POSITIVE.CONSISTENT_REPAYMENT;

  score -= u.latePayments * NEGATIVE.LATE_PAYMENT;
  score -= u.missedPayments * NEGATIVE.MISSED_PAYMENT;

  if (u.suspiciousActivity) {
    score -= NEGATIVE.SUSPICIOUS_ACTIVITY;
  }

  score = Math.min(LIMITS.MAX, Math.max(LIMITS.MIN, score));
  return score;
}

module.exports = { calculateCBI };
