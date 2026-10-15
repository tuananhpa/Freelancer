<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref} from 'vue';
import {useRoute} from 'vue-router';
import Shell from './components/Shell.vue';
import {useCoffee} from './stores/coffee';
const route=useRoute();const store=useCoffee();const online=ref(navigator.onLine);const standalone=computed(()=>route.meta.standalone);
const update=()=>online.value=navigator.onLine;
onMounted(()=>{window.addEventListener('online',update);window.addEventListener('offline',update)});
onUnmounted(()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)});
</script>
<template><div v-if="!online" class="offline" role="status">Mất kết nối. Nội dung đã lưu vẫn xem được; thao tác gửi và lưu cần kết nối.</div><RouterView v-if="standalone"/><Shell v-else><RouterView/></Shell><Transition name="toast"><div v-if="store.toast" class="toast" :class="store.toastType" role="status" aria-live="polite">{{store.toast}}<button aria-label="Đóng thông báo" @click="store.toast=''">×</button></div></Transition></template>
