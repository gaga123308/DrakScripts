
export async function onRequestGet({ params, env }) {
  const id = params.id;

  if (!/^[a-f0-9]{12}$/.test(id)) {
    return new Response("ID inválido.", { status: 400 });
  }

  const object = await env.SCRIPTS_BUCKET.get(`${id}.lua`);

  if (!object) {
    return new Response("Script não encontrado.", { status: 404 });
  }

  const name = (
    object.customMetadata?.originalName || "script.lua"
  ).replace(/[^a-zA-Z0-9._-]/g, "_");

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
