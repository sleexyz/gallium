## Have a bug or a feature request?
Look in the [issue tracker](https://github.com/sleexyz/gallium/issues) for your issue. If it isn't already there, feel free to create one.

Bugs should include steps to reproduce. If you can, please link to a branch with a failing test.

## Want to contribute to development?
Feel free to take on issues in the issue tracker. If you don't know what to work on, issues are prioritized on the [project board](https://github.com/sleexyz/gallium/projects/1).

Then fork the repo and make a pull-request when you're ready! In-progress PRs are encouraged.

## Development Guide

The following commands run in the root of the repo:

### Prequisites
Install:
- yarn 1.3.2
- node v8.7.0

Install package dependencies:
```
yarn
```

### Building and Testing

Build packages:

```
yarn build
```


To run all checks:

```
yarn check-all
```


To start a local development server for [gallium.live](http://gallium.live):

```
cd gallium-live
yarn start
```

A useful shell one-liner that checks your code as it changes. Uses [ag](https://github.com/ggreer/the_silver_searcher) and [entr](http://entrproject.org/):

```
ag -l | grep '.js' | entr -cdrs 'yarn flow && yarn test && yarn format'
```

