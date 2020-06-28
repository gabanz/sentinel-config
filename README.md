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