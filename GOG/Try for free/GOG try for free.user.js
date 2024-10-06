/* eslint-disable no-multi-spaces */

// Button configurations
const buttonSet = [
    { url: "https://gog-games.to/game/", title: "Try for free!" },
];

// URL match patterns
const siteSet = [
    { regex: /https:\/\/www\.gog\.com\/(?:en\/)?game\/.*/, title: "GOG" },
];

// ==UserScript==
// @name         GOG to Free Download Site
// @namespace    AnimeIsMyWaifu
// @author       AnimeIsMyWaifu
// @version      0.5
// @description  Try games from GOG for free before purchasing them
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @match        https://www.gog.com/game/*
// @match        https://www.gog.com/en/game/*
// @grant        none
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// @updateURL https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// ==/UserScript==

const siteSetResult = siteSet.find(el => document.URL.match(el.regex));

if (siteSetResult) {
    console.log("Games Links: ", siteSetResult.title);
    
    // Extract the required game name from the HTML structure
    const requiredGameElement = document.querySelector(".content-summary-item__description .product-tile__title");
    const requiredGameName = requiredGameElement ? requiredGameElement.textContent.trim() : "Unknown Game";
    
    console.log("Required Game Name: ", requiredGameName); // Log the required game name

    buttonSet.forEach((el) => {
        const button = furnishGOG(`${el.url}${requiredGameName.replace(/\s+/g, '_')}`, el.title);
        $("button.cart-button")[0]?.parentElement.parentElement.append(button);
    });
}

function furnishGOG(href, innerHTML) {
    const element = document.createElement("a");
    element.target = "_blank";
    element.style = "margin: 5px 0; padding: 5px 10px;";
    element.classList.add("button", "button--big", "cart-button", "ng-scope");
    element.href = href;
    element.innerHTML = innerHTML;
    return element;
}
