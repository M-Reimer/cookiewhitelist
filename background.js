/*
    Firefox addon "Cookie Whitelist"
    Copyright (C) 2023  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function onRemoved() {
  console.log("Browser storage removed");
}

function onError(error) {
  console.error(error);
}

function openMyPage() {
  browser.tabs.create({url: browser.runtime.getURL("options.html")});
}

function CookieToURL(cookie) {
  let url = "";

  if (cookie.secure)
    url = "https://";
  else
    url = "http://";

  if (cookie.domain.startsWith("."))
    url += "www" + cookie.domain;
  else
    url += cookie.domain;

  url += cookie.path;

  console.log(url)

  return url;
}

async function ClearCookies() {
  console.log("ClearCookies called");

  // Make sure we only clear cookies once per session.
  const sessionprefs = await browser.storage.session.get();
  if (sessionprefs.started) {
    console.log("ClearCookies already ran in this session!");
    return;
  }
  else
    await browser.storage.session.set({"started": true});

  // Clear cookies from non-whitelisted domains
  const prefs = await Storage.get();
  if (prefs.clearcookies) {
    console.log("ClearCookies about to clear");
    const cookies = await browser.cookies.getAll({"partitionKey": {}});
    console.log("Cookies", cookies);
    for (const cookie of cookies) {
      if (!prefs.whitelist.hasOwnProperty(cookie.domain)) {
        const result = await browser.cookies.remove({
          "firstPartyDomain": cookie.firstPartyDomain,
          "name": cookie.name,
          "partitionKey": cookie.partitionKey,
          "storeId": cookie.storeId,
          "url": CookieToURL(cookie)
        });
        console.log("Cookie removed for " + cookie.domain, cookie.path, result);
      }
    }
  }

  // Clear storage
  if (prefs.clearstorage)
    browser.browsingData.remove({}, {"localStorage": true, "indexedDB": true}).then(onRemoved, onError);
}

// Add event listeners
browser.browserAction.onClicked.addListener(openMyPage);
browser.runtime.onStartup.addListener(ClearCookies);

//ClearCookies(); // Only enable for debugging and development
