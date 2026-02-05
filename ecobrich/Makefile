build-DonateFunction:
	set GOOS=linux&& set GOARCH=arm64&& go build -o bootstrap ./hello-world/main.go
	copy bootstrap "$(ARTIFACTS_DIR)\bootstrap"
	del bootstrap

build-ProfileFunction:
	set GOOS=linux&& set GOARCH=arm64&& go build -o bootstrap ./hello-world/main.go
	copy bootstrap "$(ARTIFACTS_DIR)\bootstrap"
	del bootstrap