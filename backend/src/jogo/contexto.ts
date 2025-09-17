// Contexto do jogo a ser usado nas funções das salas e comandos
import { db } from "../db/drizzle.ts";
import { type Entidade } from "../db/entidadeSchema.ts";
import { type Estado } from "../db/estadoSchema.ts";
import { type Item } from "../db/itemSchema.ts";
import { type Sala } from "../db/salaSchema.ts";
import { EntidadeRepository } from "../repositories/entidadeRepository.ts";
import { ItemRepository } from "../repositories/itemRepository.ts";
import { SalaRepository } from "../repositories/salaRepository.ts";
import { getItemConfig } from "./itens/itens.ts";
import { getSalaConfig } from "./salas/salas.ts";

export type ItemType = {
    descricao: (ctx: Contexto) => void | string | Promise<string | void>;
    itensIniciais?: {
        tipo: string;
        quantidade: number;
        estadoInicial?: Estado;
    }[];
};

export type SalaType = {
    descricao: (ctx: Contexto) => void | string | Promise<string | void>;
    conexoes: { 
        [direcao: string]: (ctx: Contexto) => void | string | Promise<string | void>;
    };
    itensIniciais?: {
        tipo: string;
        quantidade: number;
        estadoInicial?: Estado;
    }[];
    estadoInicial?: Estado;
};

