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
            console.log(key, score);
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
            displayConfidenceScore(data, tabs);
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
