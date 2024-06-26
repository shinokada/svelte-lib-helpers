<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import type { ButtonClassesTypes } from '../types';
  import type { BottomNavType } from './BottomNav.svelte';
  import { twMerge } from 'tailwind-merge';
  import { page } from '$app/stores';

  interface Props {
    children?: Snippet;
    btnName?: string;
    appBtnPosition?: 'left' | 'middle' | 'right';
    activeClass?: string;
    href?: string;
    exact?: boolean;
    btnclass?: string;
    spanclass?: string;
  }

  let { 
    children, 
    btnName, 
    appBtnPosition = 'middle', 
    activeClass, 
    href = '', 
    exact = true, 
    btnclass, 
    class: classname,
    spanclass, 
    ...attributes 
  }: Props = $props();

  const navType: 'default' | 'border' | 'application' | 'pagination' | 'group' | 'card' | 'meeting' | 'video' = getContext('navType');

  const context = getContext<BottomNavType>('bottomNavType') ?? {};

  let currentUrl = $state($page.url.pathname);
  let active: boolean = $state(false);

  const btnClasses: ButtonClassesTypes = {
    default: 'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
    border: 'inline-flex flex-col items-center justify-center px-5 border-gray-200 border-x hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600',
    application: '',
    pagination: 'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
    group: 'inline-flex flex-col items-center justify-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 group',
    card: 'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
    meeting: '',
    video: ''
  };

  const spanClasses: ButtonClassesTypes = {
    default: 'text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500',
    border: 'text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500',
    application: 'sr-only',
    pagination: 'sr-only',
    group: 'sr-only',
    card: 'text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500',
    meeting: '',
    video: ''
  };

  const appBtnClasses = {
    left: 'inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group',
    middle: 'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
    right: 'inline-flex flex-col items-center justify-center px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group'
  };
  let btnCls: string = $state('');
  let spanCls: string = $state('');
  $effect(() => {
    currentUrl = $page.url.pathname;
    active = href === currentUrl;

    btnCls = twMerge(btnClasses[navType], appBtnClasses[appBtnPosition], active && (activeClass ?? context.activeClass), btnclass);

    spanCls = twMerge(spanClasses[navType], active && (activeClass ?? context.activeClass), spanclass);
  });
</script>

<svelte:element this={href ? 'a' : 'button'} aria-label={btnName} {href} role={href ? 'link' : 'button'} {...attributes} class={btnCls}>
  {#if children}
  {@render children()}
  {/if}
  <span class={spanCls}>{btnName}</span>
</svelte:element>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop children
@prop btnName
@prop appBtnPosition = 'middle'
@prop activeClass
@prop href = ''
@prop exact = true
@prop btnclass
@prop class: classname
@prop spanclass
@prop ...attributes
-->
