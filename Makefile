PLUGINS := 

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

MINIFIER := cat

all: boomerang-$(VERSION).$(DATE).js

usage:
	echo -e "Create a release version of boomerang:\n\tmake\n"
	echo -e "Create a release version of boomerang with the dns plugin:\n\tmake PLUGINS=dns.js\n"
	echo -e "Create a yuicompressor minified release version of boomerang:\n\tmake MINIFIER=\"java -jar /path/to/yuicompressor-2.4.2.jar --type js\"\n"
	echo -e "Create a jsmin minified release version of boomerang:\n\tmake MINIFIER=\"/path/to/jsmin\"\n"

boomerang-$(VERSION).$(DATE).js: boomerang.js $(PLUGINS)
	echo
	echo "Making $@ ..."
	echo "using plugins: $(PLUGINS)..."
	cat boomerang.js $(PLUGINS) | $(MINIFIER) > $@ && echo "done"
	echo

.PHONY: all
.SILENT:
