REVISION ?= $(shell git rev-parse --short=7 HEAD)

all: build

build: sentinel-config

sentinel-config: $(shell find . -name '*.go')
	CGO_ENABLED=0 go build -v -ldflags '-w -extldflags '-static''

linux386: $(shell find . -name '*.go')
	CGO_ENABLED=0 env GOOS=linux GOARCH=386 go build -v -ldflags '-w -extldflags '-static''

raspberrypi: $(shell find . -name '*.go')
	CGO_ENABLED=0 env GOOS=linux GOARCH=arm GOARM=7 go build -v -ldflags '-w -extldflags '-static''
