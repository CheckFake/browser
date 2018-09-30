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
    data.score = {
        'website-score': 0,
        'author-score': 0
    };
    for (const key of Object.keys(data.score)) {
        data.score[key] = Math.round(Math.random() * 100);
    }
    let confidenceScore = Object.values(data.score).reduce((a, b) => a + b);
    data.score['confidence-score'] = Math.round(confidenceScore / Object.keys(data.score).length);
    return data;
}

function displayConfidenceScore(data, tabs) {
    let tab = tabs[0];

    document.querySelector("#page-name").innerText = data.tab.title;
    document.querySelectorAll('.score').forEach(
        element => element.innerText = data.score[element.id]
    );

    let badgeDetails = {
        tabId: tab.id,
        text: data.score['confidence-score'].toString()
    };
    if (typeof browser !== 'undefined') {
        return browser.browserAction.setBadgeText(badgeDetails);
    }
    else {
        chrome.browserAction.setBadgeText(badgeDetails);
    }
}

/**
 * Queries the content script.
 */
function fetchTabData(tabs) {
    let tab = tabs[0];
    if (typeof browser !== 'undefined') {
        return browser.tabs.sendMessage(tab.id, {command: "fetchData"});
    }
    else {
        chrome.tabs.sendMessage(tab.id, {command: "fetchData"}, data => {
            data = computeConfidenceScore(data);
            displayConfidenceScore(data, tab);
        });
    }
}

/**
 * Asks the content script for details about the page it's running on.
 */
function getActiveTab() {
    let tabQuery = {active: true, currentWindow: true};
    if (typeof browser !== 'undefined') {
        return browser.tabs.query(tabQuery);
    }
    else {
        chrome.tabs.query(tabQuery, fetchTabData)
    }
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Failed to execute get_page_data content script: ${error.message}`);
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

if (typeof browser !== 'undefined') {
    let activeTabPromise = browser.tabs.executeScript(script)
        .then(getActiveTab);

    let computeScorePromise = activeTabPromise
        .then(fetchTabData)
        .then(computeConfidenceScore);

    Promise.all([activeTabPromise, computeScorePromise, browser.browserAction.setBadgeBackgroundColor(backgroundColorDetails)])
        .then(([tabs, data]) => displayConfidenceScore(data, tabs))
        .catch(reportExecuteScriptError);
}
else {
    chrome.browserAction.setBadgeBackgroundColor(backgroundColorDetails);
    chrome.tabs.executeScript(script, getActiveTab);
}
