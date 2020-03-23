# Diff pages action

This action takes screenshots of built static pages and find only updated
screenshots. As long as it just compares the built files, the action can be
integrated by any static site generators such as [Hugo](https://gohugo.io/),
[middleman](https://middlemanapp.com/) and [jekyll](https://jekyllrb.com/).

## Usage

```yaml
steps:
# Checkout and build files of a base ref.
- uses: actions/checkout@v2
  with:
    ref: ${{ github.event.pull_request.base.sha }}
- run: echo "Build the static pages into 'path/to/base'"

# Checkout and build files of a head ref.
- uses: actions/checkout@v2
  with:
    ref: ${{ github.event.pull_request.head.sha }}
    clean: false # Prevent removing files in 'path/to/base' folder.
- run: echo "Build the static pages into 'path/to/head'"

# Capture page differences.
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

## Demo

### Upload Artifacts

Artifacts of updated page screenshots can be uploaded. Check
[diff-pages-action-example](https://github.com/ssowonny/diff-pages-action-example)
repository's [workflow](https://github.com/ssowonny/diff-pages-action-example/blob/master/.github/workflows/pr.yml)
for more details.

![artifacts-example](https://github.com/ssowonny/diff-pages-action/raw/master/docs/images/artifacts-example.png)

## Action Metadata

### Inputs

#### `base-path`

**Required** The path to the base of static pages. Static pages for base branch of
each PR can be assigned to it.

#### `head-path`

**Required** The path to the head of static pages. Static pages for head branch of
each PR can be assigned to it.

#### `pattern`

Pattern string for detecting page files among the static files. It follows
[node-glob](https://github.com/isaacs/node-glob#glob-primer) syntax. Default
`**/*.+(htm|html)` for finding all files having htm or html extensions.

#### `port`

The port value for running the static server. Another port can be used in case
of port conflict. Default `8000`.

#### `output-path`

The path to save updated screenshots. Default `"diff-pages-action/output"`.

#### `temp-path`

The path to save screenshots of base and head. Default `"diff-pages-action/tmp"`.

### Outputs

#### `path`

The path of a directory contains saved screenshots.

## Development

`diff-pages-action` uses Docker for development and test. Type the command
below to check commands for development.

```bash
make help
```

### Test

`make test` command runs tests using docker environment.

## Roadmap

- Support setting up browser options.
- Make an example of uploading screenshots as a pull request comment.
- Build one page summary which contains all the updated images.
