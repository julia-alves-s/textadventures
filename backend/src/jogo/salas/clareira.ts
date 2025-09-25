import type { Contexto } from "../contexto.ts";
import { EntidadeArvore } from "../entidades/arvore.ts";
import { EntidadeBase, type EntidadeInicial } from "../entidades/base.ts";
import { entidadesContainer } from "../entidades/container.ts";
import { EntidadeNPC } from "../entidades/jogador.ts";
import type { ItemBase } from "../itens/base.ts";
import { itensPadrao } from "../itens/inicio.ts";
import type { Estado } from "../types.ts";
import { SalaBase, type AcaoExtraPopulado, type AcoesCallbackResult, type ItemInicial } from "./base.ts";
import { entidadesInicio, PortaSaida, SalaInicio } from "./inicio.ts"; // Supondo que 'inicio.ts' exporta a classe 'Inicio'

class EntidadePlaca extends EntidadeBase {
    static nome = "Placa";

    descricao(ctx: Contexto) {
        return "Uma placa de madeira simples fincada na beira da estrada.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "LER": () => {
                return "A placa aponta para o norte e tem a palavra 'CIDADE' entalhada";
            }
        };
    }
}

export class BuracoNaParede extends SalaBase {
    static nome = "BuracoNaParede";
    static estadoInicial = () => ({ luz: true });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: PortaSaida,
        ref: { sala: SalaInicio, nome: "PortaSaida" }
    },{
        entidade: entidadesContainer.Bau,
    }];
    static itensIniciais = (): ItemInicial[] => [{
        item: itensPadrao.Balde,
        quantidade: 1
    }];
    
    descricao(ctx: Contexto) {
        return "Você está dentro de uma pequena cabana, há uma escadaria descendo levando até uma porta. pela janela você vê a luz do dia.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "DESCER": () => {
                const porta = this.obterEntidadePorNome(PortaSaida).at(0);
                if(!porta?.estaAberto()) {
                    return "A Porta está fechada";
                }
                return SalaInicio;
            },
            "SAIR": Clareira
        };
    }
}

class Clareira extends SalaBase {
    static nome = "Clareira";
    static estadoInicial = () => ({ luz: true });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadeArvore,
    }];

    descricao(ctx: Contexto) {
        return "Você sai em uma clareira, cercada por árvores altas. no centro da clareira há uma pequena cabana";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "ENTRAR": BuracoNaParede,
            "L": Estrada,
            "O": MargemDoRio,
            "N": MargemDoRio,
            "S": EstradaSul
        };
    }
}

class MargemDoRio extends SalaBase {
    static nome = "MargemDoRio";
    static estadoInicial = () => ({ luz: true, agua: true });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Pedra, 
        quantidade: 3
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadeArvore,
    }];

    descricao(ctx: Contexto) {
        return "Você chega à margem de um rio largo e de correnteza forte. A água corre rápida demais para tentar atravessar a nado e não há pontes à vista. O único caminho é voltar para a clareira.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "S": Clareira,
            "L": EstradaNorte,
        };
    }
}

class EstradaNorte extends SalaBase {
    static nome = "EstradaNorte";
    static estadoInicial = () => ({ luz: true, agua: true });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: Ladrao
    }];

    descricao(ctx: Contexto) {
        return "Você está em uma estrada que termina no rio ao norte. Aqui tinha uma ponte, mas agora está destruída.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "O": MargemDoRio,
            "S": Estrada,
            "N": () => {
                return "A estrada termina no rio. Não dá para passar.";
            }
        };
    }
}


class Estrada extends SalaBase {
    static nome = "Estrada";
    static estadoInicial = () => ({ luz: true });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Pedra, 
        quantidade: 1
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePlaca
    }];

    descricao(ctx: Contexto) {
        return "Você está em uma estrada de terra batida que se estende para o sul. Uma placa de madeira está fincada na beira do caminho.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "O": Clareira,
            "S": EstradaSul,
            "N": EstradaNorte
        };
    }
}

