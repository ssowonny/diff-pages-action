# Page differences action

This action takes screenshots of static web pages and find changed screenshots.

## Inputs

### `base-path`

**Required** The path to the base of static pages. Static pages for base branch of
each PR can be assigned to it.

### `head-path`

**Required** The path to the head of static pages. Static pages for head branch of
each PR can be assigned to it.

### `port`

The port value for running the static server. Default `8080`.

### `output-path`

The path to save updated screenshots. Default `"page-differences-action/output"`.

### `temp-path`

The path to save screenshots of base and head. Default `"page-differences-action/tmp"`.

## Outputs

### `path`

The path of a directory contains saved screenshots.

## Example usage

uses: ssowonny/page-differences-action@v1
with:
  base-path: 'path/to/base/files'
  head-path: 'path/to/head/files'
