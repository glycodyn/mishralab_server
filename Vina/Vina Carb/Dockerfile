FROM ubuntu:22.04

# Install basic shell tools
RUN apt update && apt install -y \
    bash \
    coreutils

# Set work directory
WORKDIR /app

# Copy the binary
COPY build/linux/release/vina-carb .

# Make it executable
RUN chmod +x vina-carb

# Default command when container runs
CMD ["./vina-carb", "--help"]
