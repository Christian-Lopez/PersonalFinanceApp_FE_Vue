import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import AccountsView from '../views/AccountsView.vue'
import CategoriesView from '../views/CategoriesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsView
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('../views/TagsView.vue')
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue')
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue')
    }
  ]
})

export default router
