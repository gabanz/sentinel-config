# Sentinel Config
Web GUI to Generate SLO Alerts Configuration for Sentinel

## Getting started

Install jsonnet. For Mac OSX, use homebrew:

```
brew install jsonnet
```

Install jsonnet-bundler using go:

```
GO111MODULE="on" go get github.com/jsonnet-bundler/jsonnet-bundler/cmd/jb
```

Install dependencies using jsonnet-bundler:

```
jb install
```

Build package using Makefile:

```
make
```

Run the package:

```
./sentinel-config
```

Access the GUI:

```
http://localhost:9099
```

## Run in a Docker container

Build the package for Linux OS:

```
make linux386
```

Build the docker image:

```
docker build -t "sentinel-config:Dockerfile" .
```

Create the docker container:

```
docker run -d -v ${PWD}:/app -p 9099:9099 --name sentinel-config sentinel-config:Dockerfile
```

Access the application via the exposed port:

```
http://localhost:9099
```