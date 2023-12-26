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

const get = (id) => document.getElementById(id);

async function CheckboxChanged(e) {
  if (e.target.id.match(/([a-z_]+)_checkbox/)) {
    let pref = RegExp.$1;
    let params = {};
    params[pref] = e.target.checked;
    await browser.storage.local.set(params);
    await browser.runtime.sendMessage({type: "OptionsChanged"});
  }
}

async function WLCheckboxChanged(e) {
  const checkbox = e.target;
  const tr = checkbox.parentNode.parentNode;
  const domain = tr.childNodes[1].innerText;

  const prefs = await browser.storage.local.get();
  const whitelist = prefs.whitelist || {};

  if (checkbox.checked) {
    tr.classList.add("whitelisted");
    whitelist[domain] = true;
  }
  else {
    tr.classList.remove("whitelisted");
    delete whitelist[domain];
  }

  await browser.storage.local.set({"whitelist": whitelist});
}

async function FillDomainList() {
  // Memory for the domain data
  const domains = [];
  const counter = {};

  // Get list of domains which have cookies stored
  const cookies = await browser.cookies.getAll({"partitionKey": {}});
  cookies.forEach((cookie) => {
    if (domains.includes(cookie.domain))
      counter[cookie.domain]++;
    else {
      domains.push(cookie.domain);
      counter[cookie.domain] = 1;
    }
  });

  // Integrate whitelisted domains even if they currently have no cookies
  const prefs = await browser.storage.local.get();
  const whitelist = prefs.whitelist || {};
  Object.keys(whitelist).forEach((domain) => {
    if (!domains.includes(domain)) {
      domains.push(domain);
      counter[domain] = 0;
    }
  });

  // Sort the list.
  domains.sort((a, b) => {
    const regex = /^(.*?)\.([^\.]+)\.([^\.]+)$/;
    partsa = a.match(regex);
    partsb = a.match(regex);

    if (partsa && partsb) {
      a = `partsa[1].partsa[2].partsa[0]`;
      b = `partsb[1].partsb[2].partsb[0]`;
    }

    if (a < b)
      return -1;
    if (a > b)
      return 1;
    return 0;
  });

  // Generate the domain list. TODO: Add click event listener
  const tbody = get("domains_body");
  domains.forEach((domain) => {
    const tr = tbody.appendChild(document.createElement("tr"));
    const check = document.createElement("input");
    check.type = "checkbox";
    check.addEventListener("change", WLCheckboxChanged);
    tr.appendChild(document.createElement("td")).appendChild(check);
    tr.appendChild(document.createElement("td")).innerText = domain;
    tr.appendChild(document.createElement("td")).innerText = counter[domain];

    if (whitelist.hasOwnProperty(domain)) {
      tr.classList.add("whitelisted");
      check.checked = true;
    }
  });

  console.log(whitelist);
}

function init() {
  loadOptions();
  FillDomainList();

  get("clearcookies_checkbox").addEventListener("change", CheckboxChanged);
  get("clearstorage_checkbox").addEventListener("change", CheckboxChanged);
}

function loadOptions() {
  browser.storage.local.get().then((result) => {
    get("clearcookies_checkbox").checked = result.clearcookies || false;
    get("clearstorage_checkbox").checked = result.clearstorage || false;
  });
}

// Register event listener to receive option update notifications
browser.runtime.onMessage.addListener((data, sender) => {
  if (data.type == "OptionsChanged")
    loadOptions();
});

init();
