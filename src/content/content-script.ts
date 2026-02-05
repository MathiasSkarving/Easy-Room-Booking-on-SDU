chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTokens") {
        let tokens: Tokens | null = null;
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

interface Tokens {
    viewState?: string;
    viewStateGenerator?: string;
    eventValidation?: string;
}

function getFreshTokens(): Tokens | null {
    const vs = document.querySelector('input[name="__VIEWSTATE"]') as HTMLInputElement;
    const vsg = document.querySelector('input[name="__VIEWSTATEGENERATOR"]') as HTMLInputElement;
    const ev = document.querySelector('input[name="__EVENTVALIDATION"]') as HTMLInputElement;

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