// ==UserScript==
// @name         GOG to Free Download Site
// @namespace    AnimeIsMyWaifu
// @author       AnimeIsMyWaifu
// @version      0.8
// @description  Try games from GOG for free before purchasing them
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @match        https://www.gog.com/game/*
// @match        https://www.gog.com/en/game/*
// @grant        none
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// @updateURL https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// ==/UserScript==

const buttonSet = [
    { url: "https://gog-games.to/game/", title: "Try for free!" },
];

const siteSet = [
    { regex: /https:\/\/www\.gog\.com\/(?:en\/)?game\/.*/, title: "GOG" },
];

const siteSetResult = siteSet.find(el => document.URL.match(el.regex));

if (siteSetResult) {
    const requiredGameElement = document.querySelector(".content-summary-item__description .product-tile__title");
    const fallbackGameElement = document.querySelector(".productcard-basics__title");

    const requiredGameName = requiredGameElement ? requiredGameElement.textContent.trim() : fallbackGameElement ? fallbackGameElement.textContent.trim() : "";
    const gameNameForURL = requiredGameName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    const gameButton = furnishGOG(`${buttonSet[0].url}${gameNameForURL}`, buttonSet[0].title);

    // Find the "Buy now" button
    const buyNowButton = document.querySelector("button.button--big.buy-now-button");
    if (buyNowButton) {
        buyNowButton.parentElement.insertBefore(gameButton, buyNowButton.nextSibling); // Insert after the "Buy now" button
    } else {
        console.warn("Buy now button not found.");
    }
}

function furnishGOG(href, innerHTML) {
    const element = document.createElement("a");
    element.target = "_blank";
    element.classList.add("button", "button--big", "cart-button", "ng-scope");
    element.href = href;
    element.textContent = innerHTML; // Using textContent for better security
    return element;
}
