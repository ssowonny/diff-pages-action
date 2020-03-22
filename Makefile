PROJECT_NAME := $(notdir $(CURDIR))

default: build

help:
	@echo 'Development commands for diff-pages-action:'
	@echo
	@echo 'Usage:'
	@echo '    make build           Build docker image.'
	@echo '    make test            Run test on the docker image.'
	@echo '    make ci              Install npm dependencies.'
	@echo '    make sh              Execute shell on the docker image.'
	@echo

build:
	docker build . -t $(PROJECT_NAME)

test:
	docker run -it -v $(PWD):/diff-pages-action -w /diff-pages-action --entrypoint npm $(PROJECT_NAME) test

ci:
	docker run -it -v $(PWD):/diff-pages-action -w /diff-pages-action --entrypoint npm $(PROJECT_NAME) ci

sh:
	docker run -it -v $(PWD):/diff-pages-action -w /diff-pages-action --entrypoint /bin/bash $(PROJECT_NAME)
