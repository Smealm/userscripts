// ==UserScript==
// @name         GOG to Free Download Site
// @namespace    Smealm
// @author       Smealm
// @version      1.1
// @description  Try games from GOG for free before purchasing them
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @match        https://*gog.com/*game/*
// @grant        none
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// @updateURL https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// ==/UserScript==

(function() {
    'use strict'; // Use strict mode for cleaner coding practices

    // This array holds the configuration for the button we will create
    const buttonSet = [
        { url: "https://gog-games.to/game/", title: "Try for free!" }, // Base URL and button text
    ];

    // This array defines the patterns to match GOG game pages
    const siteSet = [
        { url: "https://*gog.com/*game/*", title: "GOG" }, // Pattern to identify GOG game URLs
    ];

    // Check if the current page's URL matches any of the defined patterns
    const siteSetResult = siteSet.find(el => document.URL.match(el.regex));

    // If the current page is identified as a GOG game page
    if (siteSetResult) {
        // Attempt to find the game title element on the page
        const requiredGameElement = document.querySelector(".content-summary-item__description .product-tile__title");
        
        // Get the game title text; if not found, initialize as an empty string
        let gameNameForURL = requiredGameElement ? requiredGameElement.textContent.trim() : ""; 
        
        // If the title is still empty, extract it from the URL
        if (!gameNameForURL) {
            gameNameForURL = document.URL.split("/game/")[1]; // Take the part of the URL after "/game/"
        }

        let finalUrl = null; // Initialize a variable for the final URL we will use for the button

        // Look for the edition picker link element
        const editionPickerLink = document.querySelector("a.edition-picker-list__item");
        
        // If the edition picker link is found on the page
        if (editionPickerLink) {
            // Get the href attribute from the edition picker link
            const href = editionPickerLink.getAttribute("href"); 
            
            // Clean the href by removing the base URL and any language parts
            const cleanedHref = href.replace(/https:\/\/www\.gog\.com\/|\/game\/|\/(en|de|fr|pl|ru|zh)/g, ""); 
            
            // Construct the final URL by combining the base button URL with the cleaned href
            finalUrl = buttonSet[0].url + cleanedHref; 
        }

        // If we still don't have a final URL
        if (!finalUrl) {
            // Format the game name by replacing spaces with underscores and removing invalid characters
            const formattedGameName = gameNameForURL ? gameNameForURL.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '') : ""; 
            
            // Construct the final URL using the formatted game name
            finalUrl = `${buttonSet[0].url}${formattedGameName}`; 
        }

        // If we still have no final URL
        if (!finalUrl) {
            // Clean the current page URL by removing the GOG base URL and language parts
            const currentPageUrl = window.location.href.replace(/https:\/\/www\.gog\.com\/|\/(en|de|fr|pl|ru|zh)/g, ""); 
            
            // Set the final URL to the cleaned current page URL
            finalUrl = currentPageUrl; 
        }

        // Create the button element with the final URL and button title
        const gameButton = furnishGOG(finalUrl, buttonSet[0].title); 

        // Find the "Buy Now" button on the page
        const buyNowButton = document.querySelector("button.button--big.buy-now-button");
        
        // If the "Buy Now" button is found
        if (buyNowButton) {
            // Insert the new button right after the "Buy Now" button in the layout
            buyNowButton.parentElement.insertBefore(gameButton, buyNowButton.nextSibling); 
        } else {
            // If the "Buy Now" button is not found, log a warning to the console
            console.warn("Buy now button not found."); 
        }
    }

    // Function to create the button element for the GOG link
    function furnishGOG(href, innerHTML) {
        const element = document.createElement("a"); // Create a new anchor element for the button
        element.target = "_blank"; // Set the link to open in a new tab
        element.classList.add("button", "button--big", "cart-button", "ng-scope"); // Add CSS classes for styling
        element.href = href; // Set the button's href to the final URL
        element.textContent = innerHTML; // Set the button's display text
        return element; // Return the created button element
    }
})();
