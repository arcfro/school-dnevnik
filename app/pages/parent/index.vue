<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})
</script>

<template>
  <section class="page-card stack" data-tour="parent-home">
    <div class="page-head">
      <h1>Обзор</h1>
    </div>
    <p class="muted">
      Расписание, оценки и домашние задания — в меню сверху. Включите push в настройках, чтобы не пропускать новости.
    </p>
    <nav class="quick-tiles" aria-label="Быстрые ссылки">
      <QuickLinkTile
        to="/parent/schedule"
        title="Расписание"
        description="Уроки на неделю"
        icon="lucide:calendar-days"
        primary
      />
      <QuickLinkTile
        to="/parent/grades"
        title="Оценки"
        description="Последние 30 дней"
        icon="lucide:star"
      />
      <QuickLinkTile
        to="/parent/homework"
        title="Задания"
        description="Активные домашние работы"
        icon="lucide:book-marked"
      />
    </nav>
  </section>
</template>
