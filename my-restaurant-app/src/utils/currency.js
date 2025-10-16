// Currency conversion utility
// EUR = BGN ÷ 1.95583

export const BGN_TO_EUR_RATE = 1.95583;

/**
 * Converts Bulgarian Lev (BGN) to Euro (EUR)
 * @param {number} bgnAmount - Amount in BGN
 * @returns {number} - Amount in EUR
 */
export const convertBgnToEur = (bgnAmount) => {
  if (!bgnAmount || isNaN(bgnAmount)) return 0;
  return Number(bgnAmount) / BGN_TO_EUR_RATE;
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