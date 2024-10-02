<script lang="ts">
    interface Props {
    children: Snippet;
    footerType?: 'sitemap' | 'default' | 'logo' | 'socialmedia' | undefined;
    class?: string | undefined;
  }

  let {
    children,
    footerType = 'default',
    class: footerclass,
    ...attributes
  }: Props = $props();
</script>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: Snippet;
@props:footerType: 'sitemap' | 'default' | 'logo' | 'socialmedia' | undefined = 'default';
@props:class: string | undefined;
-->
