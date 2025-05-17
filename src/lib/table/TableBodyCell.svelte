<script lang="ts">
  import clsx from "clsx";
  import { tablebodycell } from ".";
  import type { TableBodyCellProps } from "$lib/types";

  let { children, class: className, colspan, onclick, ...restProps }: TableBodyCellProps = $props();

  const base = $derived(tablebodycell({ class: clsx(className) }));
</script>

<td {...restProps} class={base} colspan={colspan ?? 1}>
  {#if onclick}
    <button {onclick}>
      {#if children}
        {@render children()}
      {/if}
    </button>
  {:else if children}
    {@render children()}
  {/if}
</td>

