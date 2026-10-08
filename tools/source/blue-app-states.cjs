// COPIED VERBATIM from claude-brain/design-work/mascot/v2/blue-app-states.js (2026-10-08).
// Only this header was added. Do not edit; tools/import-generator.mjs reads it to build spec/states.json.
// Do not run it directly: as a main module it writes into ../blue-app-states.
// Buddy app states (2026-10-08): the cute WOW Buddy (posters 02, 04, 08, 09 in "Buddy blue wow": small rounder
// sky #009CC7 tile, big navy oval eyes, tiny mouth, small tucked feet) in the moods and situations the
// platform uses. Proportions are locked (BODY below) and reused in every state. Platform props from the
// posters where they fit: volunteer badge, spotlight with the logo-tile pool, Sunday in the week grid, page
// fold. Flat, brand palette only. No hearts, blush, sparkles, tongues, tears or decorations.
// Never for billing, payment or paywall screens, grief or prayer requests, or live worship and Live Mode.
// node blue-app-states.js -> ../blue-app-states/svg (cards), ../blue-app-states/art (transparent 240 x 240),
// ../blue-app-states/sheet.svg, sheet-unlabelled.svg (blind check) and blue-app-states.figma.js.
const NAVY='#00275C',SKY='#009CC7',AMBER='#DB9C21',PALE='#A4D4E3',DEEP='#00588C',WHITE='#FFFFFF',CARD='#F4F4F2',MUTED='#7A7F87',INK='#3A3F47';
const ARCH='M8.312 0.001C9.968-0.010 11.373 0.375 12.538 1.166C13.700 1.952 14.579 3.035 15.180 4.417C15.776 5.799 16.075 7.380 16.075 9.167C16.075 9.253 16.075 9.338 16.071 9.424C15.055 9.424 14.040 9.424 13.025 9.424C12.114 9.424 11.355 8.768 11.188 7.879C11.144 7.648 11.073 7.404 10.965 7.158C10.826 6.842 10.591 6.338 10.031 5.951C9.631 5.674 9.152 5.534 8.614 5.534C8.010 5.534 7.527 5.717 7.170 6.074C6.816 6.432 6.476 6.982 6.161 7.721L6.155 7.736C5.714 8.759 4.700 9.423 3.579 9.423L0 9.423C0.184 9.045 0.377 8.632 0.580 8.180C1.032 7.156 1.447 6.155 1.833 5.182C2.217 4.205 2.664 3.333 3.163 2.554C3.669 1.779 4.325 1.161 5.133 0.697C5.949 0.230 7.009 0 8.312 0Z';
const BOWL='M5.337 2.286L4.570 1.041C4.172 0.394 3.464 0 2.700 0L0 0C0.004 1.713 0.275 3.208 0.816 4.497C1.362 5.794 2.171 6.806 3.242 7.530C4.313 8.250 5.632 8.613 7.193 8.613C8.677 8.613 9.917 8.290 10.918 7.643C12.052 6.911 12.684 6.111 13.484 4.972C14.225 3.918 15.214 2.270 15.953 0L12.015 0C11.089 0 10.243 0.520 9.830 1.343L9.822 1.359C9.623 1.755 9.311 2.317 8.653 2.761C8.237 3.041 7.722 3.185 7.107 3.185C6.298 3.185 5.710 2.885 5.337 2.285Z';
const f=v=>+(+v).toFixed(2);
const tf=(d,w,h,s,cx,cy)=>{let i=0;return d.replace(/-?\d*\.?\d+/g,n=>{const v=+n,k=i++%2;return ' '+(k===0?f(cx+(v-w/2)*s):f(cy+(v-h/2)*s));}).replace(/([A-Z]) /g,'$1');};
const tileD=(w,h,r,rs)=>`M${rs} 0H${w-r}A${r} ${r} 0 0 1 ${w} ${r}V${h-rs}A${rs} ${rs} 0 0 1 ${w-rs} ${h}H${r}A${r} ${r} 0 0 1 0 ${h-r}V${rs}A${rs} ${rs} 0 0 1 ${rs} 0Z`;
const rr=(x,y,w,h,rx,c,t='')=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${c}"${t?` transform="${t}"`:''}/>`;
const sk=(d,w,c)=>`<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const circ=(x,y,r,c)=>`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
const g=(t,inner)=>`<g transform="${t}">${inner}</g>`;

// ---------- the locked character (body units) ----------
const BODY={w:64,h:54,r:24,rs:7,ex:13,ey:25,erx:5.2,ery:7,mx:32,my:38};
function eye(t,x,y){const rx=BODY.erx,ry=BODY.ery;switch(t){
 case 'oval':return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="${NAVY}"/>`;
 case 'big':return `<ellipse cx="${f(x)}" cy="${f(y-1)}" rx="${f(rx*1.12)}" ry="${f(ry*1.22)}" fill="${NAVY}"/>`;
 case 'lid':{const y0=y-ry*0.1;return `<path d="M${f(x-rx)} ${f(y0)}A${rx} ${ry} 0 0 0 ${f(x+rx)} ${f(y0)}Z" fill="${NAVY}"/>`;}
 case 'arc':return sk(`M${f(x-5.5)} ${f(y+2.4)}Q${f(x)} ${f(y-5)} ${f(x+5.5)} ${f(y+2.4)}`,3.8,NAVY);
 case 'cup':return sk(`M${f(x-5.5)} ${f(y-1.6)}Q${f(x)} ${f(y+4.6)} ${f(x+5.5)} ${f(y-1.6)}`,3.8,NAVY);
 case 'line':return sk(`M${f(x-5.5)} ${f(y+1)}H${f(x+5.5)}`,3.8,NAVY);
 case 'small':return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.4" ry="4.6" fill="${NAVY}"/>`;
 case 'slantL':case 'slantR':{const y0=y-ry*0.1;return `<path transform="rotate(${t==='slantL'?14:-14} ${f(x)} ${f(y)})" d="M${f(x-rx)} ${f(y0)}A${rx} ${ry} 0 0 0 ${f(x+rx)} ${f(y0)}Z" fill="${NAVY}"/>`;}
 case 'none':return '';}
 return '';}
function mouth(t,x,y,w){switch(t){
 case 'line':return sk(`M${f(x-w/2)} ${y}H${f(x+w/2)}`,3.4,NAVY);
 case 'curve':return sk(`M${f(x-w/2)} ${f(y-1)}Q${f(x)} ${f(y+3.2)} ${f(x+w/2)} ${f(y-1)}`,3.4,NAVY);
 case 'big':return sk(`M${f(x-w/2)} ${f(y-1.6)}Q${f(x)} ${f(y+4.6)} ${f(x+w/2)} ${f(y-1.6)}`,3.4,NAVY);
 case 'soft':return sk(`M${f(x-w/2)} ${f(y+1)}Q${f(x)} ${f(y-1.6)} ${f(x+w/2)} ${f(y+1)}`,3.2,NAVY);
 case 'o':return `<circle cx="${f(x)}" cy="${f(y+0.6)}" r="2.8" stroke="${NAVY}" stroke-width="3" fill="none"/>`;
 case 'smirk':return sk(`M${f(x-w/2)} ${y}Q${f(x+w/4)} ${f(y+2.4)} ${f(x+w/2)} ${f(y-2)}`,3.2,NAVY);
 case 'D':return `<path d="M${f(x-w/2)} ${f(y-2)}H${f(x+w/2)}A${f(w/2)} ${f(w/2)} 0 0 1 ${f(x-w/2)} ${f(y-2)}Z" fill="${NAVY}"/>`;
 case 'wavy':return sk(`M${f(x-w/2)} ${f(y)}q${f(w/6)} -2.4 ${f(w/3)} 0t${f(w/3)} 0t${f(w/3)} 0`,3,NAVY);
 case 'none':return '';}
 return '';}
// ---------- palette (the brand blue body, one accent) ----------
const T4='#DCECF1';
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.substr(i,2),16)*(1-t)+parseInt(b.substr(i,2),16)*t).toString(16).padStart(2,'0')).join('').toUpperCase();
const accent=(acc,onAcc=NAVY)=>({acc,accLight:mix(acc,'#FFFFFF',0.45),accDark:mix(acc,NAVY,0.28),onAcc});
const ACCENTS={coral:accent('#F28B7D'),peach:accent('#F6B89A'),butter:accent('#F4D06F'),lilac:accent('#B9A6E8'),mint:accent('#8FD6B5'),
 navy:{acc:NAVY,accLight:'#00588C',accDark:'#001A40',onAcc:WHITE},amber:accent(AMBER)};
// body #A4D4E3 (brand blue), lighter brand tint for empty or missing things, deep blue for filled cells
const BASE={body:PALE,feet:PALE,light:'#CBE6EE',deep:DEEP,shadow:'#7FBFD3'};
const PICK='coral';  // picked on the accent test board: warm counterpoint to the blues, holds on white and navy, clearly not orange
let C={};const setPalette=(over={})=>{C={...BASE,...ACCENTS[PICK],...over};return C;};setPalette();
// arms: side | up | out | shrug | none, per side
function arm(t,side,w,h){const L=side<0;switch(t){
 case 'side':return rr(L?-6:w-5,h*0.52,11,9,4.5,(C.arm||C.body));
 case 'up':return L?rr(-2,h*0.08,9,22,4.5,(C.arm||C.body),`rotate(-28 2.5 ${f(h*0.08+20)})`):rr(w-7,h*0.08,9,22,4.5,(C.arm||C.body),`rotate(28 ${f(w-2.5)} ${f(h*0.08+20)})`);
 case 'out':return L?rr(-17,h*0.5,21,9,4.5,(C.arm||C.body)):rr(w-4,h*0.5,21,9,4.5,(C.arm||C.body));
 case 'shrug':return L?rr(-4,h*0.22,9,20,4.5,(C.arm||C.body),`rotate(-58 0.5 ${f(h*0.22+18)})`):rr(w-5,h*0.22,9,20,4.5,(C.arm||C.body),`rotate(58 ${f(w-0.5)} ${f(h*0.22+18)})`);}
 return '';}
// o: {eyes:[L,R]|type, edx, edy, mouth, mw, mdx, mdy, armL, armR, tilt, sx, sy, lift:{L,R}, fold, clip}
const armAt=(bx,by,ang,len)=>rr(bx-4.5,by-len,9,len+4.5,4.5,(C.arm||C.body),`rotate(${ang} ${f(bx)} ${f(by)})`);
function bud(o={}){const {w,h,r,rs,ex,ey,mx,my}=BODY,cx=w/2,et=Array.isArray(o.eyes)?o.eyes:[o.eyes||'oval',o.eyes||'oval'];
 const L=(o.lift||{}).L||[0,0],R=(o.lift||{}).R||[0,0];
 let back=rr(cx-19,h-6+L[1],11,13,5.5,C.feet,L[0]?`rotate(${L[0]} ${f(cx-13.5)} ${f(h-4+L[1])})`:'')+rr(cx+8,h-6+R[1],11,13,5.5,C.feet,R[0]?`rotate(${R[0]} ${f(cx+13.5)} ${f(h-4+R[1])})`:'');
 back+=arm(o.armL||'none',-1,w,h)+arm(o.armR||'none',1,w,h);
 if(o.arms)for(const a of o.arms){const bx=a[0]==='L'?3:a[0]==='R'?w-3:a[0],by=h*a[1];back+=armAt(bx,by,a[2],a[3]);
  if(a[4]==='thumb'){const q=a[2]*Math.PI/180,tx=bx+a[3]*Math.sin(q),ty=by-a[3]*Math.cos(q);back+=rr(tx-4.5,ty-14,9,14,4.5,C.arm||C.body);}}
 let body=`<path d="${tileD(w,h,r,rs)}" fill="${C.body}"/>`;
 if(o.fold){const c=26;body=`<path d="M${rs} 0H${w-c}L${w} ${c}V${h-rs}A${rs} ${rs} 0 0 1 ${w-rs} ${h}H${r}A${r} ${r} 0 0 1 0 ${h-r}V${rs}A${rs} ${rs} 0 0 1 ${rs} 0Z" fill="${C.body}"/>`
  +`<path d="M${w-c} 0L${w} ${c}H${w-(c-r)}A${r} ${r} 0 0 0 ${w-c} ${c-r}Z" fill="${NAVY}"/>`;}
 const dx=o.edx||0,dy=o.edy||0;
 let face=eye(et[0],cx-ex+dx,ey+dy)+eye(et[1],cx+ex+dx,ey+dy)+mouth(o.mouth||'curve',mx+(o.mdx||0),my+(o.mdy||0),o.mw||7);
 if(o.clip)face+=rr(cx-7,-3,14,9,3.5,NAVY);
 const sx=o.sx||1,sy=o.sy||1;
 return `<g transform="rotate(${o.tilt||0} ${cx} ${h/2}) translate(${cx} ${h}) scale(${sx} ${sy}) translate(${-cx} ${-h})">${back}${body}${face}</g>`;}
// tile bottom centre at (cx, by), scale s (default 2.2 for a lone Buddy)
const put=(cx,by,s,o)=>(C.shadow&&!o.noShadow?`<ellipse cx="${f(cx)}" cy="${f(GY+6.5*s)}" rx="${f(27*s*(o.sx||1))}" ry="${f(3.4*s)}" fill="${C.shadow}"/>`:'')+g(`translate(${f(cx-BODY.w*s/2)} ${f(by-BODY.h*s)}) scale(${s})`,bud(o));
const S1=2.2,S2=1.75,GY=196;                       // lone scale, scale with a prop, ground line
const solo=o=>put(120,GY+(o&&o.up?-o.up:0),S1,o);

// ---------- props (canvas units) ----------
const logoS=(x,y,s,c)=>`<path d="${tf(ARCH,16.075,9.424,s,x+2.5*s,y-4.7*s)}" fill="${c}"/><path d="${tf(BOWL,15.953,8.613,s,x,y+5.5*s)}" fill="${c}"/>`;
const tick=(x,y,s,c=NAVY,w=8)=>sk(`M${f(x-10*s)} ${f(y)}L${f(x-3*s)} ${f(y+7*s)}L${f(x+10*s)} ${f(y-8*s)}`,w,c);
const calPage=(x,y,w,h,cells,mark)=>{let s=rr(x,y,w,h,10,C.acc)+`<path d="M${x} ${y+10}a10 10 0 0 1 10 -10h${w-20}a10 10 0 0 1 10 10v8h${-w}Z" fill="${NAVY}"/>`;
 const cw=(w-24)/3;for(let i=0;i<6;i++){const cx=x+8+(i%3)*(cw+4),cy=y+24+Math.floor(i/3)*(cw+4);s+=rr(cx,cy,cw,cw,3,cells==='empty'?C.accLight:NAVY);}
 if(mark==='plus')s+=sk(`M${x+w/2} ${y+h/2+2}v16M${x+w/2-8} ${y+h/2+10}h16`,5,NAVY);
 if(mark==='tick')s+=tick(x+w/2,y+h*0.62,1.2,NAVY,6);
 return s;};
const weekRow=(x,y,c,gap,colors)=>colors.map((col,i)=>rr(x+i*(c+gap),y,c,c,5,col)).join('');
const mug=(x,y)=>sk(`M${x+30} ${y+12}a10 10 0 0 1 0 20`,7,C.deep)+rr(x,y,32,38,7,C.deep)+logoS(x+15,y+19,1.05,C.acc);
const mic=(x,y,rot)=>g(`rotate(${rot} ${x} ${y})`,`<path d="M${x-7} ${y+8}H${x+7}L${x+3} ${y+48}Q${x} ${y+52} ${x-3} ${y+48}Z" fill="${NAVY}"/>`+circ(x,y,12,C.acc));
const bell=(x,y,c)=>`<path d="M${x-16} ${y+22}Q${x-14} ${y+20} ${x-13} ${y+4}A13 13 0 0 1 ${x+13} ${y+4}Q${x+14} ${y+20} ${x+16} ${y+22}Z" fill="${c}"/>`+circ(x,y+26,4.4,c)+circ(x,y-10,3.4,c);
const magnifier=(x,y,rot)=>g(`rotate(${rot} ${x} ${y})`,sk(`M${x} ${y+17}V${y+40}`,8,NAVY)+`<circle cx="${x}" cy="${y}" r="14" fill="${C.light}" stroke="${NAVY}" stroke-width="6"/>`);
const plane=(x,y)=>`<path d="M${x} ${y+14}L${x+44} ${y}L${x+26} ${y+34}L${x+20} ${y+20}Z" fill="${C.acc}"/><path d="M${x+20} ${y+20}L${x+44} ${y}L${x+16} ${y+30}Z" fill="${C.accDark}"/>`;
const bubble=(x,y,w,h,c,dots)=>rr(x,y,w,h,h/2.4,c)+`<path d="M${x+14} ${y+h-2}L${x+10} ${y+h+12}L${x+28} ${y+h-2}Z" fill="${c}"/>`+(dots?[0,1,2].map(i=>circ(x+w/2-12+i*12,y+h/2,3.8,NAVY)).join(''):'');
const plug=(x,y)=>sk(`M${x} ${y+16}C${x-40} ${y+16} ${x-26} ${y+56} ${x-64} ${y+52}`,5,NAVY)+rr(x,y,24,32,6,NAVY)+rr(x+24,y+6,12,5,2.5,NAVY)+rr(x+24,y+21,12,5,2.5,NAVY);
const socket=(x,y)=>rr(x,y,30,46,9,C.light)+rr(x+9,y+17,4,12,2,C.deep)+rr(x+17,y+17,4,12,2,C.deep);
const lock=(x,y)=>sk(`M${x+8} ${y+2}V${y-8}A14 14 0 0 1 ${x+36} ${y-8}V${y+2}`,7,NAVY)+rr(x,y,44,38,9,C.acc)+circ(x+22,y+15,4.4,C.onAcc)+rr(x+20,y+17,4,10,2,C.onAcc);
const clock=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.light}" stroke="${NAVY}" stroke-width="5"/>`+sk(`M${x} ${y-r*0.55}V${y}L${x+r*0.4} ${y+r*0.25}`,4,NAVY);
const Zz=(x,y,s)=>sk(`M${f(x)} ${f(y)}h${f(10*s)}l${f(-10*s)} ${f(12*s)}h${f(10*s)}`,f(3.2*s),NAVY);
const checkCard=(x,y,s)=>rr(x,y,56*s,56*s,13*s,C.acc)+tick(x+28*s,y+28*s,1.5*s,C.onAcc,7*s);
const lanyard=(cx,top)=>sk(`M${cx-34} -10L${cx-6} ${top}`,7,C.acc)+sk(`M${cx+34} -10L${cx+6} ${top}`,7,C.acc);
const spotlight=(cx)=>`<path d="M${cx-14} -6H${cx+14}L${cx+78} ${GY+4}H${cx-78}Z" fill="${C.light}"/>`+g(`translate(${cx} ${GY+7}) scale(1 0.3)`,`<path transform="translate(-86 -42)" d="${tileD(172,84,38,8)}" fill="${C.acc}"/>`);
const page=(x,y,rot,c=C.light)=>rr(x,y,40,30,6,c,`rotate(${rot} ${x+20} ${y+15})`);
const ghost=(cx,s,c=C.light,by=GY)=>g(`translate(${f(cx-BODY.w*s/2)} ${f(by-BODY.h*s)}) scale(${s})`,rr(13,48,11,13,5.5,c)+rr(40,48,11,13,5.5,c)+`<path d="${tileD(BODY.w,BODY.h,BODY.r,BODY.rs)}" fill="${c}"/>`);
const ghostNote=(x,y,s,c=C.light)=>g(`translate(${x} ${y}) scale(${s})`,`<path d="M14 0h9v60h-9Z" fill="${c}"/><path d="M23 0q4 20 24 28q-5 11 -2 24q-5 -22 -22 -25Z" fill="${c}"/><ellipse cx="7" cy="60" rx="15" ry="11" transform="rotate(-22 7 60)" fill="${c}"/>`);
const staff=(x,y,w)=>rr(x,y,w,74,10,C.acc)+[0,1,2,3].map(i=>rr(x+10,y+18+i*12,w-20,3.4,1.7,NAVY)).join('');

// ---------- states ----------
// [key, group, name, use it for, art]
const ST=[
 ['hello','Welcome','Hello','First open, sign-in, greetings',()=>solo({eyes:'arc',mouth:'big',mw:9,armR:'up',armL:'side',tilt:-6})],
 ['welcome-team','Welcome','Welcome to the team','Joined a team, invite accepted',()=>lanyard(120,GY-BODY.h*S1+2)+solo({eyes:'arc',mouth:'big',mw:9,clip:true,armL:'side',armR:'side'})],
 ['setup-event','Welcome','Set up your first event','Onboarding, create the first event',()=>put(78,GY,S2,{eyes:'oval',edx:3,mouth:'curve',armR:'out'})+calPage(150,96,70,82,'empty','plus')],
 ['all-set','Welcome','All set','End of onboarding, setup complete',()=>put(120,GY-26,S1,{eyes:'arc',mouth:'big',mw:10,armL:'up',armR:'up',sy:1.06,sx:0.95,lift:{L:[18,2],R:[-18,2]}})],
 ['no-events','Empty states','No events yet','Events list, no events yet',()=>put(66,GY,S2,{eyes:'oval',edx:4,mouth:'line',mw:6,armR:'out'})+[0,1,2].map(r=>weekRow(128,86+r*36,28,7,[C.light,C.light,C.light])).join('')],
 ['no-songs','Empty states','No songs yet','Song library, no songs yet',()=>put(88,GY,S2,{eyes:'lid',mouth:'line',mw:6,armL:'shrug',armR:'shrug'})+ghostNote(174,64,1.2)],
 ['no-team','Empty states','No team members yet','Team page, no members yet',()=>ghost(40,0.95)+ghost(200,0.95)+put(120,GY,1.55,{eyes:'oval',edx:-4,mouth:'line',mw:6})],
 ['no-notifications','Empty states','No notifications','Notifications, all caught up',()=>put(98,GY,S1,{eyes:'cup',mouth:'curve',mw:7,sy:0.94,sx:1.04,tilt:-4})+g(`translate(196 ${GY-40}) scale(1.6) translate(-196 ${-(GY-40)})`,bell(196,GY-40,C.light))],
 ['no-results','Empty states','No search results','Search with no results',()=>put(92,GY,2.0,{eyes:'oval',edx:-5,edy:-1,mouth:'line',mw:5})+g('translate(186 118) scale(1.35) translate(-186 -118)',magnifier(186,118,24))],
 ['no-sunday','Empty states','Nothing this Sunday','Schedule, nothing planned this Sunday',()=>weekRow(14,44,26,5,[C.deep,C.deep,C.deep,C.deep,C.deep,C.deep,C.light])+put(178,GY,1.5,{eyes:'oval',edx:3,edy:-5,mouth:'line',mw:5})],
 ['event-created','Success','Event created','After creating an event',()=>calPage(132,92,82,92,'empty','tick')+put(78,GY,S2,{eyes:'arc',mouth:'big',mw:9,armR:'side',armL:'up'})],
 ['saved','Success','Saved','Plan or song saved',()=>solo({fold:true,eyes:'cup',edx:-3,mouth:'curve',mw:7,mdx:-3})],
 ['invite-sent','Success','Invite sent','After sending invites',()=>put(84,GY,S2,{eyes:'arc',mouth:'curve',armR:'up',tilt:-4})+plane(156,62)],
 ['everyone-confirmed','Success','Everyone confirmed','All team members accepted',()=>[36,92,148,204].map((x,i)=>put(x,GY,0.82,{eyes:'arc',mouth:'curve',tilt:[-6,3,-3,6][i]})).join('')],
 ['plan-ready','Success','Plan ready for Sunday','Service plan complete, ready to go',()=>spotlight(120)+put(120,GY,1.9,{eyes:'arc',mouth:'big',mw:9,armL:'side',armR:'side'})],
 ['done','Success','Done','Task or checklist complete',()=>put(80,GY,S2,{eyes:'arc',mouth:'big',mw:9,armR:'side'})+checkCard(138,96,1.5)],
 ['rehearsal','Reminders and team','Rehearsal tomorrow','Rehearsal reminder',()=>put(82,GY,S2,{eyes:'oval',edx:3,mouth:'o',armR:'side'})+mic(178,104,14)+calPage(182,150,46,52,'empty')],
 ['scheduled','Reminders and team','You are scheduled','You have been added to a service',()=>rr(48,58,144,152,30,C.acc)+lanyard(120,GY-BODY.h*1.9+2)+put(120,GY,1.9,{eyes:'oval',mouth:'curve',clip:true,armL:'side',armR:'side'})],
 ['waiting','Reminders and team','Waiting for replies','Invites pending',()=>bubble(132,34,82,44,C.light,true)+put(96,GY,S2,{eyes:'oval',edx:4,edy:-4,mouth:'line',mw:5,lift:{R:[-24,-2]}})],
 ['declined','Reminders and team','Someone declined','A member declined, kindly',()=>g(`rotate(8 196 ${GY})`,ghost(196,1.05,C.light))+put(86,GY,S2,{eyes:'cup',mouth:'curve',armR:'up',tilt:-3})],
 ['unavailable','Reminders and team','On a break','Unavailable or blockout dates',()=>put(88,GY,S2,{eyes:'cup',mouth:'curve',sy:0.94,sx:1.04,armR:'side',tilt:-5})+mug(156,GY-38)],
 ['new-message','Reminders and team','New message','Chat, unread message',()=>bubble(116,28,96,52,C.acc,false)+rr(134,46,58,5,2.5,C.onAcc)+rr(134,58,38,5,2.5,C.onAcc)+put(96,GY,S2,{eyes:'big',edx:3,edy:-3,mouth:'o',sy:1.04})],
 ['offline','Problems','Offline','No connection, working offline',()=>put(76,GY,S2,{eyes:'oval',edx:4,edy:2,mouth:'line',mw:5})+plug(150,140)+socket(196,104)],
 ['oops','Problems','Something went wrong','Errors, calmly',()=>page(150,GY-30,-12)+page(178,GY-28,8,C.light)+page(162,GY-58,-4,C.acc)+put(86,GY,S2,{eyes:['line','oval'],mouth:'soft',mw:6,tilt:10,armL:'side',armR:'up'})],
 ['no-access','Problems','No access','Missing permission, ask an admin',()=>put(82,GY,S2,{eyes:'lid',mouth:'line',mw:6})+lock(152,128)],
 ['loading','Problems','Loading','Loading or syncing',()=>put(46,GY,1.0,{eyes:'oval',sx:1.12,sy:0.86})+put(120,GY-28,1.0,{eyes:'oval',sx:0.95,sy:1.07})+put(194,GY-56,1.0,{eyes:'oval'})],
 ['session-expired','Problems','Session expired','Signed out after a while, sign in again',()=>put(96,GY,S2,{eyes:'line',edy:2,mouth:'line',mw:5,sy:0.9,sx:1.06,tilt:-6})+Zz(140,70,1.2)+clock(192,GY-34,22)],
 ['happy','Moods','Happy','General positive moments',()=>solo({eyes:'arc',mouth:'big',mw:9})],
 ['thinking','Moods','Thinking','Suggestions, tips, processing',()=>solo({eyes:'oval',edx:-4,edy:-5,mouth:'line',mw:5,mdx:5,tilt:-4})],
 ['surprised','Moods','Surprised','Something new, what is new',()=>solo({eyes:'big',mouth:'o',sy:1.06,sx:0.96})],
 ['proud','Moods','Proud','Milestones, streaks',()=>solo({eyes:'cup',edy:-4,mouth:'curve',mdy:-2,sy:1.06,sx:0.96,tilt:-4})],
 ['sleepy','Moods','Sleepy','Quiet periods, late night',()=>solo({eyes:'line',edy:2,mouth:'line',mw:4,sy:0.88,sx:1.07,tilt:-6})+Zz(178,62,1.5)+Zz(204,40,1.05)],
 ['sure','Moods','Sure.','Deadpan confirmations, light humour',()=>solo({eyes:['big','lid'],mouth:'line',mw:7,mdx:2,tilt:5})],
];
// ---------- more props (canvas units) ----------
const L2=o=>put(80,GY,S2,o);                      // Buddy on the left, prop on the right
const lines=(x,y,w,n,gap,c=NAVY)=>Array.from({length:n},(_,i)=>rr(x,y+i*gap,i===n-1?w*0.6:w,4.4,2.2,c)).join('');
const book=()=>rr(70,162,100,44,8,C.acc)+rr(75,165,44,38,5,C.light)+rr(121,165,44,38,5,C.light)+lines(81,173,32,3,9)+lines(127,173,32,3,9);
const clipboard=(x,y)=>rr(x,y,66,86,9,C.deep)+rr(x+8,y+14,50,64,5,C.light)+rr(x+20,y-6,26,13,5,C.acc)+tick(x+20,y+30,0.55,NAVY,4)+rr(x+30,y+27,22,4.4,2.2,NAVY)+tick(x+20,y+48,0.55,NAVY,4)+rr(x+30,y+45,18,4.4,2.2,NAVY)+rr(x+16,y+62,30,4.4,2.2,NAVY);
const phone=(x,y)=>rr(x,y,30,52,7,NAVY)+rr(x+4,y+6,22,36,4,C.light)+rr(x+11,y+45,8,3,1.5,C.light);
const laptop=()=>rr(62,136,116,66,9,C.deep)+g('translate(120 168) scale(0.32)',`<path transform="translate(-32 -27)" d="${tileD(64,54,24,7)}" fill="${C.light}"/>`)+rr(48,200,144,9,4.5,NAVY);
const box=(x,y,w,h)=>rr(x,y,w,h,8,C.deep)+rr(x+w/2-8,y,16,h,0,C.acc);
const cone=(x,y)=>`<path d="M${x} ${y}L${x+56} ${y-26}V${y+38}L${x} ${y+16}Z" fill="${NAVY}"/>`+rr(x+52,y-26,8,64,4,C.deep);
const map=(x,y)=>`<path d="M${x} ${y+8}L${x+24} ${y}L${x+48} ${y+8}L${x+72} ${y}V${y+66}L${x+48} ${y+74}L${x+24} ${y+66}L${x} ${y+74}Z" fill="${C.light}"/>`+`<path d="M${x+24} ${y}V${y+66}M${x+48} ${y+8}V${y+74}" stroke="#B5D9E4" stroke-width="2"/>`+sk(`M${x+10} ${y+58}Q${x+30} ${y+30} ${x+50} ${y+44}`,3.6,NAVY)+circ(x+56,y+32,6,C.acc);
const wrench=(x,y)=>g(`rotate(40 ${x} ${y})`,rr(x-5,y,10,58,5,NAVY)+circ(x,y-4,14,NAVY)+rr(x-5,y-20,10,16,3,C.light));
const bulb=(x,y)=>circ(x,y,20,C.acc)+rr(x-10,y+17,20,12,4,NAVY)+rr(x-7,y+31,14,5,2.5,NAVY);
const screen=()=>rr(122,36,108,74,9,C.deep)+rr(128,42,96,62,5,C.light)+rr(136,50,52,8,4,C.acc)+lines(136,66,70,3,10)+rr(172,110,8,46,4,NAVY)+rr(156,152,40,7,3.5,NAVY);
const arrowHead=(x,y,ang,c)=>g(`rotate(${ang} ${x} ${y})`,`<path d="M${x} ${y-9}L${x+9} ${y+6}H${x-9}Z" fill="${c}"/>`);
const swapArt=()=>rr(130,58,46,46,11,C.acc)+rr(182,126,46,46,11,C.light)+sk('M186 80Q206 80 206 108',5,NAVY)+arrowHead(206,114,180,NAVY)+sk('M172 150Q152 150 152 122',5,NAVY)+arrowHead(152,116,0,NAVY);
const qr=(x,y)=>{const fq=(a,b)=>rr(a,b,18,18,4,NAVY)+rr(a+4,b+4,10,10,2,C.light)+rr(a+6.5,b+6.5,5,5,1,NAVY);
 return rr(x,y,72,72,11,C.light)+fq(x+8,y+8)+fq(x+46,y+8)+fq(x+8,y+46)+[[46,46],[56,56],[46,58],[34,22],[34,34],[22,34],[58,34]].map(([a,b])=>rr(x+a,y+b,7,7,1.5,NAVY)).join('');};
const chain=(x,y)=>`<rect x="${x}" y="${y}" width="44" height="26" rx="13" fill="none" stroke="${NAVY}" stroke-width="7" transform="rotate(-32 ${x+22} ${y+13})"/>`+`<rect x="${x+28}" y="${y-18}" width="44" height="26" rx="13" fill="none" stroke="${C.acc}" stroke-width="7" transform="rotate(-32 ${x+50} ${y-5})"/>`;
const giftBox=()=>g('translate(176 104) scale(0.45)',`<path transform="translate(-32 -27)" d="${tileD(64,54,24,7)}" fill="${C.light}"/>`)+rr(140,134,74,60,8,C.deep)+rr(132,108,90,18,6,C.acc,'rotate(-16 132 126)');
const tray=()=>`<path d="M140 160H156V178H204V160H220V196H140Z" fill="${C.deep}"/>`+sk('M180 168V102',10,C.acc)+arrowHead(180,92,0,C.acc);
const headphones=()=>sk('M50 128Q120 24 190 128',8,NAVY)+rr(36,108,24,42,11,NAVY)+rr(180,108,24,42,11,NAVY);
const guitar=()=>g('rotate(-32 120 176)',circ(98,180,25,C.acc)+circ(124,176,19,C.acc)+circ(108,178,7,NAVY)+rr(132,171,72,9,3,NAVY)+rr(200,166,16,19,4,NAVY));
const keys=()=>rr(36,170,168,40,7,C.light)+Array.from({length:6},(_,i)=>rr(60+i*24,170,10,22,2.5,NAVY)).join('')+rr(36,206,168,6,3,C.deep);
const drum=()=>rr(70,154,100,52,10,C.deep)+`<ellipse cx="120" cy="154" rx="50" ry="10" fill="${C.light}"/>`+rr(70,184,100,7,0,C.acc);
const desk=()=>rr(30,158,180,52,10,C.deep)+Array.from({length:6},(_,i)=>rr(46+i*26,168,4,32,2,NAVY)+rr(41+i*26,[176,186,170,182,178,190][i],14,8,3,i===2?C.acc:C.light)).join('');
const keyTile=(x,y)=>rr(x,y,64,86,15,C.acc)+`<path d="M${x+32} ${y+12}L${x+48} ${y+32}H${x+16}Z" fill="${NAVY}"/>`+rr(x+20,y+40,24,6,3,NAVY)+`<path d="M${x+32} ${y+74}L${x+48} ${y+54}H${x+16}Z" fill="${NAVY}"/>`;
const setSheet=()=>rr(132,30,92,168,11,C.light)+[0,1,2,3,4].map(i=>(i===2?rr(138,52+i*28,80,20,6,C.acc):'')+circ(148,62+i*28,4.4,NAVY)+rr(158,60+i*28,[52,40,48,36,44][i],4.4,2.2,NAVY)).join('');
const signBoard=()=>rr(118,30,104,64,11,C.acc)+rr(166,92,8,74,4,C.deep);

const ST2=[
 // More moods
 ['idle','More moods','Idle','Default resting state, any neutral screen',()=>solo({eyes:'oval',mouth:'curve',mw:6})],
 ['excited','More moods','Excited','New feature, big news',()=>put(120,GY-18,S1,{eyes:'big',mouth:'D',mw:9,arms:[['L',0.42,-42,22],['R',0.42,42,22]],sy:1.05,sx:0.96,lift:{L:[14,2],R:[-14,2]}})],
 ['thankful','More moods','Thankful','Thank-you moments, after feedback',()=>solo({eyes:'cup',mouth:'curve',mw:7,sy:0.92,sx:1.05,tilt:8,arms:[['L',0.6,-150,12],['R',0.6,150,12]]})],
 ['wink','More moods','Wink','Tips, light humour',()=>solo({eyes:['oval','arc'],mouth:'smirk',mw:8,tilt:-5})],
 ['confused','More moods','Confused','Unclear input, help',()=>solo({eyes:['big','small'],mouth:'wavy',mw:9,tilt:7,arms:[['R',0.3,-18,24]]})],
 ['sad','More moods','Sad','Gentle letdowns, nothing alarming',()=>solo({eyes:'oval',edy:4,mouth:'soft',mw:7,mdy:2,sy:0.9,sx:1.05,tilt:-4})],
 ['shy','More moods','Shy','First steps, small nudges',()=>put(120,GY,1.75,{eyes:'oval',edx:-5,edy:4,mouth:'line',mw:4,mdx:-4,tilt:-9})],
 ['talking','More moods','Talking','Chat, comments, team messages',()=>bubble(136,34,84,48,C.light,false)+rr(152,50,52,5,2.5,NAVY)+rr(152,62,32,5,2.5,NAVY)+put(90,GY,S2,{eyes:'oval',edx:3,mouth:'D',mw:7})],
 ['shrug','More moods','Shrug','Not sure, no preference',()=>solo({eyes:'lid',mouth:'line',mw:7,mrot:-8,armL:'shrug',armR:'shrug'})],
 ['goodbye','More moods','Goodbye','Sign out, leaving a team',()=>put(140,GY,2.0,{eyes:'cup',mouth:'curve',arms:[['L',0.35,-28,24]],tilt:7,lift:{R:[-22,-2]}})],
 ['welcome-back','More moods','Welcome back','Returning user, back after a break',()=>put(66,GY,S1,{eyes:'arc',mouth:'big',mw:9,arms:[['R',0.35,32,24]],tilt:-7})],
 ['nervous','More moods','Nervous','Before a big Sunday, first event',()=>solo({eyes:'small',edx:4,mouth:'wavy',mw:9,sy:0.95,sx:0.97,lift:{L:[0,0],R:[0,0]}})],
 ['focused','More moods','Focused','Working, editing a plan',()=>solo({eyes:'lid',edy:2,mouth:'line',mw:5,tilt:5})],
 ['laughing','More moods','Laughing','Fun moments, jokes in copy',()=>solo({eyes:'arc',mouth:'D',mw:11,tilt:-8,sy:0.95,sx:1.03})],
 ['curious','More moods','Curious','Discover, explore a new area',()=>solo({eyes:['small','big'],edx:3,edy:-2,mouth:'o',tilt:12})],
 ['determined','More moods','Determined','Setup progress, keep going',()=>solo({eyes:['slantL','slantR'],mouth:'line',mw:8,arms:[['L',0.55,-58,16],['R',0.55,58,16]]})],
 ['on-it','More moods','On it','Task accepted, assigned to you',()=>solo({eyes:['slantL','slantR'],mouth:'curve',mw:8,arms:[['R',0.3,4,30]],tilt:-3})],
 ['sorry','More moods','Sorry','Apologies, calmly (not errors)',()=>solo({eyes:'cup',edy:2,mouth:'soft',mw:6,arms:[['L',0.22,-8,24]],tilt:-6,sy:0.96})],
 ['peek','More moods','Peek','Hints, tooltips, coach marks',()=>put(120,284,2.7,{eyes:'big',edy:-4,mouth:'line',mw:5,noShadow:true})],
 // Gestures
 ['pointing','Gestures','Pointing','Coach marks to the right',()=>put(96,GY,S1,{eyes:'oval',edx:4,mouth:'curve',arms:[['R',0.55,90,26]]})],
 ['pointup','Gestures','Pointing up','Coach marks above',()=>solo({eyes:'oval',edy:-5,mouth:'curve',arms:[['R',0.35,6,32]]})],
 ['pointdown','Gestures','Pointing down','Coach marks below',()=>solo({eyes:'oval',edx:3,edy:4,mouth:'curve',arms:[['R',0.6,150,24]]})],
 ['pointleft','Gestures','Pointing left','Coach marks to the side',()=>put(144,GY,S1,{eyes:'oval',edx:-4,mouth:'curve',arms:[['L',0.55,-90,26]]})],
 ['thumbsup','Gestures','Thumbs up','Approved, looks good',()=>put(108,GY,S1,{eyes:'arc',mouth:'big',mw:9,arms:[['R',0.6,90,16,'thumb']]})],
 ['clapping','Gestures','Clapping','Milestones, team wins',()=>solo({eyes:'arc',mouth:'big',mw:9,arms:[['L',0.3,50,34],['R',0.3,-50,34]]})],
 ['highfive','Gestures','High five','Team milestone',()=>put(58,GY,1.5,{eyes:'arc',mouth:'big',arms:[['R',0.3,35,22]],tilt:4})+put(182,GY,1.5,{eyes:'arc',mouth:'big',arms:[['L',0.3,-35,22]],tilt:-4})],
 ['running','Gestures','Running','Running late, in a hurry',()=>solo({eyes:'oval',edx:4,mouth:'line',mw:5,tilt:10,arms:[['L',0.55,-140,16],['R',0.55,60,16]],lift:{L:[34,-2],R:[-22,-3]}})],
 // Actions and tools
 ['reading','Actions and tools','Reading','Notes, plan details, help articles',()=>put(120,GY,S1,{eyes:'oval',edy:4,mouth:'none'})+book()],
 ['planning','Actions and tools','Planning','Building a service plan',()=>L2({eyes:'oval',edx:4,mouth:'curve',arms:[['R',0.55,90,14]]})+clipboard(150,100)],
 ['phone','Actions and tools','Phone','Mobile tips, notifications on your phone',()=>L2({eyes:'oval',edx:5,edy:3,mouth:'curve',arms:[['R',0.55,90,16]]})+phone(160,126)],
 ['laptop','Actions and tools','Laptop','Web version, working at a desk',()=>put(120,GY-26,S1,{eyes:'oval',edy:4,mouth:'none',noShadow:true})+laptop()],
 ['carrying','Actions and tools','Carrying','Moving items, bulk changes',()=>box(72,18,96,60)+put(120,GY,S1,{eyes:'lid',mouth:'line',mw:6,sy:0.93,sx:1.04,arms:[['L',0.2,-12,26],['R',0.2,12,26]]})],
 ['sign','Actions and tools','Sign','Announcements, a blank sign for copy',()=>signBoard()+put(98,GY,S2,{eyes:'oval',mouth:'curve',arms:[['R',0.45,62,12]]})],
 ['megaphone','Actions and tools','Megaphone','Announcements to the whole team',()=>L2({eyes:'oval',mouth:'o',arms:[['R',0.6,90,12]]})+cone(150,150)],
 ['reminder','Actions and tools','Reminder','Upcoming tasks and deadlines',()=>put(90,GY,S2,{eyes:'big',mouth:'o',arms:[['R',0.4,38,22]]})+g('translate(172 96) scale(1.5) translate(-172 -96)',bell(172,96,C.acc))],
 ['lost','Actions and tools','Lost','Page not found, 404',()=>put(76,GY,S2,{eyes:'oval',edx:-4,mouth:'wavy',mw:8,tilt:-6,arms:[['R',0.55,90,14]]})+map(150,108)],
 ['maintenance','Actions and tools','Maintenance','Scheduled downtime',()=>put(90,GY,S2,{eyes:'lid',mouth:'line',mw:6,arms:[['R',0.4,40,20]]})+wrench(176,92)],
 ['idea','Actions and tools','Idea','Tips, suggestions',()=>solo({eyes:'big',edx:3,edy:-3,mouth:'o'})+bulb(190,52)],
 ['slides','Actions and tools','Slides','Lyrics on screen, presentation',()=>screen()+put(72,GY,S2,{eyes:'oval',edx:4,edy:-3,mouth:'curve',arms:[['R',0.4,45,26]]})],
 ['swap','Actions and tools','Swap','Swap a shift with someone',()=>swapArt()+put(70,GY,S2,{eyes:'oval',edx:4,mouth:'curve'})],
 ['qrcode','Actions and tools','QR code','Join with a code',()=>L2({eyes:'oval',edx:4,mouth:'curve',arms:[['R',0.55,90,14]]})+qr(152,104)],
 ['link','Actions and tools','Invite link','Share an invite link',()=>L2({eyes:'oval',edx:4,mouth:'curve',arms:[['R',0.55,90,12]]})+chain(150,134)],
 ['new-feature','Actions and tools','New feature','New feature available. Never on payment or paywall screens',()=>giftBox()+put(76,GY,S2,{eyes:'big',edx:3,mouth:'o'})],
 ['export','Actions and tools','Export','Download a PDF or print',()=>tray()+put(80,GY,S2,{eyes:'oval',edx:4,edy:-3,mouth:'curve'})],
 // Music
 ['listening','Music','Listening','Reference tracks, audio',()=>solo({eyes:'cup',mouth:'curve',mw:7})+headphones()],
 ['singing','Music','Singing','Vocal team, worship leader role',()=>ghostNote(186,40,0.7,NAVY)+put(92,GY,S2,{eyes:'arc',mouth:'o',arms:[['R',0.55,55,14]]})+mic(150,150,-38)],
 ['playing','Music','Playing guitar','Band roles, instruments',()=>put(112,GY,S1,{eyes:'arc',mouth:'curve',tilt:-4})+guitar()],
 ['keyboard','Music','Keys','Keyboard role, rehearsal',()=>put(120,GY-24,S1,{eyes:'oval',edy:4,mouth:'curve',noShadow:true})+keys()],
 ['drums','Music','Drums','Drummer role',()=>put(120,GY-10,S1,{eyes:'arc',mouth:'big',mw:9,arms:[['L',0.4,-42,24],['R',0.4,42,24]],noShadow:true})+sk('M22 82L54 44',5,NAVY)+sk('M218 82L186 44',5,NAVY)+drum()],
 ['mixing','Music','Running sound','Tech team, sound desk',()=>put(120,GY-22,S1,{eyes:'lid',edy:3,mouth:'line',mw:5,noShadow:true})+desk()],
 ['transpose','Music','Key change','Transpose a song',()=>L2({eyes:'oval',edx:4,mouth:'curve',arms:[['R',0.55,90,14]]})+keyTile(154,94)],
 ['setlist','Music','Setlist','Service order, song list',()=>setSheet()+put(70,GY,S2,{eyes:'oval',edx:4,mouth:'curve',arms:[['R',0.5,72,14]]})],
];
ST.push(...ST2);
const GROUPS=['Welcome','Empty states','Success','Reminders and team','Problems','Moods','More moods','Gestures','Actions and tools','Music'];

// ---------- files ----------
const A=240;
const svgDoc=(w,h,body,bg)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg?`<rect width="${w}" height="${h}" fill="${bg}"/>`:''}${body}</svg>`;
const TITLE='OnStage mascot: Buddy app states';
const SUB='The WOW Buddy in the brand blue #A4D4E3 (big navy ovals, tiny mouth, tucked feet, flat #7FBFD3 ground shadow) with a coral #F28B7D accent. Not for billing, payment, paywalls, grief or prayer requests, or Live Mode.';
function sheetSvg(blind=false){const pad=64,gap=24,C=8,ch=A+(blind?0:58);let s='',y=pad,n=0;
 if(!blind){s+=`<text x="${pad}" y="${y+40}" font-family="DM Sans" font-weight="700" font-size="40" fill="${NAVY}">${TITLE}</text>`;y+=58;
  s+=`<text x="${pad}" y="${y+22}" font-family="DM Sans" font-size="18" fill="${INK}">${SUB}</text>`;y+=60;}
 for(const gr of GROUPS){const list=ST.filter(x=>x[1]===gr);
  if(!blind){s+=`<text x="${pad}" y="${y+22}" font-family="DM Sans" font-weight="700" font-size="22" fill="${NAVY}">${gr}</text>`;y+=40;}
  list.forEach((st,i)=>{n++;const x=pad+(i%C)*(A+gap),yy=y+Math.floor(i/C)*(ch+gap);
   s+=`<g transform="translate(${x} ${yy})"><svg width="${A}" height="${A}" viewBox="0 0 ${A} ${A}"><clipPath id="c${n}"><rect width="${A}" height="${A}" rx="18"/></clipPath><g clip-path="url(#c${n})"><rect width="${A}" height="${A}" fill="${CARD}"/>${st[4]()}</g></svg>`
    +(blind?`<text x="10" y="22" font-family="DM Sans" font-size="14" fill="${MUTED}">${n}</text>`:`<text x="4" y="${A+24}" font-family="DM Sans" font-weight="700" font-size="16" fill="${NAVY}">${st[2]}</text><text x="4" y="${A+44}" font-family="DM Sans" font-size="13" fill="${MUTED}">${st[3]}</text>`)+`</g>`;});
  y+=Math.ceil(list.length/C)*(ch+gap)+(blind?0:20);}
 const W=pad*2+C*A+(C-1)*gap,H=y+pad;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#FFFFFF"/>${s}</svg>`;}

// ---------- Figma: component set "Mascot/Buddy App" (state=<key>) + grouped board ----------
const FIG=`
const page=await figma.getNodeByIdAsync('63974:99457');await figma.setCurrentPageAsync(page);
const hex=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const fill=h=>[{type:'SOLID',color:hex(h)}];
const secs=page.findAllWithCriteria({types:['SECTION']});
const ex=secs.find(n=>n.name==='Mascot - Buddy app states');if(ex)return {error:'section already exists',id:ex.id};
const anchor=secs.find(n=>n.name==='Mascot - Buddy blue wow');if(!anchor)return {error:'anchor not found'};
await figma.loadFontAsync({family:'DM Sans',style:'Bold'});await figma.loadFontAsync({family:'DM Sans',style:'Regular'});
const txt=(name,s,style,size,col)=>{const t=figma.createText();t.fontName={family:'DM Sans',style};t.characters=s;t.fontSize=size;t.fills=fill(col);t.name=name;return t;};
const comps=[];
for(const m of M){const fr=figma.createFrame();fr.resize(240,240);fr.fills=[];fr.clipsContent=true;
 const a=figma.createNodeFromSvg(m.svg);a.name='Buddy';a.fills=[];fr.appendChild(a);a.x=0;a.y=0;
 const c=figma.createComponentFromNode(fr);c.name='state='+m.key;comps.push(c);}
const set=figma.combineAsVariants(comps,page);set.name='Mascot/Buddy App';
set.description='OnStage Buddy for platform states (welcome, empty, success, reminders, problems, moods). Not for billing, payment, paywalls, grief or prayer requests, or Live Mode.';
set.layoutMode='HORIZONTAL';set.layoutWrap='WRAP';set.itemSpacing=24;set.counterAxisSpacing=24;
set.paddingLeft=set.paddingRight=set.paddingTop=set.paddingBottom=32;set.primaryAxisSizingMode='FIXED';set.counterAxisSizingMode='AUTO';
set.resize(32*2+240*8+24*7,set.height);set.cornerRadius=24;set.fills=fill('#F4F4F2');
const board=figma.createAutoLayout('VERTICAL',{name:'Board',itemSpacing:40});
board.set({paddingLeft:64,paddingRight:64,paddingTop:64,paddingBottom:64,cornerRadius:32,fills:fill('#FFFFFF')});
const head=figma.createAutoLayout('VERTICAL',{name:'Header',itemSpacing:10});head.fills=[];
head.appendChild(txt('Title',TITLE,'Bold',40,'#00275C'));
const sub=txt('Subtitle',SUB,'Regular',18,'#3A3F47');head.appendChild(sub);sub.textAutoResize='HEIGHT';sub.resize(2000,sub.height);board.appendChild(head);
board.appendChild(txt('Label','Component set: Mascot/Buddy App (property state)','Bold',22,'#00275C'));
board.appendChild(set);
const ids=[];
for(const gr of GROUPS){const blk=figma.createAutoLayout('VERTICAL',{name:'Group - '+gr,itemSpacing:16});blk.fills=[];board.appendChild(blk);
 blk.appendChild(txt('Group label',gr,'Bold',22,'#00275C'));
 const row=figma.createAutoLayout('HORIZONTAL',{name:'Cards',itemSpacing:24});row.fills=[];row.layoutWrap='WRAP';row.counterAxisSpacing=32;
 row.primaryAxisSizingMode='FIXED';blk.appendChild(row);row.resize(240*8+24*7,row.height);
 M.forEach((m,i)=>{if(m.group!==gr)return;
  const cell=figma.createAutoLayout('VERTICAL',{name:'State - '+m.key,itemSpacing:6});cell.fills=[];
  const card=figma.createFrame();card.name='Card';card.resize(240,240);card.cornerRadius=18;card.fills=fill('#F4F4F2');card.clipsContent=true;
  const inst=comps[i].createInstance();card.appendChild(inst);inst.x=0;inst.y=0;cell.appendChild(card);
  for(const t of [txt('Name',m.name,'Bold',16,'#00275C'),txt('Use','Use it for: '+m.use,'Regular',13,'#7A7F87')]){cell.appendChild(t);t.textAutoResize='HEIGHT';t.resize(240,t.height);}
  row.appendChild(cell);ids.push(cell.id);});}
const sec=figma.createSection();sec.name='Mascot - Buddy app states';sec.appendChild(board);board.x=40;board.y=40;
sec.resizeWithoutConstraints(board.width+80,board.height+80);
let X=anchor.x+anchor.width+300,Y=anchor.y;const moved=[];
const ov=(n,x,y,w,h)=>n.x<x+w&&n.x+n.width>x&&n.y<y+h&&n.y+n.height>y;
for(let k=0;k<40;k++){const hit=page.children.find(n=>n.id!==sec.id&&n.visible!==false&&ov(n,X-100,Y-100,sec.width+200,sec.height+200));if(!hit)break;moved.push(hit.name);Y=hit.y+hit.height+300;}
sec.x=X;sec.y=Y;
const hits=page.children.filter(n=>n.id!==sec.id&&n.visible!==false&&ov(n,sec.x,sec.y,sec.width,sec.height)).map(n=>n.name);
await board.screenshot({scale:0.2});
return {sectionId:sec.id,setId:set.id,boardId:board.id,variantCount:comps.length,overlaps:hits,movedBelow:moved,x:sec.x,y:sec.y,w:sec.width,h:sec.height};`;

if(typeof module!=='undefined')module.exports={ST,GROUPS,setPalette,ACCENTS,BASE,NAVY,WHITE,PALE,DEEP,T4};
if(require.main===module){const fs=require('fs'),path=require('path'),out=path.join(__dirname,'..','blue-app-states');
 for(const d of ['svg','art','png'])fs.mkdirSync(path.join(out,d),{recursive:true});
 ST.forEach((st,i)=>{const fn=`${String(i+1).padStart(2,'0')}-${st[0]}.svg`;
  fs.writeFileSync(path.join(out,'svg',fn),svgDoc(A,A,st[4](),CARD));fs.writeFileSync(path.join(out,'art',fn),svgDoc(A,A,st[4]()));});
 fs.writeFileSync(path.join(out,'sheet.svg'),sheetSvg());fs.writeFileSync(path.join(out,'sheet-unlabelled.svg'),sheetSvg(true));
 // the Figma script carries the drawing code above, so it matches the files
 const src=fs.readFileSync(__filename,'utf8'),lib=src.slice(src.indexOf('const NAVY='),src.indexOf('// ---------- files'));
 const js=`// Generated by blue-app-states.js. Do not edit by hand.\n`+lib+`const A=240;\n`
  +`const svgDoc=(w,h,body)=>\`<svg xmlns="http://www.w3.org/2000/svg" width="\${w}" height="\${h}" viewBox="0 0 \${w} \${h}">\${body}</svg>\`;\n`
  +`const TITLE=${JSON.stringify(TITLE)},SUB=${JSON.stringify(SUB)};\n`
  +`const M=ST.map(([key,group,name,use,art])=>({key,group,name,use,svg:svgDoc(A,A,art())}));\n`+FIG;
 fs.writeFileSync(path.join(__dirname,'blue-app-states.figma.js'),js);
 console.log(ST.length,'states; figma script',js.length,'chars');}
