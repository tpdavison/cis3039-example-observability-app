import { createApp } from 'vue';
import App from './App.vue';
import { PRODUCT_DEPS_KEY } from './composables/products-key';
import {
  createProductDeps,
  initialiseInstrumentation,
} from './config/composition-root';
import router from './router';

try {
  initialiseInstrumentation();

  const app = createApp(App);
  app.provide(PRODUCT_DEPS_KEY, createProductDeps());
  app.use(router);
  app.mount('#app');
} catch {
  console.error('Products app startup failed. Check the public configuration.');
  const target = document.querySelector('#app');
  if (target) {
    target.textContent =
      'The products app could not start. Check VITE_API_BASE_URL and the public app configuration, then reload.';
  }
}
