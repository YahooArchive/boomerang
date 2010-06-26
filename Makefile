PLUGINS := 

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

all: boomerang-$(VERSION).$(DATE).js

boomerang-$(VERSION).$(DATE).js: boomerang.js $(PLUGINS)
	@echo
	@echo "Making $@ ..."
	@echo "using plugins: $(PLUGINS)..."
	@cat boomerang.js $(PLUGINS) > $@ && \
	echo "done"
	@echo

.PHONY: all
