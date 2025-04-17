<script lang="ts">
  import { getContext } from 'svelte';
  import type { SizeType } from '$lib/types';
  import { type ButtonProps, button } from '.';

  const group: SizeType = getContext('group');

  let { children, pill = false, outline = false, size = group ? 'sm' : 'md', href, type = 'button', color = group ? (outline ? 'dark' : 'alternative') : 'primary', shadow = false, tag = 'button', disabled, class: className, ...restProps }: ButtonProps = $props();

  // const disabledValue = disabled !== null ? disabled : undefined;
  const base = $derived(button({ color, size, disabled, pill, group: !!group, outline, shadow, className }));

  // $inspect('group: ', group, 'isGroup: ', isGroup);
</script>

{#if href}
  <a {href} {...restProps} class={base} role="button">
    {@render children()}
  </a>
{:else if tag === 'button'}
  <button {type} {...restProps} class={base} {disabled}>
    {@render children()}
  </button>
{:else}
  <svelte:element this={tag} {...restProps} class={base}>
    {@render children()}
  </svelte:element>
{/if}

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: any;
@props:pill: any = false;
@props:outline: any = false;
@props:size: any = group ? 'sm' : 'md';
@props:href: any;
@props:type: any = 'button';
@props:color: any = group ? (outline ? 'dark' : 'alternative') : 'primary';
@props:shadow: any = false;
@props:tag: any = 'button';
@props:disabled: any;
@props:class: string;
-->
