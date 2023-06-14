TITLE ?= template

publish:
	./scripts/deploy.sh
debug:
	hugo server -D
new-til:
	./scripts/new.sh til $(TITLE)
new-post:
	./scripts/new.sh post $(TITLE)

.PHONY: publish