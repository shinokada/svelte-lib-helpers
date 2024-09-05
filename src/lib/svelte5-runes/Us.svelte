<script lang="ts">
  import { getContext } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';

  type TitleType = {
    id?: string;
    title?: string;
  };
  type DescType = {
    id?: string;
    desc?: string;
  };
  interface BaseProps extends SVGAttributes<SVGElement> {
    size?: string;
    role?: string;
  }
  interface CtxType extends BaseProps {}
  const ctx: CtxType = getContext('iconCtx') ?? {};
  interface Props extends BaseProps {
    title?: TitleType;
    desc?: DescType;
    ariaLabel?: string;
  }

  let {
    size = ctx.size || '24',
    role = ctx.role || 'img',
    title,
    desc,
    ariaLabel = 'us',
    ...restProps
  }: Props = $props();

  let ariaDescribedby = `${title?.id || ''} ${desc?.id || ''}`;
  const hasDescription = $derived(!!(title?.id || desc?.id));
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {...restProps}
  {role}
  width={size}
  height={size}
  aria-label={ariaLabel}
  aria-describedby={hasDescription ? ariaDescribedby : undefined}
  viewBox="0 0 7410 3900"
>
  {#if title?.id && title.title}
    <title id={title.id}>{title.title}</title>
  {/if}
  {#if desc?.id && desc.desc}
    <desc id={desc.id}>{desc.desc}</desc>
  {/if}
  <path fill="#b22234" d="M0 0h7410v3900H0z" /><path
    d="M0 450h7410m0 600H0m0 600h7410m0 600H0m0 600h7410m0 600H0"
    stroke="#fff"
    stroke-width="300"
  /><path fill="#3c3b6e" d="M0 0h2964v2100H0z" /><g fill="#fff"
    ><g id="d"
      ><g id="c"
        ><g id="e"
          ><g id="b"
            ><path id="a" d="M247 90l70.534 217.082-184.66-134.164h228.253L176.466 307.082z" /><use
              xlink:href="#a"
              y="420"
            /><use xlink:href="#a" y="840" /><use xlink:href="#a" y="1260" /></g
          ><use xlink:href="#a" y="1680" /></g
        ><use xlink:href="#b" x="247" y="210" /></g
      ><use xlink:href="#c" x="494" /></g
    ><use xlink:href="#d" x="988" /><use xlink:href="#c" x="1976" /><use
      xlink:href="#e"
      x="2470"
    /></g
  >
</svg>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop size = ctx.size || '24'
@prop role = ctx.role || 'img'
@prop title
@prop desc
@prop ariaLabel = 'us'
@prop ...restProps
-->
