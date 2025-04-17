<script lang="ts">
  import { type BlockquoteProps, blockquote } from './index';

  let {
    children,
    class: className,
    border,
    italic = true,
    bg,
    alignment = 'left',
    size = 'lg',
    ...restProps
  }: BlockquoteProps = $props();

  let blockquoteClass = $derived(
    blockquote({
      border,
      italic,
      bg,
      alignment,
      size,
      className
    })
  );
</script>

<blockquote {...restProps} class={blockquoteClass}>
  {@render children()}
</blockquote>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: Snippet;
@props:class: string;
@props:border: boolean;
@props:italic: boolean = true;
@props:bg: boolean;
@props:alignment: type AlignmentType = VariantProps<typeof blockquote>['alignment'] = 'left';
@props:size: type SizeType = VariantProps<typeof blockquote>['size'] = 'lg';
-->
