import{D as n}from"./index-9wIIzUhy.js";const o=n("AI:fetch"),s={delay:{description:`Delays the execution of the next command by the specified number of milliseconds and then returns the current date and time in the format used by the system locale.  For example the following function input parameters:
    
      const milliseconds = 1000

      would result in the call:

      await new Promise(resolve => setTimeout(resolve, milliseconds))

      which would delay the execution of the next command by 1 second, and then would return the result of calling:

      new Date().toLocaleString()
      `,type:"object",additionalProperties:!1,required:["milliseconds"],properties:{milliseconds:{type:"integer",minimum:1}}}},l={delay:async({milliseconds:e})=>(o("delay",e),await new Promise(t=>setTimeout(t,e)),new Date().toLocaleString())};export{s as api,l as functions};
