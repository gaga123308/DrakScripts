
export async function onRequestPost({ request, env }) {
    try {
        if (!env.GITHUB_TOKEN) {
            return Response.json(
                { error: "Token do GitHub não configurado no Cloudflare." },
                { status: 500 }
            );
        }

        const form = await request.formData();
        const file = form.get("file");

        if (!file || typeof file.name !== "string") {
            return Response.json(
                { error: "Nenhum arquivo foi enviado." },
                { status: 400 }
            );
        }

        if (!/\.(lua|txt)$/i.test(file.name)) {
            return Response.json(
                { error: "Envie somente arquivos .lua ou .txt." },
                { status: 400 }
            );
        }

        /*
         * Sem limite artificial de 1 MB.
         * Limite prático de 70 MiB para deixar espaço para
         * a codificação Base64 e o corpo da requisição ao GitHub.
         */
        const maxBytes = 70 * 1024 * 1024;

        if (file.size > maxBytes) {
            return Response.json(
                {
                    error: "O arquivo excede 70 MiB. Os limites do Cloudflare e do GitHub impedem uploads ilimitados por este método."
                },
                { status: 413 }
            );
        }

        const id = crypto.randomUUID()
            .replaceAll("-", "")
            .slice(0, 12);

        const extension = file.name.toLowerCase().endsWith(".txt")
            ? "txt"
            : "lua";

        const path = `scripts/${id}.${extension}`;
        const content = await file.arrayBuffer();

        // Codifica em Base64 sem depender de unescape/encodeURIComponent.
        const bytes = new Uint8Array(content);
        const chunks = [];
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            chunks.push(
                String.fromCharCode(...bytes.subarray(i, i + chunkSize))
            );
        }

        const base64 = btoa(chunks.join(""));

        const githubResponse = await fetch(
            `https://api.github.com/repos/gaga123308/DrakScripts/contents/${path}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Content-Type": "application/json",
                    "User-Agent": "Drak-Studio-Scripts"
                },
                body: JSON.stringify({
                    message: `Upload de arquivo ${id}`,
                    content: base64
                })
            }
        );

        if (!githubResponse.ok) {
            const errorBody = await githubResponse.text();

            console.error(
                "Erro na API do GitHub:",
                githubResponse.status,
                errorBody.slice(0, 1000)
            );

            return Response.json(
                {
                    error: githubResponse.status === 401 ||
                           githubResponse.status === 403
                        ? "O GitHub recusou o acesso. Confira as permissões do token."
                        : githubResponse.status === 404
                        ? "Repositório não encontrado ou token sem acesso."
                        : githubResponse.status === 422
                        ? "O GitHub não aceitou o arquivo."
                        : "Falha ao salvar o arquivo no GitHub."
                },
                { status: 502 }
            );
        }

        const base = new URL(request.url).origin;

        return Response.json({
            id,
            rawUrl: `${base}/raw/${id}`,
            downloadUrl: `${base}/download/${id}`
        });
    } catch (error) {
        console.error("Erro no upload:", error);

        return Response.json(
            { error: "Erro interno ao enviar o arquivo." },
            { status: 500 }
        );
    }
}
