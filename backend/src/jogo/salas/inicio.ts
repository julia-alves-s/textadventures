import { SalaType } from "../contexto.ts";

export const salasInicio = {
    Inicio: {
        descricao: () => `Você está em um corredor do porão de uma casa antiga, 
        Ao leste há uma abertura na parede
        `,
        conexoes: {
            "L": () => "Caverna"
        }
    },
    Caverna: {
        descricao: () => `Você está em uma caverna escura,
        Há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?
        Ao sul há uma escada descendo na escuridão
        `,
        conexoes: {
            "O": () => "Inicio",
            "S": () => "Poço",
            "L": async (ctx) => {
                let objetos = await ctx.getMochila();
                if(objetos.length > 1) {
                    ctx.escrevaln("A ponte balança e você cai no Poço abaixo");
                    return "Poço";
                } else {
                    if(Math.random() > 0.5) {
                        ctx.escrevaln("A ponte balança e você cai no Poço abaixo");
                        return "Poço";
                    } else {
                        return "Tesouro";
                    }
                }
            },
        }
    },
    Poço: {
        descricao: () => "Este é um poço no fundo da caverna, acima há uma escada de cordas",
        conexoes: {
            "N": () => "Caverna"
        }
    },
    Tesouro: {
        descricao: () => "Você está em uma sala de pedra decorada com um baú fechado no centro",
        conexoes: {
            "O": () => "Caverna",
            "ABRIR": async (ctx) => {
                let objetos = await ctx.getItensNoChao();
                if(objetos.length >= 2) {
                    return "Ganhou";
                } else {
                    ctx.escrevaln("O baú está trancado, parece que precisa de uma chave");
                }
            }
        }
    },
    Ganhou: {
        descricao: () => "Você abre o baú e está cheio de moedas que "+
        "após uma análise minuciosa, você as identifica como fabricadas "+
        "por volta de 200 AC, com inscrições de Alexandre o Grande",
        conexoes: {
            "REINICIAR": () => "Inicio"
        }
    }
} satisfies Record<string, SalaType>;