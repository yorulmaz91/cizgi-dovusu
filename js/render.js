/* ============================================================
   ÇİZİM — tuval kurulumu, arka plan, çöp adam gövdesi,
   koca kafa + yüz, eller ve şimşek çizgisi
   ============================================================ */
import {lerp,rnd} from './utils.js';
import {INK,PAPER,drawMiniBolt} from './effects.js';

export const cvs=document.getElementById('game'), ctx=cvs.getContext('2d');
export let VW=0,VH=0,GROUND=0;
export function resize(){
  VW=innerWidth;VH=innerHeight;
  cvs.width=VW*devicePixelRatio;cvs.height=VH*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  GROUND=VH*0.7;
}
addEventListener('resize',resize);resize();

function capsule(g,x1,y1,x2,y2,r){
  const a=Math.atan2(y2-y1,x2-x1);
  g.beginPath();
  g.arc(x1,y1,r,a+Math.PI/2,a-Math.PI/2);
  g.arc(x2,y2,r,a-Math.PI/2,a+Math.PI/2);
  g.closePath();
}
function tstroke(g,pts,w1,w2){
  for(let i=0;i<pts.length-1;i++){
    const t=i/(pts.length-1);
    g.strokeStyle=INK;g.lineWidth=w1+(w2-w1)*t;g.lineCap='round';
    g.beginPath();g.moveTo(pts[i][0],pts[i][1]);g.lineTo(pts[i+1][0],pts[i+1][1]);g.stroke();
  }
}

/* ---------------- el çizimi ---------------- */
function drawToonHand(g,x,y,ang,mode,lw){
  g.save();g.translate(x,y);g.rotate(ang);
  g.strokeStyle=INK;g.fillStyle=PAPER;g.lineWidth=1.4;g.lineJoin='round';
  if(mode==='fist'){
    g.beginPath();
    g.moveTo(-3,-5);g.quadraticCurveTo(6,-7,8,-3);
    g.quadraticCurveTo(10,0,8,3.5);g.quadraticCurveTo(6,7,-3,5.5);
    g.quadraticCurveTo(-6,3,-6,0);g.quadraticCurveTo(-6,-3,-3,-5);
    g.closePath();g.fill();g.stroke();
    g.lineWidth=1;
    g.beginPath();g.arc(4,-3.2,1.6,Math.PI*1.1,Math.PI*1.9);g.stroke();
    g.lineWidth=1.4;
    g.beginPath();g.moveTo(-2,4.5);g.quadraticCurveTo(4,7,7,4);g.stroke();
  }else{
    g.beginPath();
    g.moveTo(-4,-4);g.quadraticCurveTo(3,-5.5,5,-3);
    g.lineTo(5,3);g.quadraticCurveTo(3,5.5,-4,4);
    g.quadraticCurveTo(-6,0,-4,-4);g.closePath();g.fill();g.stroke();
    const fingers=[{a:-0.38,l:8.5},{a:-0.13,l:10},{a:0.13,l:9.5},{a:0.38,l:8}];
    for(const f of fingers){
      const bx=4.6*Math.cos(f.a), by=4.6*Math.sin(f.a)*2.2;
      const mx=bx+Math.cos(f.a)*f.l*0.55, my=by+Math.sin(f.a)*f.l*0.55;
      const tx=bx+Math.cos(f.a*0.75)*f.l, ty=by+Math.sin(f.a*0.75)*f.l;
      capsule(g,bx,by,mx,my,1.6);g.fill();g.stroke();
      capsule(g,mx,my,tx,ty,1.4);g.fill();g.stroke();
    }
    capsule(g,-2,3.4,2.5,7,1.7);g.fill();g.stroke();
  }
  g.restore();
}

export function drawBolt(g,x1,y1,x2,y2){
  g.save();g.strokeStyle=INK;g.lineWidth=4;g.lineCap='round';
  g.beginPath();g.moveTo(x1,y1);
  const n=7;for(let i=1;i<=n;i++)g.lineTo(lerp(x1,x2,i/n)+rnd(-16,16),lerp(y1,y2,i/n));
  g.stroke();
  g.strokeStyle=PAPER;g.lineWidth=1.4;
  g.stroke();
  g.restore();
}

