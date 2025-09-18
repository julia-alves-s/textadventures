// Contexto do jogo a ser usado nas funções das salas e comandos
import { db } from "../db/drizzle.ts";
import { getItemConfig, getSalaConfig, type ItemTipo, type SalaNome } from "./config.ts";

import { type Entidade } from "../db/entidadeSchema.ts";
import { type Estado } from "../db/estadoSchema.ts";
import { type Item } from "../db/itemSchema.ts";
import { type Sala } from "../db/salaSchema.ts";
import { EntidadeRepository } from "../repositories/entidadeRepository.ts";
import { ItemRepository } from "../repositories/itemRepository.ts";
import { SalaRepository } from "../repositories/salaRepository.ts";

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    jogador: Entidade;
    private _salvarJogador: boolean = false;

    mochila: Item[] | null = null;
    async getMochila() {
        if(this.mochila) return this.mochila;

        this.mochila = await ItemRepository.listarPorLocal(db, this.jogador.id);
        return this.mochila;
    }

    itensNoChao: Item[] | null = null;
    async getItensNoChao() {
        if(this.itensNoChao) return this.itensNoChao;

        const sala = await this.getSala();
        this.itensNoChao = await ItemRepository.listarPorLocal(db, sala.id);
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

    constructor({ jogador, sala, global, itensNoChao, mochila, entidadesNaSala }: {
        jogador: Entidade,
        sala: Sala | null,
        global: Sala,
        itensNoChao: Item[] | null,
        mochila: Item[] | null,
        entidadesNaSala: Entidade[] | null,
    }) {
        this.jogador = jogador;
        this.global = global;
        this.sala = sala;
        this.str = "";
        this.itensNoChao = itensNoChao;
        this.mochila = mochila;
        this.entidadesNaSala = entidadesNaSala;
    }

    static async carregar(username: string): Promise<Contexto> {
        const result = await SalaRepository.dadosIniciaisJogador(db, username);
        return new Contexto(result);
    }

    static async _descricaoItens(ctx: Contexto, itens: Item[]) {
        const descricaoItens = [];
        for(let item of itens) {
            const itemConfig = getItemConfig(item.nome as ItemTipo);
            const descr = await itemConfig.descricao(ctx);
            if(descr) {
                ctx.escrevaln(descr);
            }
            descricaoItens.push({
                id: item.id,
                nome: item.nome,
                quantidade: item.quantidade,
                atualizadoEm: item.atualizadoEm,
                descricao: ctx.obterTexto(),
            });
        }
        return descricaoItens;
    }

    async retornarSituacao() {
        const sala = await this.getSala();
        let salaConfig = getSalaConfig(sala.nome as SalaNome);

        const resposta = this.obterTexto();

        const descr = await salaConfig.descricao(this);
        if(descr) {
            this.escrevaln(descr);
        }
        const descricaoSala = this.obterTexto();

        const descricaoItensNochao = await Contexto._descricaoItens(this, await this.getItensNoChao());
        const descricaoMochila = await Contexto._descricaoItens(this, await this.getMochila());
        const descricaoEntidades = (await this.getEntidadesNaSala()).map(e => ({
            id: e.id,
            categoria: e.categoria,
            tipo: e.tipo,
            username: e.username,
            atualizadoEm: e.atualizadoEm,
            descricao: e.tipo === 'JOGADOR' ? "" : `um ${e.tipo.toLowerCase()}`,
        }));

        return {
            resposta: resposta,
            jogador: {
                id: this.jogador.id,
                username: this.jogador.username,
                salaId: this.jogador.salaId,                
                atualizadoEm: this.jogador.atualizadoEm,
                mochila: descricaoMochila,
            },
            sala: {
                id: sala.id,
                nome: sala.nome,
                atualizadoEm: sala.atualizadoEm,
                conexoes: Object.keys(salaConfig.conexoes),
                descricao: descricaoSala,
                itens: descricaoItensNochao,
                entidades: descricaoEntidades,
            },
        };
    }

    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    async moverParaSala(novaSalaNome: SalaNome) {
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

        this.entidadesNaSala = null;
        this.itensNoChao = null;
    }

    async moverItem(item: Item, { quantidade, ondeId, estado }: { 
        quantidade: number,
        ondeId: string | null,
        estado?: Estado,
    }) {
        if(ondeId === null) {
            // Descarta o item
            await ItemRepository.removerItem(db, item.id, quantidade);
        } else {
            // Move o item para outro lugar
            // A FAZER: lidar com pilhaId quando mudar o estado
            await ItemRepository.moverItem(db, item.id, { quantidade, ondeId, pilhaId: item.nome, estado });
        }

        this.mochila = null;
        this.itensNoChao = null;
    }

    async criarItem(item: { nome: ItemTipo, estado?: Estado, quantidade: number, ondeId: string }) {
        await ItemRepository.adicionarItem(db, {
            nome: item.nome,
            pilhaId: item.nome, // A FAZER: lidar com pilhaId ligado ao estado
            quantidade: item.quantidade,
            estado: item.estado || {},
            ondeId: item.ondeId,
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