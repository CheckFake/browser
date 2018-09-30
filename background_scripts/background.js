let devIconDetails = {
    path: "../icons/logo_dev.svg"
};
let prodIconDetails = {
    path: "../icons/logo.svg"
};

if (typeof browser !== 'undefined') {
    browser.runtime.onInstalled.addListener(details => {
        let iconDetails = prodIconDetails;
        if (details.temporary) {
            iconDetails = devIconDetails
        }
        browser.browserAction.setIcon(iconDetails).catch(console.error);
    });
}
else {
    let iconDetails = prodIconDetails;
    if (!('update_url' in chrome.runtime.getManifest())) {
        iconDetails = devIconDetails
    }
    chrome.browserAction.setIcon(iconDetails);
}
