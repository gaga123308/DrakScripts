
export async function onRequestGet({ params, env }) {
  const id = params.id;

  if (!/^[a-f0-9]{12}$/.test(id)) {
    return new Response("ID inválido.", { status: 400 });
  }

  for (const ext of ["lua", "txt"]) {
    const response = await fetch(
      `https://api.github.com/repos/gaga123308/DrakScripts/contents/scripts/${id}.${ext}`,
      {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "DrakScripts"
        }
      }
    );

    if (response.ok) {
      return new Response(await response.arrayBuffer(), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${id}.${ext}"`,
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (response.status !== 404) {
      return new Response("Erro ao buscar arquivo no GitHub.", {
        status: 502
      });
    }
  }

  return new Response("Arquivo não encontrado no GitHub.", {
    status: 404
  });
}
