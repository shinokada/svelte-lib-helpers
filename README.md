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

Add the following to your package.json scripts section:

```json
"gen:exports": "svelte-lib-helpers exports",
```

### package

Copies your project's package.json to the dist directory, allowing for seamless distribution of your library.

Add the following to your package.json scripts section:

```json
"copy:package": "svelte-lib-helpers package",
```

## Component documentation

Generates component documentation for all Svelte files within the src/lib directory. 
You need to set "homepage" value in your `package.json` file.

```json
 "homepage": "https://flowbite-svelte.com/",
```
### docs

The `docs`and `docsFromProps` subcommands work for Svelte 4 structure. From the following props structure:

```js
export let color: 'primary' | 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'pink' | 'purple' | 'white' | 'custom' | undefined = 'primary';
export let bg: string = 'text-gray-300';
export let customColor: string = '';
export let size: string | number = '8';
```

To:

```js
<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop export let color: 'primary' | 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'pink' | 'purple' | 'white' | 'custom' | undefined = 'primary';
@prop export let bg: string = 'text-gray-300';
@prop export let customColor: string = '';
@prop export let size: string | number = '8';
-->
```

### docs5

This subcommand works for Svelte 5 structure. Use `docs5` sub-command to extracts props from the content of `let { myprops, anotherprops }: Props = $props` and creates component docs. Your type names need to be `Props` or ending with `PropsType`.

From the following props structure:

```js
  let {
    children: Snippet,
    footerType: 'sitemap' | 'default' | 'logo' | 'socialmedia' | undefined = 'default',
    class: string | undefined = '',
    ...attributes
  }: Props = $props();
```

To:

```js
<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop children: Snippet
@prop footerType: 'sitemap' | 'default' | 'logo' | 'socialmedia' | undefined = 'default'
@prop class: string | undefined = ''
@prop ...attributes
-->
```

### docs5FromType

If you have `interface Props`, `interface Props extends Somthing` or you have types in `index.ts` in the same directory, use `docs5FromType` sub-command to extract props and default values :

```js
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

To:

```js
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

Or from the following structure:

```js
  // defined type in index.ts
  import { type DropzoneProps as Props, dropzone } from '.';

  let { children, value = $bindable<string | undefined>(), files = $bindable<FileList | null>(), class: className, ...restProps }: Props = $props();
```

To:

```js
<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop children
@prop value = $bindable<string | undefined>()
@prop files = $bindable<FileList | null>()
@prop class: className
@prop ...restProps
-->
```

Add the following to your package.json scripts section:

```json
"gen:docs5FromType": "node ./index.js docs5FromType",
```


### Limitation

This lib is not able to handle types with long line. If you are setting the `printWidth` in `.prettierrc` file, set it with a proper value.

Format your code before running `svelte-lib-helpers`.

Having `{}` for a prop value won't work.


## Componet data

The following commands will generate JSON files containing props, slots, and events information from all Svelte files in the src/lib directory, placing them in the routes/component-data directory.

### compo-data

The `compo-data` subcommand works for Svelte 4 structure. This will generate a JSON file for each component with the following format from:

```js
export let color: 'primary' | 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'pink' | 'purple' | 'white' | 'custom' | undefined = 'primary';
export let bg: string = 'text-gray-300';
// more lines for events and slots
```

to:

```json
{"name":"Spinner","slots":[],"events":[],"props":[["color","'primary' | 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'pink' | 'purple' | 'white' | 'custom' | undefined","'primary'"],["bg","string","'text-gray-300'"]]}
```

### component-data

The `component-data` subcommand works for Svelte 4 structure. This will generate a JSON file for each component with the following format from:

```js
interface $$Props extends ComponentProps<TransitionFrame> {
  dismissable?: boolean;
  defaultClass?: string;
}

export let dismissable: $$Props['dismissable'] = false;
export let defaultClass: $$Props['defaultClass'] = 'p-4 gap-3 text-sm';
// more lines for events and slots
```

to:

