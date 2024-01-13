TITLE ?= template

publish:
	./scripts/deploy.sh
debug:
	hugo server -D
new-til:
	./scripts/new.sh til $(TITLE)
new-post:
	./scripts/new.sh blog $(TITLE)
analytics:
	open https://adlrocha.goatcounter.com/
install:
	sudo apt install hugo

.PHONY: publish, debug, new-til, new-post, analytics
