# -*- Mode: Makefile -*-
#
# Makefile for Undo Cookie Whitelist
#

FILES = manifest.json \
        background.js \
        default-preferences.json \
        options.html \
        options.js \
        options.css \
        utils/storage.js \
        utils/html-i18n.js \
        icons/cookiewhitelist.svg \
        $(wildcard _locales/*/messages.json)

ADDON = cookiewhitelist

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

ANDROIDDEVICE = $(shell adb devices | cut -s -d$$'\t' -f1 | head -n1)

WEBEXT_UTILS_REPO = git@github.com:M-Reimer/webext-utils.git

trunk: $(ADDON)-trunk.xpi

release: $(ADDON)-$(VERSION).xpi

%.xpi: $(FILES)
	@zip -9 - $^ > $@

clean:
	rm -f $(ADDON)-*.xpi

# Starts local debug session
run:
	web-ext run --pref=devtools.browserconsole.contentMessages=true --bc

# Starts debug session on connected Android device
arun:
	@if [ -z "$(ANDROIDDEVICE)" ]; then \
	  echo "No android devices found!"; \
	else \
	  web-ext run --target=firefox-android --firefox-apk=org.mozilla.fenix --android-device="$(ANDROIDDEVICE)"; \
	fi

# Subtree stuff for webext-utils
# Note to myself. Initial setup of subtree:
# git subtree add --prefix utils git@github.com:M-Reimer/webext-utils.git master

subtree-pull:
	git subtree pull --prefix utils "$(WEBEXT_UTILS_REPO)" master

subtree-push:
	git subtree push --prefix utils "$(WEBEXT_UTILS_REPO)" master
