// Percentage of a budget at which the user gets a warning.
export const WARNING_PERCENT = 80;

// Works out how much of a budget is used and whether to alert the user.
// Uses integer paise throughout; the percentage is only for display.
export function budgetStatus(budgetPaise, spentPaise) {
  const percentUsed = budgetPaise > 0 ? Math.round((spentPaise / budgetPaise) * 1000) / 10 : 0;

  let status = 'ok';
  if (spentPaise > budgetPaise) status = 'exceeded';
  else if (percentUsed >= WARNING_PERCENT) status = 'warning';

  return {
    spentPaise,
    remainingPaise: budgetPaise - spentPaise,
    percentUsed,
    status,
  };
}

// Month-over-month change in percent, or null when last month was zero
// (a change from 0 has no meaningful percentage).
export function percentChange(current, previous) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
