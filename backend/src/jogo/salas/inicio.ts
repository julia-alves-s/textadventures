import { Abrivel, Trancavel } from "../componentes/componentes.ts";
import { Contexto } from "../contexto.ts";
import { EntidadeBase, type EntidadeInicial } from "../entidades/base.ts";
import { entidadesContainer } from "../entidades/container.ts";
import { EntidadePorta } from "../entidades/porta.ts";
import type { ItemBase } from "../itens/base.ts";
import { itensPadrao } from "../itens/inicio.ts";
import type { AcoesCallbackResult, ComponenteJogo } from "../objetoJogo.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { SalaBase, type ItemInicial } from "./base.ts";
import { BuracoNaParede } from "./clareira.ts";

class Quarto extends SalaBase {
    static nome = "Quarto";
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Lampiao, 
        quantidade: 1,
        estadoInicial: {
            luz: false,
            cargas: 5
        }
    }, {
        item: itensPadrao.Papel, 
        quantidade: 1,
        estadoInicial: {
            texto: "Segunda feira: Ninguém sabe que estou aqui, como eu vou fazer agora?"
        }
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Você está em um quarto simples sem janelas, na parede há vários riscos, há uma cama, uma mesa com um candelabro e uma porta ao sul";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "S": SalaInicio,
            "DORMIR": async () => {
                if(Math.random() < 0.25) {
                    return "Você deita na cama e dorme por um tempo, mas nada mudou quando acorda.";
                } else if(Math.random() < 0.25) {
                    return "Você deita na cama e tenta dormir, mas não consegue...";
                } else if(Math.random() < 0.25) {
                    return "Você tenta dormir, mas a falta de ventilação não ajuda...";
                } else if(Math.random() < 0.5) {
                    return "Você deita e dorme... **Zzzzzzz** corda... poço... chave... **Zzzzzzz**";
                } else {
                    ctx.escrevaln("Você deita e dorme... **Zzzzzzz**");
                    ctx.escrevaln("...");
                    ctx.escrevaln("Você sabia que você era sonâmbulo?");
                    return Labirinto9;
                }                
            }
        };
    }
}


export class PortaSaida extends EntidadeBase {
    static nome = "Porta Saida";
    static estadoInicial = (): Estado => ({ aberto: false, trancado: true });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        if(this.obterComponente(Abrivel).estaAberto()) {
            return "Uma porta aberta";
        } else {
            return "Uma porta fechada, talvez você possa abri-la.";
        }
    }

    componentes(): ComponenteJogo<any>[] {
        return [
            new Abrivel(this, {
                // Só dá para abrir/fechar uma porta destrancada
                aoAbrir: async (ctx) => { 
                    if(this.obterComponente(Trancavel).estaTrancado()) {
                        ctx.escrevaln("Você não consegue abrir a porta porque ela está trancada."); 
                        return false;
                    } else {
                        ctx.escrevaln("Você abre a porta."); 
                        return true;
                    }
                },
                aoFechar: async (ctx) => { ctx.escrevaln("Você fecha a porta."); return true },
            }),
            new Trancavel(this, {
                // Só dá para trancar/destrancar uma porta fechada
                estaAtivo: async (ctx) => { return !this.obterComponente(Abrivel).estaAberto(); },
            })
        ];
    }
}

export class SalaInicio extends SalaBase {
    static nome = "Inicio";
    static itensIniciais = (): ItemInicial[] => [{
        item: itensPadrao.Papel,
        quantidade: 5,
        estadoInicial: {
            texto: ""
        }
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: PortaSaida
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Você acorda em uma sala sem janelas (subsolo?), você não sabe porquê está aqui, ao norte há um quarto, Ao oeste há uma porta e ao leste uma passagem levando à escuridão";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Quarto,
            "O": async () => {
                const porta = this.obterEntidadePorNome(PortaSaida).at(0);
                if(!porta?.obterComponente(Abrivel).estaAberto()) {
                    return "A Porta está fechada";
                }
                await ctx.alterarEntidade(porta, { estado: { aberto: false, trancado: true }});
                await ctx.moverParaSala(BuracoNaParede);
                return "Você passa pela porta e um vento forte faz ela se fechar atrás de você. Parece que a porta trancou sozinha. \n Você sobre os degraus...";
            },
            "L": Labirinto1
        };
    }
}

class Labirinto extends SalaBase {
    descricao(ctx: Contexto) {
        return "Todos os lados há passagens, tudo igual, não há como saber onde está.";
    }
}

class Labirinto1 extends Labirinto {
    static nome = "Labirinto1";
    static estadoInicial = (): Estado => ({ luz: false });
    
    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "O": SalaInicio,
            "L": Labirinto2,
            "S": Labirinto4
        };
    }
}

class Labirinto2 extends Labirinto {
    static nome = "Labirinto2";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{
        item: itensPadrao.Papel, 
        quantidade: 1,
        estadoInicial: {
            texto: "Quarta feira: Eu lembro ter visto uma corda em algum lugar... Mas aqui é tudo igual"
        }
    }];

    acoes(ctx: Contexto) {
        return {
            "O": Labirinto1,
            "S": Labirinto5,
            "N": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto4
            }
        };
    }
}

class EntidadePoco extends EntidadeBase {
    static nome = "Poco";

    descricao(ctx: Contexto) {
        const corda = this.obterItensPorNome(itensPadrao.Corda).at(0);
        if(this.ehReferencia) {
            if(corda) {
                return "Um poço com uma corda descendo lá do alto, dá para subir por ela.";
            } else {
                return "Um poço, bem alto com paredes lisas, não há como subir.";
            }
        } else {
            if(corda) {
                return "Um poço no meio da caverna, há uma corda amarrada nele, dá para descer por ela.";
            } else {
                return "Um poço no meio da caverna";
            }
        }
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        const corda = this.obterItensPorNome(itensPadrao.Corda).at(0);
        if(this.ehReferencia) {
            return {
                "SUBIR": () => {
                    if(corda) {
                        ctx.escrevaln("Você sobe a corda e chega de volta na sala com o poço.");
                        return Labirinto3;
                    } else {
                        return "Você não tem como subir, não há nenhuma corda descendo até aqui.";
                    }
                }
            };
        } else {
            return {
                "OLHAR": () => {
                    const chave = ctx.jogador.obterItensPorNome(itensPadrao.Chave).at(0);
                    if(chave) {
                        ctx.moverItem(chave, { quantidade: 1, onde: null });
                        return "Você olha para dentro do poço e a chave que você tinha caiu lá dentro!";
                    }
                    return "Você olha para dentro do poço, é muito fundo, não dá para ver o fundo.";
                },
                "PULAR": () => {
                    return "Você não tem coragem de pular em um poço tão fundo.";
                },
                "DESCER": () => {
                    if(corda) {
                        ctx.escrevaln("Você desce a corda e chega ao fundo do poço.");
                        return SalaPoco;
                    } else {
                        return "Você não tem como descer, o poço é muito fundo. talvez com uma corda seria possível...";
                    }
                },
                ...(!corda ? {"AMARRAR": async () => {
                    const jogadorCorda = ctx.jogador.obterItensPorNome(itensPadrao.Corda).at(0);
                    if(jogadorCorda) {
                        await ctx.moverItem(jogadorCorda, { quantidade: 1, onde: this });
                        return "Você amarra a corda no poço, agora dá para descer por ele.";
                    } else {
                        return "Você não tem nenhuma corda para amarrar no poço.";
                    }
                }} : {}),
            };
        }
    }

    filhosVisiveis(): boolean {
        return !this.ehReferencia;
    }
}

class Labirinto3 extends Labirinto {
    static nome = "Labirinto3";
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePoco,
        nome: "Poco Labirinto"
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto): string {
        return "Você está em uma caverna, um pouco da luz do sol entra por uma abertura no alto, há um poço no meio da sala.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("A passagem dá algumas voltas e você acaba se perdendo...");
                return Labirinto9;
            },
            "S": Labirinto6
        };
    }
}

export class SalaPoco extends SalaBase {
    static nome = "Poco";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Moedas, 
        quantidade: 5
    },{ 
        item: itensPadrao.Chave, 
        quantidade: 1,
        estadoInicial: {
            abre: "Porta Saida"
        }
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePoco,
        ref: { sala: Labirinto3, nome: "Poco Labirinto" }
    }];

    descricao(ctx: Contexto) {
        return "Você está no fundo de um poço na caverna.";
    }
}

class Labirinto4 extends Labirinto {
    static nome = "Labirinto4";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Labirinto1,
            "O": () => {
                ctx.escrevaln("Você passa por uma passagem estreita cheia de curvas e no final tropeça e cai...");
                return Labirinto7
            },
            "L": Labirinto5
        };
    }
}

class Labirinto5 extends Labirinto {
    static nome = "Labirinto5";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Labirinto2,
            "O": Labirinto4,
            "L": Labirinto6,
            "SO": Labirinto7
        };
    }
}

class Labirinto6 extends Labirinto {
    static nome = "Labirinto6";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Labirinto3,
            "O": Labirinto5       
        };
    }
}

class Labirinto7 extends Labirinto {
    static nome = "Labirinto7";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Corda, 
        quantidade: 1
    }];

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("O caminho ficou muito estreito e não deu para passar...");
            },
            "NE": Labirinto5
        };
    }
}

class Labirinto8 extends Labirinto {
    static nome = "Labirinto8";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto5;
            },
            "O": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto7;
            },
            "L": Labirinto9
        };
    }
}

