<script lang="ts">
  import { getContext } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  interface CtxType {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    role?: string;
    strokeLinecap?: 'round' | 'inherit' | 'butt' | 'square' | null | undefined;
    strokeLinejoin?: 'round' | 'inherit' | 'miter' | 'bevel' | null | undefined;
    strokeWidth?: string;
  }

  const ctx: CtxType = getContext('iconCtx') ?? {};
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  interface Props {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    role?: string;
    class?: string;
    ariaLabel?: string;
  }

  let { size = ctx.size || 'md', role,  class: classname, ariaLabel = 'user solid,',   ...restProps }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  {...restProps}
  class={twMerge('shrink-0', sizes[size], classname)}
  {role}
  aria-label={ariaLabel}
  viewBox="0 0 24 24"
>
  <path
    fill="currentColor"
    fill-rule="evenodd"
    d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
    clip-rule="evenodd"
  />
</svg>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop size = ctx.size || 'md'
@prop role
@prop class: classname
@prop ariaLabel = 'user solid
@prop '
@prop ...restProps
-->
