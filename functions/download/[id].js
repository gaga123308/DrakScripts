export async function onRequestGet({ params, env }) {
  const id = params.id;

  if (!/^[a-f0-9]{12}$/i.test(id || "")) {
    return new Response("ID inválido.", { status: 400 });
  }
  if (!env.GITHUB_TOKEN) {
    return new Response("Token do GitHub não configurado.", { status: 500 });
  }

  for (const ext of ["lua", "txt"]) {
    const response = await fetch(
      `https://api.github.com/repos/gaga123308/DrakScripts/contents/scripts/${id}.${ext}`,
      {
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Drak-Studio-Scripts"
        }
      }
    );

    if (response.ok) {
      const content = await response.text();
      return new Response(content, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${id}.${ext}"`,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (response.status !== 404) {
      console.error("GitHub download error:", response.status);
      return new Response("Erro ao buscar o arquivo no GitHub.", { status: 502 });
    }
  }

  return new Response("Arquivo não encontrado.", { status: 404 });
}
