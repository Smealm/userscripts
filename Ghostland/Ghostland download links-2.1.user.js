// ==UserScript==
// @name         Ghostland download links
// @namespace    https://nx-content.ghostland.at/
// @match        https://nx-content.ghostland.at/*
// @grant        none
// @version      3.0
// @author       Smealm
// @description  Makes the Base Game, update, and DLC tabs on Ghostland redirect to download links for the relevant content, with a pulsing visual cue
// ==/UserScript==

(function() {
    'use strict';
    const log = (...args) => console.log('[Injector]', ...args);

    // ─────────────────────────────────────────────────────────────────
    // Inject glisten + pulse CSS
    // ─────────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fadeout {
  from { opacity: 1; }
  to   { opacity: 0.4; }
}
.glisten {
  position: relative;
  overflow: hidden;
  /* match the child’s rounded corners */
  border-radius: 0.5rem;
}
.glisten::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  /* grayer, subtler shine */
  background: linear-gradient(
    120deg,
    rgba(255,255,255,0)    0%,
    rgba(200,200,200,0.4) 50%,
    rgba(255,255,255,0)    100%
  );
  background-size: 200% 100%;
  /* first do the quick shimmer, then slowly fade the overlay out over 8s */
  animation:
    shimmer 1.2s ease-in-out,
    fadeout 8s ease-in-out 1.2s forwards;
  pointer-events: none;
}

@keyframes pulse {
  0%   { box-shadow: 0 0 0 rgba(255,255,255,0.5); }
  50%  { box-shadow: 0 0 10px rgba(255,255,255,0.8); }
  100% { box-shadow: 0 0 0 rgba(255,255,255,0.5); }
}
.pulse {
  animation: pulse 1s ease-out;
}
`;
    document.head.appendChild(style);

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
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    };

    const injectLinks = async () => {
        log('🔍 Looking for Base Game section');

        // 1) Extract Title ID
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

        // 2) Locate Available Content
        let availableSection;
        try {
            await waitForElement('.card-glass h3');
            availableSection = Array.from(document.querySelectorAll('.card-glass'))
                .find(sec => sec.querySelector('h3')?.textContent.trim() === 'Available Content');
        } catch {
            return log('❌ Could not find Available Content section');
        }
        if (!availableSection) return log('❌ Available Content section missing');

        // 3) Fetch NSWDL via proxy
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

        // 4) Preferred-link helper
        function getPreferredLink(category, tid = null) {
            const rows = Array.from(doc.querySelectorAll('.download-box table tbody tr'))
                .filter(tr => tr.children[0]?.textContent.trim().toLowerCase() === category.toLowerCase());
            if (!rows.length) return null;
            let candidates = tid ?
                rows.filter(tr => tr.children[1]?.textContent.includes(tid)) :
                rows;
            if (!candidates.length) return null;
            const preferredRow = candidates.find(tr =>
                tr.children[1]?.textContent.trim().toLowerCase().endsWith('.nsp')
            ) || candidates[0];
            const linkCells = Array.from(preferredRow.querySelectorAll('td a'));
            for (const host of ['Buzzheavier', 'SendCM', '1Fichier']) {
                const a = linkCells.find(a => a.textContent.trim().toLowerCase() === host.toLowerCase());
                if (a) return a.href;
            }
            return null;
        }

        // 5) Wrap Base & Update
        const wrapCard = (labelRegex, url) => {
            if (!url) return;
            const wrapper = Array.from(availableSection.querySelectorAll('.space-y-3'))
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
                a.classList.add('glisten', 'pulse');
                log(`✅ Wrapped ${labelRegex}`);
            }
        };
        wrapCard(/Base Game/i, getPreferredLink('Base'));
        wrapCard(/^Updates/i, getPreferredLink('Update'));

        // 6) DLC: handle each card
        const dlcBlock = Array.from(availableSection.querySelectorAll('.space-y-3'))
            .find(div => /DLC Content/i.test(div.querySelector('h4')?.textContent));
        if (dlcBlock) {
            const cards = Array.from(dlcBlock.querySelectorAll('div.p-4.rounded-lg'));
            cards.forEach(card => {
                const tidP = card.querySelector('p.text-sm');
                if (!tidP) return;
                const m = tidP.textContent.match(/TID:\s*([0-9A-Fa-f]{16})/);
                if (!m) return;
                const dlcTid = m[1];
                const dlcUrl = getPreferredLink('DLC', dlcTid);
                if (!dlcUrl) return;
                if (!card.closest('a')) {
                    const a = document.createElement('a');
                    a.href = dlcUrl;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.style.display = 'block';
                    a.style.textDecoration = 'none';
                    a.appendChild(card.cloneNode(true));
                    card.replaceWith(a);
                    a.classList.add('glisten', 'pulse');
                    log(`✅ Wrapped DLC TID ${dlcTid}`);
                }
            });
        }
    };

    // Re-run on SPA navigation
    let lastUrl = location.href;
    const observeUrlChange = () => {
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                log('🔄 URL changed, re-injecting...');
                setTimeout(injectLinks, 250);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    observeUrlChange();
    injectLinks();
})();
