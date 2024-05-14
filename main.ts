Deno.serve(
  (req: Request) =>
    new Response("exists to stop deno preview deployments from failing")
);