/* ---------------- arka plan ---------------- */
export function drawBG(g){
  g.fillStyle=PAPER;g.fillRect(0,0,VW,VH);
  const line=INK==='#1A1A1A'?'rgba(0,0,0,':'rgba(255,255,255,';
  // kağıt dokusu çizgileri
  g.strokeStyle=line+'.05)';g.lineWidth=1;
  for(let i=1;i<5;i++){g.beginPath();g.moveTo(0,GROUND-i*46);g.lineTo(VW,GROUND-i*46);g.stroke();}
  // zemin
  g.strokeStyle=line+'.75)';g.lineWidth=2.5;
  g.beginPath();g.moveTo(0,GROUND+1);g.lineTo(VW,GROUND+1);g.stroke();
  // zemin taraması (hatching)
  g.strokeStyle=line+'.14)';g.lineWidth=1;
  for(let x=0;x<VW;x+=14){
    g.beginPath();g.moveTo(x,GROUND+4);g.lineTo(x-8,GROUND+16);g.stroke();
  }
}

/* ---------------- dövüşçü çizimi ---------------- */
export function drawFighter(g,ftr){
  const p=ftr.pose(),f=ftr.facing,c=ftr.ch;
  const hipY=ftr.y-46+p.dip, hip=[ftr.x,hipY];
  const seg=(x,y,a,len)=>[x+Math.sin(a)*len*f,y+Math.cos(a)*len];
  g.save();

  // zemin gölgesi (havadayken küçülür)
  if(ftr.state!=='ko'){
    const alt=GROUND-ftr.y;
    g.fillStyle=INK==='#1A1A1A'?'rgba(0,0,0,.08)':'rgba(255,255,255,.08)';
    g.beginPath();g.ellipse(ftr.x,GROUND+4,Math.max(12,30-alt*0.07),5,0,0,7);g.fill();
  }

  const nk=[hip[0]+Math.sin(p.lean)*26*f,hip[1]-Math.cos(p.lean)*26];
  const w1=c.lw+0.6,w2=c.lw-0.2;

  // bacaklar + ayakkabılar
  for(const[leg,side]of[[p.lL,1],[p.lR,-1]]){
    const kn=seg(hip[0],hip[1],leg[0],22);
    const ft=seg(kn[0],kn[1],leg[0]-leg[1]*side,20);
    tstroke(g,[hip,kn,ft],w1,w2);
    // ayakkabı
    g.fillStyle=PAPER;g.strokeStyle=INK;g.lineWidth=1.5;
    const fx=ft[0],fy=ft[1];
    g.beginPath();
    g.moveTo(fx-f*7,fy+5);
    g.quadraticCurveTo(fx-f*8,fy-3,fx-f*1,fy-3.5);
    g.quadraticCurveTo(fx+f*8,fy-4,fx+f*12,fy+1);
    g.quadraticCurveTo(fx+f*13.5,fy+5,fx+f*9,fy+5.5);
    g.closePath();g.fill();g.stroke();
    g.lineWidth=1;
    g.beginPath();g.moveTo(fx-f*7,fy+3.4);g.lineTo(fx+f*12,fy+3);g.stroke();
  }
  // gövde
  tstroke(g,[hip,[lerp(hip[0],nk[0],.5)-f,lerp(hip[1],nk[1],.5)],nk],w1+0.4,w2+0.4);

  // kollar + eller
  const fist=(ftr.state==='attack'&&ftr.mv&&ftr.mv.anim!=='palm'&&ftr.mv.anim!=='shuto')||(ftr.state==='special'&&ftr.ch.id!=='volt');
  for(const[arm,side]of[[p.aL,1],[p.aR,-1]]){
    const el=seg(nk[0],nk[1],arm[0],18);
    const hn=seg(el[0],el[1],arm[0]+arm[1]*side,17);
    tstroke(g,[[nk[0],nk[1]],el,hn],w1,w2-0.3);
    drawToonHand(g,hn[0],hn[1],Math.atan2(hn[1]-el[1],(hn[0]-el[0])),fist?'fist':'open',c.lw);
  }

  // hız yayları (whoosh)
  if(ftr.state==='attack'&&ftr.mv){
    const mv=ftr.mv;
    if(ftr.st>mv.t0-0.05&&ftr.st<mv.t1+0.2){
      g.save();g.globalAlpha=.28;g.strokeStyle=INK;g.lineWidth=2;g.lineCap='round';
      const cy=ftr.mvKind==='k'?hip[1]-4:nk[1]+6;
      for(let i=0;i<3;i++){
        g.beginPath();
        if(f===1)g.arc(nk[0],cy,28+i*8,-0.85,0.55);
        else g.arc(nk[0],cy,28+i*8,Math.PI-0.55,Math.PI+0.85);
        g.stroke();
      }
      g.restore();
    }
  }
  // volt çıtırtısı
  if(ftr.state==='special'&&ftr.ch.id==='volt'){
    for(let i=0;i<2;i++)drawMiniBolt(g,ftr.x+rnd(-28,28),ftr.y-rnd(24,112));
  }

  // koca kafa + yüz
  const R=22;
  const hd=[nk[0]+Math.sin(p.lean+p.head)*(R-2)*f,nk[1]-Math.cos(p.lean+p.head)*(R-2)];
  drawHead(g,ftr,hd[0],hd[1],R,f);

  // skil efektleri
  if(ftr.state==='special'&&ftr.ch.id==='volt'&&ftr.fx.boltT>0)drawBolt(g,ftr.fx.boltX,0,ftr.fx.boltX+rnd(-8,8),GROUND);
  if(ftr.state==='special'&&ftr.ch.id==='golge'){
    g.globalAlpha=.15;g.strokeStyle=INK;g.lineWidth=34;g.lineCap='round';
    g.beginPath();g.moveTo(ftr.fx.sx,hipY-10);g.lineTo(ftr.x,hipY-10);g.stroke();
    g.globalAlpha=1;
  }
  g.restore();
}

