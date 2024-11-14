// ==UserScript==
// @name         Remove target="_blank" from links
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes target="_blank" from all links to prevent opening in new tabs
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Find all <a> elements in the document
    const links = document.querySelectorAll('a[target="_blank"]');

    // Loop through each link and remove the target="_blank" attribute
    links.forEach(link => {
        link.removeAttribute('target');
        console.log(`Removed target="_blank" from: ${link.href}`);
    });
})();
