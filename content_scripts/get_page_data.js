(function () {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    /**
     * Retrieves the page data we want and return the object.
     */
    function retrieveData() {
        let titles = [];
        document.querySelectorAll("h1").forEach(element => {
            titles.push(element.innerText);
        });
        return {
            titles: titles,
            tab: {
                title: document.title,
                url: document.URL
            }
        };
    }

    /**
     * Listen for messages from the background script.
     * Call "retrieveData()".
     */
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.command === "fetchData") {
            sendResponse(retrieveData());
        }
    });
})();