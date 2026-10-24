export async function onRequestGet({ params, env }) {
  const id = params.id;

  if (!/^[a-f0-9]{12}$/.test(id)) {
    return new Response("ID inválido.", { status: 400 });
  }

  const response = await fetch(
    `https://api.github.com/repos/gaga123308/DrakScripts/contents/scripts/${id}.lua`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DrakScripts"
      }
    }
  );

  if (!response.ok) {
    return new Response("Script não encontrado.", {
      status: response.status === 404 ? 404 : 502
    });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${id}.lua"`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
