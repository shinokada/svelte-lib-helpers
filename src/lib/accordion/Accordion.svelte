<script lang="ts">
  import { setContext, getContext } from "svelte";
  import { writable } from "svelte/store";
  import { accordion } from "./";
  import type { AccordionProps } from "../types"
  import type { BaseThemes } from "$lib/theme";
  import clsx from "clsx";

  let { children, flush, activeClass, inactiveClass, multiple = false, class: className, ...restProps }: AccordionProps = $props();

  // Get merged theme from context
  const context = getContext<BaseThemes>("themeConfig");
  // Use context theme if available, otherwise fallback to default
  const accordionTheme = context?.accordion || accordion;

  const ctx = {
    flush,
    activeClass,
    inactiveClass,
    selected: multiple ? undefined : writable()
  };

  setContext("ctx", ctx);
  const base = $derived(accordionTheme({ flush, class: clsx(className) }));
</script>

<div {...restProps} class={base}>
  {@render children()}
</div>

