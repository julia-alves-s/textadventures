import type { SalaInfo } from "../types.ts";
import { Contexto } from "../contexto.ts";

export const salasInicio = {
    Quarto: {
        descricao: (ctx: Contexto) => {
            ctx.escrevaln("Você está em um quarto simples sem janelas, na parede há vários riscos 一 二 三, há uma cama, uma mesa com um candelabro e uma porta ao sul");
        },
        conexoes: {
            "S": "Inicio",
            "DORMIR": (ctx: Contexto) => {
                ctx.escrevaln("Você deita na cama e dorme por um tempo, mas nada mudou quando acorda.");
            },
            "ACENDER": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ lampiao ] = objetos.filter((o) => o.nome === "Lampiao");
                if(!lampiao) {
                    ctx.escrevaln("Você não tem nada para acender aqui.");
                    return;
                }

                if(lampiao.estado?.luz) {
                    ctx.escrevaln("O lampião já está aceso.");
                    return;
                }

                await ctx.moverItem(lampiao, { ondeId: lampiao.ondeId, quantidade: 1, estado: { luz: true } });
                ctx.escrevaln("Você acende o lampião.");
            }
        },
        itensIniciais: [{
            nome: "Papel",
            quantidade: 1,
            estadoInicial: {
                texto: "??/??/????: Quantos dias estou aqui? Lembrar: O que tem do outro lado daquela ponte de cordas?"
            }
        },{
            nome: "Papel",
            quantidade: 5,
            estadoInicial: {
                texto: ""
            }
        }],
        
        estadoInicial: {
            luz: true
        }
    },
    Inicio: {
        descricao: async (ctx: Contexto) => {
            ctx.escrevaln("Você acorda em uma sala sem janelas (subsolo?), você não sabe porquê está aqui, ao norte há um quarto, Ao leste há uma passagem");
        },
        conexoes: {
            "L": "Labirinto1",
            "N": "Quarto"
        },
        itensIniciais: [{
            nome: "Lampiao",
            quantidade: 1,
            estadoInicial: {
                luz: false
            }
        }],
        estadoInicial: {
            luz: true
        }
    },
    Labirinto1: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "O": "Inicio",
            "L": "Labirinto2",
            "S": "Labirinto4"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto2: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "O": "Labirinto1",
            "S": "Labirinto5",
            "N": "Labirinto4"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto3: {
        descricao: async (ctx: Contexto) => {
            ctx.escrevaln("Você está em uma caverna, um pouco da luz do sol entra por uma abertura no alto, você vê uma ponte de cordas cruzando por cima de você, há um poço no meio da sala.");
        },
        conexoes: {
            "N": "Labirinto3",
            "S": "Labirinto6",
            "DESCER": async (ctx: Contexto) => {
                let objetos = await ctx.getItensNoChao();
                const [ corda ] = objetos.filter((o) => o.nome === "Corda");
                if(corda) {
                    ctx.escrevaln("Você desce a corda e chega ao fundo do poço");
                    await ctx.moverParaSala("Poço");
                } else {
                    ctx.escrevaln("Você não tem como descer, não há nenhuma corda aqui");
                }
            }
        },
        estadoInicial: {
            luz: true
        }
    },
    Labirinto4: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto1",
            "O": "Labirinto7",
            "L": "Labirinto5"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto5: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto2",
            "O": "Labirinto4",
            "L": "Labirinto6"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto6: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto3",
            "O": "Labirinto5"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto7: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto7",
            "O": "Labirinto4",
            "L": "Labirinto8"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto8: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto5",
            "O": "Labirinto7",
            "L": "Labirinto9"
        },
        estadoInicial: {
            luz: false
        },
        itensIniciais: [{
            nome: "Corda",
            quantidade: 1
        }]
    },
    Labirinto9: {
        descricao: () => "Todos os lados há passagens, tudo igual, pela parede há degraus que levam para parte de cima da caverna.",
        conexoes: {
            "N": "Labirinto6",
            "O": "Labirinto8",
            "SUBIR": "Caverna"
        },
        estadoInicial: {
            luz: false
        }
    },
    Poço: {
        descricao: () => "Este é um poço no fundo da caverna.",
        conexoes: {
            "SUBIR": async (ctx: Contexto) => {
                let objetos = await ctx.getItensNoChao("Labirinto3");
                const [ corda ] = objetos.filter((o) => o.nome === "Corda");
                if(corda) {
                    ctx.escrevaln("Você sobe a corda e chega de volta na sala com o poço");
                    await ctx.moverParaSala("Labirinto3");
                } else {
                    ctx.escrevaln("Você não tem como subir, não há nenhuma corda descendo até aqui");
                }
            }
        },
        itensIniciais: [{
            nome: "Pedra",
            quantidade: 5
        }],
        estadoInicial: {
            luz: false
        }
    },
    Caverna: {
        descricao: () => "Você está no alto de uma caverna, bem alto uma abertura ilumina o local, cruzando um abismo há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?",
        conexoes: {
            "DESCER": "Labirinto9",
            "L": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(pedras && pedras.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const qual = Math.floor(Math.random() * 9) + 1;
                    await ctx.moverParaSala(`Labirinto${qual}` as any);
                } else {
                    await ctx.moverParaSala("Tesouro");
                }
            },
        },
        estadoInicial: {
            luz: true
        }
    },
    Tesouro: {
        descricao: async (ctx: Contexto, info: SalaInfo) => {
            if(info.estado?.bauAberto) {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú aberto no centro, sem nada dentro");
            } else {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú fechado no centro");
            }
        },
        conexoes: {
            "O": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(pedras && pedras.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const qual = Math.floor(Math.random() * 9) + 1;
                    await ctx.moverParaSala(`Labirinto${qual}` as any);
                } else {
                    await ctx.moverParaSala("Caverna");
                }
            },
            "ABRIR": async (ctx: Contexto, info: SalaInfo) => {
                if(info.estado?.bauAberto) {
                    ctx.escrevaln("O baú já está aberto, sem nada dentro");
                    return;
                }

                let objetos = await ctx.getItensNoChao();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(!pedras) {
                    ctx.escrevaln("O baú está muito alto, você não consegue alcançá-lo, se tivesse algo para subir...");
                    return;
                }

                if(pedras.quantidade === 2) {
                    ctx.escrevaln("Você sobe nas pedras e alcança o baú, abrindo-o com facilidade");
                    ctx.escrevaln("Você abre o baú e está cheio de moedas que "+
                        "após uma análise minuciosa, você as identifica como fabricadas "+
                        "por volta de 200 AC, com inscrições de Alexandre o Grande"
                    );
                    
                    await ctx.criarItem({ nome: "Moedas", quantidade: 100, ondeId: ctx.jogador.id });
                    await ctx.alterarEstadoSala({ bauAberto: true });
                } else if (pedras.quantidade > 2) {
                    ctx.escrevaln("Parece que tem pedras demais aqui, nem consegue ver o baú direito");
                } else {
                    ctx.escrevaln("Você sobe na pedra mas ainda não alcança o baú");
                }
            },
            "FECHAR": async (ctx: Contexto, info: SalaInfo) => {
                if(!info.estado?.bauAberto) {
                    ctx.escrevaln("O baú já está fechado");
                    return;
                }

                let objetos = await ctx.getItensNoChao();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(!pedras || pedras.quantidade !== 2) {
                    ctx.escrevaln("Você não consegue alcançar o baú para fechá-lo");
                    return;
                }

                ctx.escrevaln("Você sobe nas pedras e fecha o baú, mas aí você escorrega e as pedras caem em um poço");
                await ctx.alterarEstadoSala({ bauAberto: false });
                await ctx.moverItem(pedras, { quantidade: 2, ondeId: null });
            }
        },
        estadoInicial: {
            bauAberto: false,
            luz: false
        }
    },
} as const;