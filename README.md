# Diff pages action

This action takes screenshots of built static pages and find only updated
screenshots. As long as it just compares the built files, the action can be
integrated by any static site generators such as Hugo, middleman and jekyll.

## Usage

```yaml
steps:
- uses: actions/checkout@v2
  with:
    ref: ${{ github.event.pull_request.base.sha }}
- run: echo "Build the static pages into 'path/to/base'"

- uses: actions/checkout@v2
  with:
    ref: ${{ github.event.pull_request.head.sha }}
- run: echo "Build the static pages into 'path/to/head'"

- id: diffpages
  uses: ssowonny/diff-pages-action@v1
  with:
    base-path: 'path/to/base'
    head-path: 'path/to/head'

# This example step is for uploading the result as an artifact. The result or
# the artifact can be uploaded to the pull request comments, Amazon S3, or
# any place according to the github action settings.
- uses: actions/upload-artifact@v1
  with:
    name: diff-pages-artifact
    path: '${{ steps.diffpages.outputs.path }}'
```

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

The path to save updated screenshots. Default `"diff-pages-action/output"`.

### `temp-path`

The path to save screenshots of base and head. Default `"diff-pages-action/tmp"`.

## Outputs

### `path`

The path of a directory contains saved screenshots.
