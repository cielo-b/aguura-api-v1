function formatNumber(amount) {
    let numStr = amount.toString();

    if (numStr.length > 3) {
        let commas = Math.floor((numStr.length - 1) / 3);

        for (let i = 1; i <= commas; i++) {
            numStr = numStr.slice(0, -3 * i) + ',' + numStr.slice(-3 * i);
        }
    }

    return numStr;
}

module.exports = formatNumber;