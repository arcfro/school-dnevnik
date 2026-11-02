<template>
  <div class="shell" data-role="teacher">
    <AppHeader :links="teacherNav" />
    <main id="main" class="shell-main" tabindex="-1">
      <slot />
    </main>
    <AppToast />
    <AppTourHost />
  </div>
</template>
