REVISION ?= $(shell git rev-parse --short=7 HEAD)

all: build

build: promtools.dev

promtools.dev: $(shell find . -name '*.go')
	CGO_ENABLED=0 go build -v -ldflags '-w -extldflags '-static''