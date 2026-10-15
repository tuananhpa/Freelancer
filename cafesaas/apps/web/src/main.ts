import {createApp} from 'vue';
import {createPinia} from 'pinia';

import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import './styles.css';
import App from './App.vue';
import router from './router';
if(import.meta.env.PROD && 'serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(error=>console.error('Không thể đăng ký bộ nhớ ngoại tuyến:',error));}
createApp(App).use(createPinia()).use(router).mount('#app');
