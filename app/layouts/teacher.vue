<template>
  <div class="shell">
    <AppHeader :links="teacherNav" />
    <main id="main" class="shell-main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
