/* eslint-disable no-multi-spaces */
var buttonSet = [
    { url: "https://gog-games.to/game/",       title: "Try for free!" },
];
var siteSet = [
    { url: "https://www.gog.com/game/*",           title: "GOG" },
    { url: "https://www.gog.com/en/game/*",        title: "GOG" },
];

/*
All Credit for this userscript goes to Kozinc and AnimeIsMyWaifu. I simply tweaked the script a little.
*/
// ==UserScript==
// @name         GOG to Free Download Site
// @namespace    AnimeIsMyWaifu
// @author       AnimeIsMyWaifu
// @version      0.2
// @description  Try games from GOG for free before purchasing them
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @match        https://www.gog.com/game/*
// @match        https://www.gog.com/en/game/*
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/481134/GOG%20to%20Free%20Download%20Site.user.js
// @updateURL https://update.greasyfork.org/scripts/481134/GOG%20to%20Free%20Download%20Site.meta.js
// ==/UserScript==

var siteSetResult = "";

siteSet.forEach((el) => {
    if(!!document.URL.match(el.url)) siteSetResult = el.title;
})

console.log("Games Links: ", siteSetResult);
var appName = "";
switch(siteSetResult) {
    case "GOG":
        appName = document.getElementsByClassName("productcard-basics__title")[0].textContent;
        appName = appName.trim();
        buttonSet.forEach((el) => {
            $("button.cart-button")[0].parentElement.parentElement.append(furnishGOG(el.url+appName, el.title))
        })
        break;
}

function furnishGOG(href, innerHTML) {
    let element = document.createElement("a");
    element.target= "_blank";
    element.style = "margin: 5px 0 5px 0 !important; padding: 5px 10px 5px 10px;";
    element.classList.add("button");
    //element.classList.add("button--small");
    element.classList.add("button--big");
    element.classList.add("cart-button");
    element.classList.add("ng-scope");
    element.href = href;
    element.innerHTML= innerHTML;
    return element;
}