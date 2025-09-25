import { optionsPrompt, passwordPrompt, prompt, termPrint } from "../terminal";
import { APIError, fetchClient, type RespostaEntidades, type RespostaItens, type RespostaJogoInfo, type RespostaSala, type RespostaSituacao } from "../utils/fetchApi";
import { CommandParser, ParserError } from "../utils/commandParser";
import { Acao, type AcaoValue, acoesConfig, DIRECOES } from "../utils/comandoConfig";
import anyAscii from "any-ascii";
import { chalk } from "../utils/chalk";

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

// https://hexdocs.pm/color_palette/ansi_color_codes.html
const cor = {
    texto: chalk.ansi256(248),
    descricao: chalk.reset,
    resposta: chalk.red,
    quantidade: chalk.ansi256(40),
    item: chalk.ansi256(28),
    entidade: chalk.ansi256(28),
    acao: chalk.ansi256(165),
};

function descreverTudo(situacao: RespostaSituacao, situacaoAnterior?: Partial<RespostaSituacao> | null) {
    const { resposta, sala, jogador } = situacao;

    if(resposta)
    termPrint(cor.resposta(resposta));

    const acoes = new Set<string>();

    let mudouSala = sala.id !== situacaoAnterior?.sala?.id;
    if(mudouSala || sala.descricao !== situacaoAnterior?.sala?.descricao) {
        termPrint(cor.descricao(sala.descricao?.trim() || ""));
    }

    let voceVeAqui = false;
    if(sala.itens && sala.itens.length > 0 && (mudouSala || mudouAlgo(sala.itens, situacaoAnterior?.sala?.itens))) {
        voceVeAqui = true;
        termPrint(cor.texto("Você vê aqui:"));
        for(let item of sala.itens) {
            termPrint(`  ${cor.quantidade(item.quantidade)} ${cor.item(item.descricao?.trim())}`);
            if(item.acoes && item.acoes.length > 0) {
                item.acoes.forEach(a => acoes.add(a));
            }
        }
    }

    const entidades = sala.entidades;
    if(entidades && entidades.length > 0 && (mudouSala || mudouAlgo(entidades, situacaoAnterior?.sala?.entidades))) {
        if(!voceVeAqui) {
            termPrint(cor.texto("Você vê aqui:"));
        }
        for(let entidade of entidades) {
            termPrint(`  ${cor.entidade(entidade.descricao?.trim())}`);
            if(entidade.acoes && entidade.acoes.length > 0) {
                entidade.acoes.forEach(a => acoes.add(a));
            }
            if(entidade.itens && entidade.itens.length > 0) {
                termPrint(cor.texto("  que contém:"));
                for(let item of entidade.itens) {
                    termPrint(`     ${cor.quantidade(item.quantidade)} ${cor.item(item.descricao?.trim() || item.nome)}`);
                    if(item.acoes && item.acoes.length > 0) {
                        item.acoes.forEach(a => acoes.add(a));
                    }
                }
            }
        }
    }
    
    if(mudouAlgo(jogador.itens, situacaoAnterior?.jogador?.itens)) {
        if(jogador.itens && jogador.itens.length > 0) {
            termPrint(cor.texto("Na sua mochila você tem:"));
            for(let item of jogador.itens) {
                termPrint(`  ${cor.quantidade(item.quantidade)} ${cor.item(item.descricao?.trim() || item.nome)}`);
                if(item.acoes && item.acoes.length > 0) {
                    item.acoes.forEach(a => acoes.add(a));
                }
            }
        } else {
            termPrint(cor.texto("Sua mochila está vazia."));
        }
    }
    if(mudouSala && sala.acoes && sala.acoes.length > 0) {
        sala.acoes.forEach(a => acoes.add(a));
    }

    const acoesLista = Array.from(acoes)
        .filter(a => DIRECOES.includes(a as AcaoValue) === false)
        .sort()
        .map(a => cor.acao(a.length > 2 ? a.toLowerCase() : a));

    // Aqui lista ações do que foi descrito apenas
    if(acoesLista.length > 0) {
        termPrint(cor.texto("Ações:"), acoesLista.join(cor.texto(", ")));
    }

    // Agora lista todas as ações de movimento possíveis
    const mapAcoes: Partial<Record<AcaoValue, boolean | undefined>> = {};    
    for(let acao of sala.acoes || []) {
        mapAcoes[acao as AcaoValue] = true;
    }
    for(let item of sala.itens || []) {
        for(let acao of item.acoes || []) {
            mapAcoes[acao as AcaoValue] = true;
        }
    }
    for(let entidade of sala.entidades || []) {
        for(let acao of entidade.acoes || []) {
            mapAcoes[acao as AcaoValue] = true;
        }
        for(let item of entidade.itens || []) {
            for(let acao of item.acoes || []) {
                mapAcoes[acao as AcaoValue] = true;
            }
        }
    }
    for(let item of jogador.itens || []) {
        for(let acao of item.acoes || []) {
            mapAcoes[acao as AcaoValue] = true;
        }
    }
    termPrint(` ${mapAcoes[Acao.NO] ? cor.acao("NO") : "  "} ${mapAcoes[Acao.N] ? cor.acao("N") : " "} ${mapAcoes[Acao.NE] ? cor.acao("NE") : "  "} ${mapAcoes[Acao.Subir] ? cor.acao("subir") : " "}`);
    termPrint(` ${mapAcoes[Acao.O] ? cor.acao("O ") : "  "  } ${cor.resposta("✢")} ${mapAcoes[Acao.L] ? cor.acao(" L") : "  "} ${mapAcoes[Acao.Entrar] ? cor.acao("entrar") : " "}  ${mapAcoes[Acao.Sair] ? cor.acao("sair") : " "}`);
    termPrint(` ${mapAcoes[Acao.SO] ? cor.acao("SO") : "  "} ${mapAcoes[Acao.S] ? cor.acao("S") : " "} ${mapAcoes[Acao.SE] ? cor.acao("SE") : "  "} ${mapAcoes[Acao.Descer] ? cor.acao("descer") : " "}`);

    return {
        resposta,
        jogador,
        sala
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

export const desambiguar = async (
    mensagem: string,
    acao: string | null, 
    alvos: Record<string, { sinonimos: string[], ref: RespostaItens | RespostaEntidades }>, 
    alvosMatch: {match: string, confidence: number}[],
    arg: number
) => {
    if(!acao) {
        return { item: undefined, entidade: undefined };
    }

    let item: RespostaItens[] = [];
    let entidade: RespostaEntidades[] = [];
    for(let result of alvosMatch) {
        const alvo = alvos[result.match]?.ref;
        if("tipo" in alvo) {
            if(arg !== 1 || alvo.acoes?.includes(acao))
            entidade.push(alvo);
        } else {
            if(arg !== 1 || alvo.acoes?.includes(acao))
            item.push(alvo);
        }
    }

    if((item.length + entidade.length) > 1) {
        if(!(!acao || acoesConfig[acao as AcaoValue].args >= arg)) {
            return { item: undefined, entidade: undefined };
        }
        termPrint(cor.texto(mensagem));
        let k = 0;
        let options = [];
        for(; k < item.length; k++) {
            const i = item[k];
            let letter = String.fromCharCode(k + "A".charCodeAt(0));
            termPrint(`  ${cor.texto(letter)}: ${cor.quantidade(i.quantidade)} ${cor.item(i.descricao?.trim() || "")} (${i.acoes?.map(a => cor.acao(a.toLowerCase()))?.join(cor.texto(", "))})`);
            options.push(letter);
        }
        for(; k < item.length + entidade.length; k++) {
            const e = entidade[k - item.length];
            let letter = String.fromCharCode(k + "A".charCodeAt(0));
            termPrint(`  ${cor.texto(letter)}: ${cor.item(e.descricao?.trim() || "")} (${e.acoes?.map(a => cor.acao(a.toLowerCase()))?.join(cor.texto(", "))})`);
            options.push(letter);
        }
        const escolha = (await optionsPrompt(options, "Escolha um: ")).trim();
        const escolhaNum = escolha.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
        if(isNaN(escolhaNum) || escolhaNum < 0) {
            throw new ParserError("Escolha inválida.");
        }

        if(escolhaNum < item.length) {
            item = [item[escolhaNum]];
            entidade = [];
        } else if (escolhaNum - item.length < entidade.length) {
            entidade = [entidade[escolhaNum - item.length]];
            item = [];
        } else {
            throw new ParserError("Escolha inválida.");
        }
    } else if ((item.length + entidade.length) === 1) {
        if(alvosMatch.length > 1) {
            termPrint(cor.texto(`(${item.at(0)?.nome || entidade.at(0)?.nome})`));
        }
    }

    return { item: item.at(0), entidade: entidade.at(0) };
}

export const principal = async (jogoInfo?: RespostaJogoInfo) => {
    let situacao: RespostaSituacao | null = null;
    let exibirBannerOla = true;
    while(true) {
        try {
            if(!jogoInfo || !jogoInfo.jogador || !situacao || !situacao.sala || !situacao.jogador) {
                if(!jogoInfo || !jogoInfo.jogador) {
                    jogoInfo = await fetchClient.info();
                    exibirBannerOla = true;
                }
                if(exibirBannerOla) {
                    termPrint("Olá novamente", jogoInfo.jogador.username);
                    termPrint("Online última vez em", new Date(jogoInfo.jogador.atualizadoEm).toLocaleString());
                    termPrint("");
                    if(jogoInfo.usuariosCadastrados !== undefined && jogoInfo.usuariosOnline !== undefined) {
                        termPrint(`${jogoInfo.usuariosOnline} usuários online agora, ${jogoInfo.usuariosCadastrados} cadastrados.`);
                    }
                    termPrint("");
                    exibirBannerOla = false;
                }
                let salaId = situacao?.sala?.id || situacao?.jogador?.ondeId || jogoInfo?.jogador?.ondeId;
                situacao = descreverTudo(await fetchClient.salaOlhar(salaId), null);
            }

            let { sala, jogador } = situacao;
            
            const alvos = CommandParser.buildContext(situacao);
            const parser = new CommandParser(await prompt(jogador.username+"> "), { alvos });
            const { acao, quantidade, alvoA: _alvoA, alvoB: _alvoB, resto } = parser.parse();

            const alvoA = await desambiguar("Seja mais específico: ", acao, alvos, _alvoA, 1);
            const alvoB = await desambiguar("Com oq? ", acao, alvos, _alvoB, 2);
            let texto = resto?.trim() || undefined;

            if(acao && acoesConfig[acao].texto === true && !texto) {
                texto = anyAscii((await prompt() || "").replaceAll(/[\r\n\t]/g," ")).trim();
            }

            if(!acao || acao === Acao.Mochila || (!alvoA.entidade && !alvoA.item && acao === Acao.Olhar)) {
                // Apenas olhar ao redor
                if(acao === Acao.Mochila) {
                    situacao = descreverTudo(await fetchClient.salaOlhar(situacao.sala.id), { ...situacao, jogador: undefined });
                } else {
                    situacao = descreverTudo(await fetchClient.salaOlhar(situacao.sala.id), { ...situacao, sala: undefined});
                }
            } else if(acao === Acao.Ajuda) {
                termPrint("Você pode usar comandos como:");
                termPrint("  norte");
                termPrint("  abrir porta");
                termPrint("  pegar 1 pedra");
                termPrint("  largar pedra");
                termPrint("  colocar no bau 100 moedas");
                termPrint("");
                termPrint("  mochila - para ver o que você está carregando");
                termPrint("  olhar - para olhar ao redor novamente ou olhar algo específico");
                termPrint("  ajuda - para ver esta mensagem novamente");
                termPrint("  logout - para sair do jogo.");
                termPrint("");
                const resposta = await prompt("Deseja ver a lista completa de ações? (S/N) ");
                if(resposta.trim().toUpperCase() === "S" || resposta.trim().toUpperCase() === "SIM") {
                    termPrint(" Ação: Sinônimo1, Sinônimo2, ...");
                    for(let acaoKey in acoesConfig) {
                        const acao = acaoKey as AcaoValue;
                        termPrint(`  ${acao.length > 2 ? acao.toLowerCase() : acao}: ${acoesConfig[acao].sinonimos.join(", ").toLowerCase()}`);
                    }

                    termPrint("");
                    termPrint("Comandos devem seguir uma das seguintes estruturas:");
                    termPrint("  <Ação>");
                    termPrint("  ir <Direção>");
                    termPrint("  <Ação> <Alvo>");
                    termPrint("  <Ação> <Quantidade> <Alvo>");
                    termPrint("  <Ação> <AlvoA> <AlvoB>");
                    termPrint("  <Ação> <AlvoA> <Quantidade> <AlvoB>");
                    termPrint("  usando <Alvo> <Ação>");
                    termPrint("  usando <AlvoA> <Ação> <AlvoB>");
                    termPrint("");
                    termPrint("Onde:");
                    termPrint("  <Ação>: Uma ação válida (ver lista acima)");
                    termPrint("  <Direção>: Uma direção (N, S, L, O, NORTE, SUL, etc)");
                    termPrint("  <Alvo>, <AlvoA>, <AlvoB>: Um item ou entidade visível");
                    termPrint("  <Quantidade>: Um número (ex: 3)");
                    termPrint("");
                    termPrint("Artigos, preposições e contrações são ignoradas, como 'o', 'de', 'na', 'numa', etc.");
                }
            } else if (acao === Acao.Logout) {
                await fetchClient.logout();
                termPrint("Até mais!");
                break;
            } else {
                if(alvoA.item) {
                    situacao = descreverTudo(await fetchClient.itemAcao(situacao.sala.id, alvoA.item.id, acao, { quantidade, item: alvoB.item?.id, entidade: alvoB.entidade?.id, texto: texto || undefined }), situacao);
                } else if(alvoA.entidade) {
                    situacao = descreverTudo(await fetchClient.entidadeAcao(situacao.sala.id, alvoA.entidade.id, acao, { quantidade, item: alvoB.item?.id, entidade: alvoB.entidade?.id, texto: texto || undefined }), situacao);
                } else {
                    situacao = descreverTudo(await fetchClient.salaMover(situacao.sala.id, acao, { quantidade, item: alvoB.item?.id, entidade: alvoB.entidade?.id, texto: texto || undefined }), situacao);
                }
            }

        } catch(err) {
            if(err instanceof APIError && err.status === 401) {
                termPrint("Você precisa fazer login.");
                jogoInfo = undefined;
                situacao = null;
                await fazerLogin();
                continue;
            }

            console.error(err);

            if(err instanceof ParserError) {
                termPrint(chalk.red(err.message));
                continue;
            }

            if(err instanceof APIError) {
                termPrint(chalk.red((err.json as any)?.message));
                if((err.json as any)?.ok === true) {
                    continue;
                }
            } else {
                termPrint(chalk.red("Erro:"), chalk.red((err as any)?.message));
            }
            
            // Pergunta se quer tentar novamente
            const tentarNovamente = (await prompt("\nQuer continuar? (S/N) ")).trim().toUpperCase();
            if(tentarNovamente !== "S" && tentarNovamente !== "SIM") {
                break;
            }
        }
    }
};