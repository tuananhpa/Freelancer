import { defaults } from './config.js';
export function initialState() {
  return {
    settings: structuredClone(defaults), activeUserId:'student-1',
    users:[
      {id:'student-1',name:'Học sinh',email:'hocsinh@example.com',classId:'11T1',membership:'approved',points:120},
      {id:'student-2',name:'Nguyễn Minh Anh',email:'minhanh@example.com',classId:'11T2',membership:'approved',points:180},
      {id:'student-3',name:'Trần Gia Huy',email:'giahuy@example.com',classId:'11T3',membership:'approved',points:100},
      {id:'student-4',name:'Lê Ngọc Linh',email:'ngoclinh@example.com',classId:'11T1',membership:'pending',points:0},
    ],
    history: Array.from({length:8},(_,i)=>({id:`old-${i}`,userId:'student-1',classId:'11T1',binId:i%2?'R02':'R01',type:i%2?'metal':'plastic',points:i%2?20:10,at:`2026-10-${String(13-Math.floor(i/2)).padStart(2,'0')}T${i%2?'16:40':'08:15'}:00+07:00`,confirmed:true})),
    transactions:[], adjustments:[],
    snapshots:[
      {week:'2026-10-12',id:'11T1',points:1250,count:63},{week:'2026-10-12',id:'11T2',points:1480,count:74},{week:'2026-10-12',id:'11T3',points:980,count:49},
      {week:'2026-10-05',id:'11T1',points:980,count:52},{week:'2026-10-05',id:'11T2',points:870,count:48},{week:'2026-10-05',id:'11T3',points:1050,count:56},
    ],
  };
}
