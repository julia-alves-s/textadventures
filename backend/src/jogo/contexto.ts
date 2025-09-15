// Contexto do jogo a ser usado nas funções das salas e comandos
import { Entidade } from "../db/entidadeSchema.ts";
import { Estado } from "../db/estadoSchema.ts";
import { Item } from "../db/itemSchema.ts";
import { Sala } from "../db/salaSchema.ts";
import { entidadeRepository } from "../repositories/entidadeRepository.ts";
import { itemRepository } from "../repositories/itemRepository.ts";
import { salaRepository } from "../repositories/salaRepository.ts";
import { getSalaConfig } from "./salas/salas.ts";

export type SalaType = {
    descricao: (ctx: Contexto) => undefined | string | Promise<string | undefined>;
    conexoes: { 
        [direcao: string]: (ctx: Contexto) => undefined | string | Promise<string | undefined>;
    };
    estadoInicial?: Estado;
};

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    jogador: Entidade;
    private _salvarJogador: boolean = false;

    mochila: Item[] | null = null;
    async getMochila() {
        if(this.mochila) return this.mochila;

        this.mochila = await itemRepository.naMochila(this.jogador.id);
        return this.mochila;
    }

    itensNoChao: Item[] | null = null;
    async getItensNoChao() {
        if(this.itensNoChao) return this.itensNoChao;

        const sala = await this.getSala();
        this.itensNoChao = await itemRepository.noChao(sala.id);
        return this.itensNoChao;
    }

    global: Sala;
    private _salvarGlobal: boolean = false;

    sala: Sala | null;
    private _salvarSala: boolean = false;
    async getSala() {
        if(this.sala) return this.sala;
        
        this.sala = await salaRepository.getSalaById(this.jogador.salaId);
        if (!this.sala) {
            throw new Error("Sala para onde o jogador tentou ir não existe!");
        }

        return this.sala;
    }

    private str: string;

    constructor({ jogador, sala, global, itensNoChao }: {
        jogador: Entidade,
        sala: Sala | null,
        global: Sala,
        itensNoChao: Item[] | null
    }) {
        this.jogador = jogador;
        this.global = global;
        this.sala = sala;
        this.str = "";
        this.itensNoChao = itensNoChao;
    }
    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    moverParaSala(novaSalaId: string) {
        this.jogador.salaId = novaSalaId;
        this._salvarJogador = true;

        if(this.sala && this._salvarSala) {
            throw new Error("Deve salvar antes!");
        }
        this.sala = null; // Forçar recarregar a sala
        this._salvarSala = false;
    }

    async moverItem(item: Item, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
        await itemRepository.moverItem(item.id, onde);

        this.mochila = null;
        this.itensNoChao = null;
    }

    async salvar() {
        if(this._salvarJogador) {
            await entidadeRepository.atualizar(this.jogador.id, { 
                salaId: this.jogador.salaId,
                estado: this.jogador.estado
            });
            this._salvarJogador = false;
        }

        if(this._salvarSala && this.sala) {
            await salaRepository.atualizar(this.sala.id, { estado: this.sala.estado });
            this._salvarSala = false;
        }

        if(this._salvarGlobal) {
            await salaRepository.atualizar(this.global.id, { estado: this.global.estado });
            this._salvarGlobal = false;
        }
    }

    // =========================================================================
    //                 Funções para escrever na resposta  
    // =========================================================================
    async descreverSala() {
        let salaConfig = getSalaConfig(this.jogador.salaId);

        const descr = await salaConfig.descricao(this);
        if(descr) {
            this.escrevaln(descr);
        }
        for(let item of await this.getItensNoChao()) {
            // A FAZER: sistema melhor de descrição de itens
            this.escrevaln(`Você vê aqui ${item.quantidade === 1 ? "um(a)" : item.quantidade} ${item.tipo}.`);
        }
        for(const conexao of Object.keys(salaConfig.conexoes)) {
            this.escrevaln(`- ${conexao}`);
        }
    }

    escrevaln(...str: unknown[]) {
        this.escreva(...str, "\n");
    }

    escreva(...str: unknown[]) {
        let lastWasString = false;
        for(let s of str) {
            if(s === undefined || s === null) continue;
            let strValue: string;
            let isString: boolean = false;
            if(typeof s === "string") {
                strValue = s;
                isString = true;
            } else if(typeof s === "object") {
                strValue = JSON.stringify(s, null, 2);
            } else {
                strValue = String(s);
            }
            
            this.str += strValue;
            if(lastWasString && !isString) {
                this.str += ' ';
            }
            lastWasString = isString;
        }
    }

    obterTexto() {
        return this.str;
    }
}