// exists to stop deno preview deployments from failing

console.log("testing");

Deno.serve((req: Request) => new Response("Hello World"));
