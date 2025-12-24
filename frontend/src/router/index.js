import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Directory from '../views/Directory.vue';
import HouseholdDetail from '../views/HouseholdDetail.vue';
import PersonDetail from '../views/PersonDetail.vue';
import PersonEdit from '../views/PersonEdit.vue';
import AuthCallback from '../views/AuthCallback.vue';
import PrintView from '../views/PrintView.vue';
import LabelPrintView from '../views/LabelPrintView.vue';
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
    path: '/auth/expired',
    name: 'ExpiredLink',
    component: () => import('../views/ExpiredLink.vue'),
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
    path: '/print/options',
    name: 'PrintOptionsView',
    component: () => import('../views/PrintOptionsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/print',
    name: 'PrintView',
    component: PrintView,
    meta: { requiresAuth: true },
  },
  {
    path: '/print/labels',
    name: 'LabelPrintView',
    component: LabelPrintView,
    meta: { requiresAuth: true },
  },
  {
    path: '/print/labels/5160',
    name: 'LabelPrintView5160',
    component: () => import('../views/LabelPrintView5160.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/print/envelopes',
    name: 'EnvelopePrintView',
    component: () => import('../views/EnvelopePrintView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/person/new',
    name: 'PersonNew',
    component: () => import('../views/PersonNew.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // If route requires auth, check authentication
  if (to.meta.requiresAuth) {
    // If no token, redirect to login
    if (!authStore.isAuthenticated) {
      next('/login');
      return;
    }
    
    // If token exists but no user data, try to fetch it
    // This validates the token and redirects to login if invalid
    if (!authStore.currentUser) {
      try {
        await authStore.fetchCurrentUser();
        next();
      } catch (error) {
        // Token is invalid, clear it and redirect to login
        authStore.logout();
        next('/login');
      }
      return;
    }
  }
  
  // If already authenticated and trying to access login, redirect to directory
  if (to.path === '/login' && authStore.isAuthenticated && authStore.currentUser) {
    next('/directory');
    return;
  }
  
  next();
});

export default router;

