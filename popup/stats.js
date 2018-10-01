/**
 * Just log the error to the console.
 */
function reportError(error) {
    console.error(`Could not fetch page: ${error}`);
}

/**
 * Computes the confidence score given the page data.
 */
function computeConfidenceScore(data) {
    if (data.fromLocalStorage) {
        return data;
    }
    data.scores = {
        'website-score': {
            value: 0,
            title: 'Website',
            type: 'details'
        },
        'author-score': {
            value: 0,
            title: 'Author',
            type: 'details'
        }
    };
    for (const key of Object.keys(data.scores)) {
        data.scores[key].value = Math.round(Math.random() * 100);
    }

    let confidenceScore = Object.values(data.scores).reduce((a, b) => a.value + b.value);
    data.scores['confidence-score'] = {
        type: 'overall',
        value: Math.round(confidenceScore / Object.keys(data.scores).length)
    };
    return data;
}

function displayConfidenceScore(data, tabs) {
    let tab = tabs[0];

    document.querySelector("#page-name").innerText = data.tab.title;
    document.querySelector('#confidence-score').innerText = data.scores['confidence-score'].value;
    let tableScores = document.querySelector('#scores');

    Object.entries(data.scores)
        .filter(([key, score]) => score && score.type === 'details')
        .forEach(([key, score]) => {
            let line = document.createElement('tr');
            line.innerHTML = `<tr>
                <th scope="row">${score.title}</th>
                <td id="${key}" class="score">${score.value}</td>
            </tr>`;
            tableScores.appendChild(line);
        });

    let badgeDetails = {
        tabId: tab.id,
        text: data.scores['confidence-score'].value.toString()
    };
    return browser.browserAction.setBadgeText(badgeDetails);
}

/**
 * Attempts to retrieve data from local storage
 */
function fetchDataFromStorage(tabs) {
    let tab = tabs[0];
    return browser.storage.local.get(tab.url);
}

/**
 * Stores data in the local storage
 */
function storeData([tabs, data]) {
    if (data.fromLocalStorage) {
        return;
    }
    let tab = tabs[0];
    let contentToStore = {};
    contentToStore[tab.url] = data;
    return browser.storage.local.set(contentToStore);
}

/**
 * Queries the content script.
 */
function fetchTabData([tabs, localData]) {
    let tab = tabs[0];
    if (localData && Object.keys(localData).length > 0) {
        let data = localData[tab.url];
        data.fromLocalStorage = true;
        return data;
    }
    return browser.tabs.sendMessage(tab.id, {command: "fetchData"});
}

/**
 * Asks the content script for details about the page it's running on.
 */
function getActiveTab() {
    let tabQuery = {active: true, currentWindow: true};
    return browser.tabs.query(tabQuery);
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function showErrorInPopup() {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
}

/**
 * Display/hide details about the score
 */
function toggleScoreDetails() {
    document.querySelector("#score-details").classList.toggle("hidden");
}

(function () {
    document.querySelector("#confidence-score-wrapper").addEventListener('click', toggleScoreDetails);
})();

let script = {file: "/content_scripts/get_page_data.js"};
let backgroundColorDetails = {
    color: "#FFD729"
};

browser.tabs.executeScript({file: "/libs/browser-polyfill.min.js"})
    .catch(error => {
        showErrorInPopup();
        console.error("Error injecting polyfill script", error);
    });

let activeTabPromise = browser.tabs.executeScript(script)
    .then(getActiveTab)
    .catch(error => {
        showErrorInPopup();
        console.error("Error injecting extension script or retrieving active tab", error);
    });

let fetchFromStoragePromise = activeTabPromise
    .then(fetchDataFromStorage)
    .catch(error => {
        showErrorInPopup();
        console.error("Error fetching from storage", error);
    });

let computeScorePromise = Promise.all([activeTabPromise, fetchFromStoragePromise])
    .then(fetchTabData)
    .then(computeConfidenceScore)
    .catch(error => {
        showErrorInPopup();
        console.error("Error computing score", error);
    });

Promise.all([activeTabPromise, computeScorePromise])
    .then(storeData)
    .catch(error => {
        showErrorInPopup();
        console.error("Error storing data", error);
    });

Promise.all([activeTabPromise, computeScorePromise, browser.browserAction.setBadgeBackgroundColor(backgroundColorDetails)])
    .then(([tabs, data]) => displayConfidenceScore(data, tabs))
    .catch(error => {
        showErrorInPopup();
        console.error("Error displaying score", error);
    });
