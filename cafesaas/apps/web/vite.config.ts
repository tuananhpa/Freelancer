import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
import {fileURLToPath} from 'node:url';
export default defineConfig({
 root:fileURLToPath(new URL('.',import.meta.url)),
 plugins:[vue(),tailwindcss(),VitePWA({injectRegister:false,registerType:'autoUpdate',includeAssets:['icon.svg','drinks.png'],manifest:{name:'Coffee POS',short_name:'Coffee POS',description:'Quản lý quán và gọi món tại bàn',theme_color:'#075e63',background_color:'#f5f8fa',display:'standalone',start_url:'/',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,woff2,png}'],maximumFileSizeToCacheInBytes:6000000,navigateFallback:'/index.html',navigateFallbackDenylist:[/^\/api\//],runtimeCaching:[]}})],
 server:{host:'127.0.0.1',port:5177,strictPort:true},
 build:{outDir:'dist',emptyOutDir:true},
});
