// ==UserScript==
// @name         GOG to Free Download Site
// @namespace    Smealm
// @author       Smealm
// @version      1.4
// @description  Try games from GOG for free before purchasing them
// @match        https://www.gog.com/*/game*
// @grant        none
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// @updateURL    https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js
// ==/UserScript==

(function() {
    'use strict'; // Use strict mode for cleaner coding practices

    console.log('Starting the GOG to Free Download Site script...');

    // This array holds the configuration for the button we will create
    const buttonSet = [
        { url: "https://gog-games.to/game/", title: "Try for free" } // Base URL and button text
    ];

    console.log('Button configuration loaded:', buttonSet);

    // Check if the current page is a GOG game page
    if (document.URL.match(/https:\/\/.*gog\.com\/.*game\//)) {
        console.log('Detected GOG game page. Proceeding with processing...');

        // Initialize variables
        let gameNameForURL = "";
        let gameHref = "";
        let GOGProductName = ""; // Variable to store cleaned product name
        let GOGProductID = ""; // Variable to store product ID
        let finalUrl = null; // Initialize a variable for the final URL we will use for the button

        console.log('Initialized variables for game name, game href, product name, and product ID.');

        // Look for the content-summary section with requiredGames
        const requiredGamesSection = document.querySelector('[content-summary-section-id="requiredGames"]');
        console.log('Searching for required games section...');

        // If the section is found
        if (requiredGamesSection) {
            console.log('Required games section found. Searching for product tile...');

            const productTile = requiredGamesSection.querySelector(".product-tile__content.js-content");
            if (productTile) {
                // Get the game title from the product tile href
                gameNameForURL = productTile.getAttribute("href").split("/game/")[1]; // Extract from href
                gameHref = productTile.getAttribute("href");

                console.log('Product tile found. Game name:', gameNameForURL);
                console.log('Game href:', gameHref);
            }
        } else {
            console.warn('Required games section not found on the page.');
        }

        // If the title is still empty, extract it from the URL
        if (!gameNameForURL) {
            gameNameForURL = document.URL.split("/game/")[1];
            console.log('Game name extracted from URL:', gameNameForURL);
        }

        // Look for the edition picker link element
        const editionPickerLink = document.querySelector("a.edition-picker-list__item");
        console.log('Searching for edition picker link...');

        // If the edition picker link is found on the page
        if (editionPickerLink) {
            console.log('Edition picker link found. Cleaning and constructing final URL...');
            const href = editionPickerLink.getAttribute("href");

            // Clean the href by removing the base URL and any language parts
            const cleanedHref = href.replace(/https:\/\/www\.gog\.com\/|\/game\/|\/(en|de|fr|pl|ru|zh)/g, "");
            console.log('Cleaned edition picker href:', cleanedHref);

            // Construct the final URL by combining the base button URL with the cleaned href
            finalUrl = buttonSet[0].url + cleanedHref;
        }

        // Use the gameHref if available
        if (!finalUrl && gameHref) {
            console.log('Using gameHref to construct the final URL...');
            finalUrl = buttonSet[0].url + gameHref.replace("/en/game/", "");
        }

        // If we still don't have a final URL
        if (!finalUrl) {
            console.log('No final URL constructed yet. Formatting game name...');
            // Format the game name by replacing spaces and dashes with underscores, and removing invalid characters
            const formattedGameName = gameNameForURL
                ? gameNameForURL.replace(/\s+/g, '_').replace(/[-]/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
                : "";
            console.log('Formatted game name:', formattedGameName);

            // Construct the final URL using the formatted game name
            finalUrl = `${buttonSet[0].url}${formattedGameName}`;
        }

        console.log('Constructed final URL:', finalUrl);

// Store the original URL to revert to in case of an error
let previousUrl = finalUrl;

// Additional check and modifications as per the request
try {
    if (finalUrl && finalUrl.includes("https://gog-games.to/game/")) {
        console.log('Final URL contains "https://gog-games.to/game/". Proceeding with GOG DB fetch...');

        // Modify the final URL to match the GOG.com structure
        let tempUrl = finalUrl.replace("https://gog-games.to/game/", "https://www.gog.com/game/");
        console.log('Modified Final URL:', tempUrl);

        // Fetch the new final URL through the Cloudflare Worker
        const encodedUrl = encodeURIComponent(tempUrl);
        const workerUrl = `https://sweet-sun.doodlebombv13.workers.dev/?url=${encodedUrl}`;

        console.log('Fetching data from Worker with URL:', workerUrl);

        fetch(workerUrl)  // Fetch the GOG game page through the Worker proxy
            .then(response => {
                // Log the response status and check if it's a success
                console.log('Received response from Worker. Status:', response.status);
                if (!response.ok) {
                    console.error('Failed to fetch GOG game content through Worker. Status:', response.status);
                    throw new Error(`Network response was not ok: ${response.status}`);
                }
                return response.text(); // Continue with the fetch if the response is valid
            })
            .then(html => {
                console.log('Successfully fetched HTML from Cloudflare Worker. Parsing HTML...');
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html'); // Parse the HTML content

                // Locate the product ID from the fetched HTML
                const productIDElement = doc.querySelector('[card-product]');
                if (productIDElement) {
                    const GOGProductID = productIDElement.getAttribute('card-product');
                    console.log('Product ID found in fetched HTML:', GOGProductID);

                    // Construct the URL to fetch the GOG database page
                    const gogDBUrl = `https://www.gogdb.org/product/${GOGProductID}#references`;
                    console.log('Original GOG DB URL:', gogDBUrl);

                    // Encode the URL for use in the query parameter
                    const encodedUrl = encodeURIComponent(gogDBUrl);

                    // Cloudflare Worker URL
                    const workerUrl = `https://sweet-sun.doodlebombv13.workers.dev/?url=${encodedUrl}`;

                    console.log('Fetching data from Cloudflare Worker URL:', workerUrl);

                    fetch(workerUrl)  // Use the Worker URL instead of the original GOG DB URL
                        .then(response => {
                            // Log the response status and check if it's a success
                            console.log('Received response from Worker. Status:', response.status);
                            if (!response.ok) {
                                console.error('Failed to fetch GOG DB content through Worker. Status:', response.status);
                                throw new Error(`Network response was not ok: ${response.status}`);
                            }
                            return response.text(); // Continue with the fetch if the response is valid
                        })
                        .then(html => {
                            console.log('Successfully fetched HTML from Cloudflare Worker. Parsing HTML...');
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html'); // Parse the HTML content

                            // Fetch the product ID from the product link in the HTML
                            let fetchedProductID = GOGProductID;

// Search the entire document for the exact <h2>Included games</h2> tag
const heading = Array.from(doc.querySelectorAll('h2')).find(
    el => el.textContent.trim() === 'Included games'
);

if (heading) {
    // Get the next sibling element
    let nextSibling = heading.nextElementSibling;

    // Traverse siblings until a <table> is found or no siblings remain
    while (nextSibling && nextSibling.tagName !== 'TABLE') {
        nextSibling = nextSibling.nextElementSibling;
    }

    // If a valid <table> is found
    if (nextSibling) {
        const table = nextSibling;

        // Search for the td with class "col-name prod-unlisted" inside this table
        const prodUnlistedCell = table.querySelector('td.col-name.prod-unlisted');
        if (prodUnlistedCell) {
            // Find the product link inside the td
            const productLink = prodUnlistedCell.querySelector('a[href^="/product/"]');
            if (productLink) {
                // Extract the product ID
                const newProductID = productLink.getAttribute('href').replace('/product/', '').split('?')[0];
                console.log('Fetched product ID:', newProductID);

                // Update fetchedProductID
                fetchedProductID = newProductID;
            } else {
                console.log('Product link not found within prod-unlisted cell.');
            }
        } else {
            console.log('No prod-unlisted cell found in the table.');
        }
    } else {
        console.log('No valid table found after the heading.');
    }
} else {
    console.log('<h2>Included games</h2> not found in the document.');
}

                            console.log('Final product ID:', fetchedProductID);

                            // Construct the final URL with the fetched product ID
                            finalUrl = `https://gog-games.to/game/${fetchedProductID}`;
                            console.log('Constructed new final URL:', finalUrl);

                            // Now create the button with the new final URL
                            const gameButton = furnishGOG(finalUrl, buttonSet[0].title);

                            // Find the "Buy Now" button and insert the "Try for free" button after it
                            const buyNowButton = document.querySelector("button.button--big.buy-now-button");
                            if (buyNowButton) {
                                console.log('Buy Now button found. Inserting "Try for free" button...');
                                buyNowButton.parentElement.insertBefore(gameButton, buyNowButton.nextSibling);
                            } else {
                                console.warn('Buy Now button not found on the page.');
                            }
                        })
                        .catch(error => {
                            // Handle errors during fetching GOG DB content
                            console.error('Error fetching the GOG DB page through Worker:', error);
                            console.log('Reverting back to the original final URL:', previousUrl);
                            // Revert to the original final URL if an error occurs
                            finalUrl = previousUrl;
                        });
                } else {
                    console.error('Product ID not found in the fetched GOG DB HTML.');
                    console.log('Reverting back to the original final URL:', previousUrl);
                    // Revert to the original final URL if product ID is not found
                    finalUrl = previousUrl;
                }
            })
            .catch(error => {
                // Handle errors during the first fetch
                console.error('Error fetching the GOG product page through Worker:', error);
                console.log('Reverting back to the original final URL:', previousUrl);
                // Revert to the original final URL if an error occurs
                finalUrl = previousUrl;
            });
    }
	} catch (error) {
	    console.error('An error occurred during the process:', error);
	    console.log('Reverting back to the original final URL:', previousUrl);
	    // Revert to the original final URL if an error occurs
	    finalUrl = previousUrl;
	}

	// Check if productId is defined before creating the button
	if (productId) { // Assuming productId is defined somewhere in the code
	    // Now create the button with the new final URL
	    const gameButton = furnishGOG(finalUrl, buttonSet[0].title);

	    // Find the "Buy Now" button and insert the "Try for free" button after it
	    const buyNowButton = document.querySelector("button.button--big.buy-now-button");
	    if (buyNowButton) {
	        console.log('Buy Now button found. Inserting "Try for free" button...');
	        buyNowButton.parentElement.insertBefore(gameButton, buyNowButton.nextSibling);
	    } else {
	        console.warn('Buy Now button not found on the page.');
	    }
	} else {
	    console.error('Product ID not found in the fetched GOG DB HTML.');
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
    }
	})();
