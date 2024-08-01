FROM rust:1.79.0-slim AS builder
ARG TARGETARCH
ARG TARGETVARIANT
RUN echo "$TARGETARCH$TARGETVARIANT"
COPY src  /broadcaster/src
COPY Cargo.toml Cargo.lock /broadcaster/
WORKDIR /broadcaster/

COPY build.sh .
RUN ./build.sh 

FROM scratch
COPY --from=builder /broadcaster/broadcaster /broadcaster
CMD ["/broadcaster"]
