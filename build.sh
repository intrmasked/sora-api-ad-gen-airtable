#!/bin/bash

# Install dependencies
npm install

# Install ffmpeg (for video stitching)
# Note: On Render.com, ffmpeg is pre-installed, but on other platforms you might need this
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg not found, attempting to install..."

    # Try apt-get (Debian/Ubuntu)
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y ffmpeg
    # Try yum (CentOS/RHEL)
    elif command -v yum &> /dev/null; then
        yum install -y ffmpeg
    # Try apk (Alpine)
    elif command -v apk &> /dev/null; then
        apk add --no-cache ffmpeg
    else
        echo "Warning: Could not install ffmpeg automatically"
        echo "Please ensure ffmpeg is available in your environment"
    fi
fi

# Verify ffmpeg installation
if command -v ffmpeg &> /dev/null; then
    echo "FFmpeg is installed:"
    ffmpeg -version
else
    echo "Warning: FFmpeg is not available"
fi

echo "Build completed successfully"
