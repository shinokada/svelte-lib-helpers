<script lang="ts">
  import clsx from "clsx";
  import { tableheadcell } from ".";
  import type { TableHeadCellProps } from "$lib/types";

  let { children, class: className, ...restProps }: TableHeadCellProps = $props();
  const base = $derived(tableheadcell({ class: clsx(className) }));
</script>

<th {...restProps} class={base}>
  {#if children}
    {@render children()}
  {/if}
</th>

