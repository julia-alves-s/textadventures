import { Contexto } from "../contexto.ts";

export const salasInicio = {
    Inicio: {
        descricao: () => `Você está em um corredor do porão de uma casa antiga, 
        Ao leste há uma abertura na parede, e para cima tem uma escada com um alçapão que leva para fora
        `,
        conexoes: {
            "L": () => "Caverna" as const,
            "SUBIR": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ moedas ] = objetos.filter((o) => o.nome === "Moedas");
                if(moedas && moedas.quantidade > 0) {
                    await ctx.moverItem(moedas, { quantidade: moedas.quantidade, ondeId: null });
                    ctx.escrevaln("Você sobe a escada e abre o alçapão... 'EI! onde você pegou essas moedas?' **PUFT!**");
                    ctx.escrevaln("...");
                    ctx.escrevaln("Onde eu estou? você não lembra porque está nesse porão.");
                } else {
                    ctx.escrevaln("Você sobe a escada e bate no alçapão... mas ele está trancado.");
                }
            }
        },
        itensIniciais: [{
            nome: "Pedra",
            quantidade: 1
        }]
    },
    Caverna: {
        descricao: () => `Você está em uma caverna escura,
        Há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?
        Ao sul há uma escada descendo na escuridão
        `,
        conexoes: {
            "O": () => "Inicio" as const,
            "S": () => "Poço" as const,
            "L": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(pedras && pedras.quantidade > 1) {
                    ctx.escrevaln("A ponte balança e você cai no Poço abaixo");
                    await ctx.moverParaSala("Poço");
                } else {
                    if(Math.random() > 0.5) {
                        ctx.escrevaln("A ponte balança e você cai no Poço abaixo");
                        await ctx.moverParaSala("Poço");
                    } else {
                        await ctx.moverParaSala("Tesouro");
                    }
                }
            },
        }
    },
    Poço: {
        descricao: () => "Este é um poço no fundo da caverna, acima há uma escada de cordas",
        conexoes: {
            "N": () => "Caverna" as const
        },
        itensIniciais: [{
            nome: "Pedra",
            quantidade: 100
        }]
    },
    Tesouro: {
        descricao: async (ctx: Contexto) => {
            const estado = (await ctx.getSala()).estado;
            if(estado.bauAberto) {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú aberto no centro, sem nada dentro");
            } else {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú fechado no centro");
            }
        },
        conexoes: {
            "O": () => "Caverna" as const,
            "ABRIR": async (ctx: Contexto) => {
                const estado = (await ctx.getSala()).estado;
                if(estado.bauAberto) {
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
            "FECHAR": async (ctx: Contexto) => {
                const estado = (await ctx.getSala()).estado;
                if(!estado.bauAberto) {
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
            bauAberto: false
        }
    },
} as const;