#!/bin/bash
set -e

apt update
apt install -y git
apt clean
rm -rf /var/lib/apt/lists/*
