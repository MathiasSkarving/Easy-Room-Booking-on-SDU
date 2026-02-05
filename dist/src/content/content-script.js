chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTokens") {
        let tokens = null;
        tokens = getFreshTokens();
        if (tokens === null) {
            console.error("Tokens not found");
            return;
        }
        sendResponse({ tokens: tokens });
    }
    console.log("Tokens fetched");
    return true;
});
function getFreshTokens() {
    const vs = document.querySelector('input[name="__VIEWSTATE"]');
    const vsg = document.querySelector('input[name="__VIEWSTATEGENERATOR"]');
    const ev = document.querySelector('input[name="__EVENTVALIDATION"]');
    if (!vs || !vsg || !ev) {
        console.error("ASP.NET Tokens not found in the current DOM.");
        return null;
    }
    return {
        viewState: vs.value,
        viewStateGenerator: vsg.value,
        eventValidation: ev.value
    };
}

