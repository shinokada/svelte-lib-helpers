<script lang="ts">
  import { type TableHeadCellProps as Props, tableheadcell } from './';

  let { children, class: className, ...restProps }: Props = $props();
  const base = $derived(tableheadcell({ className }));
</script>

<th {...restProps} class={base}>
  {#if children}
    {@render children()}
  {/if}
</th>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: Snippet;
@props:class: string;
-->
