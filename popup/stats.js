function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getItemNameFromKey(key) {
    let arr = key.split("_");
    arr.pop();
    arr = arr.join(" ");
    return capitalizeFirstLetter(arr);
}

function displayConfidenceScore(data, tabs) {
    let tab = tabs[0];

    for (let item of document.querySelectorAll(".page-url")) {
        item.innerText = tab.url;
    }
    for (let item of document.querySelectorAll(".page-author")) {
        item.innerText = "Unknown";
    }
    for (let item of document.querySelectorAll(".confidence-score")) {
        item.innerText = data.data.global_score;
    }
    document.querySelector('#confidence-meter').setAttribute("value", data.data.global_score);

    let tableScores = document.querySelector('#scores');
    Object.entries(data.data.scores)
        .forEach(([key, score]) => {
            let line = document.createElement('tr');
            line.innerHTML = `<tr>
                <th scope="row">${getItemNameFromKey(key)}</th>
                <td id="${key}" class="score">${score}</td>
            </tr>`;
            tableScores.appendChild(line);
        });

    let badgeDetails = {
        tabId: tab.id,
        text: data.data.global_score.toString()
    };
    return browser.browserAction.setBadgeText(badgeDetails);
}

/**
 * Queries the API for the scores of the current tab
 */
function queryAPI(tabs) {
    let url = encodeURIComponent(tabs[0].url);
    return fetch(`https://fakenewsdetector.augendre.info/api/page?url=${url}`);
}

/**
 * Queries browser for the active tab.
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

let backgroundColorDetails = {
    color: "#FFD729"
};


let activeTabPromise = getActiveTab()
    .catch(error => {
        showErrorInPopup();
        console.error("Error getting active tab", error);
    });

let getScorePromise = activeTabPromise
    .then(queryAPI)
    .then(response => {
        return response.json();
    })
    .catch(error => {
        showErrorInPopup();
        console.error("Error computing score", error);
    });

Promise.all([activeTabPromise, getScorePromise, browser.browserAction.setBadgeBackgroundColor(backgroundColorDetails)])
    .then(([tabs, data]) => displayConfidenceScore(data, tabs))
    .catch(error => {
        showErrorInPopup();
        console.error("Error displaying score", error);
    });
