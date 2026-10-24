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

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300"
    }
  });
}
