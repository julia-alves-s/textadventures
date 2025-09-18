import { passwordPrompt, prompt, termPrint } from "../terminal";
import { APIError, fetchClient, type RespostaEntidades, type RespostaItens, type RespostaSala, type RespostaSituacao } from "../utils/fetchApi";

type ComponenteAtualizavel = { id: string, atualizadoEm: string };
function mudouAlgo(_obj1: undefined | null | ComponenteAtualizavel | ComponenteAtualizavel[], _obj2?: null | ComponenteAtualizavel | ComponenteAtualizavel[]) {
    if(!_obj1 || !_obj2) return true;

    const obj1 = Array.isArray(_obj1) ? _obj1 : [_obj1];
    const obj2 = Array.isArray(_obj2) ? _obj2 : [_obj2];

    if(obj1.length !== obj2.length) return true;

    for(let o1 of obj1) {
        const o2 = obj2.find(o => o.id === o1.id);
        if(!o2) return true;
        if(o1.atualizadoEm !== o2.atualizadoEm) return true;
    }
    return false;
}

function descreverTudo(situacao: RespostaSituacao, situacaoAnterior?: RespostaSituacao | null) {
    const { resposta, sala, jogador } = situacao;

    termPrint(resposta);

    let mudouSala = sala.id !== situacaoAnterior?.sala.id;
    if(mudouSala || sala.descricao !== situacaoAnterior?.sala.descricao) {
        termPrint(sala.descricao?.trim() || "");
    }

    if(sala.itens && sala.itens.length > 0 && (mudouSala || mudouAlgo(sala.itens, situacaoAnterior?.sala?.itens))) {
        termPrint("Você vê aqui:");
        for(let item of sala.itens) {
            termPrint(`  ${item.quantidade} ${item.descricao?.trim()}`);
        }
    }

    const entidades = sala.entidades?.filter(e => 
        (e.tipo !== "JOGADOR" || (Date.now() - new Date(e.atualizadoEm).getTime() <= 1000 * 60 * 10)) 
        && e.username !== jogador.username
    ) || [];
    if(entidades && entidades.length > 0 && (mudouSala || mudouAlgo(entidades, situacaoAnterior?.sala?.entidades))) {
        termPrint("está aqui:");
        for(let entidade of entidades) {
            if(entidade.id !== jogador.username) {
                termPrint(`  ${entidade.tipo === "JOGADOR" ? entidade.username : entidade.tipo} ${entidade.descricao?.trim()}`);
            }
        }
    }
    
    if(mudouAlgo(jogador.mochila, situacaoAnterior?.jogador?.mochila)) {
        if(jogador.mochila && jogador.mochila.length > 0) {
            termPrint("Na sua mochila você tem:");
            for(let item of jogador.mochila) {
                termPrint(`  ${item.quantidade} ${item.descricao?.trim() || item.nome}`);
            }
        } else {
            termPrint("Sua mochila está vazia.");
        }
    }

    if(mudouSala) {
        if(sala.conexoes && sala.conexoes.length > 0) {
            termPrint("conexões:");
            for(let conexao of sala.conexoes) {
                termPrint(`  ${conexao}`);
            }
        } else {
            termPrint("não há nenhuma direção para ir daqui.");
        }
    }

    return {
        resposta,
        jogador,
        sala: {
            ...sala,
            entidades: entidades,
        }
    };
}

const fazerLogin = async () => {
    while(true) {
        // Fazer login vs cadastrar
        let login = false;
        const acao = (await prompt("Você já possui uma conta? (S/N) ")).trim().toUpperCase();
        if(acao === "S" || acao === "SIM") {
            login = true;
        } else {
            termPrint("Ok, vamos criar uma nova conta.");
        }

        const username = (await prompt("Usuário: ")).trim();
        const password = (await passwordPrompt("Senha: ")).trim();

        try {
            if(login)
            await fetchClient.login(username, password);
            else
            await fetchClient.cadastrar(username, password);

            termPrint("Login realizado com sucesso!");
            return;
        } catch(err) {
            if(err instanceof APIError && (err.status === 401 || err.status === 400)) {
                termPrint(err.message);
                termPrint("\nTente novamente.");
                continue;
            }

            console.error(err);
            termPrint("Erro:", err?.toString());
        }
    }
}

export const principal = async () => {
    let situacao: RespostaSituacao | null = null;
    while(true) {
        try {
            if(!situacao || !situacao.sala || !situacao.jogador) {
                situacao = descreverTudo(await fetchClient.salaOlhar(), null);
            }

            let { sala, jogador } = situacao;

            const comando = (await prompt(jogador.username+"> ")).trim().toUpperCase();
            let partes = comando.split(" ").filter(p => p.trim().length > 0);

            const acao = partes.length > 0 ? partes[0] : undefined;
            const args = partes.slice(1);

            // A FAZER: processar isso melhor kk
            if(!acao || acao === "OLHAR") {
                // Apenas olhar ao redor
                situacao = descreverTudo(await fetchClient.salaOlhar(), null);
            } else if (acao === "MOCHILA") {
                let _situacao = situacao;
                situacao = await fetchClient.salaOlhar();
                descreverTudo(situacao, { ..._situacao, jogador: { ..._situacao.jogador, mochila: null } });
            } else if (acao === "SAIR") {
                await fetchClient.logout();
                termPrint("Até mais!");
                break;
            } else if (acao === "PEGAR") {
                let quantidade = 1;
                if(args[0].match(/^\d+$/)) {
                    quantidade = parseInt(args[0]);
                    args.shift();
                }
                const itemId = sala.itens?.find(i => i.nome.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Não tem isso aqui.");
                    continue;
                }

                situacao = descreverTudo(await fetchClient.itemPegar(itemId, quantidade), situacao);                
            } else if(acao === "LARGAR") {
                let quantidade = 1;
                if(args[0].match(/^\d+$/)) {
                    quantidade = parseInt(args[0]);
                    args.shift();
                }
                const itemId = jogador.mochila?.find(i => i.nome.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Não tem isso aqui.");
                    continue;
                }

                situacao = descreverTudo(await fetchClient.itemLargar(itemId, quantidade), situacao);
            } else {
                situacao = descreverTudo(await fetchClient.salaMover(acao), situacao);
            }
        } catch(err) {
            if(err instanceof APIError && err.status === 401) {
                termPrint("Você precisa fazer login.");
                await fazerLogin();
                continue;
            }

            console.error(err);
            termPrint("Erro:", err?.toString());

            // Pergunta se quer tentar novamente
            const tentarNovamente = (await prompt("\nQuer continuar? (S/N) ")).trim().toUpperCase();
            if(tentarNovamente !== "S" && tentarNovamente !== "SIM") {
                break;
            }
        }
    }
};