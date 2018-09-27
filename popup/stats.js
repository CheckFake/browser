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
    return Math.round(Math.random() * 100);
}

/**
 * Queries the content script.
 */
function asksPageForData(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
        command: "fetchData"
    }).then(data => {
        console.log(data);
        document.querySelector("#page-name").innerHTML = data.pageName;
        document.querySelector("#confidence-score").innerHTML = computeConfidenceScore(data);
    });
}

/**
 * Asks the content script for details about the page it's running on.
 */
function fetchPageData() {
    browser.tabs.query({active: true, currentWindow: true})
        .then(asksPageForData)
        .catch(reportError);
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

browser.tabs.executeScript({file: "/content_scripts/get_page_data.js"})
    .then(fetchPageData)
    .catch(reportExecuteScriptError);
