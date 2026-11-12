import React, { useMemo, useState } from 'react';

type Kind = 'rational' | 'exp' | 'quadratic';
const W=780,H=500, pad=48;
function Plot({kind,a,b,c,d,showGrid}:{kind:Kind,a:number,b:number,c:number,d:number,showGrid:boolean}) {
 const [range,setRange]=useState(7);
 const X=(x:number)=>W/2+x*(W-2*pad)/(2*range);
 const Y=(y:number)=>H/2-y*(H-2*pad)/(2*range);
 const path=(fn:(x:number)=>number,lo=-range,hi=range)=>{
  const segments:string[]=[];let active=false,prev=0;
  for(let i=0;i<=1800;i++){const x=lo+(hi-lo)*i/1800,y=fn(x);const valid=Number.isFinite(y)&&Math.abs(y)<range*3&&Y(y)>=pad&&Y(y)<=H-pad;
   if(!valid || (active&&Math.abs(y-prev)>range*.8)){active=false;continue;}
   segments.push(`${active?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`);active=true;prev=y;
  }return segments.join(' ');
 };
 const ticks=Array.from({length:2*range+1},(_,i)=>i-range);
 const lines=kind==='exp'?[{d:path(x=>Math.pow(a,x)),color:'#5146ed'},{d:path(x=>x>0?Math.log(x)/Math.log(a):NaN),color:'#00a884'}]:[{d:path(x=>kind==='quadratic'?a*x*x+b*x+c:(a*x+b)/(c*x+d)),color:'#5146ed'}];
 const asym=kind==='rational'&&c!==0&&a*d!==b*c?{x:-d/c,y:a/c}:null;
 return <div style={{position:'relative',minWidth:0}}><svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',background:'white',border:'1px solid #dbe3ee',borderRadius:12}} role="img" aria-label="Đồ thị hàm số có trục tọa độ và vạch chia">
 <defs><clipPath id="plot-clip"><rect x={pad} y={pad} width={W-2*pad} height={H-2*pad}/></clipPath></defs>
 {showGrid&&ticks.map(t=><g key={t} stroke="#e9edf5" strokeWidth="1"><line x1={X(t)} y1={pad} x2={X(t)} y2={H-pad}/><line x1={pad} y1={Y(t)} x2={W-pad} y2={Y(t)}/></g>)}
 <g stroke="#718096" strokeWidth="1.5"><line x1={pad} y1={Y(0)} x2={W-pad} y2={Y(0)}/><line x1={X(0)} y1={pad} x2={X(0)} y2={H-pad}/></g>
 {ticks.filter(t=>t!==0).map(t=><g key={t} fill="#475569" fontSize="12" textAnchor="middle"><line x1={X(t)} x2={X(t)} y1={Y(0)-4} y2={Y(0)+4} stroke="#64748b"/><text x={X(t)} y={Math.min(H-pad-5,Y(0)+18)}>{t}</text><line x1={X(0)-4} x2={X(0)+4} y1={Y(t)} y2={Y(t)} stroke="#64748b"/><text x={X(0)-18} y={Y(t)+4}>{t}</text></g>)}
 <text x={X(0)-14} y={Y(0)+17} fill="#334155" fontSize="13">O</text><text x={W-pad-12} y={Y(0)-12}>x</text><text x={X(0)+12} y={pad+13}>y</text>
 <g clipPath="url(#plot-clip)">{asym&&<g stroke="#ef4444" strokeDasharray="7 5" strokeWidth="1.6"><line x1={X(asym.x)} x2={X(asym.x)} y1={pad} y2={H-pad}/><line x1={pad} x2={W-pad} y1={Y(asym.y)} y2={Y(asym.y)}/></g>}{kind==='exp'&&<path d={path(x=>x)} stroke="#f59e0b" strokeDasharray="6 5" fill="none" strokeWidth="1.6"/>}{lines.map((l,i)=><path key={i} d={l.d} stroke={l.color} strokeWidth="2.8" fill="none" strokeLinejoin="round"/>)}</g>
 {asym&&<g fill="#b91c1c" fontSize="13"><text x={Math.min(W-pad-75,Math.max(pad+5,X(asym.x)+8))} y={H-pad-10}>x = {Number(asym.x.toFixed(2))}</text><text x={W-pad-105} y={Math.max(pad+15,Math.min(H-pad-8,Y(asym.y)-8))}>y = {Number(asym.y.toFixed(2))}</text></g>}
 {kind==='exp'&&<g fill="#0f766e" fontSize="13"><text x={Math.min(W-pad-60,X(1)+12)} y={Y(0)-14}>(1; 0)</text><text x={X(0)+10} y={Y(1)-9}>(0; 1)</text></g>}
 </svg><div style={{display:'flex',gap:8,marginTop:8}}><button onClick={()=>setRange(Math.max(3,range-1))}>Phóng to +</button><button onClick={()=>setRange(Math.min(15,range+1))}>Thu nhỏ −</button><button onClick={()=>setRange(7)}>Vừa khung</button></div></div>;
}
export default function DrawingToolsPage(){
 const [kind,setKind]=useState<Kind>('rational');const [a,setA]=useState(2),[b,setB]=useState(1),[c,setC]=useState(1),[d,setD]=useState(-1),[grid,setGrid]=useState(true);
 const error=useMemo(()=>kind==='exp'&&!(a>0&&a!==1)?'Cơ số a phải lớn hơn 0 và khác 1.':kind==='rational'&&c===0&&d===0?'Mẫu số không được đồng nhất bằng 0.':'',[kind,a,c,d]);
 const input=(label:string,v:number,set:(n:number)=>void)=><label style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,margin:'10px 0'}}>{label}<input type="number" value={v} onChange={e=>set(Number(e.target.value))} style={{width:125,padding:9,border:'1px solid #cbd5e1',borderRadius:8}}/></label>;
 return <main style={{fontFamily:'Arial,sans-serif',background:'#f4f7fb',minHeight:'100vh',padding:'20px',color:'#172033'}}><header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:18}}><div><h1 style={{fontSize:23,margin:0}}>Bộ công cụ Hình học & Đồ thị 2D/3D</h1><p style={{margin:'6px 0',color:'#64748b'}}>Trang vẽ đồ thị riêng – không sử dụng popup</p></div><button onClick={()=>window.history.length>1?window.history.back():window.location.assign('/')} style={{padding:'11px 18px',borderRadius:9,border:'1px solid #cbd5e1'}}>← Quay lại</button></header>
 <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(250px,300px)',gap:18,alignItems:'start'}} className="drawing-layout"><section style={{background:'white',padding:16,borderRadius:14}}><div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>{([['rational','Hàm phân thức'],['exp','Mũ & lôgarit'],['quadratic','Hàm bậc hai']] as const).map(([id,label])=><button key={id} onClick={()=>{setKind(id);if(id==='exp')setA(2)}} style={{padding:'9px 13px',borderRadius:8,border:'1px solid #cbd5e1',background:kind===id?'#e0e7ff':'white'}}>{label}</button>)}</div>{error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:<Plot kind={kind} a={a} b={b} c={c} d={d} showGrid={grid}/>}</section><aside style={{background:'white',padding:18,borderRadius:14}}><h2 style={{fontSize:18,marginTop:0}}>Tham số và tùy chọn</h2>{input('Hệ số / cơ số a',a,setA)}{kind!=='exp'&&input('Hệ số b',b,setB)}{kind!=='exp'&&input('Hệ số c',c,setC)}{kind==='rational'&&input('Hệ số d',d,setD)}<label><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Hiện lưới</label><p style={{color:'#64748b',fontSize:13,lineHeight:1.5}}>Trang này cung cấp đồ thị 2D hoạt động độc lập. Chức năng chèn ngược vào trình soạn đề và hình 3D cần tích hợp với phiên bản mã nguồn mới nhất.</p></aside></div><style>{'@media(max-width:800px){.drawing-layout{grid-template-columns:1fr!important}} button{cursor:pointer;font:inherit}'}</style></main>;
}
