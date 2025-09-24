import type { Contexto } from "../contexto.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "../salas/base.ts";
import { ItemBase } from "./base.ts";

class Pedra extends ItemBase {
    static nome = "Pedra";
    descricao(ctx: Contexto) {
        return "Pedra comum, redonda e cinza.";
    }
}
class Moedas extends ItemBase {
    static nome = "Moedas";
    descricao(ctx: Contexto) {
        return "Moedas antigas, parecem ser de ouro maciço.";
    }
}
class Corda extends ItemBase {
    static nome = "Corda";
    descricao(ctx: Contexto) {
        return "Corda resistente, parece que aguenta bastante peso.";
    }
}
class Chave extends ItemBase {
    static nome = "Chave";
    descricao(ctx: Contexto) {
        return "Chave, o que será que ela abre?";
    }
}
class Lampiao extends ItemBase {
    static nome = "Lampiao";
    static estadoInicial = () => ({ luz: false });

    descricao(ctx: Contexto) {
        if(this.item.estado?.luz) {
            return "Lampião antigo (aceso)";
        } else {
            return "Lampião antigo (apagado)";
        }
    }
    acoes(ctx: Contexto): AcoesCallbackResult {
        const item = this.item;
        const acoes: AcoesCallbackResult = {};
        if(item.estado?.luz) {
            acoes["APAGAR"] = async () => {
                await ctx.moverItem(this, { onde: this.onde, quantidade: 1, estado: { luz: false } });
                return "Você apaga o lampião.";
            }
        } else {
            acoes["ACENDER"] = async () => {
                await ctx.moverItem(this, { onde: this.onde, quantidade: 1, estado: { luz: true } });
                return "Você acende o lampião.";
            }
        }

        return acoes;
    }
}
class Papel extends ItemBase {
    static nome = "Papel";
    static estadoInicial = () => ({ texto: "" });

    descricao(ctx: Contexto) {
        const estado = this.item.estado || {};
        if(estado?.texto && typeof estado.texto === "string") {
            if(estado.texto.length > 32)
                return "Pedaço de papel, escrito: "+estado.texto.substring(0,32)+"...";
            else
                return "Pedaço de papel, escrito: "+estado.texto+"";
        } else {
            return "Pedaço de papel em branco."
        }
    }
    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        const item = this.item;
        return {
            "LER": () => {
                if(item.estado?.texto && typeof item.estado.texto === "string") {
                    return "No papel está escrito: \n" + item.estado.texto;
                } else {
                    return "O papel está em branco.";
                }
            },
            "ESCREVER": async () => {
                let txt = "";
                if(extra?.texto && typeof extra.texto === "string") {
                    txt = extra.texto.replaceAll(/[^\x20-\x7E]+/g,"").substring(0,1024);
                }

                await ctx.moverItem(this, { onde: this.onde, quantidade: 1, estado: { texto: txt } });
                if(txt) {
                    return "Você escreve no papel.";
                } else {
                    return "Você apaga o papel.";
                }
            }
        };
    }
}
class Machado extends ItemBase {
    static nome = "Machado"
    descricao(ctx: Contexto) {
        return "Um machado afiado.";
    }
}
class Tronco extends ItemBase {
    static nome = "Tronco Madeira"
    descricao(ctx: Contexto) {
        return "Tronco de madeira.";
    }
}

class Balde extends ItemBase {
    static nome = "Balde";
    static estadoInicial = () => ({ agua: false });
    descricao(ctx: Contexto) {
        if(this.item.estado?.agua) {
            return "Balde cheio de água.";
        } else {
            return "Balde vazio.";
        }
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        const item = this.item;
        const acoes: AcoesCallbackResult = {};
        if(!this.estaNaMochila(ctx)) {
            return acoes;
        }

        if(item.estado?.agua) {
            acoes["ESVAZIAR"] = async () => {
                await ctx.moverItem(this, { onde: this.onde, quantidade: 1, estado: { agua: false } });
                return "Você esvazia o balde.";
            }
        } else {
            acoes["ENCHER"] = async () => {
                if(ctx.sala.sala.estado?.agua !== true) {
                    return "Aqui não há água para encher o balde.";
                }
                await ctx.moverItem(this, { onde: this.onde, quantidade: 1, estado: { agua: true } });
                return "Você enche o balde com água.";
            }
        }

        return acoes;
    }
}

export const itensPadrao = {
    Pedra,
    Moedas,
    Lampiao,
    Chave,
    Corda,
    Papel,
    Machado,
    Tronco,
    Balde
};