class EstradaSul extends SalaBase {
    static nome = "EstradaSul";
    static estadoInicial = () => ({ luz: true });

    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadeArvore,
    }];

    descricao(ctx: Contexto) {
        return "Você está em uma estrada que leva para o sul, aqui a floresta começa a ficar mais densa.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Estrada,
            "L": AreaLenhador,
            "S": () => {
                const quantasArvores = this.obterEntidadePorNome(EntidadeArvore).filter(a => a.estaCrescida()).length;
                if(quantasArvores > 0) {
                    return "A floresta é densa demais, não dá para passar.";
                } else {
                    ctx.escrevaln("Você consegue passar pela floresta, mas é difícil.");
                    return Floresta1;
                }
            },
        };
    }
}

class Floresta1 extends SalaBase {
    static nome = "Floresta1"
    static estadoInicial = () => ({ luz: true });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadeArvore,
    },{
        entidade: EntidadeArvore,
    }];

    descricao(ctx: Contexto) {
        return "Você está em uma densa floresta, as árvores são altas e a luz do sol mal consegue passar pelas folhas.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": EstradaSul,
            "L": () => "A floresta é densa demais, não dá para passar.",
            "O": () => "A floresta é densa demais, não dá para passar.",
            "S": () => {
                const quantasArvores = this.obterEntidadePorNome(EntidadeArvore).filter(a => a.estaCrescida()).length;
                if(quantasArvores > 0) {
                    return "A floresta é densa demais, não dá para passar.";
                } else {
                    if(!ctx.jogador.temLuz()) {
                        return "Está escuro demais na floresta, você fica com medo.";
                    }
                    ctx.escrevaln("Você consegue passar pela floresta, mas é difícil.");
                    return Floresta2;
                }
            },
        };
    }
}

class Floresta2 extends SalaBase {
    static nome = "Floresta2"
    static estadoInicial = () => ({ luz: false });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadeArvore,
    },{
        entidade: EntidadeArvore,
    },{
        entidade: EntidadeArvore,
    }];

    descricao(ctx: Contexto) {
        return "Você está em uma densa floresta, as árvores são altas, ficou escuro de tão fechada que é a mata.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        const quantasArvores = this.obterEntidadePorNome(EntidadeArvore).filter(a => a.estaCrescida()).length;
        return {
            "N": () => {
                if(quantasArvores > 0) {
                    return "A floresta é densa demais, não dá para passar. Talvez se você cortar algumas árvores...";
                } else {
                    ctx.escrevaln("Você anda mais um pouco a acaba andando em círculos...");
                    return Floresta1;
                }                
            },
            "L": () => "A floresta é densa demais, não dá para passar.",
            "O": () => "A floresta é densa demais, não dá para passar.",
            "S": () => "A floresta é densa demais, não dá para passar.",
        };
    }
}

class Lenhador extends EntidadeNPC {
    static nome = "Lenhador";
    static estadoInicial = (): Estado => ({ 
        tomouAguaEm: null
    });

    estaComSede() {
        const tomouAguaEm = this.entidade.estado?.tomouAguaEm;
        if(!tomouAguaEm || typeof tomouAguaEm !== "number") return -1;

        return (Date.now() - tomouAguaEm) > 1000 * 60 * 60; // 1 hora
    }
    
    descricao(ctx: Contexto) {
        return `Sentado em um toco de árvore, um senhor de idade está descansando.${this.estaComSede() ? " Ele parece um pouco abatido" : ""}`;
    }

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        const acoes: AcoesCallbackResult = {};
        const troncosPossui = this.obterItensPorNome(itensPadrao.Tronco).at(0);

