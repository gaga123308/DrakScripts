
export async function onRequestPost({ request, env }) {
  try {
    if (!env.GITHUB_TOKEN) {
      return Response.json(
        { error: "Token do GitHub não configurado." },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file.name !== "string") {
      return Response.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    if (!/\.(lua|txt)$/i.test(file.name)) {
      return Response.json(
        { error: "Envie somente arquivos .lua ou .txt." },
        { status: 400 }
      );
    }

    if (file.size > 1024 * 1024) {
      return Response.json(
        { error: "O limite é 1 MB." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 12);

    const extension = file.name.toLowerCase().endsWith(".txt")
      ? "txt"
      : "lua";

    const path = `scripts/${id}.${extension}`;
    const content = await file.text();

    const result = await fetch(
      `https://api.github.com/repos/gaga123308/DrakScripts/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "DrakScripts"
        },
        body: JSON.stringify({
          message: `Upload de script ${id}`,
          content: btoa(unescape(encodeURIComponent(content)))
        })
      }
    );

    if (!result.ok) {
      return Response.json(
        { error: "Falha ao salvar no GitHub. Verifique o token e as permissões Contents: Read and write." },
        { status: 502 }
      );
    }

    const base = new URL(request.url).origin;

    return Response.json({
      id,
      rawUrl: `${base}/raw/${id}`,
      downloadUrl: `${base}/download/${id}`
    });
  } catch {
    return Response.json(
      { error: "Erro interno ao enviar o arquivo." },
      { status: 500 }
    );
  }
}
