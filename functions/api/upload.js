export async function onRequestPost({ request, env }) {
  try {
    if (!env.GITHUB_TOKEN) {
      return json({ error: "Token do GitHub não configurado." }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Corpo JSON inválido." }, 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";
    const format = typeof body.format === "string" ? body.format.toLowerCase() : "lua";

    if (!name || name.length > 60) {
      return json({ error: "Informe um nome de até 60 caracteres." }, 400);
    }
    if (!["lua", "txt"].includes(format)) {
      return json({ error: "Formato inválido. Use lua ou txt." }, 400);
    }
    if (!content.trim()) {
      return json({ error: "O arquivo está vazio." }, 400);
    }
    if (new TextEncoder().encode(content).length > 5 * 1024 * 1024) {
      return json({ error: "Arquivo maior que 5 MB." }, 413);
    }

    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const path = `scripts/${id}.${format}`;
    const apiUrl = `https://api.github.com/repos/gaga123308/DrakScripts/contents/${path}`;

    const uploadResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Drak-Studio-Scripts",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Upload script ${id}`,
        content: btoa(unescape(encodeURIComponent(content)))
      })
    });

    if (!uploadResponse.ok) {
      const details = await uploadResponse.text();
      console.error("GitHub upload error:", uploadResponse.status, details);
      return json({ error: "Falha ao salvar no GitHub. Confira o token e as permissões do repositório." }, 502);
    }

    const base = new URL(request.url).origin;
    return json({
      id,
      name,
      rawUrl: `${base}/raw/${id}`,
      downloadUrl: `${base}/download/${id}`
    }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return json({ error: "Erro interno ao enviar o arquivo." }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
