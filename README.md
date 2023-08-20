# Svelte Lib Helpers

Svelte Lib Helpers is a utility package designed to streamline various tasks when developing Svelte libraries. It offers a set of subcommands that simplify the process of managing exports, documentation, package distribution, and more.

## Installation

Install Svelte Lib Helpers as a development dependency using npm/pnpm/yarn/bun:

```sh
npm i -D svelte-lib-helpers
```

## Sub commands

Svelte Lib Helpers provides the following subcommands to enhance your Svelte library development workflow:

**exports**

The `exports` subcommand simplifies updating your package.json by adding or updating all Svelte files in src/lib. This enables efficient imports of individual components and reducing package size for developers.

**docs**

Generates component documentation for all Svelte files within the src/lib directory.

**package**

Copies your project's package.json to the dist directory, allowing for seamless distribution of your library.

**props**

Generates JSON files containing prop information from all Svelte files in the src/lib directory, placing them in the routes/props directory.

## Example Usage

Below is an example of how you can integrate Svelte Lib Helpers subcommands into the scripts section of your package.json file within a SvelteKit project:

```json
"scripts": {
  // ...
    "add-exports": "svelte-lib-helpers exports",
    "add-docs": "svelte-lib-helpers docs",
    "gen-props": "svelte-lib-helpers props",
    "copy-package": "svelte-lib-helpers package",
    "lib-helpers": "npm run add-docs && npm run gen-props && npm run build && npx svelte-lib-helpers exports && npm run copy-package"
  // ...
}
```

Feel free to adjust these scripts according to your project's needs, incorporating Svelte Lib Helpers to enhance your library development experience.

## License

This project is licensed under the MIT License. For details, please refer to the LICENSE file.