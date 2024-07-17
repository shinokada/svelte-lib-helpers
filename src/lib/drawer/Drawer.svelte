<script lang="ts">


  interface Props extends HTMLAttributes<HTMLDivElement> {
    children: Snippet;
    drawerStatus: boolean;
    activateClickOutside?: boolean;
    position?: 'fixed' | 'absolute';
    leftOffset?: string | undefined;
    rightOffset?: string | undefined;
    topOffset?: string | undefined;
    bottomOffset?: string | undefined;
    width?: string | undefined | null;
    backdrop?: boolean;
    bgColor?: string | undefined;
    bgOpacity?: string | undefined;
    placement?: 'left' | 'right' | 'top' | 'bottom';
    class?: string | undefined;
    transitionParams: drawerTransitionParamTypes;
    transitionType?: drawerTransitionTypes;
  }

  let {
    children,
    drawerStatus,
    toggleDrawer,
    closeDrawer,
    activateClickOutside = true,
    position = 'fixed',
    leftOffset = 'inset-y-0 start-0',
    rightOffset = 'inset-y-0 end-0',
    topOffset = 'inset-x-0 top-0',
    bottomOffset = 'inset-x-0 bottom-0',
    width = 'w-80',
    backdrop = true,
    bgColor = 'bg-gray-900',
    bgOpacity = 'bg-opacity-75',
    placement = 'left',
    class: className = '',
    transitionParams,
    transitionType = 'fly',
    ...attributes
  }: Props = $props();

</script>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@prop children
@prop drawerStatus
@prop toggleDrawer
@prop closeDrawer
@prop activateClickOutside = true
@prop position = 'fixed'
@prop leftOffset = 'inset-y-0 start-0'
@prop rightOffset = 'inset-y-0 end-0'
@prop topOffset = 'inset-x-0 top-0'
@prop bottomOffset = 'inset-x-0 bottom-0'
@prop width = 'w-80'
@prop backdrop = true
@prop bgColor = 'bg-gray-900'
@prop bgOpacity = 'bg-opacity-75'
@prop placement = 'left'
@prop class: className = ''
@prop transitionParams
@prop transitionType = 'fly'
@prop ...attributes
-->