```json
{"name":"Alert","slots":["icon","close-button"],"events":["on:close","on:click","on:change","on:keydown","on:keyup","on:focus","on:blur","on:mouseenter","on:mouseleave"],"props":[["dismissable","$$Props['dismissable']","false"],["defaultClass","$$Props['defaultClass']","'p-4 gap-3 text-sm'"]]}
```

### component5-data

The `component5-data` subcommand works for Svelte 5 structure. This will generate a JSON file for each component with the following format from:

```js
  // defined type in index.ts
  import { type CheckboxProps as Props, checkbox } from '.';

  let { children, aria_describedby, color = 'primary', custom, inline, tinted = false, rounded = false, group = $bindable([]), choices = [], checked = $bindable(false), classLabel, indeterminate, class: className, ...restProps }: Props = $props();
```

to:

```json
{
  "name": "Checkbox",
  "slots": [],
  "events": [],
  "props": [
    [
      "children",
      "Snippet",
      ""
    ],
    [
      "aria_describedby",
      "string",
      ""
    ],
    [
      "color",
      "ColorType",
      "'primary'"
    ],
    [
      "custom",
      "boolean",
      ""
    ],
    [
      "inline",
      "boolean",
      ""
    ],
    [
      "tinted",
      "boolean",
      "false"
    ],
    [
      "rounded",
      "boolean",
      "false"
    ],
    [
      "group",
      "array",
      "$bindable([])"
    ],
    [
      "choices",
      "array",
      "[]"
    ],
    [
      "checked",
      "boolean",
      "$bindable(false)"
    ],
    [
      "classLabel",
      "string",
      ""
    ],
    [
      "indeterminate",
      "boolean",
      ""
    ],
    [
      "className",
      "",
      ""
    ]
  ]
}
```

### runes-data

The `runes-data` subcommand works for Svelte 5 structure. This will generate a JSON file for each component with the following format from:

```js
let {
    children: Snippet,
    footerType: 'sitemap' | 'default' | 'logo' | 'socialmedia' | undefined = 'default',
    class: string | undefined = '',
    ...attributes
  }: Props = $props();
```

to:

```json
{"name":"Footer","props":[["children:Snippet",""],["footerType:'sitemap' | 'default' | 'logo' | 'socialmedia' | undefined",""],["class:string | undefined",""],["...attributes",""]]}
```

## Example Usage

Below is an example of how you can integrate Svelte Lib Helpers subcommands into the scripts section of your package.json file within a SvelteKit project:

```json
"scripts": {
  // ...
    "gen:exports": "node ./index.js exports",
    "gen:docs": "node ./index.js docs",
    "gen:docsFromProps": "node ./index.js docsFromProps",
    "gen:docs5": "node ./index.js docs5",
    "gen:docs5FromType": "node ./index.js docs5FromType",
    "gen:compo-data": "node ./index.js compo-data",
    "gen:componentData": "node ./index.js component-data",
    "gen:componentDataRunes": "node ./index.js component-data-runes",
    "gen:runes-data": "node ./index.js runes-data",
    "copy:package": "node ./index.js package",
    "lib-helpers": "npm run format && npm run gen:docs && npm run gen:compo-data && npm run package && npm run gen:exports && npm run copy:package",
    "package:publish": "standard-version && git push --follow-tags origin main && npm publish"
}
```

### Description

- "gen:exports": "Generate and update exports for efficient imports",
- "gen:docs": "Generate component documentation for Svelte 4",
- "gen:docsFromProps" : "Generate component documentation for Svelte 4 from interface Props",
- "gen:docs5": "Generate component documentation for Svelte 5",
- "gen:docs5FromType": "Generate component documentation for Svelte 5 from interface Props",
- "gen:compo-data": "Generate JSON files with component information",
- "copy:package": "Copy package.json to the dist directory"

Feel free to adjust these scripts according to your project's needs, incorporating Svelte Lib Helpers to enhance your library development experience.

## License

This project is licensed under the MIT License. For details, please refer to the LICENSE file.