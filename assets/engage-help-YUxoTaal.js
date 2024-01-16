import{D as s,d as o,_ as e}from"./index-lNgwdCew.js";const i=s("AI:engage-help"),a={engage:{description:"engage the help",type:"object",properties:{helpPath:{description:"the path to the help",type:"string"}}}},n={engage:async({help:t})=>{i("engage:",t);const{default:p}=await o(Object.assign({"../helps/curtains.js":()=>e(()=>import("./curtains-Aw3dsg9n.js"),__vite__mapDeps([])),"../helps/goalie.js":()=>e(()=>import("./goalie-bzFvFttX.js"),__vite__mapDeps([])),"../helps/help.fixture.js":()=>e(()=>import("./help.fixture-unLA5UVR.js"),__vite__mapDeps([]))}),`../helps/${t}.js`);return i(p),"testing"}};export{a as api,n as functions};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
