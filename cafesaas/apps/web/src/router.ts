import {createRouter,createWebHistory} from 'vue-router';
import PosView from './views/PosView.vue';
import TablesView from './views/TablesView.vue';
import OrdersView from './views/OrdersView.vue';
import KitchenView from './views/KitchenView.vue';
import CustomerView from './views/CustomerView.vue';
import DashboardView from './views/DashboardView.vue';
import CatalogView from './views/CatalogView.vue';
import AdminView from './views/AdminView.vue';
import ReportsView from './views/ReportsView.vue';
import ReceiptView from './views/ReceiptView.vue';
const routes=[
{path:'/',redirect:'/pos'},
{path:'/pos',component:PosView,meta:{title:'Bán hàng'}},
{path:'/waiter',component:PosView,meta:{title:'Phục vụ',waiter:true}},
{path:'/tables',component:TablesView,meta:{title:'Bàn & khu vực'}},
{path:'/orders',component:OrdersView,meta:{title:'Đơn hàng'}},
{path:'/kitchen',component:KitchenView,meta:{title:'Quầy pha chế'}},
{path:'/order/:token',component:CustomerView,meta:{standalone:true,title:'Gọi món'}},
{path:'/receipt/:id',component:ReceiptView,meta:{standalone:true,title:'Bill bán hàng'}},
{path:'/admin',redirect:'/admin/dashboard'},
{path:'/admin/dashboard',component:DashboardView,meta:{title:'Admin',admin:true}},
{path:'/admin/receipts',component:OrdersView,meta:{title:'Bill đã xuất',admin:true,receipts:true}},
{path:'/admin/products',component:CatalogView,meta:{title:'Thực đơn',admin:true}},
{path:'/admin/images',component:CatalogView,meta:{title:'Hình ảnh',admin:true,images:true}},
{path:'/admin/reports',component:ReportsView,meta:{title:'Báo cáo',admin:true}},
...['categories','banks','branches','printers','staff','permissions','settings','invoices','subscription','audit'].map(key=>({path:'/admin/'+key,component:AdminView,meta:{title:({categories:'Danh mục',banks:'Ngân hàng',branches:'Cơ sở',printers:'Máy in',staff:'Nhân viên',permissions:'Phân quyền',settings:'Cài đặt quán',invoices:'Hóa đơn điện tử',subscription:'Gói dịch vụ',audit:'Nhật ký thay đổi'} as Record<string,string>)[key],admin:true,key}})),
{path:'/platform',component:AdminView,meta:{title:'Quản trị SaaS',key:'platform'}},
{path:'/login',component:AdminView,meta:{title:'Chọn giao diện',key:'login'}},
{path:'/:pathMatch(.*)*',redirect:'/pos'}];
export default createRouter({history:createWebHistory(),routes,scrollBehavior:()=>({top:0})});
