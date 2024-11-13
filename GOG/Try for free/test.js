// ==UserScript==
// @name         GOG Button Injection Example
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add a floating button to print a message
// @author       You
// @match        https://www.gog.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the floating button element
    const button = document.createElement('button');
    button.textContent = 'Click Me!';
    button.style.position = 'fixed';
    button.style.top = '50%';
    button.style.left = '50%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';

    // Add the button to the body of the page
    document.body.appendChild(button);

    // Add an event listener to print the message when the button is clicked
    button.addEventListener('click', () => {
        console.log('Userscript successfully injected');
        alert('Userscript successfully injected');
    });
})();