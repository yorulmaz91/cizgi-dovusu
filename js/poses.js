/* ============================================================
   POZLAR — her durum/hamle için iskelet açıları
   (f = dövüşçü nesnesi; dönen P nesnesi render.js'te çizilir)
   ============================================================ */
import {lerp} from './utils.js';

export function computePose(f){
  const P={lean:0,head:0,aL:[.5,.35],aR:[-.4,.4],lL:[.15,.1],lR:[-.15,.15],dip:0};
  const t=f.st,s=f.state;
  if(s==='idle'){const b=Math.sin(t*3)*.05;P.aL=[.5+b,.4];P.aR=[-.45-b,.45];P.dip=Math.sin(t*3)*1.5;}
  if(s==='walk'){
    const w=Math.sin(f.walkPhase);
    P.lL=[w*.55,.3+Math.max(0,-w)*.5];P.lR=[-w*.55,.3+Math.max(0,w)*.5];
    P.aL=[-w*.5+.2,.4];P.aR=[w*.5-.2,.4];P.dip=Math.abs(w)*2;
  }
  if(s==='attack'){
    const mv=f.mv, tt=Math.min(1,t/mv.dur);
    const k=Math.sin(tt*Math.PI);
    switch(mv.anim){
      case 'jab':
        P.lean=.12*k;P.aR=[lerp(-.4,1.3,k),lerp(.4,.05,k)];P.aL=[.7,1.0];
        P.lL=[.3,.15];P.lR=[-.25,.3];break;
      case 'cross':
        P.lean=.25*k;P.aR=[lerp(-.5,1.45,k),lerp(.5,.05,k)];P.aL=[.9,1.1];
        P.lL=[.4,.15];P.lR=[-.3,.35];P.dip=2*k;break;
      case 'backfist':
        P.lean=.3*k;P.head=.25*k;
        P.aR=[lerp(-2.2,1.7,k),.15];P.aL=[lerp(.8,-1,k),.5];
        P.lL=[.5,.2];P.lR=[-.5,.4];P.dip=-2*k;break;
      case 'hook':
        P.lean=.3*k;P.aR=[lerp(-1.6,1.2,k),lerp(.9,.35,k)];P.aL=[.8,1.2];
        P.lL=[.35,.2];P.lR=[-.3,.3];P.dip=3*k;break;
      case 'hay':{
        const wind=Math.min(1,tt/.45), swing=Math.max(0,(tt-.45)/.55);
        P.aR=swing>0?[lerp(-2.4,1.5,swing),.1]:[lerp(-.4,-2.4,wind),.2];
        P.lean=lerp(-.18,.42,swing);P.aL=[.7,.9];
        P.lL=[.45,.25];P.lR=[-.4,.4];P.dip=5*swing;break;}
      case 'palm':
        P.lean=.15*k;P.head=.1*k;
        P.aR=[lerp(-.3,1.25,k),lerp(.6,.15,k)];P.aL=[.8,1.1];
        P.lL=[.3,.15];P.lR=[-.25,.3];break;
      case 'front':
        P.lean=-.22*k;P.lR=[lerp(-.15,1.5,k),lerp(.15,.08,k)];
        P.lL=[.1,.25];P.aL=[.9,.5];P.aR=[-.9,.5];P.dip=-4*k;break;
      case 'side':
        P.lean=-.35*k;P.lR=[lerp(-.15,1.35,k),lerp(.15,.05,k)];
        P.lL=[.15,.3];P.aL=[1.1,.6];P.aR=[-1.1,.6];P.dip=-2*k;break;
      case 'round':
        P.lean=-.4*k;P.head=-.15*k;
        P.lR=[lerp(-.3,1.9,k),.08];P.lL=[.2,.35];
        P.aL=[lerp(.9,-.6,k),.5];P.aR=[lerp(-.9,.6,k),.5];P.dip=-6*k;break;
      case 'axe':{
        const up=Math.min(1,tt/.5), down=Math.max(0,(tt-.5)/.5);
        P.lR=down>0?[lerp(2.3,.9,down),.05]:[lerp(-.15,2.3,up),.05];
        P.lean=down>0?.15:-.2;P.lL=[.15,.3];
        P.aL=[1.0,.6];P.aR=[-1.0,.6];P.dip=down*5;break;}
      case 'sweep':
        P.dip=10*k;P.lean=.2*k;
        P.lL=[.6,.9];P.lR=[lerp(-.2,1.25,k),.05];
        P.aL=[1.1,.9];P.aR=[.4,1.1];break;
      case 'knee':
        P.lean=.15*k;P.lR=[lerp(-.15,1.0,k),lerp(.15,1.3,k)];
        P.lL=[.2,.2];P.aL=[1.2,.6];P.aR=[1.0,.7];P.dip=2*k;break;
      case 'shoulder':
        P.lean=.55*k;P.head=.2*k;
        P.aL=[.9,1.6];P.aR=[.8,1.7];
        P.lL=[.55,.3];P.lR=[-.55,.4];P.dip=3*k;break;
      case 'upper':{
        const rise=Math.min(1,tt/((mv.t1)/mv.dur));
        P.dip=lerp(14,-5,rise);P.lean=lerp(.15,-.1,rise);P.head=-.15*rise;
        P.aR=[lerp(.3,2.35,rise),lerp(1.2,.15,rise)];P.aL=[.9,1.1];
        P.lL=[lerp(.8,.3,rise),lerp(1.1,.2,rise)];P.lR=[lerp(-.6,-.2,rise),lerp(1.2,.3,rise)];break;}
      case 'lowkick':
        P.dip=18;P.lean=.15;
        P.lL=[.7,1.3];P.lR=[lerp(-.2,1.35,k),.06];
        P.aL=[1.0,1.0];P.aR=[.5,1.2];break;
      case 'flykick':
        P.lean=-.3;P.head=-.1;
        P.lR=[lerp(.4,1.55,Math.min(1,tt*2.2)),.05];P.lL=[-.4,1.4];
        P.aL=[1.3,.4];P.aR=[-1.2,.5];break;
      case 'airpunch':
        P.lean=.2*k;
        P.aR=[lerp(-.3,1.4,k),lerp(.5,.1,k)];P.aL=[.9,1.2];
        P.lL=[.5,1.1];P.lR=[-.4,1.2];break;
    }
  }
  if(s==='jump'){
    const rising=f.vy<0;
    P.lL=[.6,rising?1.1:.5];P.lR=[-.5,rising?1.2:.6];
    P.aL=[rising?1.6:.9,.4];P.aR=[rising?-1.5:-.8,.5];
    P.head=-.08;
  }
  if(s==='crouch'){
    P.dip=22;P.lean=.12;P.head=-.05;
    P.lL=[.85,1.5];P.lR=[-.75,1.55];
    P.aL=[.9,1.4];P.aR=[.6,1.5];
  }
  if(s==='block'){P.lean=.08;P.aL=[.9,1.5];P.aR=[.7,1.7];P.lL=[.3,.2];P.lR=[-.25,.3];}
  if(s==='crouchblock'){ // çömelik blok: çömelme + önde koruma kolları
    P.dip=22;P.lean=.1;P.head=-.05;
    P.lL=[.85,1.5];P.lR=[-.75,1.55];
    P.aL=[.95,1.55];P.aR=[.75,1.7];
  }
  if(s==='hit'){const k=1-Math.min(1,t/.3);P.lean=-.3*k;P.head=-.45*k;P.aL=[.2,.8];P.aR=[-.6,.8];P.dip=4*k;}
  if(s==='stagger'){ // geriye sendeleme: kollar savrulur, ayaklar karışır
    const k=Math.min(1,t/.45), w=Math.sin(t*16);
    P.lean=-.38*(1-k*.4);P.head=-.3*(1-k);
    P.aL=[.9-w*.3,.5];P.aR=[-1.1+w*.3,.4];
    P.lL=[w*.45-.1,.35];P.lR=[-w*.45-.1,.4];
    P.dip=3+Math.abs(w)*2;
  }
  if(s==='crumple'){ // dizler çözülür, öne çöker
    const k=Math.min(1,t/.55);
    P.dip=8+k*30;P.lean=.15+k*.35;P.head=.2+k*.4;
    P.lL=[.7+k*.5,1.3+k*.4];P.lR=[-.6-k*.4,1.4+k*.4];
    P.aL=[.6-k*.4,.2+.7*(1-k)];P.aR=[-.5+k*.2,.2+.6*(1-k)];
  }
  if(s==='down'){ // sırtüstü yerde
    P.dip=46;P.lean=f.facing*-1.5;P.head=.7;
    P.aL=[1.3,.25];P.aR=[-1.4,.2];P.lL=[1.1,.35];P.lR=[-1.0,.25];
  }
  if(s==='getup'){ // yerden doğrulma (bu sırada dokunulmaz)
    const k=1-Math.min(1,t/.4);
    P.dip=10+36*k;P.lean=f.facing*-1.5*k+.15*(1-k);P.head=.5*k;
    P.lL=[.8,.3+1.2*k];P.lR=[-.7,.35+1.2*k];
    P.aL=[1.0,.3+1.0*k];P.aR=[.5,.3+1.1*k];
  }
  if(s==='special'){
    const k=Math.sin(Math.min(1,t/f.specDur())*Math.PI);
    if(f.ch.id==='golge'){P.lean=.5;P.aR=[1.4,.1];P.aL=[-.8,.5];P.lL=[.9,.3];P.lR=[-.7,.6];}
    if(f.ch.id==='beton'){P.lean=.35*k;P.aR=[lerp(-2.4,1.1,Math.min(1,t/.45)),.15];P.aL=[.6,.7];P.dip=6*k;P.lL=[.5,.4];P.lR=[-.4,.5];}
    if(f.ch.id==='volt'){P.aL=[2.6,.1];P.aR=[2.6,.1];P.head=.15;P.dip=-3;}
  }
  if(s==='throwing'){ // rakibi kavrayıp savurma
    const k=Math.min(1,t/.25);
    P.lean=.3*k;P.aL=[1.2,.3];P.aR=[1.0,.4]; // iki el önde kavrama
    P.lL=[.4,.2];P.lR=[-.35,.3];P.dip=4*k;
    if(f.ch.id==='beton'&&t>.35){P.lean=-.25;P.dip=-3;P.aL=[1.9,.2];P.aR=[1.6,.3];} // kaldırma
    if(f.ch.id==='golge'&&t>.3){P.lean=-.3;P.head=-.2;P.aL=[2.0,.2];P.aR=[-1.5,.4];} // savurma
    if(f.ch.id==='volt'&&t>.3){P.aL=[1.3,.25];P.aR=[1.1,.35];P.head=.1;} // tutup şok
  }
  if(s==='thrown'){ // kavranmış: geriye kaykılır, kollar çırpınır
    const w=Math.sin(t*14);
    P.lean=-.2;P.head=-.3;
    P.aL=[1.5+w*.2,.4];P.aR=[-1.2-w*.2,.5];
    P.lL=[.3,.5];P.lR=[-.3,.6];P.dip=6;
  }
  if(s==='ko'){P.dip=44;P.lean=f.facing*-1.4;P.head=.8;P.aL=[1.4,.2];P.aR=[-1.5,.2];P.lL=[1.2,.3];P.lR=[-1.1,.2];}
  return P;
}
