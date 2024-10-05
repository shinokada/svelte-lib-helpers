<script lang="ts">
  interface Props {
    children: any;
    drawerStatus: boolean;
    toggleDrawer?: () => void;
    position?: 'fixed' | 'absolute';
    leftOffset?: string | undefined;
    width?: string;
    placement?: 'left' | 'right' | 'top' | 'bottom';
    transitionParams: drawerTransitionParamTypes;
  }

  let {
    children,
    drawerStatus,
    toggleDrawer,
    position = 'fixed',
    leftOffset = 'inset-y-0 start-0',
    width = 'w-80',
    placement = 'left',
    transitionParams,
    ...attributes
  }: Props = $props();
</script>

<!--
@component
[Go to docs](https://github.com/shinokada/svelte-lib-helpers#readme)
## Props
@props: children: any;
@props:drawerStatus: any;
@props:toggleDrawer: any;
@props:position: any = 'fixed';
@props:leftOffset: any = 'inset-y-0 start-0';
@props:width: any = 'w-80';
@props:placement: any = 'left';
@props:transitionParams: any;
-->