        if(this.estaComSede()) {
            acoes["OI"] = () => {
                return "O lenhador diz: 'Olá! ahhh como eu estou cansado... você poderia me trazer um pouco de água?'";
            };
            acoes["DAR"] = async () => {
                const item = extra?.item;
                if(!item || item.item.estado?.agua !== true) {
                    return "Ele não quer isso, só água.";
                }

                await ctx.moverItem(item, { onde: null, quantidade: 1 });
                // Reseta o Nº de troncos
                if(troncosPossui)
                await ctx.moverItem(troncosPossui, { onde: null, quantidade: troncosPossui?.item.quantidade || 0 });
                await ctx.alterarEntidade(this, { estado: { tomouAguaEm: Date.now() } });
                return "Você entrega a água para o lenhador. Ele bebe com gratidão e parece revigorado.";
            };
        } else {
            const tronco = ctx.jogador.obterItensPorNome(itensPadrao.Tronco);
            acoes["OI"] = () => {
                const sorteio = Math.floor(Math.random() * 10);
                switch(sorteio) {
                    case 0: return "O lenhador diz: 'Você gostaria de trabalhar? eu pago 5 moedas por tronco que me trouxer. Pode pegar aquele machado ali.'";
                    case 1: return "O lenhador diz: 'Cuidado com ladrões ao andar pela estrada...'";
                    case 2: return "O lenhador diz: 'Ao sul a floresta fica tão densa que fica tão escuro como a noite.'";
                    case 3: return "O lenhador diz: 'Algumas árvores rendem mais troncos que outras.'";
                    case 5: return "O lenhador diz: 'Desde que a ponte caiu, o movimento por aqui diminuiu muito.'";
                    case 6: return "O lenhador diz: 'Nunca ande pela floresta sem um machado, pode ser que você precise cortar para abrir caminho.'";
                    case 7: return "O lenhador diz: 'Às vezes eu vejo um ladrão rondando pela estrada...'";
                    case 8: return "O lenhador diz: 'Oi.'";
                    default: return "O lenhador não te responde.";
                }
            };
            if(tronco.length > 0) {
                acoes["VENDER"] = async () => {
                    const item = extra?.item || tronco.at(0);
                    if(!item || item.item.nome !== itensPadrao.Tronco.nome) {
                        return "O lenhador só está interessado em troncos de madeira.";
                    }
                    if(!item.estaNaMochila(ctx)) {
                        return "Isso não está com você.";
                    }
                    if(troncosPossui && troncosPossui.item.quantidade >= 50) {
                        return "O lenhador já tem troncos demais, ele não pode comprar mais.";
                    }

                    const quantidade = extra?.quantidade || item.item.quantidade;
                    if(quantidade > item.item.quantidade) {
                        return `Você só tem ${item.item.quantidade} tronco(s).`;
                    }
                    const valor = quantidade * 5; // 5 moedas por tronco
                    await ctx.moverItem(item, { onde: this, quantidade });
                    await ctx.criarItem({ item: itensPadrao.Moedas, quantidade: valor, onde: ctx.jogador });
                    return `Você entrega ${quantidade} tronco(s) para o lenhador. Ele lhe paga com ${valor} moedas.`;
                };
            }
        }

        return acoes;
    }

    getFilhosVisiveis(): { itens: ItemBase[]; filhos: EntidadeBase[]; } {
        return { itens: [], filhos: [] };
    }
}

class AreaLenhador extends SalaBase {
    static nome = "AreaLenhador"
    static estadoInicial = () => ({ luz: true });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadeArvore,
        estadoInicial: {
            cortadaEm: new Date("3000-01-01").getTime()
        }
    },{
        entidade: EntidadeArvore,
        estadoInicial: {
            cortadaEm: new Date("3000-01-01").getTime()
        }
    },{
        entidade: Lenhador
    }];
    static itensIniciais = (): ItemInicial[] => [{
        item: itensPadrao.Machado,
        quantidade: 1
    }];

    descricao(ctx: Contexto) {
        const quantosTroncosVendidos = this.obterEntidadePorNome(Lenhador).at(0)?.obterItensPorNome(itensPadrao.Tronco).at(0)?.item.quantidade || 0;
        ctx.escrevaln("Você está em uma área onde há vários tocos de árvores cortadas. A floresta ao redor é densa e cheia de árvores altas.");

        if(quantosTroncosVendidos > 0 && quantosTroncosVendidos < 10) {
            ctx.escrevaln(`Há uma pilha com alguns tronco(s) de madeira.`);
        } else if(quantosTroncosVendidos < 50) {
            ctx.escrevaln(`Há uma grande pilha com muitos tronco(s) de madeira.`);
        } else {
            ctx.escrevaln(`Há várias pilhas com uma enorme quantidade de tronco(s) de madeira.`);
        }
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Estrada,
            "L": () => "A floresta é densa demais, não dá para passar.",
            "O": EstradaSul,
            "S": Floresta1,
        };
    }
}

class Ladrao extends EntidadeNPC {
    static nome = "Ladrao";
    static estadoInicial = (): Estado => ({ 
        roubouEm: null,
        roubouDe: null
    });

    iraRoubar(username: string) {
        const roubouEm = Number(this.entidade.estado?.roubouEm) || 0;

        return Math.random() < 0.5 && // 50% de chance
        (username !== this.entidade.estado?.roubouDe || (Date.now() - roubouEm) > 1000 * 60 * 60) && // Não roubou dessa pessoa na última hora
        (Date.now() - roubouEm) > 1000 * 60 * 5; // passou já 5 minutos desde a última vez que roubou (qualquer um)
    }

    descricao(ctx: Contexto) {
        return "Um ladrão suspeito está rondando a área, parecendo procurar por algo para roubar.";
    }

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        return {
            "$ACAO_ANTES": async () => {
                const moedas = ctx.jogador.obterItensPorNome(itensPadrao.Moedas).at(0);
                const possiveisDestinos = [Estrada, EstradaNorte, EstradaSul, Floresta1]
                    .filter(s => s.nome !== (this.onde as SalaBase)?.sala.nome);
                const proximoDestino = possiveisDestinos.at(Math.floor(Math.random() * possiveisDestinos.length)) || Estrada;

                if(!this.iraRoubar(ctx.jogador.entidade.username!)) {
                    ctx.escrevaln("O ladrão foi embora.");
                    await ctx.alterarEntidade(this, { 
                        onde: proximoDestino
                    });
                    return;
                }

                ctx.escreva("O ladrão se aproxima...");
                if(moedas) {
                    await ctx.moverItem(moedas, { onde: this, quantidade: moedas.item.quantidade });
                    
                    ctx.escrevaln(" ele vê que você tem moedas e rapidamente as rouba de você. Você se pergunta porque não as guardou em algum lugar seguro...");
                } else {
                    const itemQualquer = ctx.jogador.itens.at(0);
                    if(itemQualquer) {
                        await ctx.moverItem(itemQualquer, { onde: this, quantidade: itemQualquer.item.quantidade });
                        ctx.escrevaln(` ele vê que você não tem moedas, mas rouba seu ${itemQualquer.item.nome}.`);
                    } else {
                        const itemPresente = this.itens.filter(i => i.item.nome !== itensPadrao.Moedas.nome).at(0);
                        if(itemPresente && Math.random() < 0.10) { // 10% de chance de te dar algo
                            await ctx.moverItem(itemPresente, { onde: ctx.jogador, quantidade: 1 });
                            ctx.escrevaln(` vendo o quão miserável você é, decide lhe dar um ${itemPresente.item.nome} (Que roubou de alguém) antes de ir embora.`);
                        } else {
                            ctx.escrevaln(" ele olha para você, mas vê que você não tem nada de valor.");
                        }
                    }
                }

                await ctx.alterarEntidade(this, { 
                    onde: proximoDestino,
                    estado: {
                        roubouEm: Date.now(),
                        roubouDe: ctx.jogador.entidade.username!
                    }
                });                
            },
            "OI": () => {
                return "O ladrão olha para você desconfiado e não responde.";
            }
        };
    }

    getFilhosVisiveis(): { itens: ItemBase[]; filhos: EntidadeBase[]; } {
        return { itens: [], filhos: [] };
    }
}

// Exporta as novas salas e entidades para serem usadas no jogo
export const salasClareira = {
    BuracoNaParede,
    Clareira,
    MargemDoRio,
    EstradaNorte,
    Estrada,
    EstradaSul,
    AreaLenhador,
    Floresta1,
    Floresta2,
};

export const entidadesClareira = {
    EntidadePlaca,
    Lenhador,
    Ladrao
};