<script setup lang="ts">
import {computed} from 'vue';
import {ShoppingCart,LayoutDashboard,Armchair,ClipboardList,Coffee,BarChart3,Settings,Users,Landmark,Printer,Image,Layers,Store,ShieldCheck,Receipt,Menu,Plus,Search,ChevronDown,X,Check,MoreVertical,ArrowRight,ExternalLink,RefreshCw,Download,Clock,Trash2,Edit3,Smartphone,PanelTop,Wallet,ArrowLeft,Copy,Eye,LogOut,Globe,Wifi,FileText,Package,UtensilsCrossed} from 'lucide-vue-next';
const p=withDefaults(defineProps<{name:string;size?:number}>(),{size:20});
const icons:Record<string,any>={cart:ShoppingCart,dashboard:LayoutDashboard,table:Armchair,orders:ClipboardList,coffee:Coffee,reports:BarChart3,settings:Settings,staff:Users,bank:Landmark,printer:Printer,image:Image,layers:Layers,store:Store,shield:ShieldCheck,receipt:Receipt,menu:Menu,plus:Plus,search:Search,down:ChevronDown,close:X,check:Check,more:MoreVertical,next:ArrowRight,external:ExternalLink,refresh:RefreshCw,download:Download,clock:Clock,trash:Trash2,edit:Edit3,mobile:Smartphone,panel:PanelTop,wallet:Wallet,back:ArrowLeft,copy:Copy,eye:Eye,logout:LogOut,globe:Globe,wifi:Wifi,file:FileText,package:Package,kitchen:UtensilsCrossed};
const current=computed(()=>icons[p.name]??Coffee);
</script><template><component :is="current" :size="size" :stroke-width="1.8" aria-hidden="true"/></template>
