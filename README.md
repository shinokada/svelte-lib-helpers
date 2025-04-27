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

Svelte Lib Helpers provides the following subcommands to enhance your Svelte library development workflow:

## exports

The `exports` subcommand simplifies updating your package.json by adding or updating all Svelte files in src/lib. This enables efficient imports of individual components and reducing package size for developers.

Add the following to your package.json scripts section:

```json
"gen:exports": "svelte-lib-helpers exports",
```

## package

Copies your project's package.json to the dist directory, allowing for seamless distribution of your library.

Add the following to your package.json scripts section:

```json
"copy:package": "svelte-lib-helpers package",
```

## ts

Copies your project's tsconfig.json to the dist directory, allowing for seamless distribution of your library.

Add the following to your package.json scripts section:

```json
"copy:ts": "svelte-lib-helpers ts",
```

## Component documentation

Generates component documentation for all Svelte files within the src/lib directory. 
You need to set "homepage" value in your `package.json` file.

```json
 "homepage": "https://flowbite-svelte.com/",
```

### docspropvalue (for svelte 5)

Automatically generating inline documentation comments in Svelte 5 components.

#### Overview

This tool scans Svelte 5 components that use the `$props()` syntax and adds standardized documentation comments containing prop information and links to GitHub source code and documentation.

#### Usage

In your scripts add the following:

```json
"gen:docspropvalue": "svelte-lib-helpers docspropvalue <githubLink>",
```

Example: 

```json
"gen:docspropvalue": "svelte-lib-helpers docspropvalue themesberg/flowbite-svelte-next",
```

#### Features

- Automatically adds documentation comments to Svelte 5 components
- Extracts props and their default values
- Creates links to type definitions in your GitHub repository
- Adds links to external documentation from package.json's "homepage" field
- Handles complex prop definitions with nested objects and arrays
- Updates existing documentation comments when run multiple times

#### Requirements

- Svelte 5
- A `types.ts` file in your source directory
- "homepage" field in your package.json pointing to documentation
- Svelte 5 components using `$props()` syntax

#### Generated Documentation Format

The tool adds comments in this format:

```html
<!--
@component
[Go to docs](https://your-docs-url.com)
## Type
[ComponentPropsType](https://github.com/org/repo/blob/main/src/lib/types.ts#L42)
## Props
@prop propName = defaultValue
@prop anotherProp
-->
```

### docs5

The subcommand `docs5` extracts prop definitions from your Svelte 5 components to generate documentation. It focuses on the prop destructuring syntax specific to Svelte 5 and creates a simple list of props with their default values.

#### Requirements

Your Svelte 5 component must use the $props() syntax for prop destructuring.
The command supports various prop type annotations, including custom types.

#### How It Works

The command searches for the prop destructuring pattern in your Svelte files:
javascriptCopylet { ... }: SomePropsType = $props()

It extracts all props defined within the curly braces.
The extracted props are used to generate documentation comments in the Svelte file.

#### Output Format
The command generates a comment block in your Svelte file with the following structure.

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

#### Notes

- The command removes any existing @component comment blocks before adding the new one.
- It preserves the prop definitions exactly as they appear in your code, including default values and type annotations.
- Comments within the prop destructuring are removed from the documentation.
- The documentation URL is taken from the homepage field in your package.json file.

#### Troubleshooting
If the command doesn't generate the expected output:

1. Ensure your Svelte file uses the $props() syntax for prop destructuring.
2. Check that your package.json has a valid homepage field.
3. Verify that your Svelte files are in the correct directory structure.

#### Limitations

- This script does not extract or display type information beyond what's in the prop destructuring.
- It doesn't handle props defined outside of the $props() destructuring.

### docs5FromType

#### Overview
The subcommand `docs5FromType` extracts prop types and default values from your Svelte components to generate documentation. It supports two common patterns for defining prop types:

1. Types defined directly in the Svelte file
2. Types imported from a separate TypeScript file (typically ./index.ts)

#### Format

Your component must use one of these patterns for prop definitions:

- interface Props { ... }
- interface Props extends SomeType { ... }
- Types defined in index.ts in the same directory as the Svelte file

#### How It Works

1. The command first looks for type definitions within the Svelte file itself.
2. If no types are found in the Svelte file, it checks for imports from ./index.ts.
3. It extracts prop names, types, and default values.
4. The extracted information is used to generate documentation comments in the Svelte file.

#### Notes

- Ensure your prop destructuring in the Svelte file matches the interface definition.
- The command handles both let { ... }: Props = $props(); syntax for Svelte 5 and older syntax for previous versions.
- Custom types used in your props should be defined in the same file or properly imported.

#### Troubleshooting
If the command doesn't generate the expected output:

1. Check that your prop interface follows one of the supported patterns.
2. Verify that all custom types are properly defined or imported.
3. Ensure the Svelte file and any separate TypeScript files are in the correct locations.

#### Example

From the following props structure:
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

### docs (svelte 4)

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

Or from the following structure:

```js
  interface $$Props extends ComponentProps<TransitionFrame> {
    dismissable?: boolean;
    defaultClass?: string;
  }

  export let dismissable: $$Props['dismissable'] = false;
  export let defaultClass: $$Props['defaultClass'] = 'p-4 gap-3 text-sm';
```

To:

```json
<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop export let dismissable: boolean = false
@prop export let defaultClass: string = 'p-4 gap-3 text-sm'
-->
```

## Component data

The following commands will generate JSON files containing props, slots, and events information from all Svelte files in the src/lib directory, placing them in the routes/component-data directory.

### component-data-prop-value (for svelte 5)

Automatically extracting and documenting props from Svelte 5 components.

#### Overview

This tool scans your Svelte 5 components that use the `$props()` syntax, extracts their prop definitions, and generates JSON documentation files. It links prop types to their GitHub source files when possible.

#### Usage

In your scripts:

```json
"gen:component-data-prop-value": svelte-lib-helpers component-data-prop-value <githubLink>
```

Example:
```json
"gen:component-data-prop-value": svelte-lib-helpers component-data-prop-value themesberg/flowbite-svelte-next
```

#### Options

- `--src`: Custom source directory (default: `./src/lib`)
- `--dest`: Custom output directory (default: `./src/routes/component-data/`)

#### Features

- Extracts props from Svelte 5 components using `$props()` syntax
- Identifies prop types and their documentation links
- Handles both internal and external type imports
- Supports generic types like `HTMLAttributes<HTMLDivElement>`
- Preserves default prop values in documentation
- Creates JSON documentation files for each component

#### Output Format

The tool generates JSON files with the following structure:

```json
{
  "name": "ComponentName",
  "type": {
    "name": "TypeName",
    "link": "https://github.com/org/repo/blob/main/src/lib/types.ts#L42"
  },
  "props": [
    ["propName", "defaultValue"]
  ]
}
```

#### Requirements

- Svelte 5
- Svelte 5 components using `$props()` syntax
- `types.ts` file in your source directory (optional)

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

## License

This project is licensed under the MIT License. For details, please refer to the LICENSE file.