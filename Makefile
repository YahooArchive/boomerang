# Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

PLUGINS := plugins/rt.js plugins/bw.js

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

ESLINT := $(shell which eslint)
MINIFIER := cat
JS_CALLS_REMOVE := BOOMR\.(debug|info|warn|error)\s*\(.*?\)\s*;

all: boomerang-$(VERSION).$(DATE).js

usage:
	echo "Create a release version of boomerang:"
	echo "	make"
	echo ""
	echo "Create a release version of boomerang with the rt, bw & dns plugins:"
	echo "	make PLUGINS=\"plugins/rt.js plugins/bw.js plugins/dns.js\""
	echo ""
	echo "Create a yuicompressor minified release version of boomerang:"
	echo "	make MINIFIER=\"java -jar /path/to/yuicompressor-2.4.2.jar --type js\""
	echo ""
	echo "Create a jsmin minified release version of boomerang:"
	echo "	make MINIFIER=\"/path/to/jsmin\""
	echo ""

boomerang-$(VERSION).$(DATE).js: boomerang-$(VERSION).$(DATE)-debug.js
	echo "Making $@ ..."
	cat boomerang-$(VERSION).$(DATE)-debug.js | perl -pe 's/$(JS_CALLS_REMOVE)//' | $(MINIFIER) | perl -pe "s/else{}//g; s/\(window\)\);/\(window\)\);\n/g; s/\(\)\);\(function\(/\(\)\);\n\(function\(/g;" > $@ && echo "done"
	boomerang_size=$$( cat $@ | gzip -c | wc -c | sed -e 's/^ *//' ); if [ $$boomerang_size -gt 14200 ]; then echo "\n***** WARNING: gzipped boomerang is now $$boomerang_size bytes, which is > 14200 bytes *****"; else echo "gzipped boomerang is $$boomerang_size bytes"; fi
	echo

boomerang-$(VERSION).$(DATE)-debug.js: boomerang.js $(PLUGINS)
	echo
	echo "Making $@ ..."
	echo "using plugins: $(PLUGINS)..."
	cat boomerang.js $(PLUGINS) plugins/zzz_last_plugin.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' > $@ && echo "done"
	if [ -n "$(ESLINT)" ]; then echo "Linting..."; $(ESLINT) $@ && echo "OK"; else echo "Install eslint to check syntax"; fi
	echo

.PHONY: all
.SILENT:
