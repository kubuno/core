# Changelog

All notable changes to **@kubuno/vectors** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- First version: loads and validates conformance-vector suites (format 1), runs them with vitest or `node:test`
  (one test per case, or a whole suite with a report of every failing case), compares outputs as JSON, honours
  per-platform skips, and vendors or checks suite folders against their `VENDOR.json` checksums
  (`kubuno-vectors vendor` / `kubuno-vectors check`).
