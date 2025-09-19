export class APIError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export function getApiUrl() {
    // @ts-ignore
    let url = import.meta.env.VITE_API_URL;
    if (!url) {
        throw new Error("A variável de ambiente API_URL_SERVER e/ou API_URL_CLIENT não está definida.");
    }
    return url;
}

/**
 * Faz requisições para uma API, utilizando a documentação para inferir os tipos da requisição e resposta.
 * 
 * @example
 * const resultado = await fetchApi<any>("post", "/auth/local", {
 *    credencial: "usuario",
 *    senha: "senha"
 * });
 */
export const doFetchApi = async <T>(method: string, route: string, request?: object, _fetchOptions?: RequestInit & {headers: Record<string, string | ReadonlyArray<string>>}): Promise<T> => {
    // let token: string = "?";
    let url: string = route;
    let bodyToSend: URLSearchParams | string | undefined = undefined;

    let { headers, ...fetchOptions} = _fetchOptions || {};
    if (!headers) { headers = {}; }
    if(!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const contentType = headers["Content-Type"];

    if (request && "body" in request && request.body) {
        if (contentType === "application/x-www-form-urlencoded") {
           bodyToSend = new URLSearchParams(request.body as any);
        } else if (contentType === "application/json") {
           bodyToSend = JSON.stringify(request.body);
        } else if (contentType === "text/plain") {
           bodyToSend = ""+request.body;
        } else {
           throw new Error("Content-Type não suportado: " + contentType);
        }
    }

    if (request && "params" in request && request.params) {
        const params = request.params as Record<string, string | number>;
        for (const key in params) {
            url = url.replace(`{${key}}`, encodeURIComponent(""+params[key]));
        }
    }

    if (request && "query" in request && request.query) {
        url += "?" + new URLSearchParams(request.query as any);
    }

    url = getApiUrl() + url;
   
    console.log("apiFetch", method, url);
    let fetchRes = await fetch(url, {
        cache: "no-store", // next 15
        credentials: "include", // Necessário para enviar cookies cross-origin
        ...fetchOptions,
        headers: headers,
        
        method: method as any,
        //next: {
        //    revalidate: 0
        //},
        body: bodyToSend
    });

    // The ok read-only property of the Response interface contains a Boolean stating whether the response was successful (status in the range 200-299) or not.
    const success = fetchRes.ok;
    const responseContentType = fetchRes.headers.get("content-type");
    if (responseContentType && responseContentType.includes("application/json")) {
        let json: unknown = await fetchRes.json();

        if(!success) {
            throw new APIError(JSON.stringify(json, null, 2), fetchRes.status);
        } else {
            return json as T;
        }
    } else {
        let text: string = await fetchRes.text();

        if(!success) {
            throw new APIError(text, fetchRes.status);
        } else {
            return text as T;
        }
    }
};
export type RespostaItens = {
    id: string;
    nome: string;
    descricao?: string;
    quantidade: number;
    atualizadoEm: string;
}

export type RespostaEntidades = {
    id: string;
    categoria: string;
    tipo: string;
    descricao?: string;
    username?: string;
    atualizadoEm: string;
}

export type RespostaSituacao = {
    resposta: string;
    jogador: {
        id: string;
        username: string;
        ondeId: string;
        mochila?: RespostaItens[] | null;
        atualizadoEm: string;
    };
    sala: RespostaSala;
}

export type RespostaSala = {
    id: string;
    nome: string;
    descricao?: string;
    itens?: RespostaItens[] | null;
    entidades?: RespostaEntidades[] | null;
    conexoes?: string[] | null;
    atualizadoEm: string;
}

export const fetchClient = {
    login: (username: string, password: string) => doFetchApi<{ user: { username: string; createdAt: string; } }>("post", "/auth/login", { body: { username, password } }),
    cadastrar: (username: string, password: string) => doFetchApi<{ user: { username: string; createdAt: string; } }>("post", "/auth/cadastrar", { body: { username, password } }),
    logout: () => doFetchApi<void>("post", "/auth/logout"),
    
    salaOlhar: () => doFetchApi<{ sala: RespostaSala } & RespostaSituacao>("get", "/sala/olhar"),
    salaMover: (direcao: string) => doFetchApi<RespostaSituacao>("post", "/sala/mover", { body: { direcao } }),
    itemPegar: (item: string, quantidade?: number) => doFetchApi<RespostaSituacao>("post", "/item/pegar", { body: { item, quantidade } }),
    itemLargar: (item: string, quantidade?: number) => doFetchApi<RespostaSituacao>("post", "/item/largar", { body: { item, quantidade } }),
    itemAcao: (item: string, acao: string, extra?: object) => doFetchApi<RespostaSituacao>("post", "/item/acao", { body: { item, acao, extra } }),
};

// */