import{a as e,i as t,n,r,t as i}from"./api-cache.BR94BOV0.js";var a=(function(){let e=typeof document<`u`&&document.createElement(`link`).relList;return e&&e.supports&&e.supports(`modulepreload`)?`modulepreload`:`preload`})(),o=function(e){return`/`+e},s={},c=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),c=i?.nonce||i?.getAttribute(`nonce`);function l(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function u(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=l(t.map(t=>{if(t=o(t,n),t=u(t),t in s)return;s[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:a,r||(i.as=`script`),i.crossOrigin=``,i.href=t,c&&i.setAttribute(`nonce`,c),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},l=`/pdfjs/pdf.min.js`,u=`/pdfjs/pdf.worker.js`,d=null;function f(){return d||=c(()=>import(l).then(e=>(e.GlobalWorkerOptions.workerSrc=u,e)),[]).catch(e=>{throw d=null,e}),d}async function p({container:e,url:t,startPage:n=1,onProgress:r}){let i=await(await f()).getDocument({url:t,cMapUrl:`/pdfjs/cmaps/`,cMapPacked:!0,standardFontDataUrl:`/pdfjs/standard_fonts/`,wasmUrl:`/pdfjs/wasm/`}).promise,a=i.numPages,o=(await i.getPage(1)).getViewport({scale:1}),s=document.createElement(`div`);s.id=`pdf-pages`,s.style.cssText=`display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0 60px;`;let c={zoom:1,dpr:Math.min(window.devicePixelRatio||1,2.5),current:1,rendered:new Map,boxes:new Map};function l(){return Math.max(240,e.clientWidth-20)}function u(e){return l()/e.width*c.zoom}let d=[];{let e=0;for(let t=1;t<=a;t++){let n=l(),r=Math.round(o.height/o.width*n),i=document.createElement(`div`);i.dataset.page=String(t),i.style.cssText=`width:${n}px;height:${r}px;background:rgba(128,128,128,0.08);border-radius:4px;flex-shrink:0;`,d.push(r),s.appendChild(i),c.boxes.set(t,i),e+=r}}e.innerHTML=``,e.appendChild(s);let p=new IntersectionObserver(e=>{for(let t of e){let e=Number(t.target.dataset.page);t.isIntersecting?m(e):c.rendered.has(e)&&Math.abs(e-c.current)>3&&h(e)}},{root:e,rootMargin:`800px 0px`});for(let e of c.boxes.values())p.observe(e);async function m(e){if(c.rendered.has(e)||e<1||e>a)return;let t=c.boxes.get(e);if(!(!t||t.dataset.rendering===`1`)){t.dataset.rendering=`1`;try{let n=await i.getPage(e),r=u(n.getViewport({scale:1})),a=n.getViewport({scale:r*c.dpr}),o=document.createElement(`canvas`);o.width=Math.floor(a.width),o.height=Math.floor(a.height),o.style.cssText=`width:${Math.floor(a.width/c.dpr)}px;height:${Math.floor(a.height/c.dpr)}px;display:block;border-radius:4px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,0.12);`;let s=o.getContext(`2d`,{alpha:!1});await n.render({canvasContext:s,viewport:a}).promise,t.style.height=`${Math.floor(a.height/c.dpr)}px`,t.style.background=`transparent`,t.innerHTML=``,t.appendChild(o),c.rendered.set(e,o)}catch{t.innerHTML=`<div style="padding:24px;text-align:center;font-size:12px;opacity:0.6;">Page ${e} could not be displayed</div>`}finally{t.dataset.rendering=`0`}}}function h(e){let t=c.rendered.get(e),n=c.boxes.get(e);t&&(t.width=0,t.height=0),n&&(n.innerHTML=``,n.style.background=`rgba(128,128,128,0.08)`),c.rendered.delete(e)}function g(){let t=e.scrollTop,n=1;for(let e=1;e<=a;e++){let r=c.boxes.get(e);if(r)if(r.offsetTop-60<=t)n=e;else break}return n}function _(){r&&r({page:c.current,total:a})}function v(){let e=g();e!==c.current&&(c.current=e,_())}e.addEventListener(`scroll`,v,{passive:!0});function y(t){let n=Math.min(a,Math.max(1,t)),r=c.boxes.get(n);r&&(e.scrollTop=r.offsetTop-6),c.current=n,_()}function b(){let e=l();for(let t=1;t<=a;t++){let n=c.boxes.get(t);if(!n)continue;let r=Math.round(o.height/o.width*e);n.style.width=`${e}px`,c.rendered.has(t)||(n.style.height=`${r}px`),c.rendered.has(t)&&h(t)}for(let e=Math.max(1,c.current-1);e<=Math.min(a,c.current+1);e++)m(e)}n>1&&n<=a?requestAnimationFrame(()=>y(n)):c.current=1,_();let x=null,S=()=>{clearTimeout(x),x=setTimeout(()=>{b()},300)};return window.addEventListener(`resize`,S),{total:a,get current(){return c.current},goToPage:y,nextPage:()=>y(c.current+1),prevPage:()=>y(c.current-1),zoomIn:()=>{c.zoom=Math.min(3,c.zoom+.25),b(),_()},zoomOut:()=>{c.zoom=Math.max(.5,c.zoom-.25),b(),_()},fitWidth:()=>{c.zoom=1,b(),_()},destroy(){p.disconnect(),e.removeEventListener(`scroll`,v),window.removeEventListener(`resize`,S),clearTimeout(x),c.rendered.forEach((e,t)=>h(t)),s.remove(),i.destroy().catch(()=>{})}}}var m={alert:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,check:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,checkCircle:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,x:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,clock:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,lock:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,send:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,user:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,users:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,info:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,chart:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,mail:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,star:`<svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,dollar:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,film:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,megaphone:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,book:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,hand:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v6"/><path d="M14 10V4a2 2 0 0 0-4 0v7"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,graduation:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 6 3 12 0v-5"/></svg>`,trophy:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,play:`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,headphones:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,fileText:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,video:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,camera:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,music:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,link:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,target:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,rocket:`<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,heart:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,sunrise:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8,6 12,2 16,6"/></svg>`,sleep:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,leaf:`<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75"/></svg>`,shield:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,brain:`<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></svg>`,wallet:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,eye:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,close:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`},h=window.fetch;window.fetch=function(e,t={}){let n=typeof e==`string`?e:e&&typeof e.url==`string`?e.url:String(e);return[`/login`,`/register`,`/`,`/api/auth/login`,`/api/auth/register`,`/api/public/`].some(e=>n.includes(e)),h(e,t)};var g=document.getElementById(`dash-app`),_=localStorage.getItem(`wisdom_vault_user`),v=1800,y={USD_RATE:1800,MIN_WITHDRAWAL:7e3,MAX_WITHDRAWAL:15e5,MAX_DAILY_WATCHES:50,API_BASE:`/api`,RETRY_DELAY:2e3,MAX_RETRIES:3,TOAST_DURATION:2500,RATE_LIMIT_DELAY:3e3},b=null;function x(e){e&&(b=e,e.withdrawalMinAmount&&(y.MIN_WITHDRAWAL=e.withdrawalMinAmount),e.withdrawalMaxAmount&&(y.MAX_WITHDRAWAL=e.withdrawalMaxAmount),e.usdRate&&(y.USD_RATE=e.usdRate,v=e.usdRate))}function S(e={}){let t={"Content-Type":`application/json`,...e},n=localStorage.getItem(`wisdom_vault_session`);return n&&(t.Authorization=`Bearer ${n}`),t}async function C(i,a={},o=y.MAX_RETRIES){let s={"Content-Type":`application/json`,Accept:`application/json`},c=localStorage.getItem(`wisdom_vault_session`);c&&(s.Authorization=`Bearer ${c}`);let l={headers:s,credentials:`include`,...a};l.headers={...s,...a.headers||{}};let u=(a.method||`GET`).toUpperCase()===`GET`,d=(()=>{try{return JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`).id||``}catch{return``}})();if(u){let e=n(i,d);if(e!==void 0)return e}try{let n=await fetch(`${y.API_BASE}${i}`,l);if(!n.ok){let e=await n.json().catch(()=>({})),t=Error(e.message||`HTTP ${n.status}: ${n.statusText}`);throw t.status=n.status,t.isHttpError=!0,t}let r=await n.json();return u&&t(i,d,r),u||e(i),r}catch(e){if(u){let e=r(i,d);if(e!==void 0)return e}let t=!e.isHttpError||e.status>=500&&e.status<=599;if(o>0&&t)return console.warn(`Retrying ${i}... (${o} attempts left)`),await new Promise(e=>setTimeout(e,y.RETRY_DELAY)),C(i,a,o-1);throw t?console.error(`API Error (${i}):`,e):console.warn(`Request failed (${e.status||`network`}): ${e.message}`),e}}function ee(){let e=document.getElementById(`dash-app`);if(!e)return;e.innerHTML=`
    <div class="maint-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:14px;padding:24px;text-align:center;background:#f7f1ec;color:#2d2327;">
      <span class="maint-float maint-float--1"></span>
      <span class="maint-float maint-float--2"></span>
      <span class="maint-float maint-float--3"></span>
      <span class="maint-float maint-float--4"></span>
      <span class="maint-float maint-float--5"></span>
      <div class="maint-icon-wrap" style="width:88px;height:88px;background:rgba(192,154,138,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;">
        <span class="maint-ring"></span>
        <span class="maint-ring maint-ring--two"></span>
        <div class="maint-icon" style="display:flex;align-items:center;justify-content:center;">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
      </div>
      <div style="z-index:1;">
        <h1 class="maint-title" style="font-size:24px;font-weight:700;font-family:'Clash Display',sans-serif;margin:0;">System Under Maintenance<span class="maint-dot"></span><span class="maint-dot"></span><span class="maint-dot"></span></h1>
      </div>
      <p style="font-size:14px;color:#5a4a4a;max-width:340px;line-height:1.5;z-index:1;">We're experiencing technical difficulties right now. Please try again in a few minutes — your balance and progress are safe.</p>
      <div class="maint-scan" style="z-index:1;margin-top:6px;"></div>
      <div class="maint-pill" style="z-index:1;margin-top:6px;"><span class="maint-pill-dot"></span><span id="maint-countdown">Auto-retrying in 30s…</span></div>
      <div style="display:flex;gap:12px;margin-top:12px;z-index:1;">
        <button id="maint-retry" style="background:#2d2327;color:#ffffff;border:none;padding:12px 26px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;">Try Again</button>
        <button id="maint-signout" style="background:transparent;border:1px solid rgba(45,35,39,0.15);color:#5a4a4a;padding:12px 20px;border-radius:12px;font-size:13px;cursor:pointer;">Sign Out</button>
      </div>
    </div>
  `,document.getElementById(`maint-retry`)?.addEventListener(`click`,()=>window.location.reload()),document.getElementById(`maint-signout`)?.addEventListener(`click`,()=>{localStorage.removeItem(`wisdom_vault_user`),localStorage.removeItem(`wisdom_vault_session`),i(),window.location.href=`/`});let t=30,n=document.getElementById(`maint-countdown`),r=setInterval(()=>{--t,n&&(n.textContent=t>0?`Auto-retrying in ${t}s…`:`Retrying now…`),t<=0&&(clearInterval(r),window.location.reload())},1e3)}function te(e,t=y.RATE_LIMIT_DELAY){let n=0,r=null;return function(...i){let a=Date.now();if(a-n<t){window.showToast(m.clock+` Please wait a moment before trying again`),r&&clearTimeout(r),r=setTimeout(()=>{n=a,e.apply(this,i)},t-(a-n));return}n=a,e.apply(this,i)}}function ne(e,t,n=!1){e&&(n?e.innerHTML=t:e.textContent=t)}document.addEventListener(`touchstart`,function(){},{passive:!0});var re;window.addEventListener(`resize`,function(){clearTimeout(re),re=setTimeout(function(){},250)}),window.innerWidth,`ontouchstart`in window||navigator.maxTouchPoints,document.querySelectorAll(`img[loading="lazy"]`).forEach(e=>{`loading`in HTMLImageElement.prototype&&(e.loading=`lazy`)});var w=null,T=null,E=[],ie=[],ae=null,D=null,oe=0,se=0,ce=0,le=0,O=[],k=[],ue=`all`,de=``,fe=`recent`,A=[],j=[],M=[],pe=`explore`,me=`all`,he=``,N=[],P=[],ge=`all`,_e=``;function ve(e){return`$`+(parseFloat(e||0)/v).toFixed(2)}function F(e){return`MWK `+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function I(e){return`<span style="font-weight:700; color: #2d2327;">${F(e)}</span> <span style="font-size:11px;opacity:0.6;font-weight:400;color:#5a4a4a;">≈ ${ve(e)}</span>`}function ye(e){return e?e.split(` `).map(e=>e[0]).join(``).toUpperCase().slice(0,2):`U`}function be(e){let t=new Date().getHours(),n=`Good morning`;return t>=12&&t<17&&(n=`Good afternoon`),t>=17&&t<20&&(n=`Good evening`),(t>=20||t<5)&&(n=`Good night`),{greeting:n,name:e||`User`}}var xe=null;function Se(){try{xe||(xe=new Audio(`data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+LkZODc2BseYaRlY6HfnBtfIiSlox+bmh0go6Xk4l8bGd3h5CXkYd7bGh5iZSYj4V7bWt8jpeVjIN8b25/kZeSioJ9cXCBkpaQiYF/c3KElJePhn1+c3OFlZeOhH1/dXWGlpiNgX1/dnaHl5mMf35/d3iImJqLfX1/eHmJmZqKfH1/enqKmpuJe3x/fHuLm5yIeXt/f3yMnJyHdnp/gH2NnZ2GdHl/gn6Onp6Fcnt/g4CQoJ+DcHqAhIGRoZ6BbnmAhIKSopyAa3eBioaVn5l9ZXODkI+VnJV3YXCIlJSTmJJ0XW6Jl5eSmJFzXG6Kl5eSmJF0XHCLmJiSmJFzXHCMmZmSmJFzXHGNmpqTmZJ0XHGOm5uUmZN0XHGPnJyVmZN0XHGRnZ2WmZR0XHGSnp6XmZR0XHGUnp+YmZR0XHGVn6CZmZR0XHGWn6GamZR0XHGXn6KbmpV0XHGYoKKcmpV0XHGYoKObm5Z0XHGapKOdnJd0XHGbpKSem5h0XHGcpaWfnJl0XHGdpaagnZp0XHGepqahn5t0XHGfp6ein5x0XHGgqKmjoJ10XHGhqaqkoZ50XHGiqaqlop90XHGiqaqlop90XHGiqaukop90XHGiquqlo590XHGiuuuopJ90XHGuuuopZ90XHGuuuopZ90XHGuuyppZ90XHGuuyppZ90XHGuuyppZ90XHGuuyppZ90XHGuuyppZ90XHGuuyppZ90XHGuuyppZ90XHGuuyppZ90Q==`),xe.volume=.3),xe.currentTime=0,xe.play().catch(()=>{})}catch{}}window.showToast=function(e){try{let t=document.getElementById(`user-toast`);t||(t=document.createElement(`div`),t.id=`user-toast`,t.className=`toast`,document.body.appendChild(t)),t.innerHTML=e,t.classList.add(`show`),clearTimeout(t._timeout),t._timeout=setTimeout(()=>{t.classList.remove(`show`)},2500)}catch(e){console.error(`Toast error:`,e)}},window.toggleNotif=function(){let e=document.getElementById(`notifDrop`);if(!e)return;let t=e.style.display===`block`;e.style.display=t?`none`:`block`},window.markAll=function(){let e=document.getElementById(`badge`);e&&(e.style.display=`none`),window.showToast(`All marked as read`)};function Ce(e,t=50){let n=0;return function(...r){let i=Date.now();i-n>=t&&(n=i,e.apply(this,r))}}function we(){`ontouchstart`in window||navigator.maxTouchPoints>0||document.querySelectorAll(`.glass:not(.no-tilt)`).forEach(e=>{let t=Ce(function(t){let n=e.getBoundingClientRect(),r=t.clientX-n.left,i=t.clientY-n.top,a=n.width/2,o=(i-n.height/2)/15,s=(a-r)/15;e.style.transform=`perspective(1000px) rotateX(${o}deg) rotateY(${s}deg)`},50);e.addEventListener(`mousemove`,t),e.addEventListener(`mouseleave`,()=>{e.style.transform=`perspective(1000px) rotateX(0) rotateY(0)`})})}function Te(){let e=document.getElementById(`robot`);if(!e)return;let t=Ce(function(t){let n=e.getBoundingClientRect(),r=(t.clientX-(n.left+32))/18,i=(t.clientY-(n.top+32))/18;e.style.transform=`translate(${r}px,${i}px) rotate(${r*.8}deg)`},50);document.addEventListener(`mousemove`,t),e.addEventListener(`click`,()=>{e.style.animation=`none`,e.offsetHeight,e.style.animation=`bob 0.2s ease-in-out 3 alternate`,setTimeout(()=>e.style.animation=`bob 1.5s ease-in-out infinite alternate`,600),window.showToast(`Robot vibing • music on`)})}if(!_)g.innerHTML=`
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px;padding:20px;text-align:center; background: #f7f1ec;">
      <div style="width:80px;height:80px;background:rgba(192,154,138,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <h1 style="font-size:28px;font-weight:700;color:#2d2327;font-family:'Clash Display',sans-serif;">Wisdom Vault</h1>
      <p style="color:#5a4a4a;">Sign in to access your vault</p>
      <div style="display:flex;gap:12px;margin-top:8px;">
        <a href="/login" style="background:#2d2327;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Sign In</a>
        <a href="/register" style="background:transparent;border:2px solid #2d2327;color:#2d2327;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Register</a>
      </div>
    </div>
  `;else{let e=JSON.parse(_);w=e,g.innerHTML=`
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;gap:12px;color:#5a4a4a;background:#f7f1ec;">
      <div style="width:24px;height:24px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      Loading your Vault...
    </div>
  `,Ee(e),setTimeout(()=>{g.innerHTML.includes(`Loading your Vault`)&&ee()},2e4)}async function Ee(e){let t=null;try{let n=await C(`/user/payment-status?userId=${e.id}`);if(t=n.success?n.paymentStatus:null,t&&t!==`verified`)try{let n=await C(`/paychangu/status?userId=${e.id}`);if(n&&n.verified&&n.paymentStatus===`verified`){t=`verified`;try{let e=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);e.paymentStatus=`verified`,localStorage.setItem(`wisdom_vault_user`,JSON.stringify(e))}catch{}}}catch{}if(t&&t!==`verified`){g.innerHTML=`
        <div style="position:fixed;inset:0;background:rgba(45,35,39,0.85);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;">
          <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:20px;padding:40px;max-width:420px;width:100%;text-align:center;color:#2d2327;">
            <div style="width:56px;height:56px;background:rgba(192,154,138,0.1);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h2 style="font-family:'Clash Display',sans-serif;font-size:22px;margin-bottom:8px;">Payment Required</h2>
            <p style="font-size:14px;margin-bottom:20px;">Complete your registration payment to access the Wisdom Vault.</p>
            <a href="/billing" style="display:block;width:100%;padding:14px;background:#2d2327;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:600;margin-bottom:10px;">Complete Payment</a>
            <a href="#" id="payment-signout" style="display:block;width:100%;padding:12px;background:transparent;border:1px solid rgba(45,35,39,0.1);color:#5a4a4a;border-radius:12px;text-decoration:none;font-size:14px;">Sign Out</a>
          </div>
        </div>
      `,document.getElementById(`payment-signout`)?.addEventListener(`click`,function(e){e.preventDefault(),e.stopPropagation(),localStorage.removeItem(`wisdom_vault_user`),i(),window.location.href=`/`});return}}catch(e){console.error(`Payment status check failed:`,e)}try{let t=await Promise.allSettled([C(`/public/stats`,{},1),C(`/wallet/balance?userId=${e.id}`),C(`/content/packs?userId=${e.id}`)]),n=t[0].status===`fulfilled`?t[0].value:null,r=t[1].status===`fulfilled`?t[1].value:null,i=t[2].status===`fulfilled`?t[2].value:null;if(n&&n.success&&n.stats&&x(n.stats),!r&&!i){console.error(`Failed to load dashboard data: API unreachable`),ee();return}De(e,r,i)}catch(e){console.error(`Failed to load dashboard data:`,e),ee()}}var L=null,R=null,z=null,B=`overview`;function De(e,t,n){L&&=(clearInterval(L),null),R&&=(clearInterval(R),null),z&&=(clearInterval(z),null),T=t?.wallet||t||{balanceAvailable:0,grossEarnings:0,storeCredit:0,totalWithdrawn:0},T.balance_available!==void 0&&(T.balanceAvailable=T.balance_available,T.grossEarnings=T.gross_earnings,T.storeCredit=T.store_credit,T.totalWithdrawn=T.total_withdrawn),E=t&&Array.isArray(t.recentTransactions)?t.recentTransactions.map(e=>({id:e.id||`tx_`+Date.now()+`_`+Math.random(),transaction_type:e.type||e.transaction_type||``,amount:e.amount,fee_deducted:e.feeDeducted||0,description:e.description||``,created_at:e.createdAt||e.created_at||new Date().toISOString()})):[],ie=n?.packs||[],w=e,localStorage.setItem(`wisdom_vault_user`,JSON.stringify(e));let r=be(e.first_name||e.fullName||`Member`);g.innerHTML=`
    <!-- BACKGROUND -->
    <div class="bg-ambient"></div>

    <!-- HEADER -->
    <div class="top">
      <div style="display:flex;gap:10px;align-items:center">
        <div class="avatar">${ye(e.fullName||e.first_name||`User`)}</div>
        <div>
          <div id="greeting" style="font-size:13px;font-weight:700;line-height:1.1; color: #2d2327;">
            <span style="color: rgba(45, 35, 39, 0.5);">${r.greeting},</span> 
            <span style="color: #c09a8a;">${r.name}</span>
          </div>
          <div id="date" style="font-size:10px;opacity:.45;letter-spacing:.6px;margin-top:3px;display:flex;gap:6px;align-items:center">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span id="dateText">${new Date().toLocaleString(`en-US`,{weekday:`long`,month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`,hour12:!0})}</span>
          </div>
        </div>
      </div>
     
      <div style="display:flex;gap:10px;align-items:center">
        <!-- BELL -->
        <div class="bell" id="bell">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="dot" id="badge" style="background:#c09a8a; color:#ffffff;">0</div>
        </div>

        <!-- ROBOT -->
        <div class="robot-wrap">
          <div class="robot" id="robot">
            <div class="headphones"></div>
            <div class="eye"></div>
            <div class="eye"></div>
            <div class="eq">
              <div class="bar" style="animation-delay:0s"></div>
              <div class="bar" style="animation-delay:.2s"></div>
              <div class="bar" style="animation-delay:.4s"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NOTIFICATIONS DROPDOWN -->
    <div class="notif-drop" id="notifDrop">
      <div style="padding:14px 18px;border-bottom:1px solid rgba(45,35,39,0.05);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:rgba(247,241,236,0.95);">
        <div style="display:flex;gap:8px;align-items:center; color:#2d2327;">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span style="font-size:13px;font-weight:700;">Notifications</span>
        </div>
        <button onclick="window.markAll()" style="background:none;border:none;color:#c09a8a;font-size:11px;font-weight:700;cursor:pointer;">Mark all read</button>
      </div>
      <div id="notification-list" style="padding:8px; color:#2d2327;"></div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="container">
      <div id="panel-content" style="padding-bottom: 110px;">
        <!-- Populated by loadPanel -->
      </div>
    </div>

    <!-- BOTTOM NAV -->
    <div class="nav">
      <button class="ni active" data-panel="overview" onclick="window.loadPanel('overview')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <div style="font-size:8px;margin-top:2px">HOME</div>
      </button>
      <button class="ni" data-panel="earn" onclick="window.loadPanel('earn')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M10 8l6 4-6 4z"/></svg>
        <div style="font-size:8px;margin-top:2px">EARN</div>
      </button>
      <button class="ni" data-panel="wallet" style="flex:0" onclick="window.loadPanel('wallet')">
        <div style="width:46px;height:46px;background:#2d2327;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#ffffff">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </button>
      <button class="ni" data-panel="library" onclick="window.loadPanel('library')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <div style="font-size:8px;margin-top:2px">LIBRARY</div>
      </button>
      <button class="ni" id="moreBtn" onclick="window.openMore()">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        <div style="font-size:8px;margin-top:2px">MORE</div>
      </button>
    </div>

    <!-- MORE SHEET -->
    <div class="more-sheet" id="moreSheet" onclick="if(event.target===this)window.closeMore()">
      <div class="more-content">
        <div style="width:36px;height:4px;background:rgba(45,35,39,0.1);border-radius:100px;margin:0 auto 16px"></div>
        <div style="display:flex;justify-content:space-between;align-items:center; color:#2d2327;">
          <h3 style="font-size:16px;font-weight:700;">More • Vault Functions</h3>
          <button onclick="window.closeMore()" style="width:32px;height:32px;border-radius:50%;background:rgba(45,35,39,0.05);border:1px solid rgba(45,35,39,0.1);color:#2d2327;display:flex;align-items:center;justify-content:center;cursor:pointer">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="more-grid">
          <div class="more-item" onclick="window.loadPanel('profile');window.closeMore()">
            <div class="mi-icon" style="border: 1px solid rgba(45,35,39,0.1);">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style="font-size:11px;font-weight:600;">Profile</div>
          </div>
          
          <div class="more-item" onclick="window.loadPanel('invites');window.closeMore()">
            <div class="mi-icon" style="border: 1px solid rgba(45,35,39,0.1);">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div style="font-size:11px;font-weight:600;">Invites</div>
          </div>
          
          <div class="more-item" onclick="window.loadPanel('courses');window.closeMore()">
            <div class="mi-icon" style="border: 1px solid rgba(45,35,39,0.1);">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
            <div style="font-size:11px;font-weight:600;">Courses</div>
          </div>
          
          <div class="more-item" onclick="window.loadPanel('guides');window.closeMore()">
            <div class="mi-icon" style="border: 1px solid rgba(45,35,39,0.1);">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div style="font-size:11px;font-weight:600;">Guides</div>
          </div>

          <div class="more-item" onclick="window.loadPanel('adverts');window.closeMore()">
            <div class="mi-icon" style="border: 1px solid rgba(45,35,39,0.1);">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </div>
            <div style="font-size:11px;font-weight:600;">My Advert</div>
          </div>
        </div>
      </div>
    </div>
  `,L=setInterval(Oe,6e4),R=setInterval(U,9e4),z=setInterval(je,9e4),document.addEventListener(`visibilitychange`,function(){document.hidden||(U(),je())}),ct(),we(),Te(),Qe(),window.loadPanel(`overview`)}function Oe(){let e=new Date().getHours(),t=`Good morning`;e>=12&&e<17&&(t=`Good afternoon`),e>=17&&e<20&&(t=`Good evening`),(e>=20||e<5)&&(t=`Good night`);let n=new Date,r=`${[`Sunday`,`Monday`,`Tuesday`,`Wednesday`,`Thursday`,`Friday`,`Saturday`][n.getDay()]}, ${[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`][n.getMonth()]} ${n.getDate()} • ${n.toLocaleTimeString(`en-US`,{hour:`numeric`,minute:`2-digit`,hour12:!0})}`,i=document.getElementById(`greeting`),a=document.getElementById(`dateText`);i&&(i.textContent=`${t}, ${w?.firstName||w?.fullName||`User`}`),a&&(a.textContent=r)}function ke(e){let t=document.getElementById(`panel-content`);if(t){switch(B=e,D&&=(clearInterval(D),null),document.querySelectorAll(`[id$="-modal"]`).forEach(e=>{e.style.display===`flex`&&(e.style.display=`none`)}),document.querySelectorAll(`.ni`).forEach(t=>{t.classList.toggle(`active`,t.dataset.panel===e)}),e){case`overview`:typeof Re==`function`&&Re(t);break;case`wallet`:w&&w.id&&typeof q==`function`&&(q(w.id),Ae(w.id)),typeof ze==`function`&&ze(t);break;case`earn`:typeof dt==`function`&&dt(t);break;case`invites`:Me(t);break;case`library`:typeof Ct==`function`&&Ct(t);break;case`courses`:typeof nn==`function`&&nn(t);break;case`guides`:typeof gn==`function`&&gn(t);break;case`profile`:typeof kn==`function`&&kn(t);break;case`adverts`:typeof Hn==`function`&&Hn(t);break}setTimeout(()=>{t.querySelectorAll(`.reveal`).forEach((e,t)=>{setTimeout(()=>e.classList.add(`in`),t*80)})},50),window.scrollTo({top:0,behavior:`smooth`})}}window.loadPanel=ke;function Ae(e){e&&C(`/wallet/withdrawal-status?userId=${encodeURIComponent(e)}`).then(t=>{t&&t.success&&Array.isArray(t.withdrawals)&&t.withdrawals.some(e=>e.status===`completed`||e.status===`failed`||e.status===`rejected`)&&typeof q==`function`&&q(e)}).catch(()=>{})}function je(){if(!document.hidden&&(U(),!document.querySelector(`[id$="-modal"][style*="flex"]`)&&!(!B||B===`overview`||B===`profile`)&&document.getElementById(`panel-content`)))switch(B){case`earn`:typeof pt==`function`&&pt();break;case`library`:typeof wt==`function`&&wt();break;case`courses`:typeof rn==`function`&&rn();break;case`guides`:typeof _n==`function`&&_n();break;case`adverts`:typeof $==`function`&&$();break}}window.addEventListener(`beforeunload`,function(){L&&clearInterval(L),R&&clearInterval(R),z&&clearInterval(z),$e()});function Me(e){e.innerHTML=`
    <div class="glass" style="padding:16px;margin-bottom:16px;text-align:center; color:#2d2327;">
      <div style="margin-bottom:8px;">${m.send}</div>
      <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">Referral Program</h2>
      <p style="font-size:13px;color:#5a4a4a;">Share your link and earn rewards when friends join</p>
      <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;">
        <div style="background:rgba(192,154,138,0.1);border-radius:10px;padding:10px 16px;">
          <div style="font-size:11px;color:#5a4a4a;">Level 1 Bonus</div>
          <div style="font-weight:700;color:#c09a8a;">MWK ${(b?.referralBonusStandard||5200).toLocaleString()}</div>
        </div>
        <div style="background:rgba(192,154,138,0.1);border-radius:10px;padding:10px 16px;">
          <div style="font-size:11px;color:#5a4a4a;">Level 2 Bonus</div>
          <div style="font-weight:700;color:#c09a8a;">MWK ${(b?.referralBonusRenewal||1e3).toLocaleString()}</div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div class="glass" style="text-align:center;padding:16px; color:#2d2327;">
        <div style="font-size:28px;font-weight:700;color:#c09a8a;" id="total-referrals">0</div>
        <div style="font-size:11px;color:#5a4a4a;">Total Referrals</div>
      </div>
      <div class="glass" style="text-align:center;padding:16px; color:#2d2327;">
        <div style="font-size:28px;font-weight:700;color:#c09a8a;" id="total-earned-ref">MWK 0</div>
        <div style="font-size:11px;color:#5a4a4a;">Total Earned</div>
      </div>
    </div>

    <!-- Referral Link -->
    <div class="glass" style="padding:16px;margin-bottom:16px; color:#2d2327;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Your Referral Link</div>
      <div style="display:flex;gap:8px;background:rgba(45,35,39,0.03);border-radius:10px;padding:8px;border:1px solid rgba(45,35,39,0.05);">
        <code id="ref-link" style="flex:1;font-size:12px;word-break:break-all;color:#5a4a4a;background:transparent;border:none;padding:4px;">Loading...</code>
        <button onclick="window.copyReferralLink()" style="padding:8px 16px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">
          Copy
        </button>
      </div>
    </div>

    <!-- Referral List -->
    <h3 style="font-size:14px;font-weight:700;margin-bottom:12px; color:#2d2327;">Your Referrals</h3>
    <div id="referral-list" style="display:flex;flex-direction:column;gap:8px;">
      <div style="text-align:center;padding:30px;color:#5a4a4a;background:rgba(45,35,39,0.03);border-radius:12px;">
        <div style="width:28px;height:28px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading referrals...
      </div>
    </div>
  `,Ne()}function Ne(){let e=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!e.id){let e=document.getElementById(`referral-list`);e&&(e.innerHTML=`
        <div style="text-align:center;padding:30px;color:#5a4a4a;background:rgba(45,35,39,0.03);border-radius:12px;">
          <div style="margin-bottom:8px;">${m.lock}</div>
          <div style="font-size:14px;font-weight:600;color:#2d2327;">Please Login</div>
          <div style="font-size:12px;color:#5a4a4a;">Sign in to see your referrals</div>
        </div>
      `);return}let t=document.getElementById(`referral-list`);t&&(t.innerHTML=`
      <div style="text-align:center;padding:30px;color:#5a4a4a;background:rgba(45,35,39,0.03);border-radius:12px;">
        <div style="width:28px;height:28px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading referrals...
      </div>
    `),C(`/referral/stats?userId=${e.id}`).then(e=>{if(e.success){let t=e.stats||{},n=e.referralLink||``,r=e.firstLevelReferrals||[],i=e.secondLevelReferrals||[],a=document.getElementById(`total-referrals`),o=document.getElementById(`total-earned-ref`),s=document.getElementById(`ref-link`);a&&ne(a,t.totalReferrals||0),o&&ne(o,`MWK `+(t.totalGross||0).toLocaleString()),s&&ne(s,n||`No referral link available`),Pe(r,i)}else throw Error(e.message||`Failed to load referrals`)}).catch(e=>{console.error(`Referral data fetch failed:`,e);let t=document.getElementById(`referral-list`);t&&(t.innerHTML=`
          <div style="text-align:center;padding:30px;color:#c09a8a;background:rgba(45,35,39,0.03);border-radius:12px;">
            <div style="margin-bottom:8px;">${m.alert}</div>
            <div style="font-size:14px;font-weight:600;color:#2d2327;">Failed to load referrals</div>
            <div style="font-size:12px;color:#5a4a4a;">${e.message||`Please refresh the page`}</div>
            <button onclick="loadReferralData()" style="margin-top:12px;padding:8px 20px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Retry</button>
          </div>
        `)})}function Pe(e,t){let n=document.getElementById(`referral-list`);if(!n)return;if((e||[]).length+(t||[]).length===0){n.innerHTML=`
      <div style="text-align:center;padding:40px;color:#5a4a4a;background:rgba(45,35,39,0.03);border-radius:12px;">
        <div style="margin-bottom:8px;">${m.send}</div>
        <div style="font-size:14px;font-weight:600;color:#2d2327;">No referrals yet</div>
        <div style="font-size:12px;color:#5a4a4a;">Share your link to start earning</div>
      </div>
    `;return}let r=``;e&&e.length>0&&(r+=`<div style="font-size:12px;font-weight:600;color:#c09a8a;margin-bottom:6px;">${m.user} Level 1 (${e.length})</div>`,e.forEach(e=>{let t=V(e.referred_name||`Anonymous`),n=V(e.referred_email||``),i=e.is_paid||!1,a=parseFloat(e.bonus_amount||0);r+=`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:10px;margin-bottom:6px; color:#2d2327;">
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(192,154,138,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;color:#c09a8a;font-size:12px;border:1px solid rgba(192,154,138,0.2);">
            ${t.charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;">${t}</div>
            <div style="font-size:11px;color:#5a4a4a;">${n}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;font-weight:700;color:${i?`#10B981`:`#F59E0B`};">${i?m.checkCircle:m.clock}</div>
            <div style="font-size:10px;color:#5a4a4a;">${i?`MWK `+a.toLocaleString():`Pending`}</div>
          </div>
        </div>
      `})),t&&t.length>0&&(r+=`<div style="font-size:12px;font-weight:600;color:#c09a8a;margin-top:12px;margin-bottom:6px;">${m.users} Level 2 (${t.length})</div>`,t.forEach(e=>{let t=V(e.referred_name||`Anonymous`),n=V(e.referred_email||``),i=e.is_paid||!1,a=parseFloat(e.bonus_amount||0);r+=`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:10px;margin-bottom:6px; color:#2d2327;opacity:0.8;">
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(192,154,138,0.05);display:flex;align-items:center;justify-content:center;font-weight:700;color:#5a4a4a;font-size:12px;border:1px solid rgba(192,154,138,0.1);">
            ${t.charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;">${t}</div>
            <div style="font-size:11px;color:#5a4a4a;">${n}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;font-weight:700;color:${i?`#10B981`:`#F59E0B`};">${i?m.checkCircle:m.clock}</div>
            <div style="font-size:10px;color:#5a4a4a;">${i?`MWK `+a.toLocaleString():`Pending`}</div>
          </div>
        </div>
      `})),n.innerHTML=r}function V(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}async function Fe(e){if(!/^image\/(jpeg|png|webp)$/i.test(e.type))return e;try{let t=await createImageBitmap(e,{imageOrientation:`from-image`}),n=Math.min(1,1920/Math.max(t.width,t.height)),r=Math.round(t.width*n),i=Math.round(t.height*n),a=document.createElement(`canvas`);a.width=r,a.height=i,a.getContext(`2d`).drawImage(t,0,0,r,i);let o=await new Promise(e=>a.toBlob(e,`image/jpeg`,.82));return o&&o.size>0&&o.size<e.size?new File([o],e.name.replace(/\.[^.]+$/,``)+`.jpg`,{type:`image/jpeg`}):e}catch{return e}}function Ie(e){let t=V(e||``);return t?t.replace(/(^|[\s(])((?:https?:\/\/|www\.)[^\s<>"']+)/g,(e,t,n)=>{let r=n.startsWith(`www.`)?`https://`+n:n;return t+`<a href="`+r+`" target="_blank" rel="noopener noreferrer" style="color:#c09a8a;font-weight:600;text-decoration:underline;word-break:break-all;">`+n+`</a>`}).replace(/\n/g,`<br>`):``}window.copyReferralLink=function(){let e=document.getElementById(`ref-link`);if(!e){window.showToast(m.alert+` Referral link not available`);return}let t=e.textContent.trim();if(t===`Loading...`||!t||t===`No referral link available`){window.showToast(m.alert+` No referral link available`);return}navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t).then(()=>window.showToast(m.check+` Link copied to clipboard!`)).catch(()=>Le(t)):Le(t)};function Le(e){let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.left=`-9999px`,document.body.appendChild(t),t.focus(),t.select();try{document.execCommand(`copy`),window.showToast(m.check+` Link copied to clipboard!`)}catch{window.showToast(m.x+` Failed to copy link`)}document.body.removeChild(t)}function Re(e){let t=T||{balanceAvailable:0,grossEarnings:0,storeCredit:0},n=b?.registrationFeeMwk||1e4,r=parseFloat(t.grossEarnings)||0,i=parseFloat(t.balanceAvailable)||0,a=parseFloat(t.storeCredit)||0;e.innerHTML=`
    <div style="margin-bottom: 20px; text-align: center;">
      <div style="font-size: 11px; opacity: 0.5; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">Lifetime Total Earnings</div>
      <div class="numbers" style="font-size: 42px; font-weight: 700; color: #2d2327;">${I(r)}</div>
      <div style="display: flex; justify-content: center; gap: 20px; font-size: 13px; margin-top: 8px;">
        <span style="color: #2d2327; display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2d2327;"></span> 
          ${F(i)} Withdrawable
        </span>
        <span style="color: #c09a8a; display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #c09a8a;"></span> 
          ${F(a)} Learning Wallet
        </span>
      </div>
    </div>

    <!-- THE 3 CARDS -->
    <div class="grid" style="margin-top: 0;">
      
      <!-- CARD 1: AVAILABLE BALANCE (Cash Wallet) -->
      <div class="glass card reveal" style="grid-column: span 2;">
        <div class="label">
          <span style="display: flex; gap: 8px; align-items: center;">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Cash Wallet
          </span>
          <span class="glass-pill-white" style="background: #2d2327; color: #ffffff;">WITHDRAWABLE</span>
        </div>
        <div class="numbers amount hero-num">${I(i)}</div>
        <div class="sub-caption">Airtel Money / TNM Mpamba • Withdrawal fees apply</div>
        <button onclick="openWithdrawModal()" class="withdraw-cta-glass" style="background: #2d2327; color: #ffffff;">
          WITHDRAW FUNDS <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>

      <!-- CARD 2: LEARNING WALLET (Store Credit) -->
      <div class="glass card reveal">
        <div class="label">
          <span style="display: flex; gap: 8px; align-items: center;">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Learning Wallet
          </span>
          <span class="glass-pill" style="border-color: #c09a8a; color: #c09a8a;">NON-WITHDRAWABLE</span>
        </div>
        <div class="numbers amount" style="color: #c09a8a;">${I(a)}</div>
        <div class="sub-caption">Use this to buy Courses & Books</div>
        <button onclick="loadPanel('courses')" style="width:100%; margin-top: 16px; padding: 10px; background: transparent; border: 1px solid #c09a8a; color: #c09a8a; border-radius: 100px; font-size: 11px; font-weight: 800; cursor: pointer;">
          BROWSE COURSES →
        </button>
      </div>

      <!-- CARD 3: LOCKED ENTRY STAKE -->
      <div class="glass card reveal" style="opacity: 0.6;">
        <div class="label">
          <span style="display: flex; gap: 8px; align-items: center;">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#5a4a4a" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Entry Stake
          </span>
          <span class="glass-pill" style="background: rgba(90, 74, 74, 0.1); color: #5a4a4a;">LOCKED</span>
        </div>
        <div class="numbers amount" style="font-size: 20px;">${F(n)}</div>
        <div class="sub-caption">Initial deposit • Security hold</div>
      </div>

    </div>

    <!-- QUICK ACTIONS -->
    <div class="section-title-wrap reveal" style="margin-top: 30px;">
      <h3>Quick Actions</h3>
    </div>

    <div class="reveal" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;">
      <div class="qb" onclick="loadPanel('earn')" style="min-width:0;height:140px;">
        <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400"/>
        <div class="qb-g"></div>
        <div class="qb-icon-badge">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div class="qb-text-content">
          <div class="qb-title">Watch & Earn</div>
          <div class="qb-desc" id="overview-earn-desc">Watch & earn rewards</div>
        </div>
      </div>

      <div class="qb" onclick="loadPanel('library')" style="min-width:0;height:140px;">
        <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400"/>
        <div class="qb-g"></div>
        <div class="qb-icon-badge">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div class="qb-text-content">
          <div class="qb-title">Free Books</div>
          <div class="qb-desc">${b?.bookCount?b.bookCount.toLocaleString()+` titles`:`Explore the library`}</div>
        </div>
      </div>

      <div class="qb" onclick="loadPanel('courses')" style="min-width:0;height:140px;">
        <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800"/>
        <div class="qb-g"></div>
        <div class="qb-icon-badge">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        <div class="qb-text-content">
          <div class="qb-title">Courses</div>
          <div class="qb-desc">${b?.coursePackCount?b.coursePackCount.toLocaleString()+` packs`:`Explore courses`}</div>
        </div>
      </div>

      <div class="qb" onclick="loadPanel('wallet')" style="min-width:0;height:140px;">
        <img src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=400"/>
        <div class="qb-g"></div>
        <div class="qb-icon-badge">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#2d2327" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="qb-text-content">
          <div class="qb-title">Withdraw</div>
          <div class="qb-desc">Instant</div>
        </div>
      </div>
    </div>
  `}function ze(e){let t=T||{balanceAvailable:0,grossEarnings:0,totalWithdrawn:0,storeCredit:0},n=E||[],r=t.balanceAvailable||0,i=t.grossEarnings||0,a=t.totalWithdrawn||0,o=t.storeCredit||0,s=``;s=n.length>0?n.slice(0,10).map(e=>{let t=e.transaction_type===`referral_bonus`||e.transaction_type===`earn_watch`,n=t?`#10B981`:`#c09a8a`,r=t?`+`:`-`;return`
        <div style="padding:14px 16px;border-bottom:1px solid rgba(45,35,39,0.05);display:flex;align-items:center;justify-content:space-between;gap:12px; color:#2d2327;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
            <div style="width:36px;height:36px;border-radius:10px;background:${t?`rgba(16,185,129,0.08)`:`rgba(192,154,138,0.08)`};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${n}" stroke-width="2.5">
                ${t?`<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>`:`<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>`}
              </svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:13px;">${e.description||e.transaction_type}</div>
              <div style="font-size:11px;color:#5a4a4a;">${new Date(e.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="numbers" style="font-weight:700;font-size:15px;color:${n};white-space:nowrap;">${r}${F(e.amount)}</div>
        </div>
      `}).join(``):`<div style="text-align:center;padding:40px;color:#5a4a4a;">No transactions yet</div>`,e.innerHTML=`
    <div style="margin-bottom:16px;">
      <div class="glass" style="padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div>
            <p style="color:#5a4a4a;font-size:13px;margin-bottom:4px;">Cash Wallet (Withdrawable)</p>
            <h3 class="numbers" style="font-size:34px;color:#2d2327;">${I(r)}</h3>
          </div>
          <div style="width:44px;height:44px;border-radius:12px;background:#2d2327;display:flex;align-items:center;justify-content:center;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>
        
        <!-- Store Credit Display -->
        <div style="background:rgba(192,154,138,0.08);border-radius:12px;padding:12px;margin-bottom:16px;border:1px solid rgba(192,154,138,0.2);">
          <p style="font-size:11px;color:#5a4a4a;">Learning Wallet (Store Credit)</p>
          <p class="numbers" style="font-size:20px;font-weight:700;color:#c09a8a;">${I(o)}</p>
          <p style="font-size:10px;color:#5a4a4a;margin-top:2px;">${m.info} Use this to buy courses and books</p>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          <div style="background:rgba(16,185,129,0.08);border-radius:12px;padding:12px;">
            <p style="font-size:11px;color:#5a4a4a;">Total Earned</p>
            <p class="numbers" style="font-size:16px;font-weight:700;color:#10B981;">${I(i)}</p>
          </div>
          <div style="background:rgba(192,154,138,0.08);border-radius:12px;padding:12px;">
            <p style="font-size:11px;color:#5a4a4a;">Total Withdrawn</p>
            <p class="numbers" style="font-size:16px;font-weight:700;color:#c09a8a;">${I(a)}</p>
          </div>
        </div>
        
        <button onclick="openWithdrawModal()" class="withdraw-cta-glass">Withdraw Funds</button>
      </div>

      <h3 style="font-size:10px;letter-spacing:1px;opacity:0.4;text-transform:uppercase;margin-top:24px;margin-bottom:12px; color:#5a4a4a;">Recent Transactions</h3>
      <div class="glass" style="padding:0;overflow:hidden;">
        ${s}
      </div>
    </div>
  `}function Be(){let e=document.getElementById(`withdraw-overlay`);e&&e.remove()}function Ve(){let e=document.getElementById(`wd-amount`),t=document.getElementById(`wd-preview`);if(!e||!t)return;let n=parseFloat(e.value)||0;if(n>=6e3){let e=He(n),r=n-e,i=We(n);t.style.display=`block`,document.getElementById(`wd-preview-amount`).textContent=F(n),document.getElementById(`wd-preview-fee`).textContent=F(e),document.getElementById(`wd-preview-tier`).textContent=i,document.getElementById(`wd-preview-net`).textContent=F(r)}else t.style.display=`none`}function He(e){if(e<=0||e<7e3)return 0;let t;t=e<2e4?1e3:1e3+25*(Math.floor((e-2e4)/1e4)+1);let n=Ue(e);return t+n}function Ue(e){for(let t of[{min:3e4,max:39999,bonus:1e3},{min:4e4,max:49999,bonus:1500},{min:5e4,max:59999,bonus:1500},{min:6e4,max:69999,bonus:1500},{min:7e4,max:79999,bonus:1600},{min:8e4,max:89999,bonus:1700},{min:9e4,max:99999,bonus:1800},{min:1e5,max:119999,bonus:3e3},{min:12e4,max:139999,bonus:3100},{min:14e4,max:169999,bonus:3300},{min:17e4,max:189999,bonus:1400},{min:19e4,max:1/0,bonus:4e3}])if(e>=t.min&&e<=t.max)return t.bonus;return 0}function We(e){if(e<7e3)return`No fee — below minimum MWK 7,000`;if(e<2e4)return`Tier 1: 7k-19k → 1,000 MWK`;{let t=Math.floor((e-2e4)/1e4),n=2e4+t*1e4,r=n+9999,i=1e3+25*(t+1)+Ue(e);return`Tier `+(t+2)+`: `+n/1e3+`k-`+r/1e3+`k → `+i.toLocaleString()+` MWK`}}function Ge(e){e.preventDefault(),e.stopPropagation();let t=w||{},n=T||{balanceAvailable:0},r=document.getElementById(`wd-name`)?.value?.trim()||``,i=document.getElementById(`wd-phone`)?.value?.trim()||``,a=parseFloat(document.getElementById(`wd-amount`)?.value)||0;function o(e){let t=document.getElementById(`wd-error`);t&&(t.textContent=e,t.style.display=`block`),window.showToast(e)}function s(){let e=document.getElementById(`wd-error`);e&&(e.style.display=`none`)}if(s(),!i){o(`Please enter the mobile number you want the money sent to`);return}let c=i.replace(/[\s\-()]/g,``);if(!/^(\+?265|0)[0-9]{9,10}$/.test(c)){o(`Please enter a valid Malawian phone number (e.g., 0999123456 or +265999123456)`);return}if(!a||isNaN(a)||a<=0){o(`Please enter a valid amount`);return}if(a<y.MIN_WITHDRAWAL){o(`Minimum withdrawal is MWK ${y.MIN_WITHDRAWAL.toLocaleString()}`);return}if(a>y.MAX_WITHDRAWAL){o(`Maximum withdrawal is MWK ${y.MAX_WITHDRAWAL.toLocaleString()}`);return}if(a>n.balanceAvailable){o(`Insufficient balance`);return}let l=He(a),u=a-l;We(a);let d=e.target.querySelector(`button[type="submit"]`);d&&(d.disabled=!0,d.innerHTML=m.clock+` Processing...`),window.showToast(m.clock+` Processing withdrawal... (Fee: MWK `+l.toLocaleString()+`)`),C(`/wallet/withdraw`,{method:`POST`,body:JSON.stringify({userId:t.id,amount:a,cardholderName:r,phoneNumber:i})},0).then(e=>{e.success?(T&&(T.balanceAvailable-=a,T.totalWithdrawn+=u),E&&E.unshift({id:`wd_`+Date.now(),transaction_type:`withdrawal`,amount:a,description:`Withdrawal to ${i} (Fee: MWK ${l})`,created_at:new Date().toISOString()}),window.closeWithdrawModal(),tt(e,a,l,u,i,r,t.id)):e.refunded?et(e.message||`Your money has been fully refunded. Please try again later.`,!!e.rateLimited):(o(e.message||`Withdrawal failed`),e.message&&/(unauthorized|sign in|session)/i.test(e.message)&&Ke())}).catch(e=>{let t=e&&e.message||`Network error. Please try again.`;o(t),/401|unauthorized|session/i.test(t)&&Ke()}).finally(()=>{d&&(d.disabled=!1,d.textContent=`Confirm Withdrawal`)})}function Ke(){try{localStorage.removeItem(`wisdom_vault_user`),localStorage.removeItem(`wisdom_vault_session`)}catch{}i(),window.showToast&&window.showToast(`Your session expired. Please sign in again.`),setTimeout(()=>{window.location.href=`/login`},1200)}var H=null,qe=!1,Je=900*1e3,Ye=[`mousemove`,`keydown`,`scroll`,`touchstart`,`click`];function Xe(){H&&clearTimeout(H),H=setTimeout(Ze,Je)}function Ze(){qe=!1;for(let e of Ye)document.removeEventListener(e,Xe,{passive:!0});H&&=(clearTimeout(H),null),Ke()}function Qe(){if(!qe){qe=!0;for(let e of Ye)document.addEventListener(e,Xe,{passive:!0});Xe()}}function $e(){qe=!1,H&&=(clearTimeout(H),null);for(let e of Ye)document.removeEventListener(e,Xe,{passive:!0})}function et(e,t){let n=document.getElementById(`wd-error`);n&&(n.style.display=`flex`,n.style.alignItems=`flex-start`,n.style.gap=`10px`,n.style.background=`rgba(239,68,68,0.08)`,n.style.border=`1px solid rgba(239,68,68,0.25)`,n.style.borderRadius=`12px`,n.style.padding=`14px 16px`,n.style.color=`#991B1B`,n.style.fontSize=`13px`,n.style.lineHeight=`1.5`,n.innerHTML=[`<span class="wd-refund-icon" style="flex-shrink:0;width:38px;height:38px;border-radius:50%;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;">${(m.x||``).replace(/width="14" height="14"/g,`width="20" height="20"`)}</span>`,`<div style="flex:1;">`,`  <div style="font-weight:700;margin-bottom:3px;">${t?`Rate limit — please try again later`:`Something went wrong`}</div>`,`  <div style="font-size:12px;color:#7F1D1D;">${e}</div>`,`</div>`].join(``),n.classList.remove(`wd-refund-shake`),n.offsetWidth,n.classList.add(`wd-refund-shake`));let r=t?`Rate limit — try again later. Your money has been refunded.`:`Something went wrong. Your money has been refunded. Try again later.`;window.showToast((m.alert||m.x||``)+` `+r)}function tt(e,t,n,r,i,a,o){let s=e.withdrawal?.provider||`Mobile Money`,c=e.withdrawal?.paymentMethod||``,l=e.withdrawal?.id||``,u=e.withdrawal?.status||`processing`,d=c===`paychangu_mobile_money`,f={done:!1,pollTimer:null,autoCloseTimer:null,attempts:0},p=u;function m(e){return e===`completed`?`✅ Money sent to your mobile wallet!`:e===`failed`?`❌ Withdrawal failed. The full amount has been refunded to your wallet.`:e===`rejected`?`❌ Withdrawal rejected.`:e===`pending`&&!d?`📋 Submitted — an admin will review and pay it out shortly.`:`⏳ Processing... Your money is being sent. This usually takes a minute.`}function h(e){return e===`completed`?`#2E7D32`:e===`failed`||e===`rejected`?`#C0392B`:`#B7791F`}let g=document.createElement(`div`);g.id=`withdraw-success-overlay`,g.style.cssText=`position:fixed;inset:0;background:rgba(45,35,39,0.5);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`,g.innerHTML=`
    <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:20px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(45,35,39,0.1);padding:32px;text-align:center;color:#2d2327;position:relative;z-index:10000;">
      <div id="wds-icon-wrap" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#B7791F,#8B5E34);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 32px rgba(76,175,80,0.3);">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 id="wds-title" style="font-size:22px;font-weight:700;margin-bottom:8px;">Withdrawal Submitted!</h2>
      <p id="wds-msg" style="font-size:14px;color:#5a4a4a;margin-bottom:24px;line-height:1.5;">${m(p)}</p>
      
      <div style="background:rgba(192,154,138,0.08);border:1px solid rgba(192,154,138,0.15);border-radius:14px;padding:16px;margin-bottom:24px;text-align:left;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;color:#5a4a4a;">Amount</span>
          <span style="font-size:14px;font-weight:700;">MWK ${t.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;color:#5a4a4a;">Fee</span>
          <span style="font-size:14px;font-weight:600;">MWK ${n.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;color:#5a4a4a;">You Receive</span>
          <span style="font-size:16px;font-weight:700;color:#2E7D32;">MWK ${r.toLocaleString()}</span>
        </div>
        <div style="height:1px;background:rgba(192,154,138,0.2);margin:10px 0;"></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:12px;color:#5a4a4a;">Sent To</span>
          <span style="font-size:13px;font-weight:600;">${i}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:12px;color:#5a4a4a;">Provider</span>
          <span style="font-size:13px;font-weight:600;">${s}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:12px;color:#5a4a4a;">Status</span>
          <span id="wds-status" style="font-size:13px;font-weight:600;color:${h(p)};">${m(p)}</span>
        </div>
      </div>
      
      <button id="wds-done" style="width:100%;padding:14px;background:linear-gradient(135deg,#B7791F,#8B5E34);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(139,94,52,0.25);">
        Done
      </button>
    </div>
  `,document.body.appendChild(g);function _(){f.autoCloseTimer&&=(clearTimeout(f.autoCloseTimer),null);let e=document.getElementById(`withdraw-success-overlay`);e&&e.remove()}let v=document.getElementById(`wds-done`);v&&v.addEventListener(`click`,()=>{_(),typeof q==`function`&&o&&q(o)});function y(e){f.done=!0,f.pollTimer&&=(clearTimeout(f.pollTimer),null),typeof q==`function`&&o&&q(o),v&&(v.disabled=!1,v.style.background=e===`completed`?`linear-gradient(135deg,#4CAF50,#2E7D32)`:`linear-gradient(135deg,#B7791F,#8B5E34)`);let t=e===`completed`?`✅ Money sent to `+i:e===`failed`||e===`rejected`?e===`failed`?`❌ Withdrawal failed — the full amount has been refunded to your balance.`:`❌ Withdrawal rejected.`:``;t&&(f.autoCloseTimer=setTimeout(()=>{_(),window.showToast&&window.showToast(t)},2600))}function b(e,t){p=e;let n=document.getElementById(`wds-title`),r=document.getElementById(`wds-msg`),i=document.getElementById(`wds-status`),a=document.getElementById(`wds-icon-wrap`);n&&(n.textContent=e===`completed`?`Withdrawal Successful!`:e===`failed`||e===`rejected`?`Withdrawal Failed`:`Withdrawal Submitted!`),r&&(r.textContent=m(e)),i&&(i.textContent=m(e),i.style.color=h(e)),a&&(a.style.background=e===`completed`?`linear-gradient(135deg,#4CAF50,#2E7D32)`:e===`failed`||e===`rejected`?`linear-gradient(135deg,#E74C3C,#C0392B)`:`linear-gradient(135deg,#B7791F,#8B5E34)`),t&&y(e)}function x(){if(!(f.done||!l)){if(document.hidden){f.pollTimer=setTimeout(x,8e3);return}if(f.attempts>=8){f.done=!0;let e=document.getElementById(`wds-status`),t=document.getElementById(`wds-done`);e&&(e.textContent=`Still processing — we will notify you once your money is sent.`),t&&(t.disabled=!1);return}f.attempts++,C(`/wallet/withdrawal-status${o?`?userId=${encodeURIComponent(o)}&withdrawalId=${l}`:`?withdrawalId=${l}`}`).then(e=>{if(!e||!e.success||!e.withdrawals||e.withdrawals.length===0)return;let t=e.withdrawals[0];t.status===`completed`||t.status===`failed`||t.status===`rejected`?b(t.status,!0):f.pollTimer=setTimeout(x,4e3)}).catch(e=>{let t=e&&e.message||``;if(/401|unauthorized|session/i.test(t)){f.done=!0;let e=document.getElementById(`wds-done`);e&&(e.disabled=!1);let t=document.getElementById(`wds-status`);t&&(t.textContent=`Processing — we will notify you once your money is sent.`),typeof Ke==`function`&&Ke();return}f.pollTimer=setTimeout(x,4e3)})}}u===`completed`||u===`failed`||u===`rejected`?b(u,!0):(u===`processing`||u===`pending`)&&d&&(v&&(v.disabled=!0),f.pollTimer=setTimeout(x,3e3))}function nt(){let e=w||{},t=T||{balanceAvailable:0},n=document.getElementById(`withdraw-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`withdraw-overlay`,r.style.cssText=`position:fixed;inset:0;background:rgba(45,35,39,0.5);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`,r.innerHTML=`
    <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:20px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(45,35,39,0.1);position:relative;z-index:10000;padding:20px; color:#2d2327;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 style="font-family:'Clash Display',sans-serif;font-size:20px;font-weight:700;">Withdraw Funds</h2>
        <button onclick="closeWithdrawModal()" style="background:rgba(45,35,39,0.05);border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px;color:#2d2327;display:flex;align-items:center;justify-content:center;">${m.close}</button>
      </div>
      
      <div style="background:rgba(192,154,138,0.1);border-radius:14px;padding:16px;margin-bottom:20px;">
        <p style="font-size:13px;color:#5a4a4a;margin-bottom:4px;">Available Balance</p>
        <p class="numbers" style="font-size:28px;font-weight:700;">${I(t.balanceAvailable)}</p>
      </div>
      
      <!-- NEW: Fee Structure Info -->
      <div style="background:rgba(45,35,39,0.03);border-radius:10px;padding:12px;margin-bottom:16px;border:1px solid rgba(45,35,39,0.05);">
        <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:6px;">${m.chart} Fee Structure</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;color:#5a4a4a;">
          <span>7,000 - 19,999: MWK 1,000</span>
          <span>20,000 - 29,999: MWK 1,025</span>
          <span>30,000 - 39,999: MWK 2,050</span>
          <span>40,000 - 49,999: MWK 2,575</span>
          <span>50,000 - 59,999: MWK 2,600</span>
          <span>60,000 - 69,999: MWK 2,625</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;color:#5a4a4a;margin-top:4px;">
          <span>70,000 - 79,999: MWK 2,750</span>
          <span>80,000 - 89,999: MWK 2,875</span>
          <span>90,000 - 99,999: MWK 3,000</span>
          <span>100,000 - 119,999: MWK 4,225+</span>
          <span>120,000 - 139,999: MWK 4,375+</span>
          <span>140,000 - 169,999: MWK 4,625+</span>
          <span>170,000 - 189,999: MWK 2,825+</span>
          <span>190,000+: MWK 5,450+</span>
        </div>
      </div>

      <!-- Inline error message: shows what went wrong right here in the modal,
           so failures are never silent even if the toast is missed. -->
      <div id="wd-error" style="display:none;background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.3);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#C0392B;line-height:1.5;"></div>
      
      <form id="withdraw-form" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Full Name <span style="font-weight:400;color:#5a4a4a;">(optional)</span></label>
          <input type="text" id="wd-name" value="${e?.fullName||``}" placeholder="Full name (optional)" style="width:100%;padding:12px 14px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:14px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;">
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Mobile Number <span style="color:#c0392b;">*</span></label>
          <input type="tel" id="wd-phone" value="${e?.phone||``}" placeholder="+265 999 123 456" required style="width:100%;padding:12px 14px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:14px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;">
          <p style="font-size:11px;color:#5a4a4a;margin-top:4px;">Your money is sent straight to this number.</p>
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Amount (MWK)</label>
          <input type="number" id="wd-amount" placeholder="0.00" min="${y.MIN_WITHDRAWAL}" step="100" required style="width:100%;padding:12px 14px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:14px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;">
          <p style="font-size:11px;color:#5a4a4a;margin-top:4px;">Min: MWK ${y.MIN_WITHDRAWAL.toLocaleString()} | Max: MWK ${y.MAX_WITHDRAWAL.toLocaleString()} | Fees vary by amount (see above)</p>
        </div>
        
        <!-- Updated Preview with Tier Info -->
        <div id="wd-preview" style="display:none;background:rgba(45,35,39,0.03);border-radius:12px;padding:14px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#5a4a4a;margin-bottom:6px;">
            <span>Withdrawal Amount</span>
            <span id="wd-preview-amount">MWK 0.00</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#5a4a4a;margin-bottom:6px;">
            <span>Processing Fee</span>
            <span id="wd-preview-fee" style="color:#c09a8a;font-weight:600;">MWK 0.00</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#5a4a4a;margin-bottom:6px;border-bottom:1px solid rgba(45,35,39,0.05);padding-bottom:6px;">
            <span>Fee Tier</span>
            <span id="wd-preview-tier" style="color:#5a4a4a;">-</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;padding-top:4px;">
            <span>You will receive</span>
            <span id="wd-preview-net" style="color:#10B981;">MWK 0.00</span>
          </div>
        </div>
        
        <button type="submit" style="width:100%;padding:15px;background:#2d2327;color:#ffffff;border:none;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(45,35,39,0.1);">Confirm Withdrawal</button>
      </form>
    </div>
  `,r.addEventListener(`click`,e=>{e.target===r&&Be()}),document.body.appendChild(r),document.getElementById(`withdraw-form`).addEventListener(`submit`,Ge),document.getElementById(`wd-amount`).addEventListener(`input`,Ve)}function rt(e){let t=Date.now()-new Date(e).getTime(),n=Math.floor(t/1e3),r=Math.floor(n/60),i=Math.floor(r/60),a=Math.floor(i/24);return n<5?`Just now`:r<1?`a few seconds ago`:r<2?`1 minute ago`:r<60?r+` minutes ago`:i<2?`1 hour ago`:i<24?i+` hours ago`:a<2?`1 day ago`:a<7?a+` days ago`:a<30?Math.floor(a/7)+` weeks ago`:a<365?Math.floor(a/30)+` months ago`:Math.floor(a/365)+` years ago`}function it(e){return{withdrawal_approved:m.checkCircle,withdrawal_rejected:m.x,withdrawal_requested:m.send,payment_approved:m.checkCircle,payment_rejected:m.x,referral_approved:m.trophy,second_level_referral_approved:m.star,referral_created:m.send,second_level_referral_created:m.star,referral_bonus:m.dollar,earn_watch:m.film,system:m.megaphone,content_added:m.book,welcome:m.hand,course_access:m.book,course_purchased:m.graduation,course_completed:m.trophy,content_purchased:m.book}[e]||m.mail}function at(e){let t=document.getElementById(`badge`);if(!t)return;let n=parseInt(t.textContent)||0;e>0?(t.style.display=`flex`,t.textContent=e>99?`99+`:e,e>n&&n>=0&&(Se(),showToast(m.mail+` You have `+(e===1?`a new notification`:e+` new notifications`)))):t.style.display=`none`}var ot=!1;async function U(){if(document.hidden||ot)return;let e=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(e.id){ot=!0;try{let t=await C(`/notifications?userId=`+e.id);if(t.success){at(t.unreadCount),ae=t.notifications||[];let e=document.getElementById(`notifDrop`);e&&e.style.display===`block`&&st(t.notifications)}}catch(e){console.error(`Error fetching notifications:`,e)}finally{ot=!1}}}function st(e){let t=document.getElementById(`notification-list`);if(!t)return;if(!e||e.length===0){t.innerHTML=`
      <div style="padding:30px;text-align:center;color:#5a4a4a;">
        <div style="margin-bottom:8px;">${m.mail}</div>
        <div style="font-size:14px;font-weight:500;color:#2d2327;">No notifications</div>
        <div style="font-size:12px;color:#5a4a4a;">We'll notify you when something happens</div>
      </div>
    `;return}let n=``;for(let t=0;t<Math.min(e.length,10);t++){let r=e[t],i=r.is_read?`opacity:0.6;`:``,a=it(r.type),o=r.link||`#`;n+=`
      <div style="padding:12px;display:flex;gap:10px;margin-bottom:8px;${i}cursor:pointer; color:#2d2327;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:10px;" onclick="window.markNotificationRead('${r.id}', '${o}')">
        <div style="width:32px;height:32px;border-radius:10px;background:rgba(192,154,138,0.1);border:1px solid rgba(192,154,138,0.2);display:flex;align-items:center;justify-content:center">
          ${a}
        </div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600">${r.title}</div>
          <div style="font-size:11px;opacity:.5;margin-top:2px;color:#5a4a4a;">${r.message}</div>
          <div style="font-size:9px;opacity:.35;margin-top:4px;color:#5a4a4a;">${rt(r.created_at)}</div>
        </div>
        ${r.is_read?``:`<div style="width:6px;height:6px;border-radius:50%;background:#c09a8a;margin-top:6px"></div>`}
      </div>
    `}t.innerHTML=n}window.toggleNotif=function(){let e=document.getElementById(`notifDrop`);if(!e)return;let t=e.style.display===`block`;e.style.display=t?`none`:`block`,t||(ae&&ae.length>0&&st(ae),U())},window.markNotificationRead=async function(t,n){let r=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(r.id)try{let i=document.getElementById(`badge`);if(i&&i.style.display!==`none`){let e=parseInt(i.textContent)||0;e>0&&at(e-1)}await fetch(`/api/notifications`,{method:`PUT`,headers:S(),body:JSON.stringify({userId:r.id,notificationIds:[t]})}),e(`/notifications`),U();let a=document.getElementById(`notifDrop`);a&&(a.style.display=`none`),n&&n!==`#`&&(window.location.href=n)}catch(e){console.error(`Error marking notification read:`,e)}},window.markAll=function(){let t=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);t.id&&(at(0),fetch(`/api/notifications`,{method:`PUT`,headers:S(),body:JSON.stringify({userId:t.id,notificationIds:[]})}).then(()=>{e(`/notifications`),U(),window.showToast(`All notifications marked as read`)}).catch(e=>console.error(`Error marking all read:`,e)))};function ct(){let e=document.getElementById(`bell`);if(!e)return;let t=e.cloneNode(!0);e.parentNode.replaceChild(t,e),t.addEventListener(`click`,function(e){e.stopPropagation(),window.toggleNotif()});let n=function(e){let t=document.getElementById(`bell`),n=document.getElementById(`notifDrop`);t&&n&&!t.contains(e.target)&&!n.contains(e.target)&&(n.style.display=`none`)};document.removeEventListener(`click`,n),document.addEventListener(`click`,n),setTimeout(U,500)}function lt(){document.getElementById(`moreSheet`).classList.add(`open`)}function ut(){document.getElementById(`moreSheet`).classList.remove(`open`)}function dt(e){e.innerHTML=`
    <div class="glass" style="padding:14px 18px;margin-bottom:16px; color:#2d2327;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          </div>
          <h1 class="numbers" style="font-size:18px;font-weight:700;">Earn & Watch</h1>
        </div>
        <div style="background:rgba(45,35,39,0.05);padding:6px 14px;border-radius:100px;display:flex;align-items:center;gap:6px; color:#2d2327;">
          <span style="color:#c09a8a;">+</span>
          <span class="numbers" style="font-weight:600;font-size:14px;" id="earn-balance">MWK 0.00</span>
        </div>
      </div>
    </div>

    <div class="glass" style="padding:16px;margin-bottom:16px; color:#2d2327;">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:6px;">Watch & <span style="color:#c09a8a;">Earn</span></h2>
      <p style="font-size:13px;color:#5a4a4a;line-height:1.5;">Complete the 90-second watch time to claim your rewards.</p>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <div style="background:rgba(45,35,39,0.03);border-radius:10px;padding:10px 14px;flex:1;">
          <p style="font-size:11px;color:#5a4a4a;">Total Earned</p>
          <p class="numbers" style="font-size:18px;font-weight:700;color:#c09a8a;" id="total-earned">MWK 0.00</p>
        </div>
        <div style="background:rgba(45,35,39,0.03);border-radius:10px;padding:10px 14px;flex:1;">
          <p style="font-size:11px;color:#5a4a4a;">Watched Today</p>
          <p class="numbers" style="font-size:18px;font-weight:700;" id="watched-today">0</p>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="earn-filter-btn active" data-filter="all" style="flex:1;padding:8px;background:#2d2327;color:#ffffff;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">All</button>
      <button class="earn-filter-btn" data-filter="video" style="flex:1;padding:8px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">Videos</button>
      <button class="earn-filter-btn" data-filter="audio" style="flex:1;padding:8px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">Music</button>
    </div>

    <div id="earn-grid" style="display:grid;grid-template-columns:1fr;gap:14px;">
      <div style="text-align:center;padding:40px;color:#5a4a4a;">Loading content...</div>
    </div>

    <div id="earn-modal" style="display:none;position:fixed;inset:0;z-index:100;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);">
      <div style="position:absolute;inset:0;" id="earn-modal-bg"></div>
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;position:relative;z-index:101;padding:20px; color:#2d2327;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
          <div style="flex:1;padding-right:12px;">
            <h3 class="numbers" style="font-size:17px;font-weight:700;margin-bottom:4px;" id="earn-modal-title"></h3>
            <p style="font-size:13px;color:#5a4a4a;" id="earn-modal-desc"></p>
          </div>
          <button id="earn-modal-close-btn" style="width:30px;height:30px;border-radius:50%;background:rgba(45,35,39,0.05);border:none;cursor:pointer;font-size:16px;">${m.close}</button>
        </div>
        <div id="earn-modal-player" style="border-radius:12px;overflow:hidden;margin-bottom:14px;background:#000;"></div>
        <div style="background:rgba(45,35,39,0.03);border-radius:12px;padding:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="position:relative;width:64px;height:64px;">
                <svg style="width:64px;height:64px;transform:rotate(-90deg);">
                  <circle style="stroke:rgba(45,35,39,0.1);" stroke-width="5" fill="transparent" r="27" cx="32" cy="32"/>
                  <circle style="stroke:#c09a8a;transition:stroke-dashoffset 1s linear;" stroke-width="5" fill="transparent" r="27" cx="32" cy="32" stroke-dasharray="169.6" stroke-dashoffset="169.6" id="earn-progress"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                  <span class="numbers" style="font-size:16px;font-weight:700;" id="earn-countdown">90</span>
                </div>
              </div>
              <div><p style="font-size:11px;color:#5a4a4a;">Time</p><p style="font-size:13px;font-weight:600;" id="earn-timer-status">Watching...</p></div>
            </div>
            <div style="text-align:right;"><p style="font-size:11px;color:#5a4a4a;">Reward</p><p class="numbers" style="font-size:20px;font-weight:700;color:#c09a8a;" id="earn-modal-reward">MWK 0</p></div>
          </div>
          <button id="earn-claim-btn" style="display:none;width:100%;margin-top:12px;padding:12px;background:#2d2327;color:#ffffff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">Claim Reward</button>
        </div>
      </div>
    </div>
  `,pt(),ft(),vt()}function ft(){document.querySelectorAll(`.earn-filter-btn`).forEach(e=>{e.addEventListener(`click`,function(e){e.stopPropagation(),document.querySelectorAll(`.earn-filter-btn`).forEach(e=>{e.classList.remove(`active`),e.style.background=`rgba(45,35,39,0.05)`,e.style.color=`#2d2327`}),this.classList.add(`active`),this.style.background=`#2d2327`,this.style.color=`#ffffff`;let t=this.dataset.filter;document.querySelectorAll(`#earn-grid > div[data-type]`).forEach(e=>{let n=e.dataset.type||``;e.style.display=t===`all`||n===t?``:`none`})})})}function pt(){let e=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`),t=document.getElementById(`earn-grid`);!t||!e.id||C(`/earn/watch?userId=`+e.id).then(e=>{if(!e.success){t.innerHTML=`<div style="text-align:center;padding:40px;color:#c09a8a;">Failed to load content: `+(e.message||`Unknown error`)+`</div>`;return}let n=e.content||[];if(n.length===0){t.innerHTML=`<div style="text-align:center;padding:40px;color:#5a4a4a;">No content available. Check back later!</div>`;return}let r=n.filter(e=>e.is_watched);ce=e.todayStats?.watchedCount||r.length,se=e.todayStats?.totalEarned||r.reduce((e,t)=>e+(parseFloat(t.reward_amount)||0),0);let i=n.find(e=>!e.is_watched)||n[0];le=i&&parseFloat(i.reward_amount)||0,St(),t.innerHTML=n.map(e=>mt(e)).join(``),ht(),typeof Jn==`function`&&Jn()}).catch(()=>{t.innerHTML=`<div style="text-align:center;padding:40px;color:#c09a8a;">Failed to load content. Please refresh.</div>`})}function mt(e){let t=e.is_watched||!1,n=e.content_type===`video`,r=e.content_type===`audio`||e.video_platform===`audio`||e.external_link&&e.external_link.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i),i=e.thumbnail_url||e.cover_art||``,a=i&&i.length>0,o=parseFloat(e.reward_amount)||0,s=e.external_link||e.file_url||``,c=e.video_platform||`youtube`,l=parseInt(e.duration_seconds)||90,u=n?m.video+` Video`:r?m.music+` Music`:m.fileText+` Article`;return n?m.play:r?m.music:m.fileText,`
    <div data-type="${r?`audio`:n?`video`:`article`}" 
         data-id="${e.id}" 
         data-title="${e.title.replace(/"/g,`&quot;`)}" 
         data-reward="${o}" 
         data-link="${s.replace(/"/g,`&quot;`)}" 
         data-file-url="${(e.file_url||``).replace(/"/g,`&quot;`)}" 
         data-linktype="${c}" 
         data-duration="${l}"
         data-watched="${t}" 
         class="glass earn-content-card" style="padding:0; overflow:hidden; background: #ffffff; ${t?`opacity:0.6;`:``} border: 1px solid rgba(45,35,39,0.05);">
      <div style="position:relative;aspect-ratio:16/9;background:#080C1C;overflow:hidden;">
        ${a?`<img src="${i}" alt="" style="width:100%;height:100%;object-fit:cover;">`:`<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#2d2327);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:40px;">${r?`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`:n?`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"></polygon></svg>`:`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`}</div>`}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.4),transparent);"></div>
        ${t?`<div style="position:absolute;top:10px;right:10px;background:#10B981;color:white;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><polyline points="20,6 9,17 4,12"></polyline></svg> Earned</div>`:``}
        <div style="position:absolute;bottom:10px;left:10px;background:rgba(255,255,255,0.9);padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600; color:#2d2327;">${u}</div>
        <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.6);color:white;padding:2px 8px;border-radius:4px;font-size:10px;">${l}s</div>
      </div>
      <div style="padding:14px; color:#2d2327;">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:6px;">${e.title}</h3>
        <p style="font-size:12px;color:#5a4a4a;margin-bottom:12px;">${e.description||(r?`Listen to earn rewards`:`Watch to earn rewards`)}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <p class="numbers" style="font-size:18px;font-weight:700;color:#c09a8a;">+${o} MWK</p>
          <button class="earn-watch-btn" ${t?`disabled`:``} style="padding:8px 16px;background:${t?`rgba(45,35,39,0.05)`:`#2d2327`};color:${t?`#5a4a4a`:`#ffffff`};border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:${t?`not-allowed`:`pointer`};">
            ${t?`Earned`:r?`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M3 18v-6a9 9 0 0118 0v6"></path><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"></path></svg> Listen`:`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"></polygon></svg> Watch`}
          </button>
        </div>
      </div>
    </div>
  `}function ht(){document.querySelectorAll(`.earn-watch-btn`).forEach(e=>{e.addEventListener(`click`,function(e){e.preventDefault(),e.stopPropagation();let t=this.closest(`[data-id]`);if(!t)return;let n=t.dataset.id,r=t.dataset.title,i=parseFloat(t.dataset.reward),a=t.dataset.link||t.dataset.fileUrl||``,o=t.dataset.linktype||`youtube`,s=parseInt(t.dataset.duration)||90;t.dataset.watched!==`true`&&gt(n,r,i,a,o,s)})})}function gt(e,t,n,r,i,a){let o=a||90;document.getElementById(`earn-modal-title`).textContent=t,document.getElementById(`earn-modal-reward`).textContent=`MWK `+n.toFixed(2),document.getElementById(`earn-timer-status`).textContent=`Watching...`,document.getElementById(`earn-claim-btn`).style.display=`none`,document.getElementById(`earn-progress`).style.strokeDashoffset=`169.6`,document.getElementById(`earn-countdown`).textContent=o;let s=document.getElementById(`earn-progress`),c=2*Math.PI*27;s.style.strokeDasharray=c,s.style.strokeDashoffset=c;let l=document.getElementById(`earn-modal-player`);if(!r||r===``){l.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2d2327;color:#ffffff;padding:20px;text-align:center;flex-direction:column;">
      <div style="margin-bottom:16px;">${m.camera}</div>
      <div style="font-size:16px;font-weight:600;">No Video Available</div>
      <div style="font-size:12px;opacity:0.6;margin-top:8px;">This content does not have a video link.</div>
    </div>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}if(typeof X==`function`){let n=document.createElement(`div`);n.style.cssText=`width:100%;`,l.innerHTML=``,l.appendChild(n),X(r,n,{controls:!0,autoplay:!0,muted:!1,title:t,className:`earn-video-embed`}),document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}if(r.includes(`youtube.com`)||r.includes(`youtu.be`)){let t=r.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];if(t){l.innerHTML=`<iframe src="${r.includes(`/shorts/`),`https://www.youtube.com/embed/${t}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}" style="width:100%;height:100%;border:none;" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}}if(r.includes(`tiktok.com`)){let t=r.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);if(t){l.innerHTML=`<iframe src="https://www.tiktok.com/embed/v2/${t[1]}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}l.innerHTML=`
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2d2327;color:#ffffff;padding:20px;text-align:center;flex-direction:column;">
        <div style="margin-bottom:16px;">${m.music}</div>
        <div style="font-size:16px;font-weight:600;">TikTok Video</div>
        <div style="font-size:12px;opacity:0.6;margin-top:8px;">Click the link below to view</div>
        <a href="${r}" target="_blank" style="margin-top:12px;padding:10px 24px;background:#c09a8a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">Open TikTok</a>
      </div>
    `,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}if(r.includes(`instagram.com`)){let t=r.match(/instagram\.com\/(?:reel|p|tv)\/([^\/?#]+)/);if(t){let n=t[1];l.innerHTML=`<iframe src="https://www.instagram.com/${r.includes(`/reel/`)?`reel`:`p`}/${n}/embed" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}}if(r.includes(`vimeo.com`)){let t=r.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1];if(t){l.innerHTML=`<iframe src="https://player.vimeo.com/video/${t}?autoplay=1&title=0&byline=0&portrait=0" style="width:100%;height:100%;border:none;" allowfullscreen allow="autoplay; encrypted-media"></iframe>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}}if(r.includes(`facebook.com`)||r.includes(`fb.watch`)){l.innerHTML=`
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2d2327;color:#ffffff;padding:20px;text-align:center;flex-direction:column;">
        <div style="margin-bottom:16px;">${m.book}</div>
        <div style="font-size:16px;font-weight:600;">Facebook Video</div>
        <div style="font-size:12px;opacity:0.6;margin-top:8px;">Click the link below to view</div>
        <a href="${r}" target="_blank" style="margin-top:12px;padding:10px 24px;background:#c09a8a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">Open Facebook</a>
      </div>
    `,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}if(r.includes(`twitter.com`)||r.includes(`x.com`)){let t=r.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);if(t){t[1],l.innerHTML=`<blockquote class="twitter-tweet"><a href="${r}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}}if([`.mp4`,`.webm`,`.mov`,`.avi`,`.mkv`,`.m4v`,`.ogv`,`.3gp`].some(e=>r.toLowerCase().includes(e))){l.innerHTML=`
      <video 
        src="${r}" 
        style="width:100%;height:100%;object-fit:contain;background:#000;"
        controls
        autoplay
        muted
        playsinline
      ></video>
    `,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o);return}if(i===`audio`||r.includes(`soundcloud.com`)||r.includes(`audiomack.com`)||r.includes(`mixcloud.com`)||r.includes(`hearthis.at`)||r.includes(`mp3.pm`)||r.includes(`mp3`)||r.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma|alac)$/i)||r.match(/download\/.*\.mp3/i)){let n=r.split(`/`).pop()||`audio`,i=t||n.replace(/[_-]/g,` `).replace(/\.[^.]+$/,``);l.innerHTML=`
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a2e,#2d2327);padding:30px;text-align:center;flex-direction:column;color:#ffffff;">
        <div style="margin-bottom:12px;animation:audioPulse 2s ease-in-out infinite;">${m.music}</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:4px;">${i}</div>
        <div style="font-size:13px;opacity:0.7;margin-bottom:16px;">${m.headphones} Listening to earn rewards</div>
        <div style="width:100%;max-width:400px;">
          <audio controls autoplay style="width:100%;border-radius:8px;">
            <source src="${r}" type="audio/mpeg">
            <source src="${r}" type="audio/wav">
            <source src="${r}" type="audio/ogg">
            Your browser does not support the audio element.
          </audio>
        </div>
        <div style="margin-top:10px;font-size:11px;opacity:0.5;">
          <span id="audio-timer" style="font-weight:600;">⏱ 0:00 / 0:00</span>
        </div>
      </div>
    `,setTimeout(()=>{let e=l.querySelector(`audio`),t=l.querySelector(`#audio-timer`);e&&t&&(e.addEventListener(`loadedmetadata`,function(){let e=u(this.duration);t.textContent=`⏱ 0:00 / ${e}`}),e.addEventListener(`timeupdate`,function(){let e=u(this.currentTime),n=u(this.duration);t.textContent=`⏱ ${e} / ${n}`}))},100),document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,document.getElementById(`earn-timer-status`).textContent=`Listening...`,W(o);return}function u(e){return isNaN(e)?`0:00`:`${Math.floor(e/60)}:${Math.floor(e%60).toString().padStart(2,`0`)}`}l.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2d2327;color:#ffffff;padding:20px;text-align:center;flex-direction:column;">
    <div style="margin-bottom:16px;">${m.link}</div>
    <div style="font-size:16px;font-weight:600;">Content Link</div>
    <div style="font-size:12px;opacity:0.6;margin-top:8px;">Click the link below to view content</div>
    <a href="${r}" target="_blank" style="margin-top:12px;padding:10px 24px;background:#c09a8a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">Open Content</a>
  </div>`,document.getElementById(`earn-modal`).style.display=`flex`,document.body.style.overflow=`hidden`,document.getElementById(`earn-modal`).dataset.contentId=e,W(o)}var _t=!1;function W(e){let t=e||90,n=t,r=2*Math.PI*27;_t=!1,D&&clearInterval(D),D=setInterval(()=>{n--,document.getElementById(`earn-countdown`).textContent=n;let e=n/t;document.getElementById(`earn-progress`).style.strokeDashoffset=r*e,n<=0&&(clearInterval(D),_t=!0,document.getElementById(`earn-timer-status`).innerHTML=m.checkCircle+` Ready!`,document.getElementById(`earn-claim-btn`).style.display=`block`,document.getElementById(`earn-claim-btn`).innerHTML=m.target+` Claim Reward`)},1e3)}function vt(){document.getElementById(`earn-modal-bg`).addEventListener(`click`,e=>{e.stopPropagation(),bt()}),document.getElementById(`earn-modal-close-btn`).addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),bt()}),document.getElementById(`earn-claim-btn`).addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation();let t=document.getElementById(`earn-modal`).dataset.contentId,n=document.getElementById(`earn-modal-reward`).textContent;xt(t,parseFloat(n.replace(`MWK `,``)))})}function yt(){let e=document.getElementById(`earn-modal-player`);if(e){e.querySelectorAll(`iframe`).forEach(e=>{try{e.src=`about:blank`,e.remove()}catch{}}),e.querySelectorAll(`video`).forEach(e=>{try{e.pause(),e.removeAttribute(`src`),e.load(),e.remove()}catch{}}),e.querySelectorAll(`audio`).forEach(e=>{try{e.pause(),e.removeAttribute(`src`),e.load(),e.remove()}catch{}});try{document.querySelectorAll(`iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="tiktok"]`).forEach(e=>{e.src=`about:blank`})}catch{}e.innerHTML=``}}function bt(){yt(),D&&!_t&&(clearInterval(D),D=null,_t=!1,showToast(m.alert+` Reward cancelled - please complete the video to earn`)),D&&=(clearInterval(D),null),document.getElementById(`earn-modal`).style.display=`none`,document.body.style.overflow=``}function xt(t,n){let r=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);fetch(`/api/earn/watch`,{method:`POST`,headers:S(),body:JSON.stringify({userId:r.id,contentId:t})}).then(e=>e.json()).then(t=>{t.success?(e(`/earn/watch`),oe+=n,se+=n,ce++,St(),bt(),Rn(),showToast(m.check+` Earned MWK `+n+`! Added to Learning Wallet`),q(r.id),setTimeout(pt,500)):showToast(t.message||`Failed to claim`)}).catch(()=>showToast(`Network error`))}function St(){let e=document.getElementById(`earn-balance`),t=document.getElementById(`total-earned`),n=document.getElementById(`watched-today`);e&&(e.textContent=`MWK `+(oe||0).toFixed(2)),t&&(t.textContent=`MWK `+(se||0).toFixed(2)),n&&(n.textContent=ce||0);let r=document.getElementById(`overview-earn-desc`);r&&le>0&&(r.textContent=`MWK `+le.toLocaleString()+` / video`)}function Ct(e){try{A=JSON.parse(localStorage.getItem(`wv_continue_reading`)||`[]`)}catch{A=[]}e.innerHTML=`
    <div class="glass" style="padding:14px 18px;margin-bottom:16px; color:#2d2327;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h1 class="numbers" style="font-size:18px;font-weight:700;">My Library</h1>
        </div>
        <span id="library-book-count" style="font-size:12px;color:#5a4a4a;background:rgba(45,35,39,0.05);padding:6px 12px;border-radius:100px;font-weight:600;">0 books</span>
      </div>
    </div>

    <div id="continue-reading-section" style="display:none;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; color:#2d2327;">
        <h3 style="font-size:16px;font-weight:700;">Continue Reading</h3>
        <button id="clear-history-btn" style="font-size:12px;color:#c09a8a;background:none;border:none;cursor:pointer;font-weight:600;">Clear</button>
      </div>
      <div id="continue-reading-list" style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;"></div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <div style="position:relative;flex:1;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a4a4a" stroke-width="2.5" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="library-search" placeholder="Search books..." 
          style="width:100%;padding:10px 14px 10px 36px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:13px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;">
      </div>
      <select id="library-sort" style="padding:10px 12px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:13px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;min-width:120px;">
        <option value="recent">Recent</option>
        <option value="title">Title A-Z</option>
        <option value="author">Author A-Z</option>
      </select>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="lib-filter-chip active" data-filter="all" style="padding:6px 16px;background:#2d2327;color:#ffffff;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">All Books</button>
      <button class="lib-filter-chip" data-filter="free" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">Free</button>
      <button class="lib-filter-chip" data-filter="premium" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">Premium</button>
      <button class="lib-filter-chip" data-filter="owned" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;">Owned</button>
    </div>

    <div id="library-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="text-align:center;padding:40px;color:#5a4a4a;grid-column:1/-1;">
        <div style="width:28px;height:28px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading books...
      </div>
    </div>

    <!-- Full-screen book reader. Fills the viewport so the document gets the
         whole screen instead of a 500px box. -->
    <div id="reader-modal" style="display:none;position:fixed;inset:0;z-index:200;">
      <div style="display:flex;flex-direction:column;height:100dvh;height:100vh;">
        <div id="reader-toolbar" style="display:flex;align-items:center;gap:8px;padding:10px 12px;flex-shrink:0;border-bottom:1px solid rgba(128,128,128,0.2);">
          <button id="reader-close-btn" aria-label="Close reader" title="Close" style="width:38px;height:38px;flex-shrink:0;border:none;border-radius:10px;background:rgba(128,128,128,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:inherit;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style="flex:1;min-width:0;">
            <div id="reader-modal-title" style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
            <div id="reader-modal-author" style="font-size:11px;opacity:0.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
          </div>
          <span id="reader-kind-badge" style="font-size:10px;font-weight:700;letter-spacing:0.06em;padding:4px 8px;border-radius:6px;background:rgba(128,128,128,0.15);flex-shrink:0;"></span>
          <button id="reader-theme-btn" title="Change theme" style="width:38px;height:38px;flex-shrink:0;border:none;border-radius:10px;background:rgba(128,128,128,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:inherit;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
          </button>
          <button id="reader-font-down" title="Smaller text" style="width:38px;height:38px;flex-shrink:0;border:none;border-radius:10px;background:rgba(128,128,128,0.12);cursor:pointer;font-size:13px;font-weight:700;color:inherit;">A-</button>
          <button id="reader-font-up" title="Larger text" style="width:38px;height:38px;flex-shrink:0;border:none;border-radius:10px;background:rgba(128,128,128,0.12);cursor:pointer;font-size:15px;font-weight:700;color:inherit;">A+</button>
          <button id="reader-fullscreen-btn" title="Full screen" style="width:38px;height:38px;flex-shrink:0;border:none;border-radius:10px;background:rgba(128,128,128,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:inherit;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
          </button>
          <a id="reader-download-btn" download style="width:38px;height:38px;flex-shrink:0;border-radius:10px;background:rgba(128,128,128,0.12);cursor:pointer;display:none;align-items:center;justify-content:center;color:inherit;text-decoration:none;" title="Download">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </a>
        </div>
        <div style="flex:1;min-height:0;position:relative;overflow:hidden;">
          <div id="reader-content" style="height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;"></div>
        </div>
        <div id="reader-footer" style="display:flex;align-items:center;gap:12px;padding:8px 14px;flex-shrink:0;border-top:1px solid rgba(128,128,128,0.2);">
          <span id="reader-progress" style="font-size:11px;opacity:0.65;white-space:nowrap;">Loading…</span>
          <div style="flex:1;height:3px;border-radius:2px;background:rgba(128,128,128,0.2);overflow:hidden;">
            <div id="reader-progress-bar" style="height:100%;width:0%;background:currentColor;transition:width 0.15s;"></div>
          </div>
          <button id="reader-prev-btn" style="padding:6px 12px;border-radius:8px;border:none;background:rgba(128,128,128,0.12);font-size:12px;font-weight:600;cursor:pointer;color:inherit;">←</button>
          <button id="reader-next-btn" style="padding:6px 12px;border-radius:8px;border:none;background:rgba(128,128,128,0.12);font-size:12px;font-weight:600;cursor:pointer;color:inherit;">→</button>
        </div>
      </div>
    </div>
  `,wt(),tn(e)}function wt(){C(`/content/library?userId=`+(JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`).id||``)).then(e=>{e.success&&e.items&&e.items.length>0?(O=e.items.map(e=>({id:e.id||``,title:e.title||`Untitled`,author:e.author||`Unknown Author`,description:e.description||``,cover:e.thumbnail_url||e.cover||``,thumbnail_url:e.thumbnail_url||``,category:e.is_premium?`premium`:`free`,isPremium:e.is_premium||!1,is_owned:e.is_owned||!1,owned:e.is_owned||!1,content:e.content||e.description||``,fileUrl:e.file_url||``,linkType:e.link_type||`url`,price:e.price||0,externalLink:e.external_link||``})),console.log(`Books loaded:`,O),k=O.slice(),Et()):Tt()}).catch(()=>Tt())}function Tt(){let e=document.getElementById(`library-grid`);e&&(e.innerHTML=`
      <div style="text-align:center;padding:50px 20px;color:#5a4a4a;grid-column:1/-1;">
        <div style="margin-bottom:12px;">${m.book}</div>
        <h3 style="font-weight:700;font-size:16px;margin-bottom:4px;color:#2d2327;">No books yet</h3>
        <p style="font-size:13px;">Your library is empty. Check back later for new content!</p>
      </div>
    `),en(0)}function Et(){k=O.filter(e=>{let t=!0;if(de){let n=de.toLowerCase().trim();t=e.title&&e.title.toLowerCase().includes(n)||e.author&&e.author.toLowerCase().includes(n)||e.description&&e.description.toLowerCase().includes(n)}let n=!0;return ue===`free`&&(n=e.category===`free`),ue===`premium`&&(n=e.category===`premium`),ue===`owned`&&(n=e.owned),t&&n}),fe===`title`?k.sort((e,t)=>e.title.localeCompare(t.title)):fe===`author`&&k.sort((e,t)=>(e.author||``).localeCompare(t.author||``)),Dt(),$t()}function Dt(){let e=document.getElementById(`library-grid`);if(!e)return;if(k.length===0){e.innerHTML=`
      <div style="text-align:center;padding:40px;color:#5a4a4a;grid-column:1/-1;">
        <p>No books match your filters</p>
      </div>
    `,en(0);return}en(k.length);let t=``;for(let e of k){let n=e.is_premium||e.isPremium||!1,r=e.is_owned||e.owned||!1,i=e.price||0,a=``;n&&!r?a=`<div style="position:absolute;top:8px;left:8px;background:linear-gradient(135deg,#F59E0B,#D97706);color:white;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600;">${m.star} Premium</div>`:n&&r&&(a=`<div style="position:absolute;top:8px;left:8px;background:#10B981;color:white;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600;">${m.star} Owned</div>`);let o=r?`<div style="position:absolute;top:8px;right:8px;background:#10B981;color:white;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600;">`+m.check+` Owned</div>`:``,s=e.cover||e.thumbnail_url?`<img src="${e.cover||e.thumbnail_url}" alt="" style="width:100%;height:100%;object-fit:cover;">`:`<div style="width:100%;height:100%;background:linear-gradient(135deg,#c09a8a,#d6b8a8);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:24px;">`+m.book+`</div>`,c=e.title||`Untitled`,l=e.author||`Unknown Author`,u=`Read Now`,d=`#2d2327`,f=`#ffffff`,p=`read`;n&&!r?(u=`${m.lock} Unlock (MWK ${i.toLocaleString()})`,d=`#c09a8a`,f=`#ffffff`,p=`buy`):r?(u=m.book+` Read Now`,d=`#2d2327`,f=`#ffffff`,p=`read`):(u=m.book+` Read Free`,d=`#2d2327`,f=`#ffffff`,p=`read`);let h=``,g=(e,t)=>`<span style="font-size:10px;color:#5a4a4a;background:rgba(45,35,39,0.05);padding:2px 8px;border-radius:4px;">${e} ${t}</span>`;switch((e.linkType||``).toLowerCase()){case`pdf`:h=g(m.fileText,`PDF`);break;case`docx`:case`doc`:case`word`:h=g(m.fileText,`Word`);break;case`epub`:h=g(m.book,`EPUB`);break;case`youtube`:case`vimeo`:case`video`:h=g(m.video,`Video`);break;case`audio`:h=g(m.music,`Audio`);break;case`article`:case`url`:case`html`:h=g(m.fileText,`Article`);break}t+=`
      <div class="lib-book-card" data-book-id="${e.id}" data-action="${p}" data-price="${i}" data-premium="${n}" data-owned="${r}" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(45,35,39,0.05);cursor:pointer;transition:transform 0.2s; color:#2d2327;">
        <div style="position:relative;aspect-ratio:3/4;background:rgba(45,35,39,0.03);overflow:hidden;">
          ${s}
          ${o}
          ${a}
          <div style="position:absolute;bottom:8px;left:8px;display:flex;gap:4px;">${h}</div>
        </div>
        <div style="padding:12px;">
          <h4 style="font-size:13px;font-weight:700;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c}</h4>
          <p style="font-size:11px;color:#5a4a4a;margin-bottom:6px;">${l}</p>
          <button class="lib-read-btn" data-book-id="${e.id}" style="width:100%;padding:8px;background:${d};color:${f};border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
            ${u}
          </button>
        </div>
      </div>
    `}e.innerHTML=t,Ot()}function Ot(){let e=document.getElementById(`library-grid`);e&&(e.removeEventListener(`click`,kt),e.addEventListener(`click`,kt))}function kt(e){let t=e.target.closest(`.lib-book-card`);if(!t)return;e.target.closest(`.lib-read-btn`);let n=t.dataset.bookId;t.dataset.action;let r=t.dataset.premium===`true`,i=t.dataset.owned===`true`,a=O.find(e=>e.id==n);if(!a){console.error(`Book not found:`,n);return}if(e.target.closest(`.lib-read-btn`)){e.stopPropagation(),r&&!i?jt(a):Wt(a);return}r&&!i?showToast(m.lock+` This is premium content. Click "Unlock" to purchase.`):Wt(a)}var At=!1,jt=te(async function(e){if(At){window.showToast(m.clock+` Purchase already in progress...`);return}let t=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!t.id){window.showToast(`Please login first`);return}if(!e||!e.id){window.showToast(`Invalid book`);return}if(e.owned||e.is_owned){window.showToast(m.checkCircle+` You already have access to this book`),Wt(e);return}let n=e.price||0;if(n<=0){window.showToast(`Invalid price for this book`);return}let r=document.querySelector(`.lib-book-card[data-book-id="${e.id}"] .lib-read-btn`),i=r?.textContent||`Unlock`;try{r&&(r.innerHTML=m.clock+` Processing...`,r.disabled=!0,r.style.opacity=`0.6`);let i=T?.storeCredit||0;if(i<n){window.showToast(m.alert+` Insufficient Learning Wallet balance. You need MWK `+n.toLocaleString()+` but have MWK `+i.toLocaleString()+`)`);return}if(!confirm(`Purchase "${e.title}" for MWK ${n.toLocaleString()} using your Learning Wallet?`))return;At=!0,window.showToast(m.clock+` Processing purchase...`);let a=await C(`/content/purchase-book`,{method:`POST`,body:JSON.stringify({userId:t.id,contentId:e.id,price:n})});if(a.success){window.showToast(m.checkCircle+` Book purchased! MWK `+n.toLocaleString()+` deducted from Learning Wallet.`),T&&(T.storeCredit=a.newStoreCredit||T.storeCredit-n),e.owned=!0,e.is_owned=!0;let t=O.findIndex(t=>t.id==e.id);t!==-1&&(O[t].owned=!0,O[t].is_owned=!0),Dt(),setTimeout(()=>{Wt(e)},600)}else window.showToast(a.message||`Failed to purchase book`)}catch(e){console.error(`Purchase error:`,e),window.showToast(`Network error. Please try again.`)}finally{At=!1,r&&(r.textContent=i,r.disabled=!1,r.style.opacity=`1`)}},3e3);window.buyPremiumBook=jt;var Mt={light:{bg:`#faf7f4`,fg:`#2d2327`,bar:`#ffffff`},sepia:{bg:`#f3ead7`,fg:`#3b2f21`,bar:`#ece0c6`},dark:{bg:`#14110f`,fg:`#e9e3dc`,bar:`#1d1917`}},Nt=[`light`,`sepia`,`dark`],Pt=14,Ft=26,G={id:null,kind:`unknown`,textMode:!1,theme:`light`,fontSize:18,onScroll:null,mode:null,pdf:null};function It(e,t){try{let n=localStorage.getItem(`wv_reader_`+e);return n===null?t:n}catch{return t}}function Lt(e,t){try{localStorage.setItem(`wv_reader_`+e,t)}catch{}}function K(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function Rt(e){let t=Mt[e]||Mt.light;G.theme=Mt[e]?e:`light`;let n=document.getElementById(`reader-modal`),r=document.getElementById(`reader-toolbar`),i=document.getElementById(`reader-footer`),a=document.getElementById(`reader-content`);n&&(n.style.background=t.bg,n.style.color=t.fg),r&&(r.style.background=t.bar),i&&(i.style.background=t.bar),a&&(a.style.color=t.fg)}function zt(){let e=document.getElementById(`reader-content`),t=document.getElementById(`reader-article`);t?t.style.fontSize=G.fontSize+`px`:e&&(e.style.fontSize=G.fontSize+`px`)}async function Bt(e,t){let n=localStorage.getItem(`wisdom_vault_session`),r=await fetch(`${y.API_BASE}/content/read/${encodeURIComponent(e)}${t?`?mode=`+t:``}`,{headers:n?{Authorization:`Bearer `+n}:{},credentials:`include`}),i=null;try{i=await r.json()}catch{}if(!r.ok||!i||!i.success){let e=i&&i.message||(r.status===401?`Please sign in again to read this book.`:`This book could not be opened.`);throw Error(e)}return i}function Vt(e){return`<div style="max-width:760px;margin:0 auto;padding:28px 22px 70px;">${e}</div>`}function Ht(e,t,n){return Vt(`
    <div style="text-align:center;padding:70px 10px;">
      <div style="margin-bottom:14px;opacity:0.5;">${n||m.book}</div>
      <h3 style="font-size:17px;font-weight:700;margin-bottom:6px;">${K(e)}</h3>
      <p style="font-size:13px;opacity:0.7;line-height:1.6;">${K(t||``)}</p>
    </div>`)}function Ut(e){let t=K(e.text).replace(/\n/g,`<br>`);switch(e.type){case`h1`:return`<h1 style="font-size:1.75em;font-weight:800;line-height:1.2;margin:1.7em 0 0.6em;">${t}</h1>`;case`h2`:return`<h2 style="font-size:1.38em;font-weight:700;line-height:1.3;margin:1.6em 0 0.5em;">${t}</h2>`;case`h3`:return`<h3 style="font-size:1.14em;font-weight:700;line-height:1.35;margin:1.4em 0 0.4em;">${t}</h3>`;case`li`:return`<div style="display:flex;gap:10px;margin:0 0 0.55em;padding-left:0.4em;"><span style="opacity:0.45;flex-shrink:0;">•</span><span>${t}</span></div>`;case`quote`:return`<blockquote style="margin:1.1em 0;padding-left:16px;border-left:3px solid currentColor;opacity:0.85;font-style:italic;">${t}</blockquote>`;default:return`<p style="margin:0 0 1.1em;line-height:1.75;text-align:justify;">${t}</p>`}}async function Wt(e){if(!e)return;let t=e.is_premium||e.isPremium,n=e.owned||e.is_owned;if(t&&!n){showToast(m.lock+` This is premium content. Please purchase to access.`);return}let r=document.getElementById(`reader-modal`),i=document.getElementById(`reader-content`),a=document.getElementById(`reader-progress`),o=document.getElementById(`reader-progress-bar`),s=document.getElementById(`reader-download-btn`),c=document.getElementById(`reader-footer`);if(!(!r||!i)){if(document.getElementById(`reader-modal-title`).textContent=e.title||`Untitled`,document.getElementById(`reader-modal-author`).textContent=e.author||``,document.getElementById(`reader-kind-badge`).textContent=``,a&&(a.textContent=`Loading…`),o&&(o.style.width=`0%`),s&&(s.style.display=`none`),G.pdf){try{G.pdf.destroy()}catch{}G.pdf=null}G.id=e.id,G.textMode=!1,G.mode=null,G.fontSize=parseInt(It(`font_size`,`18`),10)||18,Rt(It(`theme`,`light`)),i.innerHTML=Vt(`
    <div style="text-align:center;padding:80px 10px;opacity:0.7;">
      <div style="width:26px;height:26px;border:3px solid rgba(128,128,128,0.25);border-top-color:currentColor;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px;"></div>
      <div style="font-size:13px;">Opening book…</div>
    </div>`),r.style.display=`block`,document.body.style.overflow=`hidden`;try{let t=await Bt(e.id,`meta`);G.kind=t.kind,G.textMode=!!t.textMode,document.getElementById(`reader-kind-badge`).textContent=t.label||``,s&&(s.style.display=`flex`,s.href=`${y.API_BASE}/content/read/${encodeURIComponent(e.id)}`,s.setAttribute(`download`,t.title||e.title||`book`)),t.textMode?await Yt(e,t):t.kind===`video`||t.kind===`audio`?(G.mode=`media`,Jt(e,t)):t.kind===`pdf`?await Kt(e,t):(G.mode=`embed`,Gt(e,t)),qt(),c&&(c.style.display=``)}catch(e){c&&(c.style.display=`none`),i.innerHTML=Ht(`Could not open this book`,e.message,m.alert)}Qt(e)}}function Gt(e,t){let n=document.getElementById(`reader-content`),r=document.getElementById(`reader-progress`),i=document.getElementById(`reader-progress-bar`),a=`${y.API_BASE}/content/read/${encodeURIComponent(e.id)}`;n.style.padding=`0`,n.innerHTML=`<iframe src="${a}" title="${K(e.title||`Book`)}"
      style="width:100%;height:100%;border:none;background:#fff;" allowfullscreen></iframe>`,r&&(r.textContent=t.size?(t.size/1048576).toFixed(1)+` MB · `+(t.label||``):t.label||``),i&&(i.style.width=`0%`)}async function Kt(e,t){let n=document.getElementById(`reader-content`),r=document.getElementById(`reader-progress`),i=document.getElementById(`reader-progress-bar`),a=`${y.API_BASE}/content/read/${encodeURIComponent(e.id)}`;n.style.padding=`0`,n.innerHTML=Vt(`
    <div style="text-align:center;padding:70px 10px;opacity:0.7;">
      <div style="width:26px;height:26px;border:3px solid rgba(128,128,128,0.25);border-top-color:currentColor;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px;"></div>
      <div style="font-size:13px;">Preparing document…</div>
    </div>`);let o=parseInt(It(`page_`+e.id,`1`),10)||1;try{G.pdf=await p({container:n,url:a,startPage:o,onProgress:({page:t,total:n})=>{let a=n>0?Math.min(100,Math.round(t/n*100)):0;r&&(r.textContent=`Page ${t} of ${n} · ${a}%`),i&&(i.style.width=a+`%`),Lt(`page_`+e.id,String(t));let o=A.findIndex(t=>t.id==e.id);if(o>-1){A[o].progress=a,A[o].lastRead=Date.now();try{localStorage.setItem(`wv_continue_reading`,JSON.stringify(A))}catch{}}}}),G.mode=`pdf`,o>1&&showToast(`Resuming from page `+o)}catch(n){console.warn(`pdf.js unavailable, falling back to the browser viewer:`,n),G.mode=`embed`,Gt(e,t);return}}function qt(){let e=document.getElementById(`reader-prev-btn`),t=document.getElementById(`reader-next-btn`),n=document.getElementById(`reader-font-up`),r=document.getElementById(`reader-font-down`),i=G.mode===`pdf`;e&&(e.title=i?`Previous page`:`Scroll up`),t&&(t.title=i?`Next page`:`Scroll down`),n&&(n.textContent=i?`+`:`A+`,n.title=i?`Zoom in`:`Larger text`),r&&(r.textContent=i?`−`:`A-`,r.title=i?`Zoom out`:`Smaller text`)}function Jt(e,t){let n=document.getElementById(`reader-content`),r=`${y.API_BASE}/content/read/${encodeURIComponent(e.id)}`,i=document.getElementById(`reader-progress`),a=document.getElementById(`reader-progress-bar`),o=t.kind===`audio`,s=o?`<div style="background:rgba(45,35,39,0.04);border-radius:14px;padding:34px 20px;">
         <div style="display:flex;justify-content:center;margin-bottom:16px;opacity:0.55;">${m.music}</div>
         <audio controls preload="metadata" src="${r}" style="width:100%;"></audio>
       </div>`:`<div style="position:relative;width:100%;aspect-ratio:16 / 9;max-height:72vh;background:#000;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.18);">
         <video controls playsinline preload="metadata" src="${r}"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;"></video>
       </div>`;n.style.padding=`0`,n.innerHTML=Vt(`
    <h1 style="font-size:1.25em;font-weight:800;margin:0 0 0.2em;text-align:center;">${K(e.title||`Untitled`)}</h1>
    ${e.author?`<p style="font-size:0.8em;opacity:0.6;margin:0 0 1.1em;text-align:center;">${K(e.author)}</p>`:`<div style="height:1em"></div>`}
    ${s}
    <div style="display:flex;justify-content:center;margin-top:14px;">
      <a href="${r}" download style="font-size:12px;opacity:0.65;text-decoration:none;">Download ${o?`audio`:`video`}</a>
    </div>`),i&&(i.textContent=t.label||(t.kind===`audio`?`Audio`:`Video`)),a&&(a.style.width=`0%`)}async function Yt(e,t){G.mode=`text`;let n=document.getElementById(`reader-content`),r=document.getElementById(`reader-progress`),i=document.getElementById(`reader-progress-bar`),a;try{a=await Bt(e.id,`text`)}catch(e){n.innerHTML=Ht(`This book has no readable text`,e.message,m.alert);return}let o=a.blocks||[],s=o.map(Ut).join(``);n.style.padding=`0`,n.innerHTML=`<article id="reader-article" style="max-width:680px;margin:0 auto;padding:26px 20px 80px;line-height:1.75;">
      <h1 style="font-size:1.6em;font-weight:800;line-height:1.25;margin:0 0 0.3em;">${K(e.title||`Untitled`)}</h1>
      ${e.author?`<p style="font-size:0.85em;opacity:0.6;margin:0 0 2em;">${K(e.author)}</p>`:`<div style="height:1.5em;"></div>`}
      ${s}
    </article>`,zt();let c=parseFloat(It(`pos_`+e.id,`0`))||0,l=n.scrollHeight-n.clientHeight;c>.01&&l>0&&(n.scrollTop=Math.round(l*c),showToast(`Resuming where you left off`));let u=()=>{let t=n.scrollHeight-n.clientHeight,a=t>0?Math.min(100,Math.round(n.scrollTop/t*100)):100;if(r&&(r.textContent=a+`% read · `+o.length.toLocaleString()+` paragraphs`),i&&(i.style.width=a+`%`),Lt(`pos_`+e.id,String(t>0?n.scrollTop/t:0)),G.id){let e=A.findIndex(e=>e.id==G.id);if(e>-1){A[e].progress=a,A[e].lastRead=Date.now();try{localStorage.setItem(`wv_continue_reading`,JSON.stringify(A))}catch{}}}};n.addEventListener(`scroll`,u,{passive:!0}),u()}function Xt(){let e=document.getElementById(`reader-modal`);if(!e||e.dataset.wired===`1`)return;e.dataset.wired=`1`;let t=document.getElementById(`reader-content`),n=document.getElementById(`reader-close-btn`),r=document.getElementById(`reader-theme-btn`),i=document.getElementById(`reader-font-up`),a=document.getElementById(`reader-font-down`),o=document.getElementById(`reader-fullscreen-btn`),s=document.getElementById(`reader-prev-btn`),c=document.getElementById(`reader-next-btn`);n&&n.addEventListener(`click`,e=>{e.stopPropagation(),Zt()}),r&&r.addEventListener(`click`,e=>{e.stopPropagation();let t=Nt[(Nt.indexOf(G.theme)+1)%Nt.length];Lt(`theme`,t),Rt(t)});let l=e=>{if(G.mode===`pdf`&&G.pdf){e>0?G.pdf.zoomIn():G.pdf.zoomOut();return}G.fontSize=Math.max(Pt,Math.min(Ft,G.fontSize+e)),Lt(`font_size`,String(G.fontSize)),zt()};i&&i.addEventListener(`click`,e=>{e.stopPropagation(),l(2)}),a&&a.addEventListener(`click`,e=>{e.stopPropagation(),l(-2)}),o&&o.addEventListener(`click`,t=>{t.stopPropagation(),document.fullscreenElement?document.exitFullscreen():e.requestFullscreen&&e.requestFullscreen().catch(()=>{})});let u=e=>{if(G.mode===`pdf`&&G.pdf){e>0?G.pdf.nextPage():G.pdf.prevPage();return}t&&t.scrollBy({top:e*Math.round(t.clientHeight*.9),behavior:`smooth`})};s&&s.addEventListener(`click`,e=>{e.stopPropagation(),u(-1)}),c&&c.addEventListener(`click`,e=>{e.stopPropagation(),u(1)}),document.addEventListener(`keydown`,t=>{e.style.display===`block`&&(t.key===`Escape`?Zt():t.key===`ArrowRight`||t.key===`PageDown`?u(1):(t.key===`ArrowLeft`||t.key===`PageUp`)&&u(-1))})}function Zt(){let e=document.getElementById(`reader-modal`),t=document.getElementById(`reader-content`);if(G.pdf){try{G.pdf.destroy()}catch{}G.pdf=null}G.mode=null,e&&(e.style.display=`none`),document.body.style.overflow=``,t&&(t.innerHTML=``,t.style.padding=``),document.fullscreenElement&&document.exitFullscreen().catch(()=>{}),G.id=null}function Qt(e){let t=A.findIndex(t=>t.id===e.id);t>-1&&A.splice(t,1),A.unshift({id:e.id,title:e.title,author:e.author,cover:e.cover,progress:0,lastRead:Date.now()}),A=A.slice(0,10),localStorage.setItem(`wv_continue_reading`,JSON.stringify(A)),$t()}function $t(){let e=document.getElementById(`continue-reading-section`),t=document.getElementById(`continue-reading-list`);if(!(!e||!t)){if(A.length===0){e.style.display=`none`;return}e.style.display=`block`,t.innerHTML=A.map(e=>{let t=e.cover?`<img src="${e.cover}" alt="" style="width:100%;height:100%;object-fit:cover;">`:`<div style="width:100%;height:100%;background:linear-gradient(135deg,#c09a8a,#d6b8a8);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:20px;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path></svg></div>`;return`
      <div class="lib-continue-card" data-book-id="${e.id}" style="flex-shrink:0;width:130px;cursor:pointer;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(45,35,39,0.05);">
        <div style="position:relative;aspect-ratio:3/4;overflow:hidden;background:rgba(45,35,39,0.03);">
          ${t}
          <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,0.1);">
            <div style="height:100%;background:#c09a8a;width:${e.progress||0}%;"></div>
          </div>
        </div>
        <div style="padding:8px;">
          <p style="font-size:11px;font-weight:600;color:#2d2327;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${e.title}</p>
          <p style="font-size:10px;color:#5a4a4a;">${e.progress||0}% read</p>
        </div>
      </div>
    `}).join(``),t.querySelectorAll(`.lib-continue-card`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.dataset.bookId,r=O.find(e=>e.id==n);r?Wt(r):showToast(m.book+` This book is no longer in your library.`)})})}}function en(e){let t=document.getElementById(`library-book-count`);t&&(t.textContent=e+` book`+(e===1?``:`s`))}function tn(e){let t=document.getElementById(`library-search`);t&&t.addEventListener(`input`,function(){de=this.value,Et()});let n=document.getElementById(`library-sort`);n&&n.addEventListener(`change`,function(){fe=this.value,Et()}),document.querySelectorAll(`.lib-filter-chip`).forEach(e=>{e.addEventListener(`click`,function(e){e.stopPropagation(),document.querySelectorAll(`.lib-filter-chip`).forEach(e=>{e.classList.remove(`active`),e.style.background=`rgba(45,35,39,0.05)`,e.style.color=`#2d2327`}),this.classList.add(`active`),this.style.background=`#2d2327`,this.style.color=`#ffffff`,ue=this.dataset.filter,Et()})});let r=document.getElementById(`clear-history-btn`);r&&r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),localStorage.removeItem(`wv_continue_reading`),A=[],$t(),showToast(`Reading history cleared`)}),Xt()}function nn(e){e.innerHTML=`
    <div class="glass" style="padding:14px 18px;margin-bottom:16px; color:#2d2327;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h1 class="numbers" style="font-size:18px;font-weight:700;">Courses</h1>
        </div>
        <span id="courses-count" style="font-size:12px;color:#5a4a4a;background:rgba(45,35,39,0.05);padding:6px 12px;border-radius:100px;font-weight:600;">0 courses</span>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="courses-tab-btn active" data-tab="explore" style="flex:1;padding:10px;background:#2d2327;color:#ffffff;border:none;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;">Explore</button>
      <button class="courses-tab-btn" data-tab="my-courses" style="flex:1;padding:10px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;">My Courses</button>
    </div>

    <div style="position:relative;margin-bottom:12px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a4a4a" stroke-width="2.5" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input type="text" id="courses-search" placeholder="Search courses..." 
        style="width:100%;padding:10px 14px 10px 36px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:13px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;">
    </div>

    <div id="courses-filters" style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;">
      <button class="courses-filter-chip active" data-category="all" style="padding:6px 16px;background:#2d2327;color:#ffffff;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">All</button>
    </div>

    <div id="courses-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="text-align:center;padding:40px;color:#5a4a4a;grid-column:1/-1;">
        <div style="width:28px;height:28px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading courses...
      </div>
    </div>

    <div id="courses-empty" style="display:none;text-align:center;padding:50px 20px;color:#5a4a4a;">
      <div style="margin-bottom:12px;">${m.book}</div>
      <h3 style="font-weight:700;font-size:16px;margin-bottom:4px;color:#2d2327;">No courses found</h3>
      <p style="font-size:13px;">Try adjusting your search or filters</p>
    </div>

    <div id="course-detail-modal" style="display:none;position:fixed;inset:0;z-index:200;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);">
      <div style="position:absolute;inset:0;" id="course-modal-bg"></div>
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:20px;width:100%;max-width:600px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:201;box-shadow:0 20px 60px rgba(45,35,39,0.1); color:#2d2327;">
        <div id="course-modal-content" style="flex:1;overflow-y:auto;"></div>
      </div>
    </div>
  `,rn(),hn()}function rn(){C(`/content/packs?userId=`+(JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`).id||``)).then(e=>{let t=e.packs||[];console.log(`Courses data:`,t),j=t.map(e=>({id:e.id,name:e.name||`Untitled Course`,title:e.name||`Untitled Course`,instructor:e.category||`Wisdom Vault`,category:e.category||`General`,duration:(e.itemCount||0)+` lessons`,price:e.price||0,owned:e.isOwned||!1,isOwned:e.isOwned||!1,isFree:e.isFree||!1,progress:e.progress||0,thumbnail:e.thumbnailUrl||an(e.slug||e.id),thumbnailUrl:e.thumbnailUrl||an(e.slug||e.id),description:e.description||``,longDescription:e.longDescription||e.description||``,contentCount:e.itemCount||0,slug:e.slug||``,previewItems:e.previewItems||[]})),console.log(`Mapped courses:`,j),M=j.slice(),on(),sn()}).catch(e=>{console.error(`Error fetching courses:`,e),ie&&ie.length>0?(j=ie.map(e=>({id:e.id,name:e.name||`Untitled Course`,title:e.name||`Untitled Course`,instructor:e.category||`Wisdom Vault`,category:e.category||`General`,duration:(e.contentCount||0)+` lessons`,price:e.price||0,owned:e.isOwned||!1,isOwned:e.isOwned||!1,isFree:e.isFree||!1,progress:e.progress||0,thumbnail:an(e.slug||e.id),thumbnailUrl:an(e.slug||e.id),description:e.description||``,longDescription:e.long_description||e.description||``,contentCount:e.contentCount||0,slug:e.slug||``,previewItems:[]})),M=j.slice(),on(),sn()):mn()})}function an(e){return{"cybersecurity-offensive":`https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=340&fit=crop`,"graphic-design-mastery":`https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=340&fit=crop`,"affiliate-marketing-mastery":`https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop`,"secret-library":`https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=340&fit=crop`,"wealth-architecture":`https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=340&fit=crop`,"relationship-mastery":`https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=340&fit=crop`,"survival-self-reliance":`https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=600&h=340&fit=crop`}[e]||`https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=340&fit=crop`}function on(){let e=document.getElementById(`courses-filters`);if(!e)return;let t=[`all`];j.forEach(e=>{e.category&&t.indexOf(e.category)===-1&&t.push(e.category)}),e.innerHTML=t.map((e,t)=>`<button class="courses-filter-chip${t===0?` active`:``}" data-category="${e}" style="padding:6px 16px;background:${t===0?`#2d2327`:`rgba(45,35,39,0.05)`};color:${t===0?`#ffffff`:`#2d2327`};border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">${e===`all`?`All Courses`:e}</button>`).join(``),e.querySelectorAll(`.courses-filter-chip`).forEach(t=>{t.addEventListener(`click`,function(t){t.stopPropagation(),e.querySelectorAll(`.courses-filter-chip`).forEach(e=>{e.classList.remove(`active`),e.style.background=`rgba(45,35,39,0.05)`,e.style.color=`#2d2327`}),this.classList.add(`active`),this.style.background=`#2d2327`,this.style.color=`#ffffff`,me=this.dataset.category,sn()})})}function sn(){if(M=j.filter(e=>pe!==`my-courses`||e.owned),me!==`all`&&(M=M.filter(e=>e.category===me)),he){let e=he.toLowerCase();M=M.filter(t=>t.title.toLowerCase().includes(e)||t.instructor&&t.instructor.toLowerCase().includes(e))}cn()}function cn(){let e=document.getElementById(`courses-grid`),t=document.getElementById(`courses-empty`);if(e){if(M.length===0){e.innerHTML=``,t.style.display=`block`,pn(0);return}t.style.display=`none`,pn(M.length),e.innerHTML=M.map(e=>{let t=e.name||e.title||`Untitled Course`,n=e.thumbnailUrl||e.thumbnail||an(e.slug||e.id),r=e.isOwned||e.owned||!1,i=e.isFree||!1,a=``;a=i?`<div style="position:absolute;top:8px;right:8px;background:#10B981;color:white;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600;">FREE</div>`:r?'<div style="position:absolute;top:8px;right:8px;background:#10B981;color:white;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600;">${ICON.check} Owned</div>':`<div style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600;color:#2d2327;">MWK ${(e.price||0).toLocaleString()}</div>`;let o=``;r&&e.progress>0&&(o=`<div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,0.1);"><div style="height:100%;background:#c09a8a;width:`+e.progress+`%;transition:width 0.8s ease;"></div></div>`);let s=r?`Continue`:i?`Enroll Free`:`Buy Course`,c=r?`continue`:i?`enroll`:`buy`;return`
      <div class="courses-card" data-course-id="${e.id}" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(45,35,39,0.05);cursor:pointer;transition:transform 0.2s; color:#2d2327;">
        <div style="position:relative;aspect-ratio:16/9;background:rgba(45,35,39,0.03);overflow:hidden;">
          ${n?`<img src="${n}" alt="${t}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#c09a8a,#d6b8a8);color:#ffffff;font-size:24px;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path></svg></div>`}
          ${a}
          ${o}
        </div>
        <div style="padding:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:10px;font-weight:600;color:#c09a8a;background:rgba(192,154,138,0.1);padding:2px 8px;border-radius:100px;">${e.category||`Course`}</span>
            <span style="font-size:10px;color:#5a4a4a;">${e.contentCount||0} lessons</span>
          </div>
          <h4 style="font-size:13px;font-weight:700;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3;">${t}</h4>
          <p style="font-size:11px;color:#5a4a4a;margin-bottom:8px;">${e.instructor||`Wisdom Vault`}</p>
          <button class="courses-action-btn" data-action="${c}" data-course-id="${e.id}" style="width:100%;padding:8px;background:${r?`rgba(45,35,39,0.05)`:`#2d2327`};color:${r?`#2d2327`:`#ffffff`};border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
            ${s}
          </button>
        </div>
      </div>
    `}).join(``),ln()}}function ln(){document.querySelectorAll(`.courses-card`).forEach(e=>{e.addEventListener(`click`,function(e){if(e.target.closest(`.courses-action-btn`))return;let t=this.dataset.courseId;J(t)})}),document.querySelectorAll(`.courses-action-btn`).forEach(e=>{e.addEventListener(`click`,function(e){e.preventDefault(),e.stopPropagation();let t=this.dataset.action,n=this.dataset.courseId;t===`continue`?J(n):t===`enroll`?un(n):t===`buy`&&dn(n)})})}function un(t){let n=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!n.id){showToast(`Please login first`);return}showToast(m.clock+` Enrolling...`),fetch(`/api/courses/purchase`,{method:`POST`,headers:S(),body:JSON.stringify({userId:n.id,packId:t})}).then(e=>e.json()).then(n=>{if(n.success){e(`/courses/purchase`),showToast(`Free course enrolled!`);let n=j.find(e=>e.id==t);n&&(n.isOwned=!0),cn(),setTimeout(()=>J(t),500)}else showToast(n.message||`Failed to enroll`)}).catch(()=>showToast(`Network error. Please try again.`))}function q(e){C(`/wallet/balance?userId=`+e).then(e=>{if(e.success&&e.wallet){T={balanceAvailable:e.wallet.balanceAvailable||0,grossEarnings:e.wallet.grossEarnings||0,totalWithdrawn:e.wallet.totalWithdrawn||0,feesPaid:e.wallet.feesPaid||0,storeCredit:e.wallet.storeCredit||0},Array.isArray(e.recentTransactions)&&(E=e.recentTransactions.map(e=>({id:e.id||`tx_`+Date.now()+`_`+Math.random(),transaction_type:e.type||e.transaction_type||``,amount:e.amount,fee_deducted:e.feeDeducted||0,description:e.description||``,created_at:e.createdAt||e.created_at||new Date().toISOString()})));let t=document.querySelector(`.ni.active`);if(t){let e=t.dataset.panel;e===`overview`?Re(document.getElementById(`panel-content`)):e===`wallet`&&ze(document.getElementById(`panel-content`))}}}).catch(e=>console.error(`Error refreshing wallet:`,e))}function dn(t){let n=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!n.id){showToast(`Please login first`);return}let r=j.find(e=>e.id==t);if(!r)return;if(r.isOwned){showToast(`You already have access to this course`),J(t);return}if(r.isFree){un(t);return}let i=T?.storeCredit||0,a=T?.balanceAvailable||0,o=r.price||0,s=``;s=i>=o?m.info+` This will be deducted from your Learning Wallet (MWK `+i.toLocaleString()+` available)`:a>=o?m.info+` This will be deducted from your Cash Wallet (MWK `+a.toLocaleString()+` available)`:m.alert+` Insufficient funds. Learning Wallet: MWK `+i.toLocaleString()+`, Cash Wallet: MWK `+a.toLocaleString()+`)`,confirm(`Purchase "${r.name}" for MWK ${(r.price||0).toLocaleString()}?\n\n${s}`)&&(showToast(`⏳ Processing purchase...`),fetch(`/api/courses/purchase`,{method:`POST`,headers:S(),body:JSON.stringify({userId:n.id,packId:t})}).then(e=>e.json()).then(r=>{if(r.success){e(`/courses/purchase`),r.alreadyPurchased?showToast(`You already have access to this course`):r.usedStoreCredit?(showToast(m.checkCircle+` Course purchased using Learning Wallet! MWK `+r.price.toLocaleString()+` deducted.`),T&&(T.storeCredit=r.newStoreCredit)):(showToast(`Course purchased using Cash Wallet!`),r.newBalance!==void 0&&T&&(T.balanceAvailable=r.newBalance));let i=j.find(e=>e.id==t);i&&(i.isOwned=!0),rn(),q(n.id),cn(),setTimeout(()=>J(t),800)}else showToast(r.message||`Failed to purchase`)}).catch(()=>showToast(`Network error. Please try again.`)))}function J(e){let t=j.find(t=>t.id==e);if(!t)return;let n=document.getElementById(`course-detail-modal`),r=document.getElementById(`course-modal-content`),i=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!t.isOwned&&!t.isFree){r.innerHTML=`
      <div style="padding:40px;text-align:center; color:#2d2327;">
        <div style="margin-bottom:16px;">${m.lock}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${t.name}</h3>
        <p style="color:#5a4a4a;margin-bottom:16px;">${t.description||`Purchase this course to access all content.`}</p>
        <div style="font-size:24px;font-weight:700;color:#c09a8a;margin-bottom:20px;">MWK ${(t.price||0).toLocaleString()}</div>
        <button onclick="buyCourse('${e}')" style="padding:12px 40px;background:#2d2327;color:#ffffff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;">Buy Now</button>
        <button onclick="closeCourseDetail()" style="margin-left:12px;padding:12px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">Close</button>
      </div>
    `,n.style.display=`flex`,document.body.style.overflow=`hidden`;return}C(`/content/course-progress?userId=${i.id}&courseId=${e}`).then(n=>{let i=n.success?n.stats:{totalLessons:0,completedLessons:0,progressPercentage:0},a=t.previewItems||[],o=t.contentCount||a.length,s=i.completedLessons||0,c=i.progressPercentage||0;r.innerHTML=`
        <div style="position:relative;aspect-ratio:16/9;background:black;overflow:hidden;">
          ${t.thumbnailUrl?`<img src="${t.thumbnailUrl}" alt="${t.name}" style="width:100%;height:100%;object-fit:cover;opacity:0.7;">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#c09a8a,#d6b8a8);color:#ffffff;font-size:48px;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path></svg></div>`}
          <button id="course-modal-close" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;z-index:10;">${m.close}</button>
        </div>

        <div style="padding:20px; color:#2d2327;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
            <div style="flex:1;">
              <span style="font-size:11px;font-weight:600;color:#c09a8a;background:rgba(192,154,138,0.1);padding:3px 10px;border-radius:100px;">${t.category||`Course`}</span>
              <h2 class="numbers" style="font-size:20px;font-weight:700;margin-top:8px;margin-bottom:4px;">${t.name}</h2>
              <p style="font-size:13px;color:#5a4a4a;">by ${t.instructor||`Wisdom Vault`} · ${t.duration||o+` lessons`}</p>
            </div>
            ${t.isOwned?`<span style="padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;background:rgba(16,185,129,0.1);color:#10B981;flex-shrink:0;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><polyline points="20,6 9,17 4,12"></polyline></svg> Owned</span>`:`<span style="padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;background:rgba(45,35,39,0.05);color:#2d2327;flex-shrink:0;">MWK ${(t.price||0).toLocaleString()}</span>`}
          </div>

          <p style="font-size:13px;color:#5a4a4a;line-height:1.6;margin-bottom:16px;">${t.longDescription||t.description||``}</p>

          ${t.isOwned?`
            <div style="margin-bottom:16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:600;">Your Progress</span>
                <span style="font-size:13px;font-weight:700;color:#c09a8a;">${c}%</span>
              </div>
              <div style="height:6px;background:rgba(45,35,39,0.05);border-radius:3px;overflow:hidden;">
                <div style="height:100%;background:#c09a8a;width:${c}%;transition:width 0.8s ease;"></div>
              </div>
              <p style="font-size:11px;color:#5a4a4a;margin-top:4px;">${s} of ${o} lessons completed</p>
              ${c===100?`<p style="font-size:13px;color:#10B981;font-weight:600;margin-top:6px;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 0 2.5 2 6 2s6-2 6-2v-5"></path></svg> Course Completed! Congratulations!</p>`:``}
            </div>
          `:``}

          <h3 class="numbers" style="font-size:16px;font-weight:700;margin-bottom:12px;">Course Content</h3>
          <div style="background:rgba(45,35,39,0.03);border-radius:12px;padding:4px;">
            ${Array.from({length:o},(e,n)=>{let r=n<s,i=a[n]||null,c=i?i.title:`Lesson `+(n+1),l=i?i.id:null,u=i&&(i.file_url||i.external_link)||``,d=i&&i.link_type||`url`,f=d===`youtube`||d===`vimeo`||d===`tiktok`||d===`instagram`||d===`facebook`||d===`twitter`||d===`video`||u&&u.match(/\.(mp4|webm|mov|avi|mkv)$/i),p=m.camera;return d===`youtube`?p=`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"></polygon></svg>`:d===`tiktok`?p=m.music:d===`instagram`?p=m.camera:d===`vimeo`?p=m.video:d===`facebook`?p=m.book:d===`twitter`&&(p=m.send),`
                <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;${n<o-1?`border-bottom:1px solid rgba(45,35,39,0.05);`:``}">
                  <div style="width:32px;height:32px;border-radius:8px;background:${r?`#c09a8a`:`rgba(45,35,39,0.05)`};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${r?`#ffffff`:`#2d2327`};font-size:12px;font-weight:600;">
                    ${r?`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><polyline points="20,6 9,17 4,12"></polyline></svg>`:n+1}
                  </div>
                  <div style="flex:1;min-width:0;">
                    <p style="font-size:12px;font-weight:600;">${f?p+` `:``}${c}</p>
                    <p style="font-size:10px;color:#5a4a4a;">${f?`Video Lesson`:t.category+` Content`}</p>
                  </div>
                  ${t.isOwned?`
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                      <button class="view-lesson-btn" 
                        data-lesson-id="${l}" 
                        data-lesson-url="${u}" 
                        data-lesson-type="${d}" 
                        data-lesson-title="${c}"
                        data-is-video="${f}"
                        style="padding:4px 12px;background:#2d2327;color:#ffffff;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">
                        ${f?m.play+` Watch`:m.eye+` View`}
                      </button>
                      <button class="mark-lesson-btn" data-lesson-id="${l}" data-completed="${r}" style="padding:4px 12px;background:${r?`rgba(45,35,39,0.05)`:`#2d2327`};color:${r?`#2d2327`:`#ffffff`};border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">
                        ${r?`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><polyline points="20,6 9,17 4,12"></polyline></svg> Done`:`Mark Complete`}
                      </button>
                    </div>
                  `:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a4a4a" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`}
                </div>
              `}).join(``)}
          </div>
        </div>
      `,fn(e)}).catch(()=>{r.innerHTML=`<div style="padding:40px;text-align:center;color:#5a4a4a;">Failed to load course content</div>`}),n.style.display=`flex`,document.body.style.overflow=`hidden`}function fn(t){document.getElementById(`course-modal-close`).addEventListener(`click`,e=>{e.stopPropagation(),Y()}),document.getElementById(`course-modal-bg`).addEventListener(`click`,e=>{e.stopPropagation(),Y()}),document.querySelectorAll(`.view-lesson-btn`).forEach(e=>{e.addEventListener(`click`,function(e){e.preventDefault(),e.stopPropagation();let t=this.dataset.lessonUrl,n=this.dataset.lessonType||`url`,r=this.dataset.lessonTitle||`Lesson`,i=this.dataset.isVideo===`true`;if(!t||t===``){showToast(`No content URL available for this lesson`);return}let a=[`youtube`,`vimeo`,`tiktok`,`instagram`,`facebook`,`twitter`,`video`].includes(n)||t.includes(`youtube.com`)||t.includes(`youtu.be`)||t.includes(`vimeo.com`)||t.includes(`tiktok.com`)||t.includes(`instagram.com`)||t.includes(`facebook.com`)||t.includes(`fb.watch`)||t.includes(`twitter.com`)||t.includes(`x.com`)||t.match(/\.(mp4|webm|mov|avi|mkv|m4v|ogv|3gp)$/i);if(i||a){if(typeof X==`function`){jn(t,n,r);return}window.open(t,`_blank`);return}typeof jn==`function`?jn(t,n,r):showToast(`Lesson viewer not available`)})}),document.querySelectorAll(`.mark-lesson-btn`).forEach(n=>{n.addEventListener(`click`,function(n){n.preventDefault(),n.stopPropagation();let r=this.dataset.lessonId;if(!r)return;let i=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);fetch(`/api/content/course-progress`,{method:`POST`,headers:S(),body:JSON.stringify({userId:i.id,courseId:t,lessonId:r})}).then(e=>e.json()).then(n=>{n.success?(e(`/content/course-progress`),showToast(`Lesson marked as complete!`),J(t),n.stats&&n.stats.isComplete&&(typeof Rn==`function`&&Rn(),showToast(m.graduation+` Congratulations! You completed the course!`))):showToast(n.message||`Failed to mark lesson as complete`)}).catch(()=>showToast(`Network error. Please try again.`))})}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`){let e=document.getElementById(`course-detail-modal`);e&&e.style.display===`flex`&&Y()}})}function Y(){let e=document.getElementById(`course-detail-modal`);e&&(e.style.display=`none`),document.body.style.overflow=``}function pn(e){let t=document.getElementById(`courses-count`);t&&(t.textContent=e+` course`+(e===1?``:`s`))}function mn(){let e=document.getElementById(`courses-grid`),t=document.getElementById(`courses-empty`);e&&(e.innerHTML=``),t&&(t.style.display=`block`),pn(0)}function hn(){document.querySelectorAll(`.courses-tab-btn`).forEach(e=>{e.addEventListener(`click`,function(e){e.stopPropagation(),document.querySelectorAll(`.courses-tab-btn`).forEach(e=>{e.classList.remove(`active`),e.style.background=`rgba(45,35,39,0.05)`,e.style.color=`#2d2327`}),this.classList.add(`active`),this.style.background=`#2d2327`,this.style.color=`#ffffff`,pe=this.dataset.tab,sn()})});let e=document.getElementById(`courses-search`);e&&e.addEventListener(`input`,function(){he=this.value,sn()}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`){let e=document.getElementById(`course-detail-modal`);e&&e.style.display===`flex`&&Y()}})}function gn(e){e.innerHTML=`
    <div class="glass" style="padding:14px 18px;margin-bottom:16px; color:#2d2327;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h1 class="numbers" style="font-size:18px;font-weight:700;">Wisdom Guides</h1>
        </div>
        <span id="guides-count" style="font-size:12px;color:#5a4a4a;background:rgba(45,35,39,0.05);padding:6px 12px;border-radius:100px;font-weight:600;">0 guides</span>
      </div>
    </div>

    <div class="glass" style="padding:16px;margin-bottom:16px;text-align:center; color:#2d2327;">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">Master Your Life</h2>
      <p style="font-size:13px;color:#5a4a4a;">Practical wisdom for relationships, wealth, health, and personal growth</p>
    </div>

    <div style="position:relative;margin-bottom:12px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a4a4a" stroke-width="2.5" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input type="text" id="guides-search" placeholder="Search guides..." 
        style="width:100%;padding:10px 14px 10px 36px;border:1px solid rgba(45,35,39,0.1);border-radius:12px;font-size:13px;outline:none;background:rgba(255,255,255,0.3);color:#2d2327;">
    </div>

    <div id="guides-filters" style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;">
      <button class="guides-filter-chip active" data-category="all" style="padding:6px 16px;background:#2d2327;color:#ffffff;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">All Guides</button>
      <button class="guides-filter-chip" data-category="relationships" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">${m.heart} Relationships</button>
      <button class="guides-filter-chip" data-category="wealth" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M6 3h12l4 6-10 13L2 9z"></path><path d="M2 9h20"></path><path d="M12 22V9"></path><path d="M6 9l6-6 6 6"></path></svg> Wealth</button>
      <button class="guides-filter-chip" data-category="life" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M12 22c4-4 8-7.58 8-12a8 8 0 10-16 0c0 4.42 4 8 8 12z"></path><circle cx="12" cy="10" r="3"></circle></svg> Life</button>
      <button class="guides-filter-chip" data-category="health-wellness" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"></path><path d="M9 9h6"></path><path d="M12 6v6"></path></svg> Health</button>
      <button class="guides-filter-chip" data-category="leadership" style="padding:6px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">${m.star} Leadership</button>
    </div>

    <div id="guides-grid" style="display:grid;grid-template-columns:1fr;gap:12px;">
      <div style="text-align:center;padding:40px;color:#5a4a4a;">
        <div style="width:28px;height:28px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading guides...
      </div>
    </div>

    <div id="guides-empty" style="display:none;text-align:center;padding:50px 20px;color:#5a4a4a;">
      <div style="margin-bottom:12px;">${m.book}</div>
      <h3 style="font-weight:700;font-size:16px;margin-bottom:4px;color:#2d2327;">No guides found</h3>
      <p style="font-size:13px;">Try adjusting your search or filters</p>
    </div>

    <div id="guide-detail-modal" style="display:none;position:fixed;inset:0;z-index:200;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);">
      <div style="position:absolute;inset:0;" id="guide-modal-bg"></div>
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:20px;width:100%;max-width:600px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:201;box-shadow:0 20px 60px rgba(45,35,39,0.1); color:#2d2327;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(45,35,39,0.05);flex-shrink:0;gap:12px;">
          <div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0;">
            <div style="width:44px;height:44px;border-radius:12px;background:#c09a8a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span id="guide-modal-icon" style="font-size:20px;color:#ffffff;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path></svg></span>
            </div>
            <div style="flex:1;min-width:0;">
              <h3 class="numbers" style="font-size:17px;font-weight:700;margin-bottom:4px;" id="guide-modal-title"></h3>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <span id="guide-modal-difficulty" style="padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600; color:#ffffff;"></span>
                <span id="guide-modal-category" style="padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600;background:rgba(45,35,39,0.05);color:#2d2327;"></span>
                <span id="guide-modal-time" style="padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600;background:rgba(45,35,39,0.05);color:#2d2327;">⏱ <span></span></span>
              </div>
            </div>
          </div>
          <button id="guide-modal-close" style="width:32px;height:32px;border-radius:8px;background:rgba(45,35,39,0.05);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#2d2327;flex-shrink:0;">${m.close}</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px;">
          <div id="guide-modal-image" style="margin:-20px -20px 16px -20px;height:200px;overflow:hidden;">
            <img id="guide-modal-img" src="" alt="" style="width:100%;height:100%;object-fit:cover;">
          </div>
          <p id="guide-modal-desc" style="font-size:14px;color:#5a4a4a;line-height:1.6;margin-bottom:20px;"></p>
          <div id="guide-modal-steps" style="display:flex;flex-direction:column;gap:16px;"></div>
          <div id="guide-modal-tips-section" style="margin-top:20px;background:rgba(45,35,39,0.03);border-radius:14px;padding:16px;">
            <h4 style="font-weight:700;font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"></path></svg> Pro Tips</h4>
            <ul id="guide-modal-tips" style="list-style:none;display:flex;flex-direction:column;gap:8px;"></ul>
          </div>
        </div>
      </div>
    </div>
  `,_n(),On()}function _n(){console.log(`Fetching guides from API...`),C(`/content/howto`).then(e=>{console.log(`API Response:`,e),e.success&&e.items&&e.items.length>0?(console.log(`Found`,e.items.length,`guides in API`),N=e.items.map(e=>vn(e)),console.log(`Mapped guides:`,N)):(console.log(`No guides from API, using demo data`),N=xn()),P=N.slice(),Sn()}).catch(e=>{console.error(`Error fetching guides:`,e),N=xn(),P=N.slice(),Sn()})}function vn(e){console.log(`Mapping guide item:`,e);let t=[],n=[];if(e.steps)if(typeof e.steps==`string`)try{t=JSON.parse(e.steps),console.log(`Steps parsed from JSON:`,t)}catch{t=e.steps.split(`
`).filter(e=>e.trim()),console.log(`Steps parsed from newlines:`,t)}else Array.isArray(e.steps)&&(t=e.steps,console.log(`Steps are array:`,t));if(e.tips)if(typeof e.tips==`string`)try{n=JSON.parse(e.tips),console.log(`Tips parsed from JSON:`,n)}catch{n=e.tips.split(`
`).filter(e=>e.trim()),console.log(`Tips parsed from newlines:`,n)}else Array.isArray(e.tips)&&(n=e.tips,console.log(`Tips are array:`,n));return t.length===0&&e.content&&(t=[e.content]),t.length===0&&(t=[`Step 1: Read the guide content`,`Step 2: Apply what you learn`,`Step 3: Share your experience`]),{id:e.id,title:e.title||`Untitled Guide`,description:e.description||``,category:e.category_slug||e.category||`getting-started`,difficulty:e.difficulty||`Beginner`,icon:yn(e.category_slug||e.category),time:e.estimated_time||`5 min`,image:e.thumbnail_url||e.cover_url||bn(e.category_slug||e.category),steps:t,tips:n,content:e.content||``,fileUrl:e.file_url||``,linkType:e.link_type||`url`,isPublished:e.is_published!==!1,author:e.author||`Wisdom Vault`,category_name:e.category_name||``}}function yn(e){return{"getting-started":m.rocket,relationships:m.heart,wealth:m.dollar,life:m.leaf,"health-wellness":m.shield,leadership:m.star,earning:m.dollar,withdrawing:m.wallet,security:m.lock,courses:m.book,tips:m.info,technology:m.fileText,business:m.chart,"personal-development":m.brain}[e]||m.book}function bn(e){return{"getting-started":`https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=450&fit=crop`,relationships:`https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=450&fit=crop`,wealth:`https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop`,life:`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop`,"health-wellness":`https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=450&fit=crop`,leadership:`https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=450&fit=crop`,earning:`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop`,withdrawing:`https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop`,security:`https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop`,courses:`https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop`,tips:`https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop`,technology:`https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop`,business:`https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=450&fit=crop`,"personal-development":`https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop`}[e]||`https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop`}function xn(){return[{id:1001,title:`The Art of Deep Listening`,description:`How truly hearing others can transform your relationships and build unshakeable trust.`,category:`relationships`,difficulty:`Beginner`,icon:m.heart,time:`6 min`,image:`https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=450&fit=crop`,steps:[{title:`Set Aside All Distractions`,content:`Put away your phone, turn off the TV, and give the speaker your full attention. Eye contact matters.`},{title:`Don't Plan Your Response`,content:`Focus completely on what the other person is saying. Don't think about what you'll say next.`},{title:`Reflect Back What You Heard`,content:`Summarize what they said in your own words. 'What I'm hearing is...' This ensures understanding.`},{title:`Ask Deeper Questions`,content:`Don't just hear facts. Ask about feelings, motivations, and what this means to them.`}],tips:[`People don't care how much you know until they know how much you care.`,`Silence is powerful - allow pauses.`,`Listen not to reply, but to understand.`]},{id:2001,title:`The Millionaire Mindset`,description:`How wealthy people think differently about money, risk, and opportunity.`,category:`wealth`,difficulty:`Beginner`,icon:m.dollar,time:`10 min`,image:`https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop`,steps:[{title:`Think Long-Term`,content:`Wealthy people think in decades, not days. Every decision compounds over time.`},{title:`Learn to Manage Risk`,content:`Not avoiding risk, but understanding and managing it. Calculated risks build wealth.`},{title:`Invest in Yourself`,content:`Your skills and knowledge are your greatest assets. Invest in learning continuously.`},{title:`Multiple Income Streams`,content:`Don't rely on one source. Build at least 3 income streams.`},{title:`Asset vs Liability`,content:`Buy assets that generate income, not liabilities that drain it.`}],tips:[`Rich people have rich habits.`,`Your network is your net worth.`,`The best investment is in yourself.`]},{id:3001,title:`10 Life-Changing Morning Habits`,description:`How you start your day determines how you live your life. Transform your mornings.`,category:`life`,difficulty:`Beginner`,icon:m.sunrise,time:`6 min`,image:`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop`,steps:[{title:`Wake Up Early`,content:`Start 30 minutes earlier. This quiet time is yours alone.`},{title:`Hydrate First`,content:`Drink a full glass of water immediately. Your body is dehydrated after sleep.`},{title:`Move Your Body`,content:`Stretch, walk, or exercise. Get the blood flowing.`},{title:`Meditate or Pray`,content:`Start with 5 minutes of silence or gratitude.`},{title:`Review Your Goals`,content:`Read your goals daily. Keep them front of mind.`},{title:`Read for 15 Minutes`,content:`Feed your mind with wisdom and knowledge.`},{title:`Plan Your Day`,content:`Write down your top 3 priorities for the day.`},{title:`Eat a Good Breakfast`,content:`Fuel your body for the day ahead.`},{title:`Avoid Screens`,content:`Don't check email or social media for the first hour.`},{title:`Practice Gratitude`,content:`List 3 things you're grateful for every morning.`}],tips:[`Your morning routine sets the tone for your day.`,`Consistency beats intensity.`,`Win the morning, win the day.`]},{id:4001,title:`The Science of Sleep`,description:`Optimize your sleep for better health, mental clarity, and longevity.`,category:`health-wellness`,difficulty:`Beginner`,icon:m.sleep,time:`7 min`,image:`https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=450&fit=crop`,steps:[{title:`Consistent Sleep Schedule`,content:`Go to bed and wake at the same time daily.`},{title:`Create a Bedtime Routine`,content:`Dim lights, no screens, relaxation rituals 30 minutes before bed.`},{title:`Optimize Your Room`,content:`Cool temperature, dark, and quiet. Invest in a good mattress.`},{title:`Avoid Caffeine After 2 PM`,content:`Caffeine stays in your system for 6-8 hours.`},{title:`Get Morning Sunlight`,content:`Morning light resets your circadian rhythm.`}],tips:[`Sleep is not a luxury; it's a necessity.`,`Your brain cleans itself during sleep.`,`Quality sleep is the foundation of all health.`]},{id:5001,title:`Leading with Emotional Intelligence`,description:`How EQ trumps IQ in leadership and how to develop yours.`,category:`leadership`,difficulty:`Intermediate`,icon:m.star,time:`9 min`,image:`https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=450&fit=crop`,steps:[{title:`Self-Awareness`,content:`Know your emotions, triggers, and blind spots.`},{title:`Self-Regulation`,content:`Control your impulses. Pause before reacting.`},{title:`Empathy`,content:`Understand others' emotions and perspectives.`},{title:`Social Skills`,content:`Build relationships, communicate effectively.`},{title:`Motivation`,content:`Lead with purpose and inspire others.`}],tips:[`People don't leave jobs; they leave managers.`,`Emotional intelligence is a skill you can develop.`,`Great leaders make you feel seen and valued.`]}]}function Sn(){console.log(`Applying filters - Current category:`,ge),console.log(`Total guides:`,N.length),P=N.filter(e=>{let t=ge===`all`||e.category===ge,n=!_e||e.title.toLowerCase().includes(_e.toLowerCase())||e.description.toLowerCase().includes(_e.toLowerCase());return t&&n}),console.log(`Filtered guides:`,P.length),Cn()}function Cn(){let e=document.getElementById(`guides-grid`),t=document.getElementById(`guides-empty`);if(!e)return;if(P.length===0){e.innerHTML=``,t.style.display=`block`,Dn(0);return}t.style.display=`none`,Dn(P.length);let n={Beginner:`background:#10B981;color:white;`,Intermediate:`background:#F59E0B;color:white;`,Advanced:`background:#EF4444;color:white;`};e.innerHTML=P.map((e,t)=>{let r=e.image?`
      <div style="width:100%;height:140px;overflow:hidden;border-radius:12px 12px 0 0;margin:-16px -16px 12px -16px;">
        <img src="${e.image}" alt="${e.title}" style="width:100%;height:100%;object-fit:cover;">
      </div>
    `:``;return`
      <div class="guides-card" data-guide-id="${e.id}" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(45,35,39,0.05);cursor:pointer;transition:all 0.3s ease;animation:fadeInUp 0.4s ease ${t*50}ms both; color:#2d2327;">
        ${r}
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:12px;">
          <div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0;">
            <div style="width:48px;height:48px;border-radius:12px;background:#c09a8a;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;color:#ffffff;">${e.icon}</div>
            <div style="flex:1;min-width:0;">
              <h4 style="font-size:15px;font-weight:700;margin-bottom:4px;line-height:1.3;">${e.title}</h4>
              <p style="font-size:12px;color:#5a4a4a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${e.description}</p>
            </div>
          </div>
          <span style="${n[e.difficulty]||`background:rgba(45,35,39,0.05);color:#2d2327;`}padding:3px 10px;border-radius:100px;font-size:10px;font-weight:600;white-space:nowrap;flex-shrink:0;">${e.difficulty}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#5a4a4a;">
          <span>⏱ ${e.time}</span>
          <span style="color:#c09a8a;font-weight:600;">Read Guide →</span>
        </div>
      </div>
    `}).join(``),document.querySelectorAll(`.guides-card`).forEach(e=>{e.addEventListener(`click`,function(){let e=this.dataset.guideId,t=N.find(t=>t.id==e);t&&wn(t)})})}function wn(e){console.log(`Opening guide:`,e),console.log(`Steps:`,e.steps),console.log(`Tips:`,e.tips);let t=document.getElementById(`guide-detail-modal`);document.getElementById(`guide-modal-icon`).innerHTML=e.icon||m.book,document.getElementById(`guide-modal-title`).textContent=e.title||`Untitled Guide`,document.getElementById(`guide-modal-desc`).textContent=e.description||``,document.getElementById(`guide-modal-time`).querySelector(`span`).textContent=e.time||`5 min`;let n=document.getElementById(`guide-modal-img`),r=document.getElementById(`guide-modal-image`);e.image&&n?(n.src=e.image,n.alt=e.title||`Guide`,r.style.display=`block`):r.style.display=`none`;let i=document.getElementById(`guide-modal-difficulty`);i.textContent=e.difficulty||`Beginner`;let a={Beginner:`#10B981`,Intermediate:`#F59E0B`,Advanced:`#EF4444`};i.style.background=a[e.difficulty]||`#10B981`,i.style.color=`white`;let o=e.category?e.category.split(`-`).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(` `):`General`;document.getElementById(`guide-modal-category`).textContent=o;let s=document.getElementById(`guide-modal-steps`);e.steps&&e.steps.length>0?s.innerHTML=e.steps.map((e,t)=>typeof e==`object`&&e.title?`
          <div style="display:flex;gap:12px;">
            <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;">${t+1}</div>
            <div style="flex:1;">
              <h5 style="font-weight:700;font-size:14px;margin-bottom:4px;color:#2d2327;">${e.title}</h5>
              <p style="font-size:13px;color:#5a4a4a;line-height:1.6;">${e.content||``}</p>
            </div>
          </div>
        `:`
        <div style="display:flex;gap:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;">${t+1}</div>
          <div style="flex:1;">
            <p style="font-size:13px;color:#5a4a4a;line-height:1.6;">${e}</p>
          </div>
        </div>
      `).join(``):s.innerHTML=`
      <div style="text-align:center;padding:20px;color:#5a4a4a;">
        <p>No steps available for this guide.</p>
        <p style="font-size:12px;margin-top:4px;">Check back later for updates.</p>
      </div>
    `;let c=document.getElementById(`guide-modal-tips`),l=document.getElementById(`guide-modal-tips-section`);e.tips&&e.tips.length>0?(l.style.display=`block`,c.innerHTML=e.tips.map(e=>typeof e==`object`&&e.content?`<li style="font-size:13px;color:#5a4a4a;display:flex;align-items:flex-start;gap:8px;"><span style="color:#c09a8a;flex-shrink:0;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><polyline points="20,6 9,17 4,12"></polyline></svg></span><span>${e.content}</span></li>`:`<li style="font-size:13px;color:#5a4a4a;display:flex;align-items:flex-start;gap:8px;"><span style="color:#c09a8a;flex-shrink:0;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><polyline points="20,6 9,17 4,12"></polyline></svg></span><span>${e}</span></li>`).join(``)):l.style.display=`none`,t.style.display=`flex`,document.body.style.overflow=`hidden`,En(e)}function Tn(){document.getElementById(`guide-detail-modal`).style.display=`none`,document.body.style.overflow=``}function En(e){try{let t=JSON.parse(localStorage.getItem(`wv_guide_history`)||`[]`),n=t.findIndex(t=>t.id===e.id);n>-1&&t.splice(n,1),t.unshift({id:e.id,title:e.title,icon:e.icon,lastRead:Date.now()}),t=t.slice(0,20),localStorage.setItem(`wv_guide_history`,JSON.stringify(t))}catch{}}function Dn(e){let t=document.getElementById(`guides-count`);t&&(t.textContent=e+` guide`+(e===1?``:`s`))}function On(){document.querySelectorAll(`.guides-filter-chip`).forEach(e=>{e.addEventListener(`click`,function(e){e.stopPropagation(),document.querySelectorAll(`.guides-filter-chip`).forEach(e=>{e.classList.remove(`active`),e.style.background=`rgba(45,35,39,0.05)`,e.style.color=`#2d2327`}),this.classList.add(`active`),this.style.background=`#2d2327`,this.style.color=`#ffffff`,ge=this.dataset.category,Sn()})});let e=document.getElementById(`guides-search`);e&&e.addEventListener(`input`,function(){_e=this.value.toLowerCase(),Sn()}),document.getElementById(`guide-modal-close`).addEventListener(`click`,e=>{e.stopPropagation(),Tn()}),document.getElementById(`guide-modal-bg`).addEventListener(`click`,e=>{e.stopPropagation(),Tn()}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`){let e=document.getElementById(`guide-detail-modal`);e&&e.style.display===`flex`&&Tn()}})}function kn(e){let t=w||{};e.innerHTML=`
    <div style="margin-bottom:16px;">
      <div class="glass" style="text-align:center;padding:30px; color:#2d2327;">
        <div style="width:64px;height:64px;border-radius:50%;background:#c09a8a;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:24px;font-weight:700;margin:0 auto 12px;">${ye(t.fullName)}</div>
        <h3 style="font-size:18px;font-weight:700;">${t.fullName||`User`}</h3>
        <p style="font-size:13px;color:#5a4a4a;">${t.email||``}</p>
        <p style="font-size:13px;color:#5a4a4a;">${t.phone||``}</p>
        <button id="change-password-btn" style="margin-top:12px;padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.background='rgba(45,35,39,0.1)'" onmouseout="this.style.background='rgba(45,35,39,0.05)'"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg> Change Password</button>
        <button id="signout-btn" style="margin-top:16px;padding:10px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">Sign Out</button>
      </div>
    </div>
  `,document.getElementById(`change-password-btn`)?.addEventListener(`click`,e=>{e.stopPropagation(),An()}),document.getElementById(`signout-btn`)?.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),localStorage.removeItem(`wisdom_vault_user`),localStorage.removeItem(`wisdom_vault_session`),i(),showToast(`<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M7 11l.65-.65a2 2 0 012.83 0L12 12.08M14.35 9.65a2 2 0 012.83 0l.82.82a2 2 0 010 2.83l-1.17 1.17a8 8 0 01-11.31 0L4.83 13.66a2 2 0 010-2.83l2-2a2 2 0 012.83 0"></path></svg> Signing out...`),setTimeout(()=>window.location.href=`/`,300)})}function An(){let e=w||{},t=document.getElementById(`change-password-modal`);t&&t.remove();let n=document.createElement(`div`);n.id=`change-password-modal`,n.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`,n.innerHTML=`
    <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;padding:32px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(45,35,39,0.1); color:#2d2327;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="margin-bottom:8px;">${m.lock}</div>
          <h3 style="font-size:18px;font-weight:700;">Change Password</h3>
          <p style="font-size:14px;color:#5a4a4a;margin-top:4px;">Update your account password</p>
        </div>
        <button onclick="this.closest('#change-password-modal').remove()" style="background:rgba(45,35,39,0.05);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;color:#2d2327;">${m.close}</button>
      </div>

      <form id="change-password-form">
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Current Password <span style="color:#c09a8a;">*</span></label>
          <input type="password" id="cp-current" placeholder="Enter your current password" required style="width:100%;padding:10px 14px;border:1px solid rgba(45,35,39,0.1);border-radius:8px;font-size:14px;background:rgba(255,255,255,0.3);color:#2d2327;">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">New Password <span style="color:#c09a8a;">*</span></label>
          <input type="password" id="cp-new" placeholder="Enter new password (min 6 characters)" required style="width:100%;padding:10px 14px;border:1px solid rgba(45,35,39,0.1);border-radius:8px;font-size:14px;background:rgba(255,255,255,0.3);color:#2d2327;">
          <div style="font-size:11px;color:#5a4a4a;margin-top:4px;">Password must be at least 6 characters</div>
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Confirm New Password <span style="color:#c09a8a;">*</span></label>
          <input type="password" id="cp-confirm" placeholder="Confirm new password" required style="width:100%;padding:10px 14px;border:1px solid rgba(45,35,39,0.1);border-radius:8px;font-size:14px;background:rgba(255,255,255,0.3);color:#2d2327;">
        </div>
        <div style="display:flex;gap:10px;">
          <button type="button" onclick="this.closest('#change-password-modal').remove()" style="flex:1;padding:12px;background:rgba(45,35,39,0.05);color:#2d2327;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Cancel</button>
          <button type="submit" style="flex:2;padding:12px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg> Change Password</button>
        </div>
        <div id="cp-msg" style="margin-top:12px;padding:10px;border-radius:8px;display:none;"></div>
      </form>
    </div>
  `,document.body.appendChild(n),document.getElementById(`change-password-form`).addEventListener(`submit`,async function(t){t.preventDefault();let r=document.getElementById(`cp-current`).value,i=document.getElementById(`cp-new`).value,a=document.getElementById(`cp-confirm`).value,o=document.getElementById(`cp-msg`);if(o.style.display=`none`,i.length<6){o.style.display=`block`,o.innerHTML=m.alert+` Password must be at least 6 characters`;return}if(i!==a){o.style.display=`block`,o.innerHTML=m.alert+` Passwords do not match`;return}try{let t=await(await fetch(`/api/user/change-password`,{method:`PUT`,headers:S(),body:JSON.stringify({userId:e.id,currentPassword:r,newPassword:i})})).json();t.success?(o.style.display=`block`,o.textContent=`Password changed successfully!`,showToast(`Password changed successfully!`),setTimeout(()=>n.remove(),1500)):(o.style.display=`block`,o.innerHTML=t.message||m.x+` Failed to change password`,showToast(t.message||`Failed to change password`))}catch{o.style.display=`block`,o.innerHTML=m.x+` Network error. Please try again.`,showToast(`Network error. Please try again.`)}})}function jn(e,t,n){typeof Y==`function`&&Y();let r=document.getElementById(`lesson-viewer`);r&&r.remove();let i=document.createElement(`div`);i.id=`lesson-viewer`,i.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;`;let a=[`youtube`,`vimeo`,`tiktok`,`instagram`,`facebook`,`twitter`,`video`].includes(t)||e.includes(`youtube.com`)||e.includes(`youtu.be`)||e.includes(`vimeo.com`)||e.includes(`tiktok.com`)||e.includes(`instagram.com`)||e.includes(`facebook.com`)||e.includes(`fb.watch`)||e.includes(`twitter.com`)||e.includes(`x.com`)||e.match(/\.(mp4|webm|mov|avi|mkv|m4v|ogv|3gp)$/i),o=``;if(a&&typeof X==`function`){o=`
      <div style="position:relative;width:100%;max-width:900px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;max-height:90vh;display:flex;flex-direction:column; color:#2d2327;">
        <div style="padding:16px;border-bottom:1px solid rgba(45,35,39,0.05);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:18px;font-weight:700;">${n}</h3>
          <button class="close-lesson-btn" style="background:rgba(45,35,39,0.05);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;color:#2d2327;">${m.close}</button>
        </div>
        <div id="lesson-video-container" style="flex:1;min-height:400px;background:#000;"></div>
        <div style="padding:12px;border-top:1px solid rgba(45,35,39,0.05);display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
          <button class="close-lesson-btn" style="padding:8px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Close Lesson</button>
        </div>
      </div>
    `,i.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="width:100%;max-width:900px;max-height:90vh;">${o}</div></div>`,document.body.appendChild(i);let t=i.querySelector(`#lesson-video-container`);t&&X(e,t,{controls:!0,autoplay:!0,fill:!0,title:n,className:`lesson-video-embed`}),i.querySelectorAll(`.close-lesson-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let e=document.getElementById(`lesson-viewer`);e&&e.remove()})});let r=e=>{if(e.key===`Escape`){let e=document.getElementById(`lesson-viewer`);e&&e.remove(),document.removeEventListener(`keydown`,r)}};document.addEventListener(`keydown`,r);return}if(e.includes(`youtube.com`)||e.includes(`youtu.be`)){let t=e.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]||``;o=t?`
        <div style="position:relative;width:100%;max-width:800px;background:black;border-radius:16px;overflow:hidden;">
          <div style="position:relative;padding-bottom:56.25%;height:0;">
            <iframe src="${e.includes(`/shorts/`),`https://www.youtube.com/embed/${t}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>
          </div>
          <div style="padding:16px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.4);display:flex;justify-content:space-between;align-items:center; color:#2d2327;">
            <h3 style="font-size:18px;font-weight:700;">${n}</h3>
            <button class="close-lesson-btn" style="padding:10px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Close Lesson</button>
          </div>
        </div>
      `:`
        <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
          <div style="font-size:48px;margin-bottom:16px;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"></polygon></svg></div>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
          <p style="color:#5a4a4a;margin-bottom:16px;">Click the button below to view</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"></polygon></svg> Watch on YouTube</a>
            <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
          </div>
        </div>
      `}else if(e.includes(`tiktok.com`)){let t=e.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);o=t?`
        <div style="position:relative;width:100%;max-width:500px;background:black;border-radius:16px;overflow:hidden;">
          <div style="position:relative;padding-bottom:177.78%;height:0;">
            <iframe src="https://www.tiktok.com/embed/v2/${t[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>
          </div>
          <div style="padding:16px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.4);display:flex;justify-content:space-between;align-items:center; color:#2d2327;">
            <h3 style="font-size:18px;font-weight:700;">${n}</h3>
            <button class="close-lesson-btn" style="padding:10px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Close Lesson</button>
          </div>
        </div>
      `:`
        <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
          <div style="margin-bottom:16px;">${m.music}</div>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
          <p style="color:#5a4a4a;margin-bottom:16px;">Click the button below to view</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg> Open TikTok</a>
            <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
          </div>
        </div>
      `}else if(e.includes(`instagram.com`)){let t=e.match(/instagram\.com\/(?:reel|p|tv)\/([^\/?#]+)/);if(t){let r=t[1];o=`
        <div style="position:relative;width:100%;max-width:600px;background:black;border-radius:16px;overflow:hidden;">
          <div style="position:relative;padding-bottom:100%;height:0;">
            <iframe src="https://www.instagram.com/${e.includes(`/reel/`)?`reel`:`p`}/${r}/embed" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>
          </div>
          <div style="padding:16px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.4);display:flex;justify-content:space-between;align-items:center; color:#2d2327;">
            <h3 style="font-size:18px;font-weight:700;">${n}</h3>
            <button class="close-lesson-btn" style="padding:10px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Close Lesson</button>
          </div>
        </div>
      `}else o=`
        <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
          <div style="margin-bottom:16px;">${m.camera}</div>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
          <p style="color:#5a4a4a;margin-bottom:16px;">Click the button below to view</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> Open Instagram</a>
            <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
          </div>
        </div>
      `}else if(e.includes(`vimeo.com`)){let t=e.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1]||``;o=t?`
        <div style="position:relative;width:100%;max-width:800px;background:black;border-radius:16px;overflow:hidden;">
          <div style="position:relative;padding-bottom:56.25%;height:0;">
            <iframe src="https://player.vimeo.com/video/${t}?autoplay=1&title=0&byline=0&portrait=0" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen allow="autoplay; encrypted-media"></iframe>
          </div>
          <div style="padding:16px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.4);display:flex;justify-content:space-between;align-items:center; color:#2d2327;">
            <h3 style="font-size:18px;font-weight:700;">${n}</h3>
            <button class="close-lesson-btn" style="padding:10px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Close Lesson</button>
          </div>
        </div>
      `:`
        <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
          <div style="margin-bottom:16px;">${m.video}</div>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
          <p style="color:#5a4a4a;margin-bottom:16px;">Click the button below to view</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line><line x1="17" y1="17" x2="22" y2="17"></line></svg> Open Vimeo</a>
            <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
          </div>
        </div>
      `}else o=e.includes(`facebook.com`)||e.includes(`fb.watch`)?`
      <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
        <div style="margin-bottom:16px;">${m.book}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
        <p style="color:#5a4a4a;margin-bottom:16px;">Click the button below to view</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path></svg> Open Facebook</a>
          <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
        </div>
      </div>
    `:e.includes(`twitter.com`)||e.includes(`x.com`)?`
      <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
        <div style="margin-bottom:16px;">${m.send}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
        <p style="color:#5a4a4a;margin-bottom:16px;">Click the button below to view</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg> Open Twitter/X</a>
          <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
        </div>
      </div>
    `:e.match(/\.(mp4|webm|mov|avi|mkv|m4v|ogv|3gp)$/i)?`
      <div style="position:relative;width:100%;max-width:800px;background:black;border-radius:16px;overflow:hidden;">
        <video 
          src="${e}" 
          style="width:100%;display:block;"
          controls
          autoplay
          muted
          playsinline
        ></video>
        <div style="padding:16px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.4);display:flex;justify-content:space-between;align-items:center; color:#2d2327;">
          <h3 style="font-size:18px;font-weight:700;">${n}</h3>
          <button class="close-lesson-btn" style="padding:10px 24px;background:#2d2327;color:#ffffff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Close Lesson</button>
        </div>
      </div>
    `:t===`pdf`||e.includes(`.pdf`)?`
      <div style="position:relative;width:100%;max-width:900px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;max-height:90vh;display:flex;flex-direction:column; color:#2d2327;">
        <div style="padding:16px;border-bottom:1px solid rgba(45,35,39,0.05);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:18px;font-weight:700;">${n}</h3>
          <button class="close-lesson-btn" style="background:rgba(45,35,39,0.05);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;color:#2d2327;">${m.close}</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px;min-height:400px;">
          <iframe src="${e}" style="width:100%;height:600px;border:none;border-radius:8px;"></iframe>
        </div>
        <div style="padding:12px;border-top:1px solid rgba(45,35,39,0.05);display:flex;gap:10px;flex-wrap:wrap;">
          <a href="${e}" target="_blank" style="padding:8px 16px;background:#2d2327;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">${m.fileText} Open Full PDF</a>
          <a href="${e}" download style="padding:8px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:6px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download</a>
          <button class="close-lesson-btn" style="padding:8px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:6px;border:none;cursor:pointer;">Close</button>
        </div>
      </div>
    `:t===`audio`||e.includes(`soundcloud.com`)||e.match(/\.(mp3|wav|ogg|m4a)$/i)?`
      <div style="position:relative;width:100%;max-width:600px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px; color:#2d2327;">
        <div style="text-align:center;">
          <div style="margin-bottom:16px;">${m.music}</div>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
          <audio controls style="width:100%;margin:16px 0;">
            <source src="${e}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
            <a href="${e}" target="_blank" style="padding:8px 16px;background:#2d2327;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg> Open Audio</a>
            <button class="close-lesson-btn" style="padding:8px 16px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:6px;border:none;cursor:pointer;">Close</button>
          </div>
        </div>
      </div>
    `:`
      <div style="position:relative;width:100%;max-width:800px;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.4);border-radius:16px;overflow:hidden;padding:40px;text-align:center; color:#2d2327;">
        <div style="margin-bottom:16px;">${m.fileText}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">${n}</h3>
        <p style="color:#5a4a4a;margin-bottom:16px;">Content is available for viewing.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a href="${e}" target="_blank" style="padding:10px 24px;background:#2d2327;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> Open Content</a>
          <button class="close-lesson-btn" style="padding:10px 24px;background:rgba(45,35,39,0.05);color:#2d2327;border-radius:8px;border:none;cursor:pointer;">Close</button>
        </div>
      </div>
    `;i.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="width:100%;max-width:900px;max-height:90vh;">${o}</div></div>`,i.querySelectorAll(`.close-lesson-btn`).forEach(e=>e.addEventListener(`click`,()=>{let e=document.getElementById(`lesson-viewer`);e&&e.remove()})),document.body.appendChild(i);let s=e=>{if(e.key===`Escape`){let e=document.getElementById(`lesson-viewer`);e&&e.remove(),document.removeEventListener(`keydown`,s)}};document.addEventListener(`keydown`,s)}function Mn(e){if(!e)return null;e=e.trim();let t=e.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/);if(t){let n=t[1],r=e.includes(`/shorts/`);return{type:`youtube`,embed:`https://www.youtube.com/embed/${n}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,videoId:n,platform:`YouTube`,isShorts:r}}let n=e.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);if(n){let e=n[1];return{type:`tiktok`,embed:`https://www.tiktok.com/embed/v2/${e}`,videoId:e,platform:`TikTok`}}if(e.includes(`vm.tiktok.com`)||e.includes(`tiktok.com/t/`))return{type:`tiktok_short`,embed:null,platform:`TikTok`,url:e};let r=e.match(/instagram\.com\/(?:reel|p|tv)\/([^\/?#]+)/);if(r){let t=r[1],n=e.includes(`/reel/`)?`reel`:`post`;return{type:`instagram`,embed:`https://www.instagram.com/${n}/${t}/embed`,videoId:t,platform:`Instagram`,isReel:n===`reel`}}let i=e.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);if(i){let e=i[1];return{type:`vimeo`,embed:`https://player.vimeo.com/video/${e}?autoplay=0&title=0&byline=0&portrait=0`,videoId:e,platform:`Vimeo`}}if(e.match(/(?:facebook\.com|fb\.watch)/))return{type:`facebook`,embed:null,platform:`Facebook`,url:e};let a=e.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);if(a){let e=a[1];return{type:`twitter`,embed:`https://twitter.com/i/status/${e}`,videoId:e,platform:`Twitter/X`}}let o=e.match(/rumble\.com\/(?:v|embed\/)([^\/.?#]+)/);if(o){let e=o[1];return{type:`rumble`,embed:`https://rumble.com/embed/${e}/`,videoId:e,platform:`Rumble`}}let s=e.match(/dailymotion\.com\/video\/([^\/?#]+)/);if(s){let e=s[1];return{type:`dailymotion`,embed:`https://www.dailymotion.com/embed/video/${e}`,videoId:e,platform:`Dailymotion`}}let c=e.match(/twitch\.tv\/(?:videos\/(\d+)|clips\/([^\/?#]+))/);if(c){let t=c[1]||c[2],n=e.includes(`/clips/`);return{type:`twitch`,embed:n?`https://clips.twitch.tv/embed?clip=${t}`:`https://player.twitch.tv/?video=${t}`,videoId:t,platform:`Twitch`,isClip:n}}return[`.mp4`,`.webm`,`.mov`,`.avi`,`.mkv`,`.m4v`,`.ogv`,`.3gp`].some(t=>e.toLowerCase().includes(t))?{type:`direct`,embed:e,platform:`Direct Video`,isDirect:!0}:{type:`generic`,embed:e,platform:`Link`,isGeneric:!0}}function Nn(e,t){try{let n=new URL(e,window.location.origin);for(let[e,r]of Object.entries(t))n.searchParams.set(e,String(r));return n.toString()}catch{return e}}function Pn(e){return e.isShorts||e.isReel||e.type===`tiktok`?[9,16]:e.type===`instagram`?[1,1]:[16,9]}function Fn(e,t,n){switch(e.type){case`youtube`:return{autoplay:+!!t,mute:+!!n,playsinline:1,rel:0,modestbranding:1};case`vimeo`:return{autoplay:+!!t,muted:+!!n,playsinline:1,title:0,byline:0,portrait:0,dnt:1};case`dailymotion`:return{autoplay:+!!t,mute:+!!n};case`twitch`:return{autoplay:+!!t,parent:window.location.hostname};case`rumble`:return{autoplay:t?2:0};default:return{}}}function In(e,t,n){return`<div class="video-error" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:38px 22px;text-align:center;background:rgba(45,35,39,0.04);border-radius:14px;color:#2d2327;">
    <div style="font-size:14px;font-weight:700;">${e}</div>
    <div style="font-size:12px;opacity:0.7;line-height:1.6;">${t}</div>
    ${n?`<a href="${n}" target="_blank" rel="noopener" style="margin-top:6px;padding:9px 20px;background:#2d2327;color:#fff;border-radius:9px;text-decoration:none;font-size:12px;font-weight:600;">Open in a new tab</a>`:``}
  </div>`}function X(e,t,n={}){let{autoplay:r=!1,controls:i=!0,muted:a=!1,className:o=`video-embed`,fill:s=!1,title:c=``}=n,l=Mn(e);if(!l)return t.innerHTML=In(`Could not read this video link`,`The link may be incomplete or from an unsupported site.`,e),null;if(l.type===`tiktok_short`)return Ln(l,t,{...n,title:c}),l;let[u,d]=Pn(l),f=d>u,p;if(l.type===`direct`)p=`<video src="${l.embed}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;" ${i?`controls`:``} ${r?`autoplay`:``} ${a?`muted playsinline`:`playsinline`} preload="metadata"></video>`;else if(l.type===`facebook`)p=`<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(l.url||e)}&show_text=false&width=1280&height=720" title="${(c||`Facebook video`).replace(/"/g,``)}" style="position:absolute;inset:0;width:100%;height:100%;border:none;" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;else if(l.type===`twitter`)p=`<iframe src="https://platform.twitter.com/embed/Tweet.html?id=${l.videoId}" title="${(c||`Post on X`).replace(/"/g,``)}" style="position:absolute;inset:0;width:100%;height:100%;border:none;" allowfullscreen loading="lazy"></iframe>`;else if(l.embed&&!l.isGeneric)p=`<iframe src="${Nn(l.embed,Fn(l,r,a))}" title="${(c||l.platform).replace(/"/g,``)}" style="position:absolute;inset:0;width:100%;height:100%;border:none;" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe>`;else return t.innerHTML=In(`This video can’t be embedded`,`${l.platform} does not allow its player to run inside another site. Open it in a new tab instead.`,e),l;let m=s?`position:relative;width:100%;height:100%;background:#000;overflow:hidden;`:`position:relative;width:100%;max-width:${f?Math.round(u/d*62)+`vh`:`100%`};aspect-ratio:${u} / ${d};max-height:70vh;margin:0 auto;background:#000;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.22);`;t.innerHTML=`
    <div class="${o} video-shell" style="position:relative;${s?`width:100%;height:100%;`:``}">
      <div class="video-stage" style="${m}">
        ${p}
        <div class="video-loading" style="position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,0.65);color:#fff;pointer-events:none;">
          <div style="width:28px;height:28px;border:3px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
          <div style="font-size:12px;opacity:0.85;">Loading ${l.platform}…</div>
        </div>
        <div style="position:absolute;top:10px;left:10px;z-index:4;background:rgba(0,0,0,0.65);color:#fff;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;backdrop-filter:blur(4px);">${l.platform}${l.isShorts?` · Shorts`:``}${l.isReel?` · Reel`:``}</div>
        <button type="button" class="video-fs-btn" title="Fullscreen" aria-label="Fullscreen" style="position:absolute;top:10px;right:10px;z-index:4;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);color:#fff;border:none;border-radius:10px;cursor:pointer;backdrop-filter:blur(4px);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/></svg>
        </button>
      </div>
      ${s?`<a href="${e}" target="_blank" rel="noopener" style="position:absolute;left:10px;bottom:10px;z-index:5;padding:5px 12px;border-radius:100px;background:rgba(0,0,0,0.65);color:#fff;font-size:11px;text-decoration:none;backdrop-filter:blur(4px);">Open on ${l.platform}</a>`:`<div style="display:flex;justify-content:center;margin-top:8px;">
        <a href="${e}" target="_blank" rel="noopener" style="font-size:11px;opacity:0.6;">Not playing? Open on ${l.platform}</a>
      </div>`}
    </div>`;let h=t.querySelector(`.video-stage`);t.querySelector(`.video-shell`);let g=t.querySelector(`.video-loading`),_=()=>{g&&(g.style.display=`none`)},v=t.querySelector(`iframe, video`);v&&(v.addEventListener(`load`,_),v.addEventListener(`loadeddata`,_)),setTimeout(_,4500);let y=t.querySelector(`.video-fs-btn`);return y&&(h&&(h.requestFullscreen||h.webkitRequestFullscreen)?y.addEventListener(`click`,e=>{if(e.stopPropagation(),document.fullscreenElement){document.exitFullscreen().catch(()=>{});return}let t=h,n=t.requestFullscreen||t.webkitRequestFullscreen;n&&n.call(t).catch(()=>{})}):y.style.display=`none`),l}async function Ln(e,t,n){try{if(e.type===`tiktok_short`){let n=await(await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(e.url)}`)).json();n.html?(t.innerHTML=`
                    <div style="position:relative;border-radius:12px;overflow:hidden;background:#000;">
                        ${n.html}
                    </div>
                `,t.querySelectorAll(`script`).forEach(e=>{let t=document.createElement(`script`);t.textContent=e.textContent,e.parentNode.replaceChild(t,e)})):t.innerHTML=`<div class="video-error"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Failed to load TikTok video. Please try again.</div>`}}catch(e){console.error(`Error fetching video embed:`,e),t.innerHTML=`<div class="video-error"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-0.125em"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Failed to load video. Please try again.</div>`}}function Rn(){let e=[`#c09a8a`,`#d6b8a8`,`#F5B731`,`#10B981`,`#4D96FF`,`#FF8E53`];for(let t=0;t<60;t++){let t=document.createElement(`div`);t.style.cssText=`
      position: fixed;
      width: ${Math.random()*8+4}px;
      height: ${Math.random()*8+4}px;
      background: ${e[Math.floor(Math.random()*e.length)]};
      left: ${Math.random()*100}vw;
      top: -10px;
      border-radius: ${Math.random()>.5?`50%`:`2px`};
      pointer-events: none;
      z-index: 9999;
      animation: confettiFall ${Math.random()*2+2}s ease-in forwards;
      animation-delay: ${Math.random()*.5}s;
    `,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.remove()},3e3)}}var zn=document.createElement(`style`);zn.textContent=`
  @keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes audioPulse {
    0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
    50% { transform: scale(1.08) rotate(2deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  }
  @keyframes waveBounce {
    0% { transform: scaleY(0.4); }
    100% { transform: scaleY(1); }
  }
`,document.head.appendChild(zn),window.fireConfetti=Rn,window.renderVideoEmbed=X,window.closeCourseDetail=Y,window.closeLessonViewer=function(){let e=document.getElementById(`lesson-viewer`);e&&e.remove()},window.openLessonViewer=jn,window.openWithdrawModal=nt,window.closeWithdrawModal=Be,window.loadPanel=ke,window.openMore=lt,window.closeMore=ut,window.toggleNotif=toggleNotif,window.markAll=markAll,window.showToast=showToast,console.log(`Clear Water Glass Dashboard loaded successfully`);function Bn(){L&&=(clearInterval(L),null),R&&=(clearInterval(R),null)}window.addEventListener(`pagehide`,Bn),window.addEventListener(`beforeunload`,Bn);var Vn=[],Z=null,Q=[];function Hn(e){e.innerHTML=`
    <div class="glass" style="padding:14px 18px;margin-bottom:16px; color:#2d2327;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#c09a8a;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
          </div>
          <h1 class="numbers" style="font-size:18px;font-weight:700;">My Advert</h1>
        </div>
      </div>
      <p style="font-size:12px;color:#5a4a4a;margin-top:8px;line-height:1.5;">Advertise your business to the Vault community. <strong>One advert per day</strong> — fill a template, add up to 3 photos, and our team approves it before it goes live in the Earn &amp; Watch section.</p>
    </div>

    <div id="advert-submit-zone"></div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 10px;">
      <h3 style="font-size:14px;font-weight:700;color:#2d2327;">Your Adverts</h3>
      <span id="advert-count-chip" style="font-size:11px;color:#5a4a4a;"></span>
    </div>
    <div id="advert-status-list" style="display:flex;flex-direction:column;gap:10px;">
      <div style="text-align:center;padding:30px;color:#5a4a4a;background:rgba(45,35,39,0.03);border-radius:12px;">
        <div style="width:28px;height:28px;border:3px solid rgba(192,154,138,0.2);border-top-color:#c09a8a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading...
      </div>
    </div>

    <!-- Advert detail overlay (own adverts + feed ads) -->
    <div id="advert-view-overlay" style="display:none;position:fixed;inset:0;z-index:120;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px;">
      <div style="background:#ffffff;border-radius:20px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;position:relative;">
        <button onclick="window.closeAdvertView()" style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(45,35,39,0.08);border:none;cursor:pointer;z-index:2;font-size:16px;color:#2d2327;">✕</button>
        <div id="advert-view-body"></div>
      </div>
    </div>
  `,$()}async function $(){let e=document.getElementById(`advert-status-list`),t=document.getElementById(`advert-submit-zone`);if(e)try{let n=await C(`/user/adverts`);if(!n.success)throw Error(n.message||`Failed to load`);Vn=n.templates||[],n.limits&&n.limits;let r=n.adverts||[],i=document.getElementById(`advert-count-chip`);if(i&&(i.textContent=r.length+` submitted`),t&&!Z&&(n.submittedToday?t.innerHTML=`
          <div class="glass" style="padding:16px;margin-bottom:16px;background:rgba(192,154,138,0.08);color:#2d2327;">
            <div style="display:flex;gap:10px;align-items:flex-start;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2.5" style="flex-shrink:0;margin-top:2px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div>
                <div style="font-size:13px;font-weight:700;">Daily advert used</div>
                <div style="font-size:12px;color:#5a4a4a;margin-top:2px;">You can submit your next advert tomorrow. One advert per day keeps the feed fresh for everyone.</div>
              </div>
            </div>
          </div>
        `:t.innerHTML=Un()),r.length===0){e.innerHTML=`
        <div style="text-align:center;padding:30px;color:#5a4a4a;background:rgba(45,35,39,0.03);border-radius:12px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.5" style="margin-bottom:8px;"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
          <div style="font-size:13px;font-weight:600;color:#2d2327;">No adverts yet</div>
          <div style="font-size:12px;">Pick a template above to create your first advert.</div>
        </div>
      `;return}e.innerHTML=r.map(e=>Gn(e)).join(``)}catch{e.innerHTML=`<div style="text-align:center;padding:30px;color:#c09a8a;">Failed to load your adverts. Please refresh.</div>`}}function Un(){return`
    <div class="glass" style="padding:16px;margin-bottom:16px;color:#2d2327;">
      <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Create Today's Advert</div>
      <div style="font-size:12px;color:#5a4a4a;margin-bottom:12px;">Choose a template to get started:</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${Vn.map(e=>`
          <div onclick="window.pickAdvertTemplate('${e.id}')" style="border:1px solid rgba(45,35,39,0.1);border-radius:12px;padding:12px;cursor:pointer;background:rgba(45,35,39,0.02);">
            <div style="font-size:12px;font-weight:700;color:#2d2327;">${e.name}</div>
            <div style="font-size:10px;color:#5a4a4a;margin-top:4px;line-height:1.4;">${e.description}</div>
          </div>
        `).join(``)}
      </div>
    </div>
  `}window.pickAdvertTemplate=function(e){if(Z=Vn.find(t=>t.id===e),!Z)return;Q=[];let t=document.getElementById(`advert-submit-zone`);if(!t)return;let n=Z.fields;t.innerHTML=`
    <div class="glass" style="padding:16px;margin-bottom:16px;color:#2d2327;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:14px;font-weight:700;">${Z.name}</div>
        <button onclick="window.cancelAdvertForm()" style="font-size:12px;background:rgba(45,35,39,0.05);border:none;border-radius:8px;padding:6px 12px;color:#2d2327;cursor:pointer;">Cancel</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <label style="font-size:11px;font-weight:600;color:#5a4a4a;">Headline *</label>
          <input id="adv-headline" maxlength="120" placeholder="${n.headline}" style="width:100%;padding:10px;border:1px solid rgba(45,35,39,0.15);border-radius:10px;font-size:13px;margin-top:4px;box-sizing:border-box;">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#5a4a4a;">Business name *</label>
          <input id="adv-business" maxlength="100" placeholder="${n.businessName}" style="width:100%;padding:10px;border:1px solid rgba(45,35,39,0.15);border-radius:10px;font-size:13px;margin-top:4px;box-sizing:border-box;">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#5a4a4a;">Description (optional)</label>
          <textarea id="adv-description" rows="5" placeholder="${n.description}" style="width:100%;padding:10px;border:1px solid rgba(45,35,39,0.15);border-radius:10px;font-size:13px;margin-top:4px;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:11px;font-weight:600;color:#5a4a4a;">Phone (optional)</label>
            <input id="adv-phone" maxlength="40" placeholder="${n.contactPhone}" style="width:100%;padding:10px;border:1px solid rgba(45,35,39,0.15);border-radius:10px;font-size:13px;margin-top:4px;box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:#5a4a4a;">Location (optional)</label>
            <input id="adv-location" maxlength="150" placeholder="${n.location}" style="width:100%;padding:10px;border:1px solid rgba(45,35,39,0.15);border-radius:10px;font-size:13px;margin-top:4px;box-sizing:border-box;">
          </div>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#5a4a4a;">Business photos (up to 3, JPG/PNG/WebP — large photos are compressed automatically)</label>
          <input id="adv-images" type="file" accept="image/jpeg,image/png,image/webp" multiple style="width:100%;padding:8px;font-size:12px;margin-top:4px;">
          <div id="adv-preview" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;"></div>
        </div>

        <div id="adv-error" style="display:none;font-size:12px;color:#EF4444;"></div>

        <button id="adv-submit-btn" onclick="window.submitAdvert()" style="padding:12px;background:#2d2327;color:#ffffff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">
          Submit for Review
        </button>
        <div style="font-size:10px;color:#5a4a4a;text-align:center;">Admin reviews every advert before it appears to other users.</div>
      </div>
    </div>
  `;let r=document.getElementById(`adv-images`);r&&r.addEventListener(`change`,function(){Q.forEach(e=>URL.revokeObjectURL(e)),Q=Array.from(this.files||[]).slice(0,3).map(e=>URL.createObjectURL(e));let e=document.getElementById(`adv-preview`);e&&(e.innerHTML=Q.map(e=>`<img src="${e}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid rgba(45,35,39,0.1);">`).join(``))})},window.cancelAdvertForm=function(){Q.forEach(e=>URL.revokeObjectURL(e)),Q=[],Z=null;let e=document.getElementById(`advert-submit-zone`);e&&(e.innerHTML=Un())},window.submitAdvert=async function(){let e=document.getElementById(`adv-submit-btn`),t=document.getElementById(`adv-error`);if(!e||!Z)return;let n=e=>{t&&(t.textContent=e,t.style.display=`block`)};t&&(t.style.display=`none`);let r=(document.getElementById(`adv-headline`)?.value||``).trim(),i=(document.getElementById(`adv-business`)?.value||``).trim();if(!r)return n(`Please enter a headline.`);if(!i)return n(`Please enter your business name.`);let a=document.getElementById(`adv-images`),o=Array.from(a?.files||[]).slice(0,3);for(let e of o)if(e.size>100*1024*1024)return n(`That file is too large.`);let s=new FormData;s.append(`template`,Z.id),s.append(`headline`,r),s.append(`businessName`,i),s.append(`description`,(document.getElementById(`adv-description`)?.value||``).trim()),s.append(`contactPhone`,(document.getElementById(`adv-phone`)?.value||``).trim()),s.append(`location`,(document.getElementById(`adv-location`)?.value||``).trim());for(let e of o)s.append(`images`,await Fe(e));e.disabled=!0,e.textContent=`Submitting...`;try{let e=localStorage.getItem(`wisdom_vault_session`),t=await fetch(y.API_BASE+`/user/adverts`,{method:`POST`,headers:e?{Authorization:`Bearer `+e}:{},body:s}),n=await t.json().catch(()=>{throw Error(t.status===403?`Security check failed. Please reload the page and try again.`:`Server error. Please try again in a moment.`)});if(!n.success)throw Error(n.message||`Submission failed`);window.showToast(m.checkCircle+` Advert submitted for review!`),window.cancelAdvertForm(),$()}catch(t){n(t.message||`Failed to submit. Please try again.`),e.disabled=!1,e.textContent=`Submit for Review`}};function Wn(e){return e===`approved`?`<span style="background:#10B981;color:#fff;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;">LIVE</span>`:e===`rejected`?`<span style="background:#EF4444;color:#fff;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;">NOT APPROVED</span>`:`<span style="background:#F59E0B;color:#fff;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;">PENDING REVIEW</span>`}function Gn(e){let t=e.images&&e.images[0]||``;return`
    <div class="glass" style="padding:12px;color:#2d2327;display:flex;gap:12px;align-items:center;cursor:pointer;" onclick="window.openAdvertView('${e.id}', true)">
      ${t?`<img src="${t}" style="width:64px;height:64px;border-radius:10px;object-fit:cover;flex-shrink:0;${e.sold?`filter:grayscale(1);`:``}">`:`<div style="width:64px;height:64px;border-radius:10px;background:linear-gradient(135deg,#1a1a2e,#2d2327);display:flex;align-items:center;justify-content:center;flex-shrink:0;${e.sold?`filter:grayscale(1);`:``}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2"><path d="M3 11l18-5v12L3 13v-2z"/></svg></div>`}
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${V(e.headline)}</div>
        <div style="font-size:11px;color:#5a4a4a;">${V(e.businessName)}</div>
        <div style="margin-top:5px;">${Wn(e.status)}
          ${e.sold?`<span style="background:#F59E0B;color:#fff;padding:3px 8px;border-radius:100px;font-size:10px;font-weight:700;margin-left:6px;">SOLD</span>`:``}
          ${e.status===`approved`?`<span style="font-size:10px;color:#5a4a4a;margin-left:6px;">${e.viewCount||0} views</span>`:``}
        </div>
        ${e.status===`rejected`&&e.rejectionReason?`<div style="font-size:10px;color:#EF4444;margin-top:4px;">Reason: ${V(e.rejectionReason)}</div>`:``}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;" onclick="event.stopPropagation();">
        ${e.status===`approved`?`<button onclick="window.toggleAdvertSold('${e.id}', ${e.sold?`false`:`true`})" style="padding:5px 10px;border-radius:8px;border:1px solid rgba(45,35,39,0.15);background:rgba(45,35,39,0.04);color:#2d2327;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;">${e.sold?`Mark Available`:`Mark Sold`}</button>`:``}
        <button onclick="window.deleteMyAdvert('${e.id}')" style="padding:5px 10px;border-radius:8px;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.08);color:#EF4444;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;">Delete</button>
      </div>
    </div>
  `}window.toggleAdvertSold=async function(e,t){try{let n=localStorage.getItem(`wisdom_vault_session`),r=await(await fetch(y.API_BASE+`/user/adverts`,{method:`PATCH`,headers:{"Content-Type":`application/json`,...n?{Authorization:`Bearer `+n}:{}},body:JSON.stringify({id:e,action:t?`mark-sold`:`mark-available`})})).json().catch(()=>({}));r.success?(window.showToast(m.checkCircle+` `+(r.message||`Updated`)),$()):window.showToast(m.alert+` `+(r.message||`Failed to update`))}catch{window.showToast(m.alert+` Network error. Please try again.`)}},window.deleteMyAdvert=async function(e){if(confirm(`Delete this advert? This cannot be undone and frees today's advert slot.`))try{let t=localStorage.getItem(`wisdom_vault_session`),n=await(await fetch(y.API_BASE+`/user/adverts`,{method:`PATCH`,headers:{"Content-Type":`application/json`,...t?{Authorization:`Bearer `+t}:{}},body:JSON.stringify({id:e,action:`delete`})})).json().catch(()=>({}));n.success?(window.showToast(m.checkCircle+` Advert deleted`),$()):window.showToast(m.alert+` `+(n.message||`Failed to delete`))}catch{window.showToast(m.alert+` Network error. Please try again.`)}};function Kn(){if(document.getElementById(`advert-view-overlay`))return;let e=document.createElement(`div`);e.innerHTML=`
    <div id="advert-view-overlay" style="display:none;position:fixed;inset:0;z-index:120;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px;">
      <div style="background:#ffffff;border-radius:20px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;position:relative;">
        <button onclick="window.closeAdvertView()" style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(45,35,39,0.08);border:none;cursor:pointer;z-index:2;font-size:16px;color:#2d2327;">✕</button>
        <div id="advert-view-body"></div>
      </div>
    </div>
  `,document.body.appendChild(e.firstElementChild)}window.openAdvertView=async function(e,t=!1){Kn();let n=document.getElementById(`advert-view-overlay`),r=document.getElementById(`advert-view-body`);if(!n||!r)return;let i=null;try{i=t?((await C(`/user/adverts`)).adverts||[]).find(t=>t.id===e)||null:((await C(`/user/adverts/feed`)).adverts||[]).find(t=>t.id===e)||null}catch{}if(!i){window.showToast(m.alert+` Advert not found`);return}let a=(i.whatsapp||i.contactPhone||``).replace(/[^0-9]/g,``),o=a?`https://wa.me/`+a:``,s=i.contactPhone?`tel:`+i.contactPhone.replace(/[^0-9+]/g,``):``,c=i.images||[];if(r.innerHTML=`
    ${c.length>0?`
      <div style="position:relative;aspect-ratio:4/3;background:#080C1C;border-radius:20px 20px 0 0;overflow:hidden;">
        <img id="advert-main-img" src="${c[0]}" style="width:100%;height:100%;object-fit:cover;">
        ${c.length>1?`
          <div style="position:absolute;bottom:10px;left:0;right:0;display:flex;gap:6px;justify-content:center;">
            ${c.map((e,t)=>`
              <img src="${e}" onclick="document.getElementById('advert-main-img').src='${e}'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid ${t===0?`#c09a8a`:`rgba(255,255,255,0.5)`};">
            `).join(``)}
          </div>
        `:``}
      </div>
    `:``}
    <div style="padding:18px;color:#2d2327;">
      <div style="font-size:10px;font-weight:700;color:#c09a8a;letter-spacing:1px;margin-bottom:6px;">BUSINESS AD${i.isOfficial?` • OFFICIAL`:``}${i.isMine&&!i.isOfficial?` • YOURS`:``}</div>
      <h2 style="font-size:18px;font-weight:700;line-height:1.3;">${V(i.headline)}</h2>
      <div style="font-size:13px;font-weight:600;color:#c09a8a;margin-top:4px;">${V(i.businessName)}</div>
      ${i.sold?`<div style="margin-top:12px;background:#F59E0B;color:#ffffff;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:700;text-align:center;">SOLD — this listing has been marked as sold</div>`:``}
      ${i.description?`<div style="font-size:13px;color:#5a4a4a;line-height:1.6;margin-top:10px;max-height:180px;overflow-y:auto;padding-right:6px;">${Ie(i.description)}</div>`:``}
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
        ${i.location?`<div style="font-size:12px;color:#5a4a4a;display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${V(i.location)}</div>`:``}
        ${i.contactPhone?`<div style="font-size:12px;color:#5a4a4a;display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${V(i.contactPhone)}</div>`:``}
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        ${o?`<a href="${o}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:11px;background:#25D366;color:#fff;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;">WhatsApp</a>`:``}
        ${s?`<a href="${s}" style="flex:1;text-align:center;padding:11px;background:#2d2327;color:#fff;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;">Call</a>`:``}
      </div>
    </div>
  `,n.style.display=`flex`,i.status===`approved`||!t)try{let t=localStorage.getItem(`wisdom_vault_session`);fetch(y.API_BASE+`/user/adverts/feed`,{method:`POST`,headers:{"Content-Type":`application/json`,...t?{Authorization:`Bearer `+t}:{}},body:JSON.stringify({id:e})}).catch(()=>{})}catch{}},window.closeAdvertView=function(){let e=document.getElementById(`advert-view-overlay`);e&&(e.style.display=`none`)};function qn(e){let t=e.images&&e.images[0]||``;return`
    <div data-type="ad" data-ad-id="${e.id}"
         class="glass advert-feed-card"
         style="padding:0;overflow:hidden;background:#ffffff;border:1px solid rgba(192,154,138,0.35);cursor:pointer;"
         onclick="window.openAdvertView('${e.id}', false)">
      <div style="position:relative;aspect-ratio:16/9;background:#080C1C;overflow:hidden;">
        ${t?`<img src="${t}" style="width:100%;height:100%;object-fit:cover;${e.sold?`filter:grayscale(1);`:``}">`:`<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#2d2327);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:36px;${e.sold?`filter:grayscale(1);`:``}"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.125em"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg></div>`}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.4),transparent);"></div>
        <div style="position:absolute;top:10px;left:10px;background:#c09a8a;color:#fff;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:0.5px;">${e.isOfficial?`OFFICIAL`:`AD`}</div>
        ${e.isOfficial?``:e.isMine?`<div style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.9);color:#2d2327;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;">YOURS</div>`:``}
        ${e.sold?`
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <div style="background:rgba(245,158,11,0.92);color:#fff;padding:6px 22px;border-radius:8px;font-size:16px;font-weight:800;letter-spacing:3px;transform:rotate(-8deg);box-shadow:0 4px 14px rgba(0,0,0,0.35);">SOLD</div>
        </div>`:``}
      </div>
      <div style="padding:14px;color:#2d2327;">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:4px;">${V(e.headline)}</h3>
        <p style="font-size:12px;color:#c09a8a;font-weight:600;margin-bottom:6px;">${V(e.businessName)}</p>
        <p style="font-size:12px;color:#5a4a4a;margin-bottom:12px;">${V(e.location||`Support community businesses`)}</p>
        <button class="advert-view-btn" style="width:100%;padding:9px;background:#c09a8a;color:#ffffff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">View Business</button>
      </div>
    </div>
  `}async function Jn(){let e=document.getElementById(`earn-grid`);if(!e)return;let t=[];try{let e=await C(`/user/adverts/feed`);e.success&&(t=e.adverts||[])}catch{return}if(t.length===0)return;e.querySelectorAll(`.advert-feed-card`).forEach(e=>e.remove());let n=Array.from(e.children).filter(e=>!e.classList.contains(`advert-feed-card`));t.forEach((t,r)=>{let i=document.createElement(`div`);i.innerHTML=qn(t);let a=i.firstElementChild;if(!a)return;let o=Math.min((r+1)*3,n.length)-1,s=n[o];s&&s.nextSibling?e.insertBefore(a,s.nextSibling):e.appendChild(a)})}