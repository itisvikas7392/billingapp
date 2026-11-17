/**
 * Indian Rupee Number to Words Converter
 * Formats according to the Indian numbering system (Lakhs, Crores).
 * Example: 2500.00 => "Indian Rupee Two Thousand Five Hundred Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n) {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

/**
 * Converts a number to words in Indian numbering system
 * @param {number|string} amount
 * @param {string} currencyName (default: 'Indian Rupee')
 * @returns {string} Words representation
 */
function convertNumberToIndianWords(amount, currencyName = 'Indian Rupee') {
  const num = parseFloat(amount);
  if (isNaN(num) || num === 0) {
    return `${currencyName} Zero Only`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  let remaining = integerPart;
  const parts = [];

  // Crores (>= 1,00,00,000)
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    parts.push(convertBelowThousand(crores) + ' Crore');
    remaining %= 10000000;
  }

  // Lakhs (>= 1,00,000)
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    parts.push(convertBelowThousand(lakhs) + ' Lakh');
    remaining %= 100000;
  }

  // Thousands (>= 1,000)
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    parts.push(convertBelowThousand(thousands) + ' Thousand');
    remaining %= 1000;
  }

  // Hundreds & Remaining (< 1,000)
  if (remaining > 0) {
    parts.push(convertBelowThousand(remaining));
  }

  let words = parts.join(' ').trim();
  if (!words) {
    words = 'Zero';
  }

  let result = `${currencyName} ${words}`;

  if (decimalPart > 0) {
    const paiseWords = convertBelowThousand(decimalPart);
    result += ` and ${paiseWords} Paise`;
  }

  result += ' Only';

  return isNegative ? `Minus ${result}` : result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertNumberToIndianWords };
}
