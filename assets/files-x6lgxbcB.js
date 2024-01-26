import{D as d,w as n,l,d as o}from"./index-lK83-PcX.js";const i=d("AI:files"),u={write:{description:"Overwrite or Add a file with optional contents.  If the contents are ommitted, the file will be overwritten or created with zero contents.",type:"object",additionalProperties:!1,required:["path"],properties:{path:{type:"string",description:"the absolute path to the file"},contents:{type:"string",description:"the contents of the file to be written"}}},ls:{description:"list files",type:"object",additionalProperties:!1,properties:{path:{type:"string",description:"the absolute path to the directory you want to list"}}},read:{description:"Read a file.  It will be returned to you as a string",type:"object",additionalProperties:!1,required:["path"],properties:{path:{type:"string",description:"the absolute path to the file you want to read"}}},update:{description:"Update a file using a regex and a replacement string.  The number of occurences replaced will be returned to you as an integer.  If you want to append something to a file, you can use a regex to match the end of the file and replace it with the contents you want to append.  To delete portions of a file, you can use a regex to match the contents you want to delete and replace it with an empty string.",type:"object",additionalProperties:!1,required:["path","regex","replacement"],properties:{path:{type:"string",description:"the absolute path to the file you want to update"},regex:{type:"string",description:"a regular expression string"},replacement:{type:"string",description:"the replacement string"}}}},h={write:async({path:e,contents:t=""})=>(i("add",e,t),await n(e,t),`added ${e} with length: ${t.length}`),ls:async({path:e})=>(i("ls"),await l(e)),read:async({path:e})=>o(e),update:async({path:e,regex:t,replacement:r})=>{i("update",e,t,r);const a=await o(e),s=a.match(new RegExp(t,"g"))||[],p=a.replace(new RegExp(t,"g"),r);return await n(e,p),s.length}};export{u as api,h as functions};
