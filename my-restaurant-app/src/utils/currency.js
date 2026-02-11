// Currency conversion utility
// EUR = BGN ÷ 1.955 (Official fixed rate)

export const BGN_TO_EUR_RATE = 1.955;

/**
 * Converts Bulgarian Lev (BGN) to Euro (EUR)
 * @param {number} bgnAmount - Amount in BGN
 * @returns {number} - Amount in EUR
 */
export const convertBgnToEur = (bgnAmount) => {
  if (!bgnAmount || isNaN(bgnAmount)) return 0;
  const amount = Number(bgnAmount);
  if (amount <= 0) return 0;
  return amount / BGN_TO_EUR_RATE;
};

/**
 * Formats currency amount to 2 decimal places
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount with 2 decimal places
 */
export const formatCurrency = (amount) => {
  return Number(amount).toFixed(2);
};

/**
 * Converts BGN to EUR and formats to 2 decimal places
 * @param {number} bgnAmount - Amount in BGN
 * @returns {string} - EUR amount formatted to 2 decimal places
 */
export const convertAndFormatPrice = (bgnAmount) => {
  return formatCurrency(convertBgnToEur(bgnAmount));
};

/**
 * Displays both BGN and EUR prices
 * @param {number} bgnAmount - Amount in BGN
 * @returns {string} - Formatted string showing both currencies
 */
export const formatDualCurrency = (bgnAmount) => {
  const eurAmount = convertBgnToEur(bgnAmount);
  return `${formatCurrency(bgnAmount)} лв / €${formatCurrency(eurAmount)}`;
};

/**
 * Displays both BGN and EUR prices in compact format
 * @param {number} bgnAmount - Amount in BGN
 * @returns {string} - Compact formatted string showing both currencies
 */
export const formatDualCurrencyCompact = (bgnAmount) => {
  // Handle invalid inputs
  if (!bgnAmount || isNaN(bgnAmount)) {
    return '0.00 € (0.00 лв)';
  }
  
  const amount = Number(bgnAmount);
  const eurAmount = convertBgnToEur(amount);
  return `${formatCurrency(eurAmount)} € (${formatCurrency(amount)} лв)`;
};