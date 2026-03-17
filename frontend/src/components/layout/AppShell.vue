<script setup lang="ts">
import NetworkBanner from './NetworkBanner.vue'
import TabBar from './TabBar.vue'
import SideNav from './SideNav.vue'
</script>

<template>
  <!-- iPhone layout: top banner + content + bottom tabs -->
  <div class="h-100 d-flex flex-column d-md-none">
    <NetworkBanner />
    <main class="flex-grow-1 overflow-auto">
      <slot />
    </main>
    <TabBar />
  </div>

  <!-- iPad layout: side nav + content -->
  <div class="h-100 d-none d-md-flex">
    <SideNav />
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <NetworkBanner />
      <main class="flex-grow-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
