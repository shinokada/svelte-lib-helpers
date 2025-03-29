<script lang="ts">
  import { type MegaMenuProps as Props, megamenu } from '.';
  import { fly } from 'svelte/transition';

  let { children, footer, items = [], full, dropdownStatus = $bindable(), class: className, backdropClass, params, transition = fly, ...restProps }: Props = $props();

  const { base, div, ul, footerDiv } = $derived(megamenu());
  $inspect('dropdownStatus', dropdownStatus);
</script>

<!-- Dropdown menu -->
{#if dropdownStatus}
  <div class={base({ className })} {...restProps}>
    <div class={div()}>
      <ul class={ul()}>
        {#each items as item, index}
          <li>
            {@render children({ item, index })}
          </li>
        {:else}
          {@render children({ item: items[0], index: 0 })}
        {/each}
      </ul>
      {#if full && footer}
        <div class={footerDiv()}>
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: Snippet<[{ item;
@props:footer: any;
@props:items: any = [];
@props:full: any;
@props:dropdownStatus: any = $bindable();
@props:class: string;
@props:backdropClass: any;
@props:params: any;
@props:transition: any = fly;
-->