function drawHead(g,ftr,x,y,R,f){
  const c=ftr.ch,s=ftr.state;
  const expr=s==='ko'?'ko':(s==='hit'||s==='stagger'||s==='crumple'||s==='down'||s==='thrown')?'hit'
    :(s==='attack'||s==='special'||s==='throwing')?'angry'
    :(s==='block'||s==='crouchblock'||s==='getup')?'focus':'idle';
  const k=R/30;
  g.save();g.translate(x,y);g.scale(f*k,k);
  // vuruş yiyince kafa yamulur
  if(expr==='hit'){const sq=1+Math.sin(ftr.st*40)*.06;g.scale(1/sq,sq);}
  g.fillStyle=PAPER;g.strokeStyle=INK;g.lineWidth=1.8/k;
  g.beginPath();g.arc(0,0,30,0,7);g.fill();g.stroke();
  // kulaklar
  g.beginPath();g.arc(-30,3,5.5,Math.PI*0.35,Math.PI*1.65);g.fill();g.stroke();
  g.beginPath();g.arc(30,3,5.5,Math.PI*1.35,Math.PI*0.65);g.fill();g.stroke();
  g.lineWidth=1/k;
  g.beginPath();g.arc(-30.5,3,2.4,Math.PI*0.5,Math.PI*1.5);g.stroke();
  g.beginPath();g.arc(30.5,3,2.4,Math.PI*1.5,Math.PI*0.5);g.stroke();
  // saç
  g.fillStyle=INK;g.strokeStyle=INK;g.lineWidth=1.6/k;
  if(c.hair==='long'){
    g.beginPath();
    g.arc(0,-3,32.5,Math.PI*0.98,Math.PI*2.02);
    g.quadraticCurveTo(-43,12,-29,25);
    g.quadraticCurveTo(-26,2,-22,-13);
    g.quadraticCurveTo(0,-18.5,22,-13);
    g.quadraticCurveTo(26,-6,28,4);
    g.closePath();g.fill();
    for(const[px,pl]of[[-12,9],[-2,11],[9,8]]){
      g.beginPath();
      g.moveTo(px-4,-18);
      g.quadraticCurveTo(px+1,-10,px,-18+pl);
      g.quadraticCurveTo(px+4,-15,px+5,-18.5);
      g.closePath();g.fill();
    }
  }
  if(c.hair==='flat'){
    g.beginPath();
    g.moveTo(-23,-16.5);
    g.lineTo(-23,-37);g.lineTo(23,-37);g.lineTo(23,-16.5);
    g.quadraticCurveTo(0,-23.4,-23,-16.5);
    g.closePath();g.fill();
    g.lineWidth=1/k;g.strokeStyle=PAPER;
    g.beginPath();g.moveTo(-21,-18);g.lineTo(-21,-35);g.stroke();
    g.beginPath();g.moveTo(21,-18);g.lineTo(21,-35);g.stroke();
    g.strokeStyle=INK;
  }
  if(c.hair==='spiky'){
    for(let i=-2;i<=2;i++){
      const a=-Math.PI/2+i*.4;
      const bx=Math.cos(a)*28,by=Math.sin(a)*28;
      const tx=Math.cos(a)*48+3,ty=Math.sin(a)*48;
      g.beginPath();g.moveTo(bx-6,by+2);g.lineTo(tx,ty);g.lineTo(bx+6,by+2);g.closePath();g.fill();
    }
  }
  // gözler
  const blink=(expr==='idle'&&Math.sin(performance.now()/770+ftr.x)>0.97)?0.12:1;
  for(const ox of[-9,9]){
    g.save();g.translate(ox+2,-2);
    if(expr==='ko'){
      g.strokeStyle=INK;g.lineWidth=2.2/k;
      g.beginPath();g.moveTo(-4,-4);g.lineTo(4,4);g.moveTo(4,-4);g.lineTo(-4,4);g.stroke();
    }else if(expr==='hit'){
      g.strokeStyle=INK;g.lineWidth=2/k;
      g.beginPath();g.moveTo(-4.5,0);g.lineTo(4.5,0);g.stroke();
    }else{
      g.scale(1,expr==='angry'?0.85:blink);
      g.fillStyle=PAPER;g.strokeStyle=INK;g.lineWidth=1.5/k;
      g.beginPath();g.ellipse(0,0,7,9,0,0,7);g.fill();g.stroke();
      if(blink===1){
        g.fillStyle=INK;
        g.beginPath();g.arc(2.5,1,expr==='angry'?3.5:3,0,7);g.fill();
        g.fillStyle=PAPER;
        g.beginPath();g.arc(3.4,-.2,1,0,7);g.fill();
      }
    }
    g.restore();
  }
  // kaşlar
  g.strokeStyle=INK;g.lineWidth=2.6/k;g.lineCap='round';
  if(expr==='angry'||expr==='focus'){
    g.beginPath();g.moveTo(-16,-16);g.lineTo(-3,-10);g.stroke();
    g.beginPath();g.moveTo(16,-16);g.lineTo(3,-10);g.stroke();
  }else if(expr==='hit'){
    g.beginPath();g.moveTo(-15,-11);g.lineTo(-4,-15);g.stroke();
    g.beginPath();g.moveTo(15,-11);g.lineTo(4,-15);g.stroke();
  }else if(expr!=='ko'){
    if(c.mood==='frown'){
      g.beginPath();g.moveTo(-16,-15);g.lineTo(-4,-11);g.stroke();
      g.beginPath();g.moveTo(16,-15);g.lineTo(4,-11);g.stroke();
    }else if(c.mood==='smirk'){
      g.beginPath();g.moveTo(-16,-13);g.lineTo(-5,-14);g.stroke();
      g.beginPath();g.moveTo(5,-16);g.lineTo(16,-13.5);g.stroke();
    }else{
      g.beginPath();g.moveTo(-16,-13.5);g.lineTo(-4,-15);g.stroke();
      g.beginPath();g.moveTo(4,-15);g.lineTo(16,-13.5);g.stroke();
    }
  }
  // burun
  g.strokeStyle=INK;g.lineWidth=1.5/k;
  g.beginPath();g.ellipse(4,7,5,4,0,Math.PI*1.6,Math.PI*1.1);g.stroke();
  // ağız
  g.lineWidth=1.8/k;
  if(expr==='hit'||expr==='ko'){
    g.fillStyle=PAPER;
    g.beginPath();g.ellipse(1,20,expr==='ko'?4:6,expr==='ko'?5:7.5,0,0,7);g.fill();g.stroke();
  }else if(expr==='angry'){
    g.fillStyle=PAPER;
    g.beginPath();g.moveTo(-10,16);g.lineTo(12,15);g.lineTo(10,21);g.lineTo(-8,21.5);g.closePath();g.fill();g.stroke();
    g.lineWidth=1/k;
    g.beginPath();g.moveTo(-3,15.7);g.lineTo(-3,21.2);g.moveTo(4,15.5);g.lineTo(4,21);g.stroke();
  }else if(c.mood==='grin'){
    g.fillStyle=PAPER;g.beginPath();
    g.moveTo(-12,14);g.quadraticCurveTo(2,27,16,13);
    g.quadraticCurveTo(4,19,-12,14);g.closePath();g.fill();g.stroke();
    g.lineWidth=1.1/k;
    g.beginPath();g.moveTo(-4,16.2);g.lineTo(-3.4,20);g.moveTo(4,16.6);g.lineTo(4.4,19.8);g.stroke();
  }else if(c.mood==='frown'){
    g.beginPath();g.arc(2,25,9,Math.PI*1.15,Math.PI*1.85);g.stroke();
    g.lineWidth=1.1/k;g.beginPath();g.moveTo(-5,28);g.lineTo(9,28);g.stroke();
  }else{
    g.beginPath();g.moveTo(-8,17);g.quadraticCurveTo(4,22,14,13);g.stroke();
    g.lineWidth=1.1/k;g.beginPath();g.moveTo(14,13);g.lineTo(12,16.5);g.stroke();
  }
  g.restore();
}
