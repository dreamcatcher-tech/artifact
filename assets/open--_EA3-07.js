import{D as r,i as n}from"./index-lK83-PcX.js";r("AI:io.fixture");const i={openUrl:{description:"Opens a URL in the default browser",type:"object",additionalProperties:!1,required:["url"],properties:{url:{type:"string"},wait:{type:"boolean",default:!1}}}},t={openUrl:async({url:e})=>{debugger;if(!n)throw new Error("cannot open window unless running in browser");window.open(e,"_blank")}};export{i as api,t as functions};
