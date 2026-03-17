<script setup lang="ts">
import NetworkBanner from './NetworkBanner.vue'
import TabBar from './TabBar.vue'
import SideNav from './SideNav.vue'
</script>

<template>
  <!-- iPhone layout: top banner + content + bottom tabs -->
  <div class="h-full flex flex-col md:hidden">
    <NetworkBanner />
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
    <TabBar />
  </div>

  <!-- iPad layout: side nav + content -->
  <div class="h-full hidden md:flex">
    <SideNav />
    <div class="flex-1 flex flex-col overflow-hidden">
      <NetworkBanner />
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