class Labirinto9 extends Labirinto {
    static nome = "Labirinto9";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{
        item: itensPadrao.Papel, 
        quantidade: 1,
        estadoInicial: {
            texto: "Terça feira: Quando eu fui olhar o poço, me inclinei demais e caiu a chave do meu bolso, que droga!"
        }
    }];

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto6;
            },
            "O": Labirinto8
        };
    }
}
const salasLabirinto = {Labirinto1, Labirinto2, Labirinto3, Labirinto4, Labirinto5, Labirinto6, Labirinto7, Labirinto8, Labirinto9};

/*
class Caverna extends SalaBase {
    static nome = "Caverna";
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        return "Você está no alto de uma caverna, bem alto uma abertura ilumina o local, cruzando um abismo há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "DESCER": Labirinto9,
            "L": () => {
                if(ctx.jogador.terminouTutorial()) {
                    return "A ponte está toda quebrada, não dá mais para atravessar.";
                }

                let pedras = ctx.jogador.obterItensPorNome(itensPadrao.Pedra).at(0);
                if(pedras && pedras.item.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const [nome, classeSala] = Object.entries(salasLabirinto)[Math.floor(Math.random() * 9)];
                    return classeSala;
                } else {
                    return Tesouro;
                }
            },
        };
    }
}

class BauTesouro extends entidadesContainer.Bau {
    static nome = "Bau Tesouro";
    static estadoInicial = () => ({ aberto: false });

    descricao(ctx: Contexto) {
        const pedras = this.onde.obterItensPorNome(itensPadrao.Pedra).at(0);
        const quantas = pedras?.item.quantidade || 0;
        const descrPedestal = quantas === 0 ? " sem nada neles" : quantas === 1 ? ", um deles tem uma pedra em cima" : quantas === 2 ? ", cada uma com uma pedra" : ", mas parece que tem pedras demais aqui";
        if(this.estaAberto()) {
            return `Grande baú aberto no centro da sala. há dois pedestais em cada lado do baú${descrPedestal}.`;
        } else {
            return `Grande baú fechado no centro da sala, há dois pedestais em cada lado do baú${descrPedestal}.`;
        }
    }
    
    acoes(ctx: Contexto): AcoesCallbackResult {
        const pedras = this.onde.obterItensPorNome(itensPadrao.Pedra).at(0);
        if(this.estaAberto()) {
            return {
                "FECHAR": async () => {
                    if(!pedras || pedras.item.quantidade !== 2) {
                        return "Você não consegue alcançar o baú para fechá-lo.";
                    }
                    
                    ctx.escrevaln("Você sobe nas pedras e fecha o baú.");
                    await this.fechar(ctx);
                }
            };
        } else {
            return {
                "ABRIR": async () => {
                    if(!pedras) {
                        return "O baú está muito alto, você não consegue alcançá-lo, se tivesse algo para subir...";
                    } else if(pedras.item.quantidade === 1) {
                        return "Você sobe na pedra mas ainda não alcança o baú.";
                    } else if (pedras.item.quantidade > 2) {
                        return "Parece que tem pedras demais aqui, nem consegue ver o baú direito.";
                    }
                    
                    ctx.escrevaln("Você sobe nas pedras e alcança o baú, abrindo-o com facilidade.");
                    ctx.escrevaln("Depois de todo esse esforço você fica até com sono...");
                    await this.abrir(ctx);
                }
            };
        }
    }

    getFilhosVisiveis(): { itens: ItemBase[]; filhos: EntidadeBase[]; } {
        const pedras = this.onde.obterItensPorNome(itensPadrao.Pedra).at(0);
        const quantas = pedras?.item.quantidade || 0;
        if(quantas === 2) {
            return super.getFilhosVisiveis();
        } else {
            return { itens: [], filhos: [] };
        }
    }
}

class Tesouro extends SalaBase {
    static nome = "Tesouro";
    static estadoInicial = (): Estado => ({ luz: false });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: BauTesouro,
        estadoInicial: { aberto: false },
        itensIniciais: [{
            item: itensPadrao.Moedas,
            quantidade: 100
        }]
    }]

    descricao(ctx: Contexto) {
        return "Você está em uma sala de pedra decorada";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "O": () => {
                let pedras = ctx.jogador.obterItensPorNome(itensPadrao.Pedra).at(0);
                if(pedras && pedras.item.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const [nome, classeSala] = Object.entries(salasLabirinto)[Math.floor(Math.random() * 9)];
                    return classeSala;
                } else {
                    return Caverna;
                }
            }
        };
    }
}*/

export const salaasInicio = {
    Quarto,
    SalaInicio,
    SalaPoco,
    //Caverna,
    //Tesouro,
    ...salasLabirinto
};

export const entidadesInicio = {
    //BauTesouro,
    PortaSaida,
    EntidadePoco,
};