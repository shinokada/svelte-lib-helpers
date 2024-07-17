<script lang="ts">
  
  interface Props extends HTMLAttributes<HTMLDivElement> {
    children: Snippet;
    icon?: Snippet;
    color?: ColorVariant;
    large?: boolean;
    dismissable?: boolean;
    class?: string | undefined | null;
    border?: boolean;
    href?: string | undefined | null;
    rounded?: boolean;
    transition?: TransitionFunc;
    params?: any;
    onclick?: () => void;
  }
  let {
    children,
    icon,
    color = 'primary',
    large = false,
    dismissable = false,
    class: divClass,
    border,
    href,
    rounded,
    transition = fade,
    params,
    onclick,
    ...attributes
  }: Props = $props();

</script>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop children
@prop icon
@prop color = 'primary'
@prop large = false
@prop dismissable = false
@prop class: divClass
@prop border
@prop href
@prop rounded
@prop transition = fade
@prop params
@prop onclick
@prop ...attributes
-->
