const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
const params = '?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
let comparisonList = JSON.parse(localStorage.getItem('comparisonList')) || [];
let userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
    priceChange: false,
    sortMarketCap: false,
    favoriteCrypto: false
};

async function fetchCryptoData() {
    try {
        const response = await fetch(apiUrl + params);
        const data = await response.json();
        displayCryptoData(data);
        displayComparisonData();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayCryptoData(data) {
    const cryptoListBody = document.getElementById('crypto-list-body');
    cryptoListBody.innerHTML = '';

    if (userPreferences.sortMarketCap) {
        data.sort((a, b) => b.market_cap - a.market_cap);
    }

    data.forEach(crypto => {
        if (userPreferences.favoriteCrypto && !comparisonList.some(c => c.id === crypto.id)) {
            return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${crypto.name}</td>
            <td>${crypto.symbol.toUpperCase()}</td>
            <td>$${crypto.current_price.toLocaleString()}</td>
            <td>${crypto.price_change_percentage_24h.toFixed(2)}%</td>
            <td>$${crypto.market_cap.toLocaleString()}</td>
            <td><button onclick="addToComparison('${crypto.id}')">Add</button></td>
        `;
        cryptoListBody.appendChild(row);
    });
}

function displayComparisonData() {
    const comparisonBody = document.getElementById('comparison-body');
    comparisonBody.innerHTML = '';

    if (comparisonList.length === 0) {
        comparisonBody.innerHTML = '<tr><td colspan="6">No cryptocurrencies to compare.</td></tr>';
        return;
    }

    comparisonList.forEach (crypto => {
        const name = crypto.name || 'N/A';
        const symbol = crypto.symbol ? crypto.symbol.toUpperCase() : 'N/A';
        const currentPrice = crypto.current_price ? `$${crypto.current_price.toLocaleString()}` : '$0';
        const priceChange = crypto.price_change_percentage_24h !== undefined ? `${crypto.price_change_percentage_24h.toFixed(2)}%` : 'N/A';
        const marketCap = crypto.market_cap ? `$${crypto.market_cap.toLocaleString()}` : '$0';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${name}</td>
            <td>${symbol}</td>
            <td>${currentPrice}</td>
            <td>${priceChange}</td>
            <td>${marketCap}</td>
            <td><button onclick="removeFromComparison('${crypto.id}')">Remove</button></td>
        `;
        comparisonBody.appendChild(row);
    });
}

function addToComparison(id) {
    if (comparisonList.length >= 5) {
        alert('You can only compare up to 5 cryptocurrencies.');
        return;
    }

    fetch(`https://api.coingecko.com/api/v3/coins/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!comparisonList.some(c => c.id === data.id)) {
                comparisonList.push(data);
                localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
                displayComparisonData();
            } else {
                alert('This cryptocurrency is already in your comparison list.');
            }
        })
        .catch(error => console.error('Error adding to comparison:', error));
}

function removeFromComparison(id) {
    comparisonList = comparisonList.filter(crypto => crypto.id !== id);
    localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
    displayComparisonData();
}

function updatePreferences() {
    userPreferences.priceChange = document.getElementById('price-change').checked;
    userPreferences.sortMarketCap = document.getElementById('sort-market-cap').checked;
    userPreferences.favoriteCrypto = document.getElementById('favorite-crypto').checked;
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    fetchCryptoData();
}

function loadPreferences() {
    document.getElementById('price-change').checked = userPreferences.priceChange;
    document.getElementById('sort-market-cap').checked = userPreferences.sortMarketCap;
    document.getElementById('favorite-crypto').checked = userPreferences.favoriteCrypto;
}

document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    fetchCryptoData();
    document.getElementById('price-change').addEventListener('change', updatePreferences);
    document.getElementById('sort-market-cap').addEventListener('change', updatePreferences);
    document.getElementById('favorite-crypto').addEventListener('change', updatePreferences);
});