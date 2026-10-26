
export async function onRequestGet({ params, env }) {
    try {
        const id = params.id;

        if (!/^[a-f0-9]{12}$/i.test(id || "")) {
            return new Response("ID inválido.", { status: 400 });
        }

        if (!env.GITHUB_TOKEN) {
            return new Response("Token do GitHub não configurado.", {
                status: 500
            });
        }

        let githubResponse;
        let extension;

        for (const ext of ["lua", "txt"]) {
            githubResponse = await fetch(
                `https://api.github.com/repos/gaga123308/DrakScripts/contents/scripts/${id}.${ext}`,
                {
                    headers: {
                        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
                        Accept: "application/vnd.github.raw+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                        "User-Agent": "Drak-Studio-Scripts"
                    }
                }
            );

            if (githubResponse.ok) {
                extension = ext;
                break;
            }

            if (githubResponse.status !== 404) {
                return new Response("Erro ao buscar o script no GitHub.", {
                    status: 502
                });
            }
        }

        if (!githubResponse?.ok) {
            return new Response("Script não encontrado.", { status: 404 });
        }

        const content = await githubResponse.text();

        return new Response(content, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": `inline; filename="${id}.${extension}"`,
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff"
            }
        });
    } catch (error) {
        console.error("Erro no RAW:", error);

        return new Response("Erro interno ao carregar o script.", {
            status: 500
        });
    }
}
