import { createRouter, createWebHistory } from 'vue-router'
import GeneratorView from '../views/GeneratorView.vue'
import LibraryView from '../views/LibraryView.vue'
import ExportView from '../views/ExportView.vue'
import ContrastView from '../views/ContrastView.vue'

const routes = [
  {
    path: '/',
    name: 'Generator',
    component: GeneratorView,
    meta: { title: 'Генератор палитр' }
  },
  {
    path: '/library',
    name: 'Library',
    component: LibraryView,
    meta: { title: 'Библиотека палитр' }
  },
  {
    path: '/export',
    name: 'Export',
    component: ExportView,
    meta: { title: 'Экспорт' }
  },
  {
    path: '/contrast',
    name: 'Contrast',
    component: ContrastView,
    meta: { title: 'Проверка контраста' }
  },
  {
    // Обработка 404
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Обновляем заголовок страницы при переходе
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Генератор палитр'
  next()
})

export default router

