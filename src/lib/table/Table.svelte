<script lang="ts">
  import { setContext } from "svelte";
  import { table as tableCls, TableHead, TableBody } from ".";
  import clsx from "clsx";
  import type { TableProps, TableCtxType } from "$lib";

  let { children, footerSlot, captionSlot, items, divClass = "relative overflow-x-auto", striped, hoverable, border = true, shadow, color = "default", class: className, ...restProps }: TableProps = $props();

  const { base, table } = $derived(tableCls({ color, shadow }));

  let tableCtx: TableCtxType = {
    get striped() {
      return striped;
    },
    get hoverable() {
      return hoverable;
    },
    get border() {
      return border;
    },
    get color() {
      return color;
    }
  };

  setContext("tableCtx", tableCtx);
  let headItems = $derived(items && items.length > 0 ? Object.keys(items[0]).map((key) => ({ text: key.charAt(0).toUpperCase() + key.slice(1) })) : []);

  let bodyItems = $derived(items && items.length > 0 ? items.map((item) => Object.values(item)) : []);
</script>

<div class={base({ class: divClass })}>
  <table {...restProps} class={table({ class: clsx(className) })}>
    {#if captionSlot}
      {@render captionSlot()}
    {/if}
    {#if items && items.length > 0}
      <TableHead {headItems} />
      <TableBody {bodyItems} />
    {:else if children}
      {@render children()}
    {/if}
    {#if footerSlot}
      {@render footerSlot()}
    {/if}
  </table>
</div>

