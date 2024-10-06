GOG Games site redirect button script or something.

This userscript is a slightly tweaked version of AnimeIsMyWaifu's version

Install the script from this github repo [by clicking here](https://raw.githubusercontent.com/Smealm/userscripts/refs/heads/main/GOG/Try%20for%20free/GOG%20try%20for%20free.user.js) or make it yourself below

Steps taken to make this script
1. download userscript manager [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
2. [click this url](https://update.greasyfork.org/scripts/481134/GOG%20to%20Free%20Download%20Site.user.js) or go here: https://greasyfork.org/en/scripts/481134-gog-to-free-download-site and click 'install + edit'
3. under `var buttonSet = [` delete all URL entries except for `    { url: "https://gog-games.to/?search=",       title: "GOG Games" },`
4. in the URL string replace `https://gog-games.to/?search=` with `https://gog-games.to/game/`
5. in the TITLE string replace `GOG Games` with `Try for free!`
6. hit save and enjoy!



