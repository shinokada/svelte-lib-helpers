# Svelte Lib Helpers

## Installation

```sh
npm i -D svelte-lib-helpers
```

## add-docs

This command will add component docs to all svelte files in src/lib.

## add-export

This command will add export all svelte files in src/lib directory to ./package.json

## add-package

This command will add your ./package.json to dist/package.json

## package.json

```json
"scripts": {
  // ...
    "add-docs": "npm run add-docs",
    "add-exports": "npm run add-exports",
    "add-package": "npm run add-package"
  // ...
}
```