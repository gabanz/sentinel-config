REVISION ?= $(shell git rev-parse --short=7 HEAD)

all: build

build: sentinel-config

sentinel-config: $(shell find . -name '*.go')
	CGO_ENABLED=0 go build -v -ldflags '-w -extldflags '-static''