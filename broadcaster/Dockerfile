FROM rust:1.79.0-slim AS builder
ARG TARGETARCH
ARG TARGETVARIANT
RUN echo "$TARGETARCH$TARGETVARIANT"
COPY src  /broadcaster/src
COPY Cargo.toml Cargo.lock /broadcaster/
WORKDIR /broadcaster/

RUN rustup target add x86_64-unknown-linux-musl
RUN cargo build --release --target=x86_64-unknown-linux-musl

FROM scratch
COPY --from=builder /broadcaster/target/x86_64-unknown-linux-musl/release/broadcaster /broadcaster
CMD ["/broadcaster"]
