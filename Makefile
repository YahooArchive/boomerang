PLUGINS := 

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

SOURCES := $(PLUGINS:%=%.boomerang.plugin.js)

all: boomerang-$(VERSION).$(DATE).js

boomerang-$(VERSION).$(DATE).js: boomerang.js $(SOURCES)
	@echo "Making $@ ..."
	@echo "   using plugins: $(PLUGINS)"
	@sed -e '/---include-plugins-here---/q' boomerang.js > $@ && \
	cat $(SOURCES) >> $@ && \
	sed -ne '/---include-plugins-here---/,$${/--include-plugins-here/n;p;}' boomerang.js >> $@ && \
	echo "done"

.PHONY: all
