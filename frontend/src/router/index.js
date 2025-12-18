import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Directory from '../views/Directory.vue';
import HouseholdDetail from '../views/HouseholdDetail.vue';
import PersonDetail from '../views/PersonDetail.vue';
import PersonEdit from '../views/PersonEdit.vue';
import AuthCallback from '../views/AuthCallback.vue';
import PrintView from '../views/PrintView.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/directory',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback,
    meta: { requiresAuth: false },
  },
  {
    path: '/directory',
    name: 'Directory',
    component: Directory,
    meta: { requiresAuth: true },
  },
  {
    path: '/household/:id',
    name: 'HouseholdDetail',
    component: HouseholdDetail,
    meta: { requiresAuth: true },
  },
  {
    path: '/person/:id',
    name: 'PersonDetail',
    component: PersonDetail,
    meta: { requiresAuth: true },
  },
  {
    path: '/person/:id/edit',
    name: 'PersonEdit',
    component: PersonEdit,
    meta: { requiresAuth: true },
  },
  {
    path: '/print',
    name: 'PrintView',
    component: PrintView,
    meta: { requiresAuth: true },
  },
  {
    path: '/person/new',
    name: 'PersonNew',
    component: () => import('../views/PersonNew.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;

