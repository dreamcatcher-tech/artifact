import{g as Tr,c as Q,D as Ar,b as wr,O as Cr,a as x,p as Or}from"./index-zaTwQhOH.js";import{i as Bt}from"./io-hooks-xM_uqc8w.js";var k={exports:{}};k.exports;(function(c,p){var _=200,l="__lodash_hash_undefined__",b=800,g=16,y=9007199254740991,A="[object Arguments]",U="[object Array]",B="[object AsyncFunction]",G="[object Boolean]",H="[object Date]",L="[object Error]",P="[object Function]",tt="[object GeneratorFunction]",N="[object Map]",et="[object Number]",w="[object Null]",m="[object Object]",I="[object Proxy]",Lt="[object RegExp]",Vt="[object Set]",Kt="[object String]",Jt="[object Undefined]",$t="[object WeakMap]",Wt="[object ArrayBuffer]",Yt="[object DataView]",Zt="[object Float32Array]",qt="[object Float64Array]",Qt="[object Int8Array]",Xt="[object Int16Array]",kt="[object Int32Array]",te="[object Uint8Array]",ee="[object Uint8ClampedArray]",re="[object Uint16Array]",ne="[object Uint32Array]",ae=/[\\^$.*+?()[\]{}|]/g,ie=/^\[object .+?Constructor\]$/,oe=/^(?:0|[1-9]\d*)$/,s={};s[Zt]=s[qt]=s[Qt]=s[Xt]=s[kt]=s[te]=s[ee]=s[re]=s[ne]=!0,s[A]=s[U]=s[Wt]=s[G]=s[Yt]=s[H]=s[L]=s[P]=s[N]=s[et]=s[m]=s[Lt]=s[Vt]=s[Kt]=s[$t]=!1;var dt=typeof Q=="object"&&Q&&Q.Object===Object&&Q,se=typeof self=="object"&&self&&self.Object===Object&&self,R=dt||se||Function("return this")(),gt=p&&!p.nodeType&&p,z=gt&&!0&&c&&!c.nodeType&&c,_t=z&&z.exports===gt,rt=_t&&dt.process,bt=function(){try{var t=z&&z.require&&z.require("util").types;return t||rt&&rt.binding&&rt.binding("util")}catch{}}(),yt=bt&&bt.isTypedArray;function ue(t,e,r){switch(r.length){case 0:return t.call(e);case 1:return t.call(e,r[0]);case 2:return t.call(e,r[0],r[1]);case 3:return t.call(e,r[0],r[1],r[2])}return t.apply(e,r)}function fe(t,e){for(var r=-1,n=Array(t);++r<t;)n[r]=e(r);return n}function ce(t){return function(e){return t(e)}}function le(t,e){return t==null?void 0:t[e]}function pe(t,e){return function(r){return t(e(r))}}var he=Array.prototype,de=Function.prototype,V=Object.prototype,nt=R["__core-js_shared__"],K=de.toString,v=V.hasOwnProperty,mt=function(){var t=/[^.]+$/.exec(nt&&nt.keys&&nt.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}(),vt=V.toString,ge=K.call(Object),_e=RegExp("^"+K.call(v).replace(ae,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),J=_t?R.Buffer:void 0,Tt=R.Symbol,At=R.Uint8Array,wt=J?J.allocUnsafe:void 0,Ct=pe(Object.getPrototypeOf,Object),Ot=Object.create,be=V.propertyIsEnumerable,ye=he.splice,C=Tt?Tt.toStringTag:void 0,$=function(){try{var t=ot(Object,"defineProperty");return t({},"",{}),t}catch{}}(),me=J?J.isBuffer:void 0,St=Math.max,ve=Date.now,xt=ot(R,"Map"),D=ot(Object,"create"),Te=function(){function t(){}return function(e){if(!S(e))return{};if(Ot)return Ot(e);t.prototype=e;var r=new t;return t.prototype=void 0,r}}();function O(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}function Ae(){this.__data__=D?D(null):{},this.size=0}function we(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e}function Ce(t){var e=this.__data__;if(D){var r=e[t];return r===l?void 0:r}return v.call(e,t)?e[t]:void 0}function Oe(t){var e=this.__data__;return D?e[t]!==void 0:v.call(e,t)}function Se(t,e){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=D&&e===void 0?l:e,this}O.prototype.clear=Ae,O.prototype.delete=we,O.prototype.get=Ce,O.prototype.has=Oe,O.prototype.set=Se;function T(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}function xe(){this.__data__=[],this.size=0}function Ie(t){var e=this.__data__,r=W(e,t);if(r<0)return!1;var n=e.length-1;return r==n?e.pop():ye.call(e,r,1),--this.size,!0}function je(t){var e=this.__data__,r=W(e,t);return r<0?void 0:e[r][1]}function Ee(t){return W(this.__data__,t)>-1}function Pe(t,e){var r=this.__data__,n=W(r,t);return n<0?(++this.size,r.push([t,e])):r[n][1]=e,this}T.prototype.clear=xe,T.prototype.delete=Ie,T.prototype.get=je,T.prototype.has=Ee,T.prototype.set=Pe;function j(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}function Ne(){this.size=0,this.__data__={hash:new O,map:new(xt||T),string:new O}}function Re(t){var e=Z(this,t).delete(t);return this.size-=e?1:0,e}function ze(t){return Z(this,t).get(t)}function De(t){return Z(this,t).has(t)}function Fe(t,e){var r=Z(this,t),n=r.size;return r.set(t,e),this.size+=r.size==n?0:1,this}j.prototype.clear=Ne,j.prototype.delete=Re,j.prototype.get=ze,j.prototype.has=De,j.prototype.set=Fe;function E(t){var e=this.__data__=new T(t);this.size=e.size}function Me(){this.__data__=new T,this.size=0}function Ue(t){var e=this.__data__,r=e.delete(t);return this.size=e.size,r}function Be(t){return this.__data__.get(t)}function Ge(t){return this.__data__.has(t)}function He(t,e){var r=this.__data__;if(r instanceof T){var n=r.__data__;if(!xt||n.length<_-1)return n.push([t,e]),this.size=++r.size,this;r=this.__data__=new j(n)}return r.set(t,e),this.size=r.size,this}E.prototype.clear=Me,E.prototype.delete=Ue,E.prototype.get=Be,E.prototype.has=Ge,E.prototype.set=He;function Le(t,e){var r=ft(t),n=!r&&ut(t),i=!r&&!n&&Nt(t),o=!r&&!n&&!i&&zt(t),u=r||n||i||o,a=u?fe(t.length,String):[],f=a.length;for(var d in t)(e||v.call(t,d))&&!(u&&(d=="length"||i&&(d=="offset"||d=="parent")||o&&(d=="buffer"||d=="byteLength"||d=="byteOffset")||Et(d,f)))&&a.push(d);return a}function at(t,e,r){(r!==void 0&&!q(t[e],r)||r===void 0&&!(e in t))&&it(t,e,r)}function Ve(t,e,r){var n=t[e];(!(v.call(t,e)&&q(n,r))||r===void 0&&!(e in t))&&it(t,e,r)}function W(t,e){for(var r=t.length;r--;)if(q(t[r][0],e))return r;return-1}function it(t,e,r){e=="__proto__"&&$?$(t,e,{configurable:!0,enumerable:!0,value:r,writable:!0}):t[e]=r}var Ke=nr();function Y(t){return t==null?t===void 0?Jt:w:C&&C in Object(t)?ar(t):cr(t)}function It(t){return F(t)&&Y(t)==A}function Je(t){if(!S(t)||ur(t))return!1;var e=lt(t)?_e:ie;return e.test(dr(t))}function $e(t){return F(t)&&Rt(t.length)&&!!s[Y(t)]}function We(t){if(!S(t))return fr(t);var e=Pt(t),r=[];for(var n in t)n=="constructor"&&(e||!v.call(t,n))||r.push(n);return r}function jt(t,e,r,n,i){t!==e&&Ke(e,function(o,u){if(i||(i=new E),S(o))Ye(t,e,u,r,jt,n,i);else{var a=n?n(st(t,u),o,u+"",t,e,i):void 0;a===void 0&&(a=o),at(t,u,a)}},Dt)}function Ye(t,e,r,n,i,o,u){var a=st(t,r),f=st(e,r),d=u.get(f);if(d){at(t,r,d);return}var h=o?o(a,f,r+"",t,e,u):void 0,M=h===void 0;if(M){var pt=ft(f),ht=!pt&&Nt(f),Mt=!pt&&!ht&&zt(f);h=f,pt||ht||Mt?ft(a)?h=a:gr(a)?h=tr(a):ht?(M=!1,h=Qe(f,!0)):Mt?(M=!1,h=ke(f,!0)):h=[]:_r(f)||ut(f)?(h=a,ut(a)?h=br(a):(!S(a)||lt(a))&&(h=ir(f))):M=!1}M&&(u.set(f,h),i(h,f,n,o,u),u.delete(f)),at(t,r,h)}function Ze(t,e){return pr(lr(t,e,Ft),t+"")}var qe=$?function(t,e){return $(t,"toString",{configurable:!0,enumerable:!1,value:mr(e),writable:!0})}:Ft;function Qe(t,e){if(e)return t.slice();var r=t.length,n=wt?wt(r):new t.constructor(r);return t.copy(n),n}function Xe(t){var e=new t.constructor(t.byteLength);return new At(e).set(new At(t)),e}function ke(t,e){var r=e?Xe(t.buffer):t.buffer;return new t.constructor(r,t.byteOffset,t.length)}function tr(t,e){var r=-1,n=t.length;for(e||(e=Array(n));++r<n;)e[r]=t[r];return e}function er(t,e,r,n){var i=!r;r||(r={});for(var o=-1,u=e.length;++o<u;){var a=e[o],f=n?n(r[a],t[a],a,r,t):void 0;f===void 0&&(f=t[a]),i?it(r,a,f):Ve(r,a,f)}return r}function rr(t){return Ze(function(e,r){var n=-1,i=r.length,o=i>1?r[i-1]:void 0,u=i>2?r[2]:void 0;for(o=t.length>3&&typeof o=="function"?(i--,o):void 0,u&&or(r[0],r[1],u)&&(o=i<3?void 0:o,i=1),e=Object(e);++n<i;){var a=r[n];a&&t(e,a,n,o)}return e})}function nr(t){return function(e,r,n){for(var i=-1,o=Object(e),u=n(e),a=u.length;a--;){var f=u[t?a:++i];if(r(o[f],f,o)===!1)break}return e}}function Z(t,e){var r=t.__data__;return sr(e)?r[typeof e=="string"?"string":"hash"]:r.map}function ot(t,e){var r=le(t,e);return Je(r)?r:void 0}function ar(t){var e=v.call(t,C),r=t[C];try{t[C]=void 0;var n=!0}catch{}var i=vt.call(t);return n&&(e?t[C]=r:delete t[C]),i}function ir(t){return typeof t.constructor=="function"&&!Pt(t)?Te(Ct(t)):{}}function Et(t,e){var r=typeof t;return e=e??y,!!e&&(r=="number"||r!="symbol"&&oe.test(t))&&t>-1&&t%1==0&&t<e}function or(t,e,r){if(!S(r))return!1;var n=typeof e;return(n=="number"?ct(r)&&Et(e,r.length):n=="string"&&e in r)?q(r[e],t):!1}function sr(t){var e=typeof t;return e=="string"||e=="number"||e=="symbol"||e=="boolean"?t!=="__proto__":t===null}function ur(t){return!!mt&&mt in t}function Pt(t){var e=t&&t.constructor,r=typeof e=="function"&&e.prototype||V;return t===r}function fr(t){var e=[];if(t!=null)for(var r in Object(t))e.push(r);return e}function cr(t){return vt.call(t)}function lr(t,e,r){return e=St(e===void 0?t.length-1:e,0),function(){for(var n=arguments,i=-1,o=St(n.length-e,0),u=Array(o);++i<o;)u[i]=n[e+i];i=-1;for(var a=Array(e+1);++i<e;)a[i]=n[i];return a[e]=r(u),ue(t,this,a)}}function st(t,e){if(!(e==="constructor"&&typeof t[e]=="function")&&e!="__proto__")return t[e]}var pr=hr(qe);function hr(t){var e=0,r=0;return function(){var n=ve(),i=g-(n-r);if(r=n,i>0){if(++e>=b)return arguments[0]}else e=0;return t.apply(void 0,arguments)}}function dr(t){if(t!=null){try{return K.call(t)}catch{}try{return t+""}catch{}}return""}function q(t,e){return t===e||t!==t&&e!==e}var ut=It(function(){return arguments}())?It:function(t){return F(t)&&v.call(t,"callee")&&!be.call(t,"callee")},ft=Array.isArray;function ct(t){return t!=null&&Rt(t.length)&&!lt(t)}function gr(t){return F(t)&&ct(t)}var Nt=me||vr;function lt(t){if(!S(t))return!1;var e=Y(t);return e==P||e==tt||e==B||e==I}function Rt(t){return typeof t=="number"&&t>-1&&t%1==0&&t<=y}function S(t){var e=typeof t;return t!=null&&(e=="object"||e=="function")}function F(t){return t!=null&&typeof t=="object"}function _r(t){if(!F(t)||Y(t)!=m)return!1;var e=Ct(t);if(e===null)return!0;var r=v.call(e,"constructor")&&e.constructor;return typeof r=="function"&&r instanceof r&&K.call(r)==ge}var zt=yt?ce(yt):$e;function br(t){return er(t,Dt(t))}function Dt(t){return ct(t)?Le(t,!0):We(t)}var yr=rr(function(t,e,r){jt(t,e,r)});function mr(t){return function(){return t}}function Ft(t){return t}function vr(){return!1}c.exports=yr})(k,k.exports);var Sr=k.exports;const Ut=Tr(Sr);var xr={VITE_OPENAI_API_KEY:"c2stVWRlRWFIWWZxQVBkQ1czZVNuTmFUM0JsYmtGSkRSTnp5cW9rRjFmR0ZBdE80Sm9S",BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1};const X=Ar("AI:isolates:chat"),Ir="gpt-4-1106-preview",{VITE_OPENAI_API_KEY:Gt}=xr;if(!Gt)throw new Error("missing openai api key");const jr=wr.Buffer.from(Gt,"base64").toString("utf-8"),Er=new Cr({apiKey:jr,dangerouslyAllowBrowser:!0}),Dr={prompt:{description:"prompt the AI",type:"object",properties:{text:{description:"the text to prompt the AI with",type:"string"}}}},Fr={prompt:async({text:c},p)=>{x(typeof c=="string","text must be a string"),x(c.length,"text must not be empty");const{sessionPath:_,systemPromptPath:l}=p,b=Bt(),g=await b.readJS(_);x(Array.isArray(g),"messages must be an array");const y=await b.readFile(l);g.shift(),g.unshift({role:"assistant",content:y}),c&&g.push({role:"user",content:c});const A=await Ht(g,_);return X("assistant",A),A}},Pr=c=>{try{return JSON.parse(c),!0}catch{return!1}},Ht=async(c,p)=>{var y,A,U,B,G,H,L;const _={model:Ir,temperature:0,messages:[...c],stream:!0,seed:1337},l={role:"assistant"};c.push(l);const b=Bt();await b.writeJS(c,p),X("streamCall started");const g=await Er.chat.completions.create(_);X("streamCall placed");for await(const P of g){const tt=((A=(y=P.choices[0])==null?void 0:y.delta)==null?void 0:A.content)||"";l.content||(l.content=""),l.content+=tt;const N=(B=(U=P.choices[0])==null?void 0:U.delta)==null?void 0:B.tool_calls;if(N){x(Array.isArray(N),"toolCalls must be an array"),l.toolCalls||(l.toolCalls=[]);for(const et of N){let{index:w,...m}=et;x(Number.isInteger(w),"toolCalls index must be an integer");let I=((H=(G=l.toolCalls[w])==null?void 0:G.function)==null?void 0:H.arguments)||"";I+=((L=m==null?void 0:m.function)==null?void 0:L.arguments)||"",I&&Pr(I)&&(l.toolCalls[w]||(l.toolCalls[w]={}),m=Ut({},m,{function:{arguments:JSON.parse(I)}}),Ut(l.toolCalls[w],m))}}await b.writeJS(c,p)}return X("streamCall complete"),Nr(c,p)},Nr=async(c,p)=>{x(Array.isArray(c),"messages must be an array"),x(Or.isAbsolute(p),"sessionPath must be absolute");const _=c[c.length-1];if(!_.toolCalls)return _.content;for(const l of _.toolCalls){const{function:b,arguments:g}=l;await io(path,b,g);const y=await fs.call(b,arguments);l.result=y}return Ht(c,p)};export{Dr as api,Fr as functions};