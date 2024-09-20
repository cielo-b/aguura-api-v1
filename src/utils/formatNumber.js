function formatNumber(amount) {
  return new Intl.NumberFormat("en-US").format(amount);
}

module.exports = formatNumber;
