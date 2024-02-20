# Svelte Lib Helpers

Svelte Lib Helpers is a utility package designed to streamline various tasks when developing Svelte libraries. It offers a set of subcommands that simplify the process of managing exports, documentation, package distribution, and more.

## Installation

Install Svelte Lib Helpers as a development dependency using npm/pnpm/yarn/bun:

```sh
pnpm i -D svelte-lib-helpers
```

## Sub commands

Svelte Lib Helpers provides the following subcommands to enhance your Svelte library development workflow:

### exports

The `exports` subcommand simplifies updating your package.json by adding or updating all Svelte files in src/lib. This enables efficient imports of individual components and reducing package size for developers.

### docs

Generates component documentation for all Svelte files within the src/lib directory. 
You need to set "homepage" value in your `package.json` file.

```json
 "homepage": "https://flowbite-svelte.com/",
```

**Svelte 5**

There are two sub-commands for Svelte 5:

Use `docs5` sub-command to extracts props from the content of `let { myprops, anotherprops } = $props` and creates component docs.

Use `docs5FromType` sub-command to extract props and default values if you have `interface Props`:

```
interface Props {
    children: any;
    drawerStatus: boolean;
    toggleDrawer?: () => void;
    position?: 'fixed' | 'absolute';
    leftOffset?: string | undefined;
    width?: string;
    placement?: 'left' | 'right' | 'top' | 'bottom';
    transitionParams: drawerTransitionParamTypes;
  }

  let {
    children,
    drawerStatus,
    toggleDrawer,
    position = 'fixed',
    leftOffset = 'inset-y-0 start-0',
    width = 'w-80',
    placement = 'left',
    transitionParams,
    ...attributes
  } = $props<Props>();
```

The above code will produce the following component docs:

```
<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers)
## Props
@props: children: any;
@props:drawerStatus: boolean;
@props:toggleDrawer?: () => void;
@props:position?:  'fixed' | 'absolute'; = 'fixed';
@props:leftOffset?:  string | undefined; = 'inset-y-0 start-0';
@props:width?:  string; = 'w-80';
@props:placement?:  'left' | 'right' | 'top' | 'bottom'; = 'left';
@props:transitionParams: drawerTransitionParamTypes;
-->
```

**Svelte 4**

The script extract props from `export let myprops` and creates component docs.

### package

Copies your project's package.json to the dist directory, allowing for seamless distribution of your library.

### compo-data

Generates JSON files containing props, slots, events information from all Svelte files in the src/lib directory, placing them in the routes/component-data directory.

## Example Usage

Below is an example of how you can integrate Svelte Lib Helpers subcommands into the scripts section of your package.json file within a SvelteKit project:

```json
"scripts": {
  // ...
    "gen:exports": "svelte-lib-helpers exports",
    "gen:docs": "svelte-lib-helpers docs",
    "gen:docs5": "svelte-lib-helpers docs5",
    "gen:docs5FromType": "svelte-lib-helpers docs5FromType",
    "gen:compo-data": "svelte-lib-helpers compo-data",
    "copy:package": "svelte-lib-helpers package",
    "lib-helpers": "npm run gen:docs && npm run gen:compo-data && npm run build && npm run gen:exports && npm run copy:package",
    "package:publish": "standard-version && git push --follow-tags origin main && npm run lib-helpers && npm publish"
}
```

### Description

- "gen:exports": "Generate and update exports for efficient imports",
- "gen:docs": "Generate component documentation for Svelte 4",
- "gen:docs5": "Generate component documentation for Svelte 5",
- "gen:docs5FromType": "Generate component documentation for Svelte 5 from interface Props",
- "gen:compo-data": "Generate JSON files with component information",
- "copy:package": "Copy package.json to the dist directory"

Feel free to adjust these scripts according to your project's needs, incorporating Svelte Lib Helpers to enhance your library development experience.

## License

This project is licensed under the MIT License. For details, please refer to the LICENSE file.