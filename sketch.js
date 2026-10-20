'use strict';
window.PM_SCRIPT_LOADED = true;
const PM = {
  version: 'v1.7.2.2',
  previewMobile: 900,
  previewDesktop: 1180,
  sourceMaxPixels: 9000000,
  exportMaxPixelsMobile: 5800000,
  exportMaxPixelsDesktop: 9000000,
  sourceOverscan: 0.012,
  historyMax: 24,
  modes: ['DREAM','OCCULT','GHOST','REASSEMBLE'],
  description: {
    DREAM: 'dream exposure / optical drift',
    OCCULT: 'invasion / darkness / corrosion',
    GHOST: 'temporal void / displaced presence',
    REASSEMBLE: 'continuous surface / misplaced space'
  },
  engineCount: 4
};
const VERT = `attribute vec2 aPosition; attribute vec2 aUv; varying vec2 vUv; void main() { vUv = aUv; gl_Position = vec4(aPosition, 0.0, 1.0); }`;
const STRUCTURE_FRAG = `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; vec2 sourceMargin(){ return max(vec2(2.5) / max(uSourceSize, vec2(1.0)), vec2(0.0015)); } vec2 safeCoord(vec2 uv){ vec2 m = sourceMargin(); return clamp(uv, m, 1.0 - m); } vec3 src(vec2 uv){ return texture2D(uSource, safeCoord(uv)).rgb; } float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); } void main(){ vec2 uv = safeCoord(vUv); vec2 e = vec2(1.5) / max(uSourceSize, vec2(1.0)); float lum = luma(src(uv)); float lumL = luma(src(uv - vec2(e.x, 0.0))); float lumR = luma(src(uv + vec2(e.x, 0.0))); float lumU = luma(src(uv - vec2(0.0, e.y))); float lumD = luma(src(uv + vec2(0.0, e.y))); float gx = lumR - lumL; float gy = lumD - lumU; float edge = clamp(length(vec2(gx, gy)) * 2.8, 0.0, 1.0); float shadow = clamp((0.72 - lum) * 1.55, 0.0, 1.0); float highlight = clamp((lum - 0.44) * 1.7, 0.0, 1.0); float localAvg = 0.25 * (lumL + lumR + lumU + lumD); float detail = clamp(abs(lum - localAvg) * (5.4 + 2.2 * uDepth), 0.0, 1.0); gl_FragColor = vec4(edge, shadow, highlight, detail); }`;
const MODE_SHADERS = {
  DREAM: {
    event: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)) + uSeed*0.00013)*43758.5453123); } float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=0.56*noise2(p);v+=0.28*noise2(p*2.03+11.17);v+=0.16*noise2(p*4.03+37.4);return v;} vec2 flow(vec2 uv,vec2 phase,float scale){return vec2(fbm(uv*scale+phase),fbm(uv*scale+phase+vec2(8.31,21.7)))-0.5;} void main(){ vec2 uv=vUv; vec4 st=texture2D(uStructure,uv); float d=uDepth; float eventGain=uHiddenA.y, scaleGain=uHiddenA.w; vec2 f=flow(uv,uRecipeA.xy*13.,2.35*scaleGain); float low=fbm(uv*2.4+uRecipeB.xy*9.+f*0.28); float mid=fbm(uv*5.2+uRecipeA.zw*15.-f*0.18); float fine=fbm(uv*9.1+uRecipeB.zw*21.); float quiet=1.-clamp(st.r*0.52+st.a*0.72,0.,1.); float veil=smoothstep(0.33-0.13*d-0.07*(eventGain-1.),0.72,low*0.66+mid*0.22+st.b*0.16); float flash=smoothstep(0.30-0.08*(eventGain-1.),0.82,st.b*0.62+low*0.26+fine*0.10); float membrane=1.-smoothstep(0.045,0.19,abs(low-mid)*(1.58+0.22/scaleGain)); float material=smoothstep(0.27-0.05*(eventGain-1.)-0.04*(uHiddenA.z-1.),0.78,mid*0.48+fine*0.22+st.a*0.20+quiet*0.12); gl_FragColor=vec4(clamp(veil,0.,1.),clamp(flash,0.,1.),clamp(membrane,0.,1.),clamp(material,0.,1.)); }`,
    mutation: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)) + uSeed*0.00013)*43758.5453123); } float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=0.56*noise2(p);v+=0.28*noise2(p*2.03+11.17);v+=0.16*noise2(p*4.03+37.4);return v;} vec2 safeUv(vec2 uv){ vec2 q=mod(uv,2.0); q=mix(q,2.0-q,step(vec2(1.0),q)); vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.0)),vec2(0.0006)); return clamp(q,m,1.0-m); } vec2 edgeCondition(vec2 uv,vec2 delta){ float gx=smoothstep(0.018,0.145,min(uv.x,1.0-uv.x)); float gy=smoothstep(0.018,0.145,min(uv.y,1.0-uv.y)); return delta*vec2(0.18+0.82*gx,0.18+0.82*gy); } vec3 photo(vec2 uv){return texture2D(uSource,safeUv(uv)).rgb;} vec2 flow(vec2 uv,vec2 phase,float scale){return vec2(fbm(uv*scale+phase),fbm(uv*scale+phase+vec2(8.31,21.7)))-0.5;} void main(){ vec2 uv=vUv; vec4 e=texture2D(uMask,uv); vec4 st=texture2D(uStructure,uv); float t=uTransform,d=uDepth,typ=uRecipeIds.z; float spatial=uHiddenA.x,wild=uHiddenB.w,scaleGain=uHiddenA.w; vec2 f1=flow(uv,uRecipeA.xy*12.,(2.15+typ*0.42)*scaleGain); vec2 f2=flow(uv.yx,uRecipeB.zw*15.,4.8/max(scaleGain,0.55)); float detailGuard=clamp(st.r*0.58+st.a*0.70,0.,1.); float freeSpace=1.-detailGuard*0.52; vec2 wave=vec2(sin(uv.y*(5.2+typ*1.4)+uRecipeA.z*6.283),cos(uv.x*(5.7+typ*1.2)+uRecipeB.y*6.283)); vec2 disp=(f1*0.115+f2*0.032+wave*(0.010+0.004*typ))*(0.15+1.10*t)*(0.38+0.62*e.r)*freeSpace*spatial; vec2 er=uv-vec2(uEventCtl.z,uEventCtl.w); float erLen=max(length(er),.001); float liquidLens=(1.-smoothstep(.08,.52,erLen))*smoothstep(.68,.98,wild); disp+=(er/erLen)*sin(erLen*(18.+10.*scaleGain)+uSeed*.0017)*(.010+.018*t)*liquidLens*spatial; disp=edgeCondition(uv,disp); vec3 base=photo(uv); vec3 warped=photo(uv+disp); vec2 slip=vec2(-f1.y,f1.x)*(0.008+0.042*t)*(0.25+0.75*e.a)*(0.65+0.35*(1.-st.a))*mix(.76,1.34,wild); slip=edgeCondition(uv,slip); vec3 softSlip=photo(uv+slip); vec3 outC=mix(base,warped,clamp((0.23+0.62*t)*(.86+.15*spatial),0.,0.95)); outC=mix(outC,softSlip,e.b*(0.06+0.24*d)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`,
    grade: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)) + uSeed*0.00013)*43758.5453123); } float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=0.56*noise2(p);v+=0.28*noise2(p*2.03+11.17);v+=0.16*noise2(p*4.03+37.4);return v;} vec2 safeUv(vec2 uv){ vec2 q=mod(uv,2.0); q=mix(q,2.0-q,step(vec2(1.0),q)); vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.0)),vec2(0.0006)); return clamp(q,m,1.0-m); } vec2 edgeCondition(vec2 uv,vec2 delta){ float gx=smoothstep(0.018,0.145,min(uv.x,1.0-uv.x)); float gy=smoothstep(0.018,0.145,min(uv.y,1.0-uv.y)); return delta*vec2(0.18+0.82*gx,0.18+0.82*gy); } vec3 photo(vec2 uv){return texture2D(uSource,safeUv(uv)).rgb;} float lum(vec3 c){return dot(c,vec3(0.2126,0.7152,0.0722));} vec3 palette(float t,vec3 a,vec3 b,vec3 c){float k=clamp(t,0.,1.);return k<0.5?mix(a,b,k*2.):mix(b,c,(k-0.5)*2.);} vec3 screenC(vec3 a,vec3 b){return 1.-(1.-a)*(1.-b);} void main(){ vec2 uv=vUv; vec4 e=texture2D(uMask,uv); vec4 st=texture2D(uStructure,uv); vec3 base=texture2D(uWarp,uv).rgb; float l=lum(base),C=clamp(uColor*uHiddenB.x,0.,1.25),d=uDepth; float exposureGain=uHiddenB.y; float rid=uRecipeIds.x; vec3 dark,mid,light; if(rid<0.5){dark=vec3(0.28,0.34,0.42);mid=vec3(0.63,0.80,0.82);light=vec3(1.00,0.86,0.72);} else if(rid<1.5){dark=vec3(0.37,0.31,0.46);mid=vec3(0.74,0.67,0.86);light=vec3(0.96,0.97,0.82);} else if(rid<2.5){dark=vec3(0.26,0.38,0.43);mid=vec3(0.54,0.85,0.83);light=vec3(1.00,0.76,0.80);} else if(rid<3.5){dark=vec3(0.40,0.36,0.31);mid=vec3(0.84,0.70,0.49);light=vec3(0.95,0.92,0.87);} else{dark=vec3(0.34,0.37,0.38);mid=vec3(0.70,0.72,0.69);light=vec3(0.96,0.91,0.94);} vec3 dream=palette(clamp(l+e.g*0.14+st.b*0.10,0.,1.),dark,mid,light); vec3 outC=mix(base,dream,0.08+0.54*C); float exposure=uRecipeIds.y; if(exposure<0.5) outC=mix(outC,vec3(1.0),st.b*(0.08+0.25*C)*exposureGain); else if(exposure<1.5) outC=pow(clamp(outC,0.,1.),vec3(clamp(0.82-0.06*exposureGain,0.68,0.82))); else if(exposure<2.5) outC=mix(outC,vec3(l*0.60+0.36),(0.10+0.18*d)*exposureGain); else if(exposure<3.5) outC=mix(outC,screenC(outC,vec3(0.28,0.22,0.18)),(0.08+0.14*C)*exposureGain); else outC=mix(outC,vec3(0.95,0.96,0.98),e.r*(0.06+0.16*C)*exposureGain); vec2 pos=vec2(uEventCtl.z,uEventCtl.w); vec2 q=(uv-pos)*vec2(0.92,1.15); float n=fbm(uv*4.8+uRecipeA.xy*10.); float halo=1.-smoothstep(0.16,0.66,length(q)+(n-0.5)*0.17); float side=1.-smoothstep(0.0,0.42,abs(uv.x-(0.12+uRecipeB.x*0.76))+(n-0.5)*0.10); float act=clamp(uEventCtl.x*uEventCtl.y*(0.34+0.66*d)*uHiddenA.y,0.,1.45); float kind=uRecipeIds.w; if(kind<0.5){ float veil=clamp(halo*0.72+e.r*0.28,0.,1.); outC=mix(outC,vec3(0.98,0.97,0.94),act*veil*(0.18+0.38*d)); } else if(kind<1.5){ vec3 candy=mix(vec3(1.0,0.62,0.72),vec3(0.55,0.85,1.0),smoothstep(0.25,0.80,uv.y+n*0.15)); outC=mix(outC,screenC(outC,candy),act*halo*(0.22+0.44*C)); } else if(kind<2.5){ vec3 heat=vec3(1.0,0.73,0.46); outC=mix(outC,screenC(outC,heat),act*e.g*halo*(0.18+0.42*d)); outC=mix(outC,vec3(1.0),act*st.b*halo*0.14); } else if(kind<3.5){ vec3 wrong=mix(vec3(0.50,0.86,0.92),vec3(0.95,0.69,0.83),n); outC=mix(outC,screenC(outC,wrong),act*side*(0.12+0.30*C)); } else { float ir=0.5+0.5*sin((l*7.0+n*2.5+uv.x*1.4)*6.283); vec3 foil=mix(vec3(0.72,0.89,1.0),vec3(1.0,0.77,0.66),ir); float material=e.a*(0.25+0.75*st.a); outC=mix(outC,screenC(outC,foil),act*material*(0.10+0.28*C)*uHiddenA.z); } float opalChance=smoothstep(.70,.97,uHiddenB.w)*e.a*(.25+.75*st.b); vec3 opal=mix(vec3(.70,.93,1.0),vec3(1.0,.72,.86),n*.65+uHiddenB.z*.35); outC=mix(outC,screenC(outC,opal),opalChance*(.06+.18*C)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`
  },
  OCCULT: {
    event: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*0.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} void main(){ vec2 uv=vUv; vec4 st=texture2D(uStructure,uv); float d=uDepth; float eventGain=uHiddenA.y,scaleGain=uHiddenA.w; float low=fbm(uv*(2.7*scaleGain)+uRecipeA.xy*10.); float mid=fbm(uv.yx*(5.4/max(scaleGain,.62))+uRecipeB.zw*13.); float fine=fbm(uv*(9.5*scaleGain)+uRecipeA.zw*21.); float shadow=st.g; float quiet=1.-clamp(st.a*0.75+st.r*0.42,0.,1.); float fog=smoothstep(0.33-0.12*d-0.06*(eventGain-1.),0.73,low*0.50+mid*0.22+shadow*0.32); float stain=smoothstep(0.35-0.07*(eventGain-1.)-0.04*(uHiddenA.z-1.),0.78,mid*0.47+fine*0.18+shadow*0.35); float witness=smoothstep(0.38-0.09*(eventGain-1.),0.74,low*0.52+quiet*0.32+shadow*0.18); float membrane=1.-smoothstep(0.035,0.16,abs(low-mid)*1.75+st.r*0.10); gl_FragColor=vec4(clamp(fog,0.,1.),clamp(stain,0.,1.),clamp(witness,0.,1.),clamp(membrane,0.,1.)); }`,
    mutation: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*0.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float soft1(float x,float m){if(x<m){float d=m-x;return m-d/(1.+d/m);}if(x>1.-m){float d=x-(1.-m);return 1.-m+d/(1.+d/m);}return x;} vec2 frameUv(vec2 uv){vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.)),vec2(.001));return vec2(soft1(uv.x,m.x),soft1(uv.y,m.y));} float coverScale(){return 1.+clamp(.010+.034*uTransform+.015*max(uHiddenA.x-1.,0.)+.009*uHiddenB.w,0.,.068);} vec2 sourceUv(vec2 uv){float z=coverScale();return frameUv(.5+(uv-.5)/z);} vec2 edgeCondition(vec2 uv,vec2 delta){float gx=smoothstep(.018,.145,min(uv.x,1.-uv.x));float gy=smoothstep(.018,.145,min(uv.y,1.-uv.y));return delta*vec2(.18+.82*gx,.18+.82*gy);} vec3 photo(vec2 uv){return texture2D(uSource,sourceUv(uv)).rgb;} vec2 flow(vec2 uv,vec2 ph,float s){return vec2(fbm(uv*s+ph),fbm(uv*s+ph+vec2(8.31,21.7)))-.5;} void main(){ vec2 uv=vUv; vec4 e=texture2D(uMask,uv); vec4 st=texture2D(uStructure,uv); float t=uTransform,d=uDepth; float spatial=uHiddenA.x,wild=uHiddenB.w,scaleGain=uHiddenA.w; vec2 f=flow(uv,uRecipeA.xy*13.,3.3*scaleGain); vec2 f2=flow(uv.yx,uRecipeB.zw*15.,6.1/max(scaleGain,.58)); vec2 center=vec2(0.14+0.72*uRecipeB.x,0.12+0.76*uRecipeB.y); vec2 rel=center-uv; float rr=max(length(rel),0.001); vec2 toward=rel/rr; float protect=clamp(st.r*0.48+st.a*0.64,0.,1.); float background=1.-protect*0.58; vec2 pull=(toward*(0.010+0.062*t)*e.r*background + f*(0.012+0.055*t)*(0.25+0.75*e.g)*background)*spatial; vec2 sideways=vec2(-f.y,f.x)*(0.006+0.030*t)*e.a*mix(.82,1.42,wild); float sinkPocket=smoothstep(.73,.98,wild)*e.b*(1.-st.a*.48); pull+=toward*(.012+.038*d)*sinkPocket*spatial; vec2 occultShift=edgeCondition(uv,pull+sideways); vec3 base=photo(uv); vec3 sink=photo(uv+occultShift); vec3 outC=mix(base,sink,0.25+0.52*t); vec2 shadowShift=edgeCondition(uv,-pull*0.85+f2*0.012); vec3 shadowDrift=photo(uv+shadowShift); outC=mix(outC,shadowDrift,e.b*(0.05+0.18*d)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`,
    grade: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float soft1(float x,float m){if(x<m){float d=m-x;return m-d/(1.+d/m);}if(x>1.-m){float d=x-(1.-m);return 1.-m+d/(1.+d/m);}return x;} vec2 frameUv(vec2 uv){vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.)),vec2(.001));return vec2(soft1(uv.x,m.x),soft1(uv.y,m.y));} float coverScale(){return 1.+clamp(.010+.034*uTransform+.015*max(uHiddenA.x-1.,0.)+.009*uHiddenB.w,0.,.068);} vec2 sourceUv(vec2 uv){float z=coverScale();return frameUv(.5+(uv-.5)/z);} vec2 edgeCondition(vec2 uv,vec2 delta){float gx=smoothstep(.018,.145,min(uv.x,1.-uv.x));float gy=smoothstep(.018,.145,min(uv.y,1.-uv.y));return delta*vec2(.18+.82*gx,.18+.82*gy);} vec3 photo(vec2 uv){return texture2D(uSource,sourceUv(uv)).rgb;} float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));} vec3 palette(float t,vec3 a,vec3 b,vec3 c){float k=clamp(t,0.,1.);return k<.5?mix(a,b,k*2.):mix(b,c,(k-.5)*2.);} vec3 screenC(vec3 a,vec3 b){return 1.-(1.-a)*(1.-b);} void main(){ vec2 uv=vUv; vec4 e=texture2D(uMask,uv); vec4 st=texture2D(uStructure,uv); vec3 base=texture2D(uWarp,uv).rgb; float l=lum(base),C=clamp(uColor*uHiddenB.x,0.,1.18),d=uDepth; float exposureGain=uHiddenB.y; vec3 a,b,c; float rid=uRecipeIds.x; if(rid<.5){a=vec3(.09,.14,.13);b=vec3(.29,.48,.42);c=vec3(.72,.77,.58);} else if(rid<1.5){a=vec3(.10,.12,.18);b=vec3(.25,.37,.49);c=vec3(.70,.73,.67);} else if(rid<2.5){a=vec3(.15,.12,.11);b=vec3(.43,.30,.24);c=vec3(.75,.65,.51);} else if(rid<3.5){a=vec3(.12,.10,.16);b=vec3(.36,.27,.42);c=vec3(.67,.69,.71);} else{a=vec3(.10,.15,.12);b=vec3(.31,.43,.27);c=vec3(.62,.72,.63);} vec3 mapped=palette(clamp(l+e.r*.08-e.g*.06,0.,1.),a,b,c); vec3 outC=mix(base,mapped,.08+.47*C); float ex=uRecipeIds.y; if(ex<.5) outC*=clamp((.82+.11*l)/max(exposureGain,.70),.62,1.02); else if(ex<1.5) outC=mix(outC,vec3(l*.67+.17),(.08+.14*d)*exposureGain); else if(ex<2.5) outC*=clamp(.96-.04*exposureGain+.03*l,.82,1.02); else outC=mix(outC,screenC(outC,vec3(.18,.22,.19)),(.08+.10*C)*exposureGain); vec2 pos=vec2(uEventCtl.z,uEventCtl.w); float n=fbm(uv*5.1+uRecipeA.xy*11.); float field=1.-smoothstep(.12,.69,length((uv-pos)*vec2(.95,1.12))+(n-.5)*.20); float act=clamp(uEventCtl.x*uEventCtl.y*(.30+.70*d)*uHiddenA.y,0.,1.45); float kind=uRecipeIds.w; if(kind<.5){outC*=1.-act*field*e.r*(.12+.34*d);} else if(kind<1.5){vec3 cold=mix(vec3(.42,.67,.58),vec3(.47,.63,.78),n);outC=mix(outC,screenC(outC,cold),act*field*e.r*(.12+.26*C));} else if(kind<2.5){float falseLamp=field*e.b*(1.-st.a*.55);outC=mix(outC,screenC(outC,vec3(.80,.88,.66)),act*falseLamp*(.14+.25*d));} else if(kind<3.5){vec3 stain=mix(vec3(.30,.39,.29),vec3(.50,.33,.36),n);outC=mix(outC,stain,act*e.g*field*(.10+.28*C));} else {vec2 off=vec2(.025+.035*uTransform,-.018-.022*uDepth);vec3 witness=photo(uv+off);float wm=act*field*e.b*(1.-st.a*.62)*(1.-st.r*.35);outC=mix(outC,mix(witness,vec3(lum(witness))*.78,.44),wm*(.10+.20*d));} float aperture=smoothstep(.74,.98,uHiddenB.w)*field*(1.-st.a*.50)*(0.35+0.65*e.b); vec3 apertureTone=mix(vec3(.16,.22,.20),vec3(.46,.63,.58),uHiddenB.z); outC=mix(outC,apertureTone,aperture*(.07+.20*d)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`
  },
  GHOST: {
    event: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} vec2 flow(vec2 uv,vec2 ph,float s){return vec2(fbm(uv*s+ph),fbm(uv*s+ph+vec2(8.31,21.7)))-.5;} void main(){ vec2 uv=vUv; vec4 st=texture2D(uStructure,uv); float d=uDepth,kind=uRecipeIds.w; float eventGain=uHiddenA.y,scaleGain=uHiddenA.w; vec2 f=flow(uv,uRecipeA.xy*13.,2.55*scaleGain); float low=fbm(uv*(2.45*scaleGain)+uRecipeB.zw*9.+f*.13); float mid=fbm(uv*(5.10/max(scaleGain,.60))+uRecipeA.zw*17.-f*.09); float fine=fbm(uv*(8.20*scaleGain)+uRecipeB.xy*21.); float phase=clamp(low*.60+mid*.29+fine*.11,0.,1.); float presence=smoothstep(.36-.12*d-.08*(eventGain-1.),.69,phase+st.a*.08+st.g*.06); vec2 center=vec2(uEventCtl.z,uEventCtl.w); vec2 rel=(uv-center)*vec2(.94,1.08); float radial=length(rel)+(low-.5)*.16+(mid-.5)*.08; float focus=1.-smoothstep(.14+.03*uRecipeA.x,.52+.08*uRecipeB.y+.05*(uHiddenA.z-1.),radial); focus*=clamp((.38+.62*uEventCtl.x)*eventGain,0.,1.35); float membrane=1.-smoothstep(.025,.14,abs(phase-.52)); float trace=clamp(st.r*(.45+.45*presence)+membrane*.42+st.a*.16,0.,1.); float cavity=focus*(.50+.50*presence)*(.60+.30*st.g+.10*(1.-st.a)); if(kind<.5)cavity=clamp(cavity*1.30+focus*presence*.18,0.,1.); else if(kind<1.5)cavity*=.72; else if(kind<2.5)cavity=clamp(cavity*.72+presence*membrane*.22,0.,1.); else if(kind<3.5)cavity=clamp(cavity*.88+st.g*focus*.20,0.,1.); else if(kind<4.5)cavity=clamp(cavity+focus*trace*.20,0.,1.); else cavity*=.58; gl_FragColor=vec4(clamp(presence,0.,1.),clamp(trace,0.,1.),clamp(cavity,0.,1.),clamp(phase*.86+low*.14,0.,1.)); }`,
    mutation: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float soft1(float x,float m){if(x<m){float d=m-x;return m-d/(1.+d/m);}if(x>1.-m){float d=x-(1.-m);return 1.-m+d/(1.+d/m);}return x;} vec2 frameUv(vec2 uv){vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.)),vec2(.001));return vec2(soft1(uv.x,m.x),soft1(uv.y,m.y));} float coverScale(){return 1.+clamp(.010+.034*uTransform+.015*max(uHiddenA.x-1.,0.)+.009*uHiddenB.w,0.,.068);} vec2 sourceUv(vec2 uv){float z=coverScale();return frameUv(.5+(uv-.5)/z);} vec2 edgeCondition(vec2 uv,vec2 delta){float gx=smoothstep(.018,.145,min(uv.x,1.-uv.x));float gy=smoothstep(.018,.145,min(uv.y,1.-uv.y));return delta*vec2(.18+.82*gx,.18+.82*gy);} vec3 photo(vec2 uv){return texture2D(uSource,sourceUv(uv)).rgb;} vec2 flow(vec2 uv,vec2 ph,float s){return vec2(fbm(uv*s+ph),fbm(uv*s+ph+vec2(8.31,21.7)))-.5;} void main(){ vec2 uv=vUv; vec4 e=texture2D(uMask,uv); vec4 st=texture2D(uStructure,uv); float t=uTransform,d=uDepth,kind=uRecipeIds.w; float phase=e.a*2.-1.; float spatial=uHiddenA.x,eventGain=uHiddenA.y,wild=uHiddenB.w; float ang=6.28318*(uRecipeA.z*.67+uRecipeB.w*.33); vec2 axis=vec2(cos(ang),sin(ang)),normal=vec2(-axis.y,axis.x); vec2 f1=flow(uv,uRecipeB.zw*11.,2.35),f2=flow(uv.yx,uRecipeA.xy*17.,4.90); float zone=e.r*(.38+.62*d); vec2 disp=(axis*phase*(.016+.088*t)*(.35+.65*zone)+normal*f1.x*(.018+.058*t)*zone+f2*(.010+.040*d)*zone)*spatial; if(kind>1.5&&kind<2.5)disp+=axis*sign(phase)*(.014+.060*t)*e.g*(.30+.70*smoothstep(.20,.78,abs(phase))); if(kind>3.5&&kind<4.5)disp+=normal*(.012+.052*t)*(e.b*.55+e.g*.28)*sign(phase+.001)*spatial; float phasePocket=smoothstep(.70,.98,wild)*e.r*(1.-st.a*.44); disp+=normal*sign(phase+.001)*(.010+.040*t)*phasePocket*spatial; disp=edgeCondition(uv,disp); vec3 outC=photo(uv+disp); vec2 center=vec2(uEventCtl.z,uEventCtl.w),rel=(uv-center)*vec2(.94,1.08); float rr=max(length(rel),.0008);vec2 dir=rel/rr,tangent=vec2(-dir.y,dir.x);float cavity=e.b*(.22+.78*d)*(.55+.45*uEventCtl.y)*eventGain; vec2 fillShift=dir*(.018+.090*d)*(.45+.55*e.r)+tangent*(f1.y*.040+phase*.012); fillShift=edgeCondition(uv,fillShift); vec2 fillShiftB=edgeCondition(uv,-fillShift*.62+f2*.018); vec3 surroundA=photo(uv+fillShift),surroundB=photo(uv+fillShiftB);vec3 surround=mix(surroundA,surroundB,.34+.22*e.a); float fillAmount=cavity*(.30+.38*d);if(kind<.5)fillAmount*=1.35;else if(kind<1.5)fillAmount*=.62;else if(kind>3.5&&kind<4.5)fillAmount*=1.12;else if(kind>4.5)fillAmount*=.42;outC=mix(outC,surround,clamp(fillAmount,0.,.82)); float hollow=cavity*(.35+.65*(1.-st.r))*(.45+.55*(1.-st.a));vec2 hollowShift=edgeCondition(uv,normal*(.022+.035*d)+f1*.015);vec3 lowDetail=mix(surround,photo(uv+hollowShift),.42);outC=mix(outC,lowDetail,hollow*(.10+.26*d)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`,
    grade: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float soft1(float x,float m){if(x<m){float d=m-x;return m-d/(1.+d/m);}if(x>1.-m){float d=x-(1.-m);return 1.-m+d/(1.+d/m);}return x;} vec2 frameUv(vec2 uv){vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.)),vec2(.001));return vec2(soft1(uv.x,m.x),soft1(uv.y,m.y));} float coverScale(){return 1.+clamp(.010+.034*uTransform+.015*max(uHiddenA.x-1.,0.)+.009*uHiddenB.w,0.,.068);} vec2 sourceUv(vec2 uv){float z=coverScale();return frameUv(.5+(uv-.5)/z);} vec2 edgeCondition(vec2 uv,vec2 delta){float gx=smoothstep(.018,.145,min(uv.x,1.-uv.x));float gy=smoothstep(.018,.145,min(uv.y,1.-uv.y));return delta*vec2(.18+.82*gx,.18+.82*gy);} vec3 photo(vec2 uv){return texture2D(uSource,sourceUv(uv)).rgb;} float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));} vec3 screenC(vec3 a,vec3 b){return 1.-(1.-a)*(1.-b);} vec2 flow(vec2 uv,vec2 ph,float s){return vec2(fbm(uv*s+ph),fbm(uv*s+ph+vec2(8.31,21.7)))-.5;} void main(){ vec2 uv=vUv;vec4 e=texture2D(uMask,uv),st=texture2D(uStructure,uv);vec3 base=texture2D(uWarp,uv).rgb,original=photo(uv);float C=clamp(uColor*uHiddenB.x,0.,1.12),d=uDepth,t=uTransform,kind=uRecipeIds.w,l=lum(base),phase=e.a*2.-1.; float exposureGain=uHiddenB.y; float ang=6.28318*(uRecipeA.z*.67+uRecipeB.w*.33);vec2 axis=vec2(cos(ang),sin(ang)),normal=vec2(-axis.y,axis.x); vec3 tint;if(uRecipeIds.x<.5)tint=vec3(.62,.79,.88);else if(uRecipeIds.x<1.5)tint=vec3(.77,.66,.80);else if(uRecipeIds.x<2.5)tint=vec3(.78,.80,.76);else tint=vec3(.55,.73,.65); vec3 spectral=vec3(l)*tint;float spectralRegion=clamp(e.r*.48+e.b*.32+e.g*.16,0.,1.);vec3 outC=mix(base,spectral,(.03+.34*C)*spectralRegion); if(uRecipeIds.y<.5)outC*=clamp((.84+.12*l)/max(exposureGain,.72),.68,1.02);else if(uRecipeIds.y<1.5)outC=mix(outC,screenC(outC,vec3(.22)),(.07+.10*C)*exposureGain);else outC*=clamp(.99-.03*exposureGain+.03*l,.86,1.02); vec2 traceShift=axis*(.008+.026*t)+normal*flow(uv,uRecipeA.xy*8.,3.4).x*.010;float pastEdge=texture2D(uStructure,frameUv(uv-traceShift)).r;float trace=max(pastEdge-st.r*.58,0.)*e.g;vec3 traceTone=mix(vec3(.62,.76,.84),tint,.45);outC=mix(outC,screenC(outC,traceTone),trace*(.04+.20*d)); float sink=e.b*(.16+.54*d)*(.42+.58*(1.-l));outC*=1.-sink*(.14+.25*d);outC=mix(outC,outC*vec3(.58,.62,.65),sink*(.12+.21*C)); float act=clamp((.36+.64*uEventCtl.x)*uEventCtl.y*uHiddenA.y,0.,1.55); if(kind<.5){vec3 empty=vec3(l)*vec3(.66,.71,.72);outC=mix(outC,empty,act*e.b*(.12+.31*d));} else if(kind<1.5){vec2 cs=normal*(.003+.014*t);vec3 aa=photo(uv+cs),bb=photo(uv-cs),split=vec3(aa.r,base.g,bb.b);outC=mix(outC,split,act*trace*(.07+.25*C));} else if(kind<2.5){float side=smoothstep(-.20,.28,phase)-smoothstep(.28,.68,phase);vec3 wrong=outC*(1.+side*(.07+.11*C));outC=mix(outC,wrong,act*e.r*.50);} else if(kind<3.5){vec3 solar=1.-abs(2.*outC-1.);outC=mix(outC,mix(outC,solar,.60),act*e.b*(.07+.30*C));} else if(kind<4.5){float former=e.b*(.46+.54*(1.-st.r));vec3 washed=mix(vec3(l)*vec3(.60,.65,.68),original*.61,.28);outC=mix(outC,washed,act*former*(.09+.27*d));outC=mix(outC,screenC(outC,traceTone),act*trace*(.05+.17*d));} else {vec2 wrongShift=axis*(.032+.048*t)+normal*(.014+.022*d);float shiftedEdge=texture2D(uStructure,frameUv(uv-wrongShift)).r;float wrongShadow=max(shiftedEdge-st.r*.35,0.)*e.r*(1.-st.a*.38);vec3 shadowTone=mix(vec3(.19,.24,.27),tint*.40,.32);outC=mix(outC,shadowTone,act*wrongShadow*(.11+.25*d));} vec2 witnessPos=vec2(.14+.72*(1.-uEventCtl.z),.12+.72*uHiddenB.z); float witnessNoise=fbm(uv*7.1+uRecipeB.xy*12.); float witnessField=(1.-smoothstep(.055,.23,length((uv-witnessPos)*vec2(.82,1.35))+(witnessNoise-.5)*.035))*smoothstep(.72,.98,uHiddenB.w)*(1.-st.a*.52); vec3 witnessImg=photo(uv+axis*(.024+.036*t)+normal*.011); vec3 witnessTone=mix(witnessImg,vec3(lum(witnessImg))*tint,.48); outC=mix(outC,witnessTone,witnessField*(.05+.18*d)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`
  },
  REASSEMBLE: {
    event: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float blob(vec2 uv,vec2 c,float r){vec2 d=uv-c;return exp(-dot(d,d)/max(r*r,.0005));} void main(){ vec2 uv=vUv;vec4 st=texture2D(uStructure,uv);float d=uDepth; float eventGain=uHiddenA.y,scaleGain=uHiddenA.w; vec2 c1=vec2(.18+.55*uRecipeA.x,.17+.62*uRecipeA.y),c2=vec2(.28+.54*uRecipeB.x,.24+.55*uRecipeB.y),c3=vec2(.16+.65*uRecipeA.z,.25+.50*uRecipeB.z); float w1=blob(uv,c1,(.18+.10*uRecipeA.w)/scaleGain),w2=blob(uv,c2,(.16+.11*uRecipeB.w)/scaleGain),w3=blob(uv,c3,(.20+.08*uRecipeA.y)/scaleGain);float n=fbm(uv*(4.1*scaleGain)+uRecipeB.zw*11.); float surface=clamp((w1*.55+w2*.48+w3*.44)*( .70+.30*d)+n*.18,0.,1.); float weave=1.-smoothstep(.04,.23,abs(w1-w2)+abs(w2-w3)*.55+n*.08); float quiet=1.-clamp(st.r*.46+st.a*.58,0.,1.);float patch=smoothstep(.20-.06*(eventGain-1.),.77,surface*.55+quiet*.22+st.g*.12+n*.12); gl_FragColor=vec4(clamp(surface,0.,1.),clamp(patch,0.,1.),clamp(weave,0.,1.),clamp(n*.72+quiet*.28,0.,1.)); }`,
    mutation: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float soft1(float x,float m){if(x<m){float d=m-x;return m-d/(1.+d/m);}if(x>1.-m){float d=x-(1.-m);return 1.-m+d/(1.+d/m);}return x;} vec2 frameUv(vec2 uv){vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.)),vec2(.001));return vec2(soft1(uv.x,m.x),soft1(uv.y,m.y));} float coverScale(){return 1.+clamp(.010+.034*uTransform+.015*max(uHiddenA.x-1.,0.)+.009*uHiddenB.w,0.,.068);} vec2 sourceUv(vec2 uv){float z=coverScale();return frameUv(.5+(uv-.5)/z);} vec2 edgeCondition(vec2 uv,vec2 delta){float gx=smoothstep(.018,.145,min(uv.x,1.-uv.x));float gy=smoothstep(.018,.145,min(uv.y,1.-uv.y));return delta*vec2(.18+.82*gx,.18+.82*gy);} vec3 photo(vec2 uv){return texture2D(uSource,sourceUv(uv)).rgb;} vec2 flow(vec2 uv,vec2 ph,float s){return vec2(fbm(uv*s+ph),fbm(uv*s+ph+vec2(8.31,21.7)))-.5;} float blob(vec2 uv,vec2 c,float r){vec2 d=uv-c;return exp(-dot(d,d)/max(r*r,.0005));} void main(){ vec2 uv=vUv;vec4 e=texture2D(uMask,uv),st=texture2D(uStructure,uv);float t=uTransform,d=uDepth,typ=uRecipeIds.z; float spatial=uHiddenA.x,materialGain=uHiddenA.z,scaleGain=uHiddenA.w,wild=uHiddenB.w; vec2 c1=vec2(.18+.55*uRecipeA.x,.17+.62*uRecipeA.y),c2=vec2(.28+.54*uRecipeB.x,.24+.55*uRecipeB.y),c3=vec2(.16+.65*uRecipeA.z,.25+.50*uRecipeB.z); float w1=blob(uv,c1,(.18+.10*uRecipeA.w)/scaleGain),w2=blob(uv,c2,(.16+.11*uRecipeB.w)/scaleGain),w3=blob(uv,c3,(.20+.08*uRecipeA.y)/scaleGain),ws=max(.001,w1+w2+w3); vec2 dir1=normalize(vec2(uRecipeB.x-.5,uRecipeA.w-.5)+vec2(.001));vec2 dir2=normalize(vec2(uRecipeA.y-.5,uRecipeB.z-.5)+vec2(.001));vec2 dir3=normalize(vec2(uRecipeB.w-.5,uRecipeA.x-.5)+vec2(.001)); vec2 f=flow(uv,uRecipeA.xy*10.,(2.7+typ*.22)*scaleGain),f2=flow(uv.yx,uRecipeB.zw*12.,5.0/max(scaleGain,.60)); float protect=clamp(st.r*.46+st.a*.56,0.,1.);float freedom=1.-protect*.44; vec2 warp=((dir1*w1+dir2*w2+dir3*w3)/ws)*(.010+.095*t+.035*d)*freedom*spatial; warp+=(f*(.010+.055*t)*e.r*freedom+vec2(-f2.y,f2.x)*(.006+.028*t)*e.b)*spatial; float foldBurst=smoothstep(.72,.98,wild)*e.g*(1.-st.a*.42); warp+=vec2(-f.y,f.x)*(.010+.036*t)*foldBurst*spatial; warp=edgeCondition(uv,warp); vec2 counterShift=edgeCondition(uv,-warp*.46+f2*.012); vec3 orig=photo(uv),moved=photo(uv+warp),counter=photo(uv+counterShift); float stitch=e.b*(.18+.44*d)*materialGain;vec3 reformed=mix(moved,counter,stitch*.34);reformed=mix(reformed,orig,(1.-e.g)*(.06+.11*(1.-t))); float amount=clamp((.24+.56*t+.10*d)*(.82+.18*spatial),0.,.96);vec3 outC=mix(orig,reformed,amount); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`,
    grade: `precision highp float; varying vec2 vUv; uniform sampler2D uSource; uniform sampler2D uStructure; uniform sampler2D uMask; uniform sampler2D uWarp; uniform vec2 uSourceSize; uniform vec2 uRenderSize; uniform float uSeed; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; uniform vec4 uRecipeIds; uniform vec4 uEventCtl; uniform vec4 uHiddenA; uniform vec4 uHiddenB; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*.00013)*43758.5453123);} float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){float v=0.;v+=.56*noise2(p);v+=.28*noise2(p*2.03+11.17);v+=.16*noise2(p*4.03+37.4);return v;} float soft1(float x,float m){if(x<m){float d=m-x;return m-d/(1.+d/m);}if(x>1.-m){float d=x-(1.-m);return 1.-m+d/(1.+d/m);}return x;} vec2 frameUv(vec2 uv){vec2 m=max(vec2(1.5)/max(uSourceSize,vec2(1.)),vec2(.001));return vec2(soft1(uv.x,m.x),soft1(uv.y,m.y));} float coverScale(){return 1.+clamp(.010+.034*uTransform+.015*max(uHiddenA.x-1.,0.)+.009*uHiddenB.w,0.,.068);} vec2 sourceUv(vec2 uv){float z=coverScale();return frameUv(.5+(uv-.5)/z);} vec2 edgeCondition(vec2 uv,vec2 delta){float gx=smoothstep(.018,.145,min(uv.x,1.-uv.x));float gy=smoothstep(.018,.145,min(uv.y,1.-uv.y));return delta*vec2(.18+.82*gx,.18+.82*gy);} vec3 photo(vec2 uv){return texture2D(uSource,sourceUv(uv)).rgb;} float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));} vec3 palette(float t,vec3 a,vec3 b,vec3 c){float k=clamp(t,0.,1.);return k<.5?mix(a,b,k*2.):mix(b,c,(k-.5)*2.);} vec3 screenC(vec3 a,vec3 b){return 1.-(1.-a)*(1.-b);} void main(){ vec2 uv=vUv;vec4 e=texture2D(uMask,uv),st=texture2D(uStructure,uv);vec3 base=texture2D(uWarp,uv).rgb;float l=lum(base),C=clamp(uColor*uHiddenB.x,0.,1.18),d=uDepth; float exposureGain=uHiddenB.y; vec3 a,b,c;float rid=uRecipeIds.x;if(rid<.5){a=vec3(.18,.22,.23);b=vec3(.49,.60,.56);c=vec3(.89,.82,.68);}else if(rid<1.5){a=vec3(.20,.20,.28);b=vec3(.55,.49,.69);c=vec3(.89,.78,.70);}else if(rid<2.5){a=vec3(.25,.24,.22);b=vec3(.57,.53,.47);c=vec3(.92,.91,.85);}else{a=vec3(.19,.26,.23);b=vec3(.49,.64,.62);c=vec3(.91,.75,.80);} vec3 mapped=palette(clamp(l+e.g*.08-e.b*.03,0.,1.),a,b,c);vec3 outC=mix(base,mapped,.07+.43*C); float ex=uRecipeIds.y;if(ex<.5)outC=mix(outC,vec3(1.),st.b*(.04+.15*C)*exposureGain);else if(ex<1.5)outC*=clamp(.96-.04*exposureGain+.04*l,.82,1.02);else if(ex<2.5)outC=mix(outC,vec3(l),e.b*.08*exposureGain);else outC=mix(outC,screenC(outC,vec3(.19,.18,.17)),e.r*.08*C*exposureGain); float n=fbm(uv*5.2+uRecipeA.zw*13.);float act=clamp(uEventCtl.x*uEventCtl.y*(.28+.64*d)*uHiddenA.y,0.,1.45);float kind=uRecipeIds.w; if(kind<.5){vec3 slip=photo(uv+vec2(.025,-.018)*uTransform);outC=mix(outC,slip,act*e.g*e.b*(.10+.24*d));} else if(kind<1.5){outC=mix(outC,vec3(.96,.94,.88),act*e.g*(.10+.26*C));} else if(kind<2.5){float ir=.5+.5*sin((l*6.+n*2.7+uv.y)*6.283);vec3 foil=mix(vec3(.63,.85,.90),vec3(.96,.68,.70),ir);outC=mix(outC,screenC(outC,foil),act*e.a*st.a*(.08+.22*C));} else if(kind<3.5){vec3 wall=mix(vec3(.62,.69,.60),vec3(.77,.68,.78),n);outC=mix(outC,wall,act*e.g*(1.-st.a*.54)*(.08+.18*C));} else {vec3 light=vec3(.91,.86,.72);outC=mix(outC,screenC(outC,light),act*e.b*st.r*(.07+.18*d));} float mismatch=smoothstep(.74,.98,uHiddenB.w)*e.a*(.30+.70*e.g)*(1.-st.a*.40); vec3 oddSurface=mix(vec3(.56,.77,.73),vec3(.90,.68,.78),uHiddenB.z); outC=mix(outC,screenC(outC,oddSurface),mismatch*(.05+.16*C)); gl_FragColor=vec4(clamp(outC,0.,1.),1.); }`
  }
};
const SAFE_FRAG = `precision mediump float; varying vec2 vUv; uniform sampler2D uSource; uniform vec2 uSourceSize; uniform float uSeed; uniform float uMode; uniform float uTransform; uniform float uColor; uniform float uDepth; uniform vec4 uRecipeA; uniform vec4 uRecipeB; float lum(vec3 c){return dot(c,vec3(0.2126,0.7152,0.0722));} void main(){ vec2 uv=vUv; vec2 stepUV=vec2(2.0,2.0)/max(uSourceSize,vec2(1.0)); vec2 q1=mod(uv+stepUV*(1.0+7.0*uTransform),2.0);q1=mix(q1,2.0-q1,step(vec2(1.0),q1)); vec2 q2=mod(uv-stepUV*(1.0+6.0*uDepth),2.0);q2=mix(q2,2.0-q2,step(vec2(1.0),q2)); vec3 a=texture2D(uSource,uv).rgb; vec3 b=texture2D(uSource,q1).rgb; vec3 c=texture2D(uSource,q2).rgb; float f=clamp(lum(a),0.0,1.0); float mask=smoothstep(0.08,0.90, f*0.5+uRecipeA.x*0.15+uTransform*0.22); vec3 mixed=mix(a,mix(b,c,0.5),clamp((uTransform+uDepth)*0.28,0.0,0.65)*mask); if(uMode<0.5){ vec3 pal=mix(vec3(0.12,0.10,0.26),vec3(0.98,0.68,0.82),f); mixed=mix(mixed,pal,clamp(0.10+uColor*0.62+uRecipeB.y*0.14,0.0,0.88)); }else{ vec3 pal=mix(vec3(0.04,0.06,0.08),vec3(0.58,0.38,0.30),1.0-f); mixed=mix(mixed,pal,clamp(0.10+uColor*0.50+uRecipeA.z*0.12,0.0,0.80)); mixed*=1.0-0.22*uDepth*(1.0-f); } gl_FragColor=vec4(clamp(mixed,0.0,1.0),1.0); }`;
let gl = null;
let canvasElement = null;
let ui = {};
let gpu = {
  structureProgram:null,
  safeProgram:null,
  safeMode:false,
  engines:{},
  quad:null,
  sourceTexture:null,
  sourceSize:[1,1],
  previewPasses:null
};
let sourceImage = null;
let sourceObjectURL = null;
let sourceWidth = 0, sourceHeight = 0;
let currentMode = 'DREAM';
let variant = null;
let history = [];
let variantNumber = 0;
let exportBusy = false;
let renderPending = false;
let dead = false;
let uiConnected = false;
let lastView = {w:0,h:0};
let appP5 = null;
let engineLaunched = false;
function launchEngine() {
  if (engineLaunched) return;
  if (typeof window.p5 !== 'function') {
    if (document.readyState === 'complete') {
      showFatalError(new Error('p5.js library is not loaded.'), 'LIBRARY');
    }
    return;
  }
  engineLaunched = true;
  window.PM_ENGINE_STARTED = true;
  try {
    new window.p5(function(p) {
      appP5 = p;
      p.setup = function() {
        initializeCanvas(p);
      };
      p.draw = function() {};
      p.windowResized = function() { requestRender(); };
    });
  } catch (e) {
    console.error('[GHOST KIOSK v1.7.2.1] instance startup', e);
    showFatalError(e, 'P5 INSTANCE');
  }
}
function initializeCanvas(p) {
  window.PM_BOOT_OK = true;
  try {
    connectUI();
    uiConnected = true;
  } catch(e) {
    console.error('[GHOST KIOSK v1.7.2.1] UI setup', e);
    showFatalError(e, 'UI');
    return;
  }
  try {
    p.pixelDensity(1);
    const cnv = p.createCanvas(64, 64, p.WEBGL);
    cnv.parent('canvasMount');
    canvasElement = cnv.elt;
    p.noLoop();
    gl = p.drawingContext;
    if (!gl || typeof gl.createShader !== 'function') throw new Error('WebGL context unavailable');
    initializeGPU();
    dead = false;
    setStatus(gpu.safeMode ? 'READY / SAFE GPU MODE / ADD A PHOTO' : 'READY / ADD A PHOTO');
  } catch(e) {
    console.error('[GHOST KIOSK v1.7.2.1] GPU setup', e);
    showFatalError(e, 'GPU');
  }
}
function showFatalError(error, phase='GPU') {
  dead = true;
  const detail = (error && error.message) ? error.message : String(error);
  const message = phase + ' ERROR / ' + detail;
  setStatus(message);
  const panel = document.getElementById('errorPanel');
  const errorDetail = document.getElementById('errorDetail');
  if(panel && errorDetail){
    errorDetail.textContent = message;
    panel.hidden = false;
  }
}
function clearDiagnostic(){
  const panel = document.getElementById('errorPanel');
  if(panel) panel.hidden = true;
}
function compile(type, code){
  const s = gl.createShader(type);
  gl.shaderSource(s, code);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    const log = gl.getShaderInfoLog(s) || 'UNKNOWN GLSL ERROR';
    gl.deleteShader(s);
    throw new Error('SHADER COMPILE: ' + log);
  }
  return s;
}
function buildProgram(fragment){
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('SHADER LINK: ' + gl.getProgramInfoLog(p));
  const names = ['uSource','uStructure','uMask','uWarp','uSourceSize','uRenderSize','uSeed','uMode','uTransform','uColor','uDepth','uRecipeA','uRecipeB','uRecipeIds','uEventCtl','uHiddenA','uHiddenB'];
  const loc = {}; for(const n of names) loc[n] = gl.getUniformLocation(p, n);
  return {program:p, loc, position:gl.getAttribLocation(p,'aPosition'), uv:gl.getAttribLocation(p,'aUv')};
}
function createModePrograms(mode){
  if(gpu.engines[mode]) return gpu.engines[mode];
  const source=MODE_SHADERS[mode];
  if(!source) throw new Error('UNKNOWN ENGINE / '+mode);
  const programs={};
  try{
    programs.event=buildProgram(source.event);
    programs.mutation=buildProgram(source.mutation);
    programs.grade=buildProgram(source.grade);
    gpu.engines[mode]=programs;
    return programs;
  }catch(error){
    for(const value of Object.values(programs)) if(value) gl.deleteProgram(value.program);
    throw new Error(mode+' SHADER / '+error.message);
  }
}
function initializeGPU(){
  gpu.engines={};
  try{
    gpu.structureProgram=buildProgram(STRUCTURE_FRAG);
    createModePrograms(currentMode);
  }catch(e){
    console.warn('[GHOST KIOSK v1.7.2.1] GPU fallback',e);
    if(gpu.structureProgram) gl.deleteProgram(gpu.structureProgram.program);
    gpu.structureProgram=null;
    gpu.safeProgram=buildProgram(SAFE_FRAG);
    gpu.safeMode=true;
  }
  gpu.quad=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,gpu.quad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
    -1,-1,0,0,  1,-1,1,0,
    -1, 1,0,1,  1, 1,1,1
  ]),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,null);
  canvasElement.addEventListener('webglcontextlost',e=>{
    e.preventDefault();dead=true;setStatus('GPU CONTEXT LOST / RELOAD PAGE');
  });
  canvasElement.addEventListener('webglcontextrestored',()=>window.location.reload());
}
function commonGPUState(){
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.SCISSOR_TEST);
  gl.colorMask(true,true,true,true);
  gl.clearColor(0,0,0,1);
}
function newRenderTarget(w,h){
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer);
    throw new Error('FRAMEBUFFER INCOMPLETE');
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {texture, framebuffer, w, h};
}
function destroyTarget(target){ if(target){ gl.deleteFramebuffer(target.framebuffer); gl.deleteTexture(target.texture); } }
function destroyPassSet(set){ if(set){ destroyTarget(set.structure); destroyTarget(set.mask); destroyTarget(set.incident); } }
function ensurePassSet(existing, w, h){
  if(existing && existing.w === w && existing.h === h) return existing;
  destroyPassSet(existing);
  return { w, h, structure:newRenderTarget(w,h), mask:newRenderTarget(w,h), incident:newRenderTarget(w,h) };
}
function seed32(){ if(window.crypto && crypto.getRandomValues){ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; } return (Math.random() * 4294967295) >>> 0; }
function mulberry32(seed){ return function(){ let z = seed += 0x6D2B79F5; z = Math.imul(z ^ (z >>> 15), z | 1); z ^= z + Math.imul(z ^ (z >>> 7), z | 61); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; }; }
const RECIPE_COUNTS = Object.freeze({
  DREAM:{color:5,exposure:5,structure:4,phenomena:5,chance:0.98},
  OCCULT:{color:5,exposure:4,structure:4,phenomena:5,chance:0.98},
  GHOST:{color:4,exposure:3,structure:4,phenomena:6,chance:1.00},
  REASSEMBLE:{color:4,exposure:4,structure:5,phenomena:5,chance:0.98}
});
const HIDDEN_RANGES = Object.freeze({
  DREAM:{spatial:[.76,1.30],event:[.88,1.48],material:[.76,1.48],scale:[.82,1.28],color:[.90,1.46],exposure:[.90,1.56]},
  OCCULT:{spatial:[.72,1.20],event:[1.00,1.58],material:[.86,1.46],scale:[.78,1.25],color:[.74,1.18],exposure:[.84,1.28]},
  GHOST:{spatial:[.90,1.52],event:[1.02,1.68],material:[.86,1.46],scale:[.78,1.28],color:[.68,1.12],exposure:[.82,1.22]},
  REASSEMBLE:{spatial:[1.00,1.60],event:[.84,1.40],material:[.96,1.52],scale:[.76,1.28],color:[.74,1.20],exposure:[.84,1.28]}
});
function hiddenEnergy(rand){
  const roll=rand();
  if(roll<.16) return .84+rand()*.14;
  if(roll<.76) return 1.02+rand()*.25;
  return 1.34+rand()*.28;
}
function hiddenValue(rand,range,energy,sensitivity=.55){
  const base=range[0]+rand()*(range[1]-range[0]);
  return Math.max(.45,Math.min(1.90,base*(1.+(energy-1.)*sensitivity)));
}
function makeVariant(mode){
  const seed=seed32(),rand=mulberry32(seed),cfg=RECIPE_COUNTS[mode],hr=HIDDEN_RANGES[mode];
  const labels={
    DREAM:['MILK VEIL','CANDY FLASH','PALE NOON','WRONG SUN','SOFT FOIL'],
    OCCULT:['SHADOW BLOOM','COLD BREATH','FALSE LAMP','STAIN AIR','QUIET WITNESS'],
    GHOST:['EMPTY EXPOSURE','LATE SKIN','WRONG PARALLAX','NEGATIVE WITNESS','AFTER BODY','MISPLACED SHADOW'],
    REASSEMBLE:['SOFT TOPOLOGY','SLIPPED WALL','FALSE CONTINUITY','MUTABLE SURFACE','LIQUID PATCH']
  };
  const energy=hiddenEnergy(rand);
  const phenomenon=Math.floor(rand()*cfg.phenomena);
  const wild=Math.min(1,rand()*.72+(energy>1.30?.30:0));
  const hiddenA=[
    hiddenValue(rand,hr.spatial,energy,.72),
    hiddenValue(rand,hr.event,energy,.68),
    hiddenValue(rand,hr.material,energy,.48),
    hiddenValue(rand,hr.scale,energy,.34)
  ];
  const hiddenB=[
    hiddenValue(rand,hr.color,energy,.46),
    hiddenValue(rand,hr.exposure,energy,.42),
    rand(),
    wild
  ];
  const recipe={
    color:Math.floor(rand()*cfg.color),exposure:Math.floor(rand()*cfg.exposure),
    structure:Math.floor(rand()*cfg.structure),phenomena:phenomenon,
    eventActive:rand()<cfg.chance?1:0,eventStrength:.62+rand()*.38,
    eventX:.10+rand()*.80,eventY:.08+rand()*.84
  };
  return {seed,recipe,name:labels[mode][phenomenon],energy,hiddenA,hiddenB,
    a:[rand(),rand(),rand(),rand()], b:[rand(),rand(),rand(),rand()]};
}
function seedHex(x){ return (x >>> 0).toString(16).toUpperCase().padStart(8,'0'); }
function setStatus(s){ if(ui.statusText) ui.statusText.textContent = s; }
function connectUI(){
  if(uiConnected) return;
  for(const id of ['photoInput','openPhotoTop','openPhotoPrimary','emptyState','imageMeta','variationMeta','modeDescription','backButton','mutateButton','editToggle','editPanel','editChevron','saveButton','transformSlider','colorSlider','depthSlider','transformValue','colorValue','depthValue','renderOverlay','renderLabel','statusText','exportSize']) {
    ui[id] = document.getElementById(id);
    if(!ui[id]) throw new Error('HTML ELEMENT MISSING / ' + id);
  }
  const choose = () => {
    if(dead){
      setStatus('GPU ERROR / CHECK ERROR PANEL');
      return;
    }
    ui.photoInput.click();
  };
  ui.openPhotoTop.addEventListener('click', choose);
  ui.openPhotoPrimary.addEventListener('click', choose);
  ui.photoInput.addEventListener('change', async e => {
    const input = e.currentTarget;
    const file = input.files && input.files[0];
    if(!file) return;
    try { await loadPhoto(file); }
    finally { input.value = ''; }
  });
  document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => selectMode(b.dataset.mode)));
  ui.mutateButton.addEventListener('click', mutate);
  ui.backButton.addEventListener('click', goBack);
  ui.editToggle.addEventListener('click', () => { const opening = ui.editPanel.hidden; ui.editPanel.hidden = !opening; ui.editToggle.setAttribute('aria-expanded', String(opening)); ui.editChevron.textContent = opening ? '−' : '＋'; });
  for(const id of ['transformSlider','colorSlider','depthSlider']) ui[id].addEventListener('input', () => { updateReadouts(); requestRender(); });
  ui.saveButton.addEventListener('click', exportImage);
  updateReadouts();
  setActiveMode();
}
function updateReadouts(){ for(const k of ['transform','color','depth']) ui[k+'Value'].textContent = ui[k+'Slider'].value; }
function setActiveMode(){
  document.querySelectorAll('.mode').forEach(el => { const active = el.dataset.mode === currentMode; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
  ui.modeDescription.textContent = PM.description[currentMode];
  document.documentElement.dataset.mode = currentMode.toLowerCase();
  ui.backButton.disabled = history.length === 0;
}
function updateMeta(){ if(!variant) return; ui.imageMeta.textContent = `SOURCE / ${sourceWidth} × ${sourceHeight}`; ui.variationMeta.textContent = `V${String(variantNumber).padStart(3,'0')} / ${variant.name}`; }
function snapshot(){ return {mode:currentMode, variant, count:variantNumber, transform:ui.transformSlider.value, color:ui.colorSlider.value, depth:ui.depthSlider.value}; }
function pushHistory(){ if(!variant) return; history.push(snapshot()); if(history.length > PM.historyMax) history.shift(); ui.backButton.disabled = false; }
function selectMode(mode){ if(!PM.modes.includes(mode)||exportBusy) return; if(!sourceImage){ currentMode=mode; setActiveMode(); return; } if(mode===currentMode) return; pushHistory(); currentMode=mode; variant=makeVariant(mode); variantNumber++; setActiveMode(); updateMeta(); requestRender(); }
function mutate(){ if(exportBusy) return; if(!sourceImage){ ui.photoInput.click(); return; } document.body.classList.remove('mutation-pulse'); void document.body.offsetWidth; document.body.classList.add('mutation-pulse'); window.setTimeout(()=>document.body.classList.remove('mutation-pulse'),220); pushHistory(); variant=makeVariant(currentMode); variantNumber++; updateMeta(); requestRender(); }
function goBack(){ if(!history.length||exportBusy) return; const x=history.pop(); currentMode=x.mode; variant=x.variant; variantNumber=x.count; ui.transformSlider.value=x.transform; ui.colorSlider.value=x.color; ui.depthSlider.value=x.depth; updateReadouts(); setActiveMode(); updateMeta(); requestRender(); }
function showBusy(s){ ui.renderOverlay.hidden = false; ui.renderLabel.textContent = s; }
function hideBusy(){ ui.renderOverlay.hidden = true; }
function loadHtmlImage(url){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE ELEMENT DECODE FAILED'));
    img.src = url;
  });
}
function readFileAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FILE READER FAILED'));
    reader.readAsDataURL(file);
  });
}
async function decodePhotoFile(file){
  let blobUrl = null;
  try {
    blobUrl = URL.createObjectURL(file);
    const img = await loadHtmlImage(blobUrl);
    return {img, cleanup:()=>URL.revokeObjectURL(blobUrl)};
  } catch(blobError) {
    if(blobUrl) URL.revokeObjectURL(blobUrl);
    console.warn('[GK] Blob URL decode failed; trying FileReader',blobError);
  }
  try {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadHtmlImage(dataUrl);
    return {img, cleanup:()=>{}};
  } catch(readerError) {
    console.warn('[GK] FileReader decode failed; trying ImageBitmap',readerError);
  }
  if(typeof createImageBitmap === 'function'){
    const img = await createImageBitmap(file);
    return {img, cleanup:()=>img.close()};
  }
  throw new Error('IMAGE DECODE FAILED / TRY JPEG OR PNG');
}
async function loadPhoto(file){
  if(dead){
    setStatus('GPU ERROR / ENGINE INITIALIZATION FAILED');
    return;
  }
  if(!file.type.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp)$/i.test(file.name)) {
    setStatus('LOAD ERROR / SELECT AN IMAGE FILE');
    return;
  }
  if(exportBusy) return;
  showBusy('DECODING PHOTO');
  setStatus('READING / ' + file.name.slice(0,40));
  let decoded = null;
  try {
    decoded = await decodePhotoFile(file);
    const img = decoded.img;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if(!w || !h) throw new Error('INVALID IMAGE SIZE');
    setStatus('UPLOADING / ' + w + ' × ' + h);
    uploadSourceTexture(img);
    sourceImage = true;
    sourceWidth = w;
    sourceHeight = h;
    decoded.cleanup();
    decoded = null;
    if(sourceObjectURL){ URL.revokeObjectURL(sourceObjectURL); sourceObjectURL=null; }
    history=[];
    variant=makeVariant(currentMode);
    variantNumber=1;
    ui.emptyState.hidden=true;
    ui.saveButton.disabled=false;
    setActiveMode();
    updateMeta();
    clearDiagnostic();
    setStatus('PHOTO LOADED / RENDERING');
    requestRender();
  }catch(e){
    console.error('[GK v1.7.2.1] photo load',e);
    const message = e && e.message ? e.message : String(e);
    setStatus('LOAD ERROR / '+message);
    const panel = document.getElementById('errorPanel');
    const detail = document.getElementById('errorDetail');
    if(panel && detail){ detail.textContent='LOAD ERROR / '+message; panel.hidden=false; }
  }finally{
    if(decoded) decoded.cleanup();
    hideBusy();
  }
}
function uploadSourceTexture(img){
  const previousTexture = gpu.sourceTexture;
  const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const imageW = img.naturalWidth || img.width;
  const imageH = img.naturalHeight || img.height;
  const sourceScale = Math.min(1, maxTexture / Math.max(imageW,imageH), Math.sqrt(PM.sourceMaxPixels / (imageW*imageH)));
  const w = Math.max(1, Math.round(imageW * sourceScale));
  const h = Math.max(1, Math.round(imageH * sourceScale));
  const temp = document.createElement('canvas'); temp.width=w; temp.height=h;
  const ctx=temp.getContext('2d'); if(!ctx) throw new Error('SOURCE CANVAS FAILED');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality='high';
  const os=PM.sourceOverscan; ctx.drawImage(img,-w*os,-h*os,w*(1.0+os*2.0),h*(1.0+os*2.0));
  const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,temp); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  const err=gl.getError(); if(err!==gl.NO_ERROR){ gl.deleteTexture(texture); throw new Error('TEXTURE UPLOAD ERROR ' + err); }
  gpu.sourceTexture=texture; gpu.sourceSize=[w,h]; if(previousTexture) gl.deleteTexture(previousTexture); destroyPassSet(gpu.previewPasses); gpu.previewPasses=null;
}
function useProgram(pr, texMap, renderW, renderH){
  gl.useProgram(pr.program); gl.bindBuffer(gl.ARRAY_BUFFER, gpu.quad); gl.enableVertexAttribArray(pr.position); gl.vertexAttribPointer(pr.position,2,gl.FLOAT,false,16,0); gl.enableVertexAttribArray(pr.uv); gl.vertexAttribPointer(pr.uv,2,gl.FLOAT,false,16,8);
  const bindTex=(name,unit,texture)=>{ if(pr.loc[name]===null||!texture) return; gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(pr.loc[name], unit); };
  bindTex('uSource',0,texMap.source||gpu.sourceTexture); bindTex('uStructure',1,texMap.structure); bindTex('uMask',2,texMap.mask); bindTex('uWarp',3,texMap.warp);
  const set1=(name,x)=>{ if(pr.loc[name]!==null) gl.uniform1f(pr.loc[name],x); };
  const modeIndex = {DREAM:0,OCCULT:1,GHOST:2,REASSEMBLE:3};
  set1('uSeed', variant ? (variant.seed % 1000000) : 0); set1('uMode', modeIndex[currentMode] ?? 0); set1('uTransform', Number(ui.transformSlider.value) / 100); set1('uColor', Number(ui.colorSlider.value) / 100); set1('uDepth', Number(ui.depthSlider.value) / 100);
  if(pr.loc.uSourceSize!==null) gl.uniform2fv(pr.loc.uSourceSize, gpu.sourceSize); if(pr.loc.uRenderSize!==null) gl.uniform2f(pr.loc.uRenderSize, renderW, renderH); if(pr.loc.uRecipeA!==null&&variant) gl.uniform4fv(pr.loc.uRecipeA, variant.a); if(pr.loc.uRecipeB!==null&&variant) gl.uniform4fv(pr.loc.uRecipeB, variant.b);
  if(variant && pr.loc.uRecipeIds!==null) gl.uniform4f(pr.loc.uRecipeIds,variant.recipe.color,variant.recipe.exposure,variant.recipe.structure,variant.recipe.phenomena);
  if(variant && pr.loc.uEventCtl!==null) gl.uniform4f(pr.loc.uEventCtl,variant.recipe.eventActive,variant.recipe.eventStrength,variant.recipe.eventX,variant.recipe.eventY);
  if(variant && pr.loc.uHiddenA!==null) gl.uniform4fv(pr.loc.uHiddenA,variant.hiddenA); if(variant && pr.loc.uHiddenB!==null) gl.uniform4fv(pr.loc.uHiddenB,variant.hiddenB);
}
function renderPass(pr,target,w,h,texMap){ commonGPUState(); gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.framebuffer:null); gl.viewport(0,0,w,h); gl.clear(gl.COLOR_BUFFER_BIT); useProgram(pr,texMap,w,h); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); gl.bindFramebuffer(gl.FRAMEBUFFER,null); }
function runPipeline(passSet,finalTarget,w,h){
  if(gpu.safeMode){
    renderPass(gpu.safeProgram,finalTarget,w,h,{source:gpu.sourceTexture});return;
  }
  const programs=createModePrograms(currentMode);
  renderPass(gpu.structureProgram,passSet.structure,w,h,{source:gpu.sourceTexture});
  renderPass(programs.event,passSet.mask,w,h,{source:gpu.sourceTexture,structure:passSet.structure.texture});
  renderPass(programs.mutation,passSet.incident,w,h,{source:gpu.sourceTexture,structure:passSet.structure.texture,mask:passSet.mask.texture});
  renderPass(programs.grade,finalTarget,w,h,{source:gpu.sourceTexture,structure:passSet.structure.texture,mask:passSet.mask.texture,warp:passSet.incident.texture});
}
function targetDimensions(longEdge, maxPixels){ let scale=Math.min(1,longEdge/Math.max(sourceWidth,sourceHeight)); if(sourceWidth*sourceHeight*scale*scale>maxPixels) scale=Math.sqrt(maxPixels/(sourceWidth*sourceHeight)); return {w:Math.max(1,Math.round(sourceWidth*scale)), h:Math.max(1,Math.round(sourceHeight*scale))}; }
function desiredPreview(){ const mobile=window.matchMedia('(max-width:740px), (pointer:coarse)').matches; const longEdge=mobile?PM.previewMobile:PM.previewDesktop; return targetDimensions(longEdge,1400000); }
function requestRender(){ if(renderPending||dead||!sourceImage||exportBusy) return; renderPending=true; requestAnimationFrame(()=>{ renderPending=false; if(dead||!sourceImage||exportBusy) return; try{ const dims=desiredPreview(); if(lastView.w!==dims.w||lastView.h!==dims.h){ appP5.resizeCanvas(dims.w,dims.h,true); lastView=dims; } if(!gpu.safeMode) gpu.previewPasses=ensurePassSet(gpu.previewPasses,dims.w,dims.h); runPipeline(gpu.previewPasses,null,dims.w,dims.h); setStatus(`READY / ${currentMode} / SEED ${seedHex(variant.seed)}${gpu.safeMode ? ' / SAFE GPU' : ''}`); }catch(e){ console.error('[GK v1.7.2.1] render error',e); setStatus('RENDER ERROR / ' + e.message); const panel=document.getElementById('errorPanel'); const detail=document.getElementById('errorDetail'); if(panel&&detail){detail.textContent='RENDER ERROR / '+e.message;panel.hidden=false;} } }); }
function pixelsToCanvas(raw,w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); if(!ctx) throw new Error('EXPORT 2D CANVAS FAILED'); const img=ctx.createImageData(w,h); const stride=w*4; for(let y=0;y<h;y++){ const from=(h-1-y)*stride, to=y*stride; img.data.set(raw.subarray(from,from+stride),to);} ctx.putImageData(img,0,0); return c; }
function toBlob(c){ return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG ENCODE FAILED')),'image/png')); }
async function exportImage(){ if(exportBusy||dead||!sourceImage||!variant) return; exportBusy=true; ui.saveButton.disabled=true; showBusy('GPU EXPORT'); let passSet=null,dest=null; try{ const mobile=window.matchMedia('(max-width:740px), (pointer:coarse)').matches; const maxPixels=mobile?PM.exportMaxPixelsMobile:PM.exportMaxPixelsDesktop; const limits=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)); const dims=targetDimensions(Math.min(Number(ui.exportSize.value), limits), maxPixels); setStatus(`EXPORTING / ${dims.w} × ${dims.h}`); if(!gpu.safeMode) passSet=ensurePassSet(null,dims.w,dims.h); dest=newRenderTarget(dims.w,dims.h); runPipeline(passSet,dest,dims.w,dims.h); gl.bindFramebuffer(gl.FRAMEBUFFER,dest.framebuffer); const raw=new Uint8Array(dims.w*dims.h*4); gl.readPixels(0,0,dims.w,dims.h,gl.RGBA,gl.UNSIGNED_BYTE,raw); const err=gl.getError(); gl.bindFramebuffer(gl.FRAMEBUFFER,null); if(err!==gl.NO_ERROR) throw new Error('PIXEL READ ERROR ' + err); const png=await toBlob(pixelsToCanvas(raw,dims.w,dims.h)); const url=URL.createObjectURL(png); const name=`GHOST_KIOSK_${currentMode}_${seedHex(variant.seed)}.png`; const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000); setStatus(`PNG READY / ${dims.w} × ${dims.h}`); }catch(e){ console.error('[GK v1.7.2.1] export',e); setStatus('EXPORT ERROR / ' + e.message); alert('EXPORT FAILED / TRY 1800PX.\n' + e.message); }finally{ if(dest) destroyTarget(dest); destroyPassSet(passSet); exportBusy=false; ui.saveButton.disabled=false; hideBusy(); requestRender(); } }
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', launchEngine, {once:true});
} else {
  launchEngine();
}
window.addEventListener('load', launchEngine, {once:true});
