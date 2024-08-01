if [ "$TARGETARCH" = "amd64" ]; then
  target="x86_64-unknown-linux-musl"
elif [ "$TARGETARCH" = "arm" ] && [ "$TARGETVARIANT" = "v7" ]; then
  target="armv7-unknown-linux-musleabihf"
elif [ "$TARGETARCH" = "arm" ] && [ "$TARGETVARIANT" = "v8" ]; then
  target="aarch64-unknown-linux-musl"
else
  echo "Unsupported TARGETARCH: $TARGETARCH"
  exit 1
fi

rustup target add $target 
cargo build --release --target=$target
mv target/$target/release/ broadcaster