<a href='https://ko-fi.com/Z8Z2CHALG' target='_blank'><img height='42' style='border:0px;height:42px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=3' alt='Buy Me a Coffee at ko-fi.com' /></a>

# Svelte Lib Helpers

Svelte Lib Helpers is a utility package designed to streamline various tasks when developing Svelte libraries. It offers a set of subcommands that simplify the process of managing exports, documentation, package distribution, and more.

## Repo

[Svelte-lib-helpers](https://github.com/shinokada/svelte-lib-helpers)

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

Use `docs5` sub-command to extracts props from the content of `let { myprops, anotherprops }: Props = $props` and creates component docs. Your type names need to be `Props` or ending with `PropsType`.

```
let {
    source,
    user,
    repo,
    interval,
    packageName,
    style = 'flat',
   // more lines
    ...attributes
  }: DownloadPropsType = $props();
```

The above code will produce the following:

```

<!--
@component
[Go to docs](https://github.com/shinokada/your-homepage#readme)
## Props
@prop source
@prop user
@prop repo
@prop interval
@prop packageName
@prop style = 'flat'
...
@prop ...attributes
-->

```

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
  }: Props = $props();
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

- Limitation

This lib is not able to handle types with long line. If you are setting the `printWidth` in `.prettierrc` file, set it with a proper value.

Format your code before running `svelte-lib-helpers`.

Having `{}` for a prop value won't work.

**Svelte 4**

The script extract props from `export let myprops` and creates component docs.

### package

Copies your project's package.json to the dist directory, allowing for seamless distribution of your library.

### compo-data

Generates JSON files containing props, slots, events information from all Svelte files in the src/lib directory, placing them in the routes/component-data directory.

There are two sub commands, `compo-data` and `runes-data`.

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
    "gen:runes-data": "node ./index.js runes-data",
    "copy:package": "svelte-lib-helpers package",
    "lib-helpers": "npm run format && npm run gen:docs && npm run gen:compo-data && npm run package && npm run gen:exports && npm run copy:package",
    "package:publish": "standard-version && git push --follow-tags origin main && npm publish"
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