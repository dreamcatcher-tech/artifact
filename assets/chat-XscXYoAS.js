import{D as O,b as R,O as P,a as r,_ as x,p as N}from"./index-G_WXAw4L.js";import{m as b}from"./index-3Scg1s-s.js";import{i as h}from"./io-hooks-NnKsiyKm.js";var V={VITE_OPENAI_API_KEY:"c2stVWRlRWFIWWZxQVBkQ1czZVNuTmFUM0JsYmtGSkRSTnp5cW9rRjFmR0ZBdE80Sm9S",BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1};const m=O("AI:isolates:chat"),D="gpt-4-1106-preview",{VITE_OPENAI_API_KEY:C}=V;if(!C)throw new Error("missing openai api key");const J=R.Buffer.from(C,"base64").toString("utf-8"),v=new P({apiKey:J,dangerouslyAllowBrowser:!0}),k={prompt:{description:"prompt the AI",type:"object",properties:{text:{description:"the text to prompt the AI with",type:"string"},noSysPrompt:{type:"boolean"}}}},K={prompt:async({text:s,noSysPrompt:e=!1})=>{r(typeof s=="string","text must be a string"),r(s.length,"text must not be empty");const a=h();let t=[];const o="/chat-1.session.json";if(await a.isFile(o)&&(t=await a.readJS(o)),r(Array.isArray(t),"messages must be an array"),!e){const{default:i}=await x(()=>import("./curtains-Aw3dsg9n.js"),__vite__mapDeps([])),u=i.instructions.join(`
`).trim();t.shift(),t.unshift({role:"system",content:u})}s&&t.push({role:"user",content:s});const n=await S(t,o);return m("assistant",n),n}},B=s=>{try{return JSON.parse(s),!0}catch{return!1}},S=async(s,e)=>{var i,u,y,d,g,_,w;const a={model:D,temperature:0,messages:[...s],stream:!0,seed:1337},t={role:"assistant"};s.push(t);const o=h();await o.writeJS(s,e),m("streamCall started");const n=await v.chat.completions.create(a);m("streamCall placed");for await(const A of n){const E=((u=(i=A.choices[0])==null?void 0:i.delta)==null?void 0:u.content)||"";t.content||(t.content=""),t.content+=E;const f=(d=(y=A.choices[0])==null?void 0:y.delta)==null?void 0:d.tool_calls;if(f){r(Array.isArray(f),"toolCalls must be an array"),t.toolCalls||(t.toolCalls=[]);for(const I of f){let{index:c,...l}=I;r(Number.isInteger(c),"toolCalls index must be an integer");let p=((_=(g=t.toolCalls[c])==null?void 0:g.function)==null?void 0:_.arguments)||"";p+=((w=l==null?void 0:l.function)==null?void 0:w.arguments)||"",p&&B(p)&&(t.toolCalls[c]||(t.toolCalls[c]={}),l=b({},l,{function:{arguments:JSON.parse(p)}}),b(t.toolCalls[c],l))}}await o.writeJS(s,e)}return m("streamCall complete"),T(s,e)},T=async(s,e)=>{r(Array.isArray(s),"messages must be an array"),r(N.isAbsolute(e),"sessionPath must be absolute");const a=s[s.length-1];if(!a.toolCalls)return a.content;for(const t of a.toolCalls){const{function:o,arguments:n}=t;await io(path,o,n);const i=await fs.call(o,arguments);t.result=i}return S(s,e)};export{k as api,K as functions};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
