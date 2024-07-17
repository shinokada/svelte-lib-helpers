<script lang="ts">
  import type { DownloadPropsType } from './types';

  let {
    source,
    user,
    repo,
    interval,
    packageName,
    style = 'flat',
    logo,
    logoColor,
    logoSize,
    label,
    labelColor,
    color,
    cacheSeconds,
    link,
    class: classname,
    ...attributes
  }: DownloadPropsType = $props();

  // common
  const styleOpt = style ? `style=${style}` : 'style=flat';
  const logoOpt = logo ? `&logo=${logo}` : '';
  const logoColorOpt = logoColor ? `&logoColor=${logoColor}` : '';
  const logoSizeOpt = logoSize ? `&logoSize=${logoSize}` : '';
  const labelOpt = label ? `&label=${encodeURIComponent(label)}` : '';
  const labelColorOpt = labelColor ? `&labelColor=${labelColor}` : '';
  const colorOpt = color ? `&color=${color}` : '';
  const cacheSecondsOpt = cacheSeconds ? `&cacheSeconds=${cacheSeconds}` : '';
  const link1 = link ? `&link=${encodeURIComponent(link[0])}` : '';
  const link2 = link ? `&link=${encodeURIComponent(link[1])}` : '';

  const npmSrcData = $state(
    `https://img.shields.io/npm/${interval}/${packageName}?${styleOpt}${logoOpt}${logoColorOpt}${logoSizeOpt}${labelOpt}${labelColorOpt}${colorOpt}${cacheSecondsOpt}${link1}${link2}`
  );

  let githubSrcData = $state(
    `https://img.shields.io/github/downloads/${user}/${repo}/total?${styleOpt}${logoOpt}${logoColorOpt}${logoSizeOpt}${labelOpt}${labelColorOpt}${colorOpt}${cacheSecondsOpt}${link1}${link2}`
  );
</script>

{#if link}
  {#if source === 'npm'}
    <!-- NPM -->
    <object data={npmSrcData} title="NPM downloads" class={classname}> </object>
  {:else}
    <!-- GitHub -->
    <object data={githubSrcData} title="GitHub downloads" class={classname}> </object>
  {/if}
{:else if source === 'npm'}
  <!-- NPM -->
  <img src={npmSrcData} alt="NPM downloads" class={classname} {...attributes} />
{:else}
  <!-- GitHub -->
  <img src={githubSrcData} alt="GitHub downloads" class={classname} {...attributes} />
{/if}

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop source
@prop user
@prop repo
@prop interval
@prop packageName
@prop style = 'flat'
@prop logo
@prop logoColor
@prop logoSize
@prop label
@prop labelColor
@prop color
@prop cacheSeconds
@prop link
@prop class: classname
@prop ...attributes
-->
