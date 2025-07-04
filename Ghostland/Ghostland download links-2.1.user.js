// ==UserScript==
// @name         Ghostland download links
// @namespace    https://nx-content.ghostland.at/
// @match        https://nx-content.ghostland.at/*
// @grant        none
// @version      2.2
// @author       You
// @description  Makes the Base Game and update tabs on Ghostland redirect to download links for the relevant content
// ==/UserScript==

(function () {
    'use strict';
    const log = (...args) => console.log('[Injector]', ...args);

    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    };

    const injectLinks = async () => {
        log('🔍 Looking for Base Game section');

        let baseGameSection;
        try {
            await waitForElement('h4.text-orange-400');
            const headers = Array.from(document.querySelectorAll('h4.text-orange-400'));
            const baseHeader = headers.find(h => h.textContent.trim() === 'Base Game');
            if (!baseHeader) throw new Error('Base Game header not found');

            baseGameSection = baseHeader.closest('.space-y-3');
            if (!baseGameSection) throw new Error('Base Game container not found');
        } catch (err) {
            return log('❌ Error finding Base Game section:', err);
        }

        const tidElement = baseGameSection.querySelector('p');
        if (!tidElement) return log('❌ Could not find TID paragraph');
        const tidMatch = tidElement.textContent.match(/TID:\s*([0-9A-Fa-f]{16})/);
        if (!tidMatch) return log('❌ TID format not found');
        const titleId = tidMatch[1];
        log(`🆔 Extracted Title ID: ${titleId}`);

        let availableSection;
        try {
            await waitForElement('.card-glass h3');
            availableSection = Array.from(document.querySelectorAll('.card-glass'))
                .find(sec => sec.querySelector('h3')?.textContent.trim() === 'Available Content');
        } catch {
            return log('❌ Could not find Available Content section');
        }

        if (!availableSection) return log('❌ Available Content section missing');

        const proxyBase = 'https://sweet-sun.doodlebombv13.workers.dev/';
        const nswUrl = `https://nswdl.com/${encodeURIComponent(titleId)}`;
        const proxyUrl = `${proxyBase}?url=${encodeURIComponent(nswUrl)}`;
        let html;
        try {
            log(`🌐 Fetching via proxy: ${proxyUrl}`);
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            html = await res.text();
            log('✅ Fetched NSWDL page successfully');
        } catch (err) {
            return log('❌ Fetch failed:', err);
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');

        const getPreferredLink = (category) => {
            const row = Array.from(doc.querySelectorAll('.download-box table tbody tr'))
                .find(tr => tr.children[0]?.textContent.trim().toLowerCase() === category.toLowerCase());
            if (!row) {
                log(`⚠️ No row found for category: ${category}`);
                return null;
            }

            const linkCells = Array.from(row.querySelectorAll('td a'));
            const preferredOrder = ['Buzzheavier', 'SendCM', '1Fichier'];
            for (const name of preferredOrder) {
                const found = linkCells.find(a => a.textContent.trim().toLowerCase() === name.toLowerCase());
                if (found) {
                    log(`🔗 Found preferred ${category} link: ${name}`);
                    return found.href;
                }
            }

            log(`❌ No preferred host found for ${category}`);
            return null;
        };

        const baseUrl = getPreferredLink('Base');
        const updateUrl = getPreferredLink('Update');

        const wrapCard = (labelRegex, url) => {
            if (!url) return log(`⛔ Skipping wrap for ${labelRegex}, no URL`);

            const wrapper = Array.from(availableSection.querySelectorAll('div.space-y-3'))
                .find(div => labelRegex.test(div.querySelector('h4')?.textContent));
            const card = wrapper?.querySelector('div.p-4.rounded-lg');

            if (card && !card.closest('a')) {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'block';
                a.style.textDecoration = 'none';
                a.appendChild(card.cloneNode(true));
                card.replaceWith(a);
                log(`✅ Wrapped ${labelRegex} card with ${url}`);
            } else {
                log(`⚠️ Could not wrap ${labelRegex}: card missing or already linked`);
            }
        };

        wrapCard(/Base Game/i, baseUrl);
        wrapCard(/^Updates/i, updateUrl);
    };

    let lastUrl = location.href;
    const observeUrlChange = () => {
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                log('🔄 URL changed, re-injecting...');
                setTimeout(injectLinks, 250);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    observeUrlChange();
    injectLinks();
})();
