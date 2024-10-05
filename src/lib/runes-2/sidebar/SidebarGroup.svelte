<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLUListElement> {
    children: Snippet;
    borderClass?: string;
    border?: boolean;
  }

  let { children, class: className = 'space-y-2', borderClass = 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700', border = false, ...restProps }: Props = $props();
</script>

<ul {...restProps} class={border ? borderClass : className}>
  {@render children()}
</ul>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: any;
@props:class: string = 'space-y-2';
@props:borderClass: any = 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700';
@props:border: any = false;
-->
