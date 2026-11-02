<template>
  <div class="shell" data-role="admin">
    <AppHeader :links="adminNav" />
    <main id="main" class="shell-main" tabindex="-1">
      <slot />
    </main>
    <AppToast />
    <AppTourHost />
  </div>
</template>
