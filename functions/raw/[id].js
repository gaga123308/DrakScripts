
export async function onRequestGet({ params, env }) {
  const id = params.id;

  if (!/^[a-f0-9]{12}$/.test(id)) {
    return new Response("ID inválido.", { status: 400 });
  }

  const object = await env.SCRIPTS_BUCKET.get(`${id}.lua`);

  if (!object) {
    return new Response("Script não encontrado.", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300"
    }
  });
}