function ondeParaLocalId(onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
    const localTipo = "entidadeId" in onde && onde.entidadeId ? "ENTIDADE" : "salaId" in onde && onde.salaId ? "SALA" : "itemContainerId" in onde && onde.itemContainerId ? "CONTAINER" : undefined;
    const localId = ("entidadeId" in onde && onde.entidadeId) || ("salaId" in onde && onde.salaId) || ("itemContainerId" in onde && onde.itemContainerId);
    if(!localTipo || !localId) {
        throw new Error("Quer colocar onde? lugar nenhum?");
    }
    return { localTipo, localId } as const;
}

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    jogador: Entidade;
    private _salvarJogador: boolean = false;

    mochila: Item[] | null = null;
    async getMochila() {
        if(this.mochila) return this.mochila;

        this.mochila = await ItemRepository.naMochila(db, this.jogador.id);
        return this.mochila;
    }

    itensNoChao: Item[] | null = null;
    async getItensNoChao() {
        if(this.itensNoChao) return this.itensNoChao;

        const sala = await this.getSala();
        this.itensNoChao = await ItemRepository.noChao(db, sala.id);
        return this.itensNoChao;
    }

    entidadesNaSala: Entidade[] | null = null;
    async getEntidadesNaSala() {
        if(this.entidadesNaSala) return this.entidadesNaSala;

        const sala = await this.getSala();
        this.entidadesNaSala = await EntidadeRepository.naSala(db, sala.id);
        return this.entidadesNaSala;
    }

    global: Sala;
    private _salvarGlobal: boolean = false;

    sala: Sala | null;
    private _salvarSala: boolean = false;
    async getSala() {
        if(this.sala) return this.sala;
        
        this.sala = await SalaRepository.getSalaById(db, this.jogador.salaId);
        if (!this.sala) {
            throw new Error("Sala para onde o jogador tentou ir não existe!");
        }

        return this.sala;
    }

    private str: string;

    constructor({ jogador, sala, global, itensNoChao, mochila }: {
        jogador: Entidade,
        sala: Sala | null,
        global: Sala,
        itensNoChao: Item[] | null,
        mochila: Item[] | null,
    }) {
        this.jogador = jogador;
        this.global = global;
        this.sala = sala;
        this.str = "";
        this.itensNoChao = itensNoChao;
        this.mochila = mochila;
    }

    static async carregar(username: string): Promise<Contexto> {
        const result = await SalaRepository.dadosIniciaisJogador(db, username);
        return new Contexto(result);
    }

    retornarSituacao() {
        return {
            resposta: this.obterTexto(),
            jogador: {
                username: this.jogador.username,
                salaId: this.jogador.salaId,
                atualizadoEm: this.jogador.atualizadoEm,
                mochila: this.mochila ? this.mochila.map(i => ({
                    id: i.id,
                    tipo: i.tipo,
                    quantidade: i.quantidade,
                    atualizadoEm: i.atualizadoEm
                })) : undefined,
            },
            sala: this.sala ? {
                id: this.sala.id,
                nome: this.sala.nome,
                atualizadoEm: this.sala.atualizadoEm,
                itens: this.itensNoChao ? this.itensNoChao.map(i => ({
                    id: i.id,
                    tipo: i.tipo,
                    quantidade: i.quantidade,
                    atualizadoEm: i.atualizadoEm
                })) : undefined,
                entidades: this.entidadesNaSala ? this.entidadesNaSala.map(e => ({
                    id: e.id,
                    categoria: e.categoria,
                    tipo: e.tipo,
                    username: e.username,
                    atualizadoEm: e.atualizadoEm
                })) : undefined,
            } : undefined,
        };
    }

    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    async moverParaSala(novaSalaNome: string) {
        if(this._salvarJogador || (this.sala && this._salvarSala)) {
            throw new Error("Deve salvar antes!");
        }

        const { entidade, sala } = (await EntidadeRepository.moveParaSalaNome(db, this.jogador.id, novaSalaNome)) || {};
        if(!entidade || !sala) {
            throw new Error("Erro ao mover para a sala " + novaSalaNome);
        }

        this.jogador = entidade;
        this._salvarJogador = false;

        this.sala = sala;
        this._salvarSala = false;
    }

    async moverItem(item: Item, quantidade: number, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string } | null) {
        if(onde === null) {
            // Descarta o item
            await ItemRepository.removerItem(db, item.id, quantidade);
        } else {
            // Move o item para outro lugar
            const { localTipo, localId } = ondeParaLocalId(onde);
            await ItemRepository.moverItem(db, item.id, quantidade, localTipo, localId);
        }

        this.mochila = null;
        this.itensNoChao = null;
    }

    async criarItem(item: { tipo: string, estado?: Estado, quantidade: number}, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
        const { localTipo, localId } = ondeParaLocalId(onde);
        await ItemRepository.adicionarItem(db, {
            tipo: item.tipo,
            quantidade: item.quantidade,
            estado: item.estado || {},
            localTipo: localTipo,
            localId: localId
        });

        this.mochila = null;
        this.itensNoChao = null;
    }

    async alterarEstadoSala(novoEstado: Estado) {
        const sala = await this.getSala();

        sala.estado = { ...sala.estado, ...novoEstado };
        this._salvarSala = true;
    }

    async salvar() {
        if(this._salvarJogador) {
            await EntidadeRepository.atualizar(db, this.jogador.id, { 
                salaId: this.jogador.salaId,
                estado: this.jogador.estado
            });
            this._salvarJogador = false;
        }

        if(this._salvarSala && this.sala) {
            await SalaRepository.atualizar(db, this.sala.id, { estado: this.sala.estado });
            this._salvarSala = false;
        }

        if(this._salvarGlobal) {
            await SalaRepository.atualizar(db, this.global.id, { estado: this.global.estado });
            this._salvarGlobal = false;
        }
    }

    // =========================================================================
    //                 Funções para escrever na resposta  
    // =========================================================================
    static async _descricaoItens(ctx: Contexto, itens: Item[]) {
        const descricaoItens = [];
        for(let item of itens) {
            const itemConfig = getItemConfig(item.tipo);
            const descr = await itemConfig.descricao(ctx);
            if(descr) {
                ctx.escrevaln(descr);
            }
            descricaoItens.push({
                id: item.id,
                tipo: item.tipo,
                quantidade: item.quantidade,
                atualizadoEm: item.atualizadoEm,
                descricao: ctx.obterTexto(),
            });
        }
        return descricaoItens;
    }

    async descricaoSala() {
        const sala = await this.getSala();
        let salaConfig = getSalaConfig(sala.nome);

        const descr = await salaConfig.descricao(this);
        if(descr) {
            this.escrevaln(descr);
        }
        const descricaoSala = this.obterTexto();

        const descricaoItens = await Contexto._descricaoItens(this, await this.getItensNoChao());
        const conexoes = Object.keys(salaConfig.conexoes);

        const entidades = await this.getEntidadesNaSala();
        const descricaoEntidades = [];
        for(let entidade of entidades) {
            descricaoEntidades.push({
                id: entidade.id,
                categoria: entidade.categoria,
                tipo: entidade.tipo,
                username: entidade.username,
                atualizadoEm: entidade.atualizadoEm,
                descricao: entidade.tipo === 'JOGADOR' ? "" : `um ${entidade.tipo.toLowerCase()}`,
            });
        }
        
        return {
            id: sala.id,
            nome: sala.nome,
            descricao: descricaoSala, 
            itens: descricaoItens,
            entidades: descricaoEntidades,
            conexoes
        };
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
        let txt = this.str;
        this.str = "";
        return txt;
    }
}