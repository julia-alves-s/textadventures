// Contexto do jogo a ser usado nas funções das salas e comandos
import { db } from "../db/drizzle.ts";
import { gerarPilhaId, getEntidadeConfig, getItemConfig, getSalaConfig } from "./config.ts";

import { SalaRepository } from "../repositories/salaRepository.ts";
import { EntidadeJogador } from "./entidades/jogador.ts";
import type { SalaBase, SalaBaseStatic } from "./salas/base.ts";
import type { ItemBase, ItemBaseStatic } from "./itens/base.ts";
import { EntidadeBase } from "./entidades/base.ts";
import { EntidadeRepository } from "../repositories/entidadeRepository.ts";
import type { Sala } from "../db/salaSchema.ts";
import type { Item } from "../db/itemSchema.ts";
import { execArrowOrValue, JogoError, type Estado } from "./types.ts";
import { ItemRepository } from "../repositories/itemRepository.ts";
import type { Entidade } from "../db/entidadeSchema.ts";
import e from "express";
import { Acao, type AcaoValue } from "./comandos/comandoConfig.ts";
import { RevokeSessionError } from "../middlewares/authMiddleware.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "./objetoJogo.ts";

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    jogador: EntidadeJogador;
    sala: SalaBase;

    private str: string;
    constructor({ sala, jogador }: {
        sala: SalaBase,
        jogador: EntidadeJogador
    }) {
        this.sala = sala;
        this.jogador = jogador;
        this.str = "";      
    }

    static async carregar(username: string, ondeId: string) {
        const { sala, entidades, itens } = await SalaRepository.carregarSalaCompleta(db, ondeId);

        const salaItens: ItemBase[] = [];
        const salaEntidades: EntidadeBase[] = [];
        let jogador: EntidadeJogador | undefined = undefined;
        const salaConfig = await getSalaConfig(sala.nome, { sala: sala, itens: salaItens, entidades: salaEntidades });
                
        for(let item of itens) {
            const itemConfig = await getItemConfig(item.nome, { item: item, onde: salaConfig });
            salaItens.push(itemConfig);
        }

        for(let ent of entidades) {
            const entidadeMochila: ItemBase[] = [];
            let entidade: Entidade;
            let mochila: Item[];
            const { entidadeRef, mochila: entMochila, ...entInfo } = ent;
            if(entidadeRef) {
                const { mochila: entidadeRefMochila, ...entidadeRefInfo } = entidadeRef;
                entidade = entidadeRefInfo;
                mochila = entidadeRefMochila;
            } else {
                entidade = entInfo;
                mochila = entMochila;
            }
            const entidadeConfig = await getEntidadeConfig(ent.tipo, { entidade: entidade, onde: salaConfig, itens: entidadeMochila, filhos: [] });
            entidadeConfig.ehReferencia = entidadeRef ? true : false;
            for(let item of mochila) {
                const itemConfig = await getItemConfig(item.nome, { item: item, onde: entidadeConfig });
                entidadeMochila.push(itemConfig);
            }
            salaEntidades.push(entidadeConfig);

            if(entidade.tipo === 'JOGADOR' && entidade.username === username) {
                jogador = entidadeConfig as EntidadeJogador;
                jogador.outroJogador = false;
            }
        }

        if(!jogador) {
            throw new RevokeSessionError("Jogador não encontrado na sala!");
        }

        return {
            sala: salaConfig,
            jogador: jogador
        };
    }

    getEntidadeVisivel(entidadeId: string): EntidadeBase | undefined {
        let achouEntidade: EntidadeBase | undefined = undefined;
        // 1 Filhos na mochila (Não implementado sempre vazio...)
        if(this.jogador.filhosVisiveis()) {
            achouEntidade = this.jogador.filhos.find(f => f.estaVisivel() && f.entidade.id === entidadeId);

            // 1.1 Filhos de filhos na mochila (Não implementado sempre vazio...)
            if(!achouEntidade) {
                for(let filho of this.jogador.filhos) {
                    if(!filho.estaVisivel() || !filho.filhosVisiveis()) continue;

                    achouEntidade = filho.filhos.find(f => f.estaVisivel() && f.entidade.id === entidadeId);
                    if(achouEntidade) break;
                }
            }
        }
        // 2. Na sala
        if(!achouEntidade && this.sala.estaVisivel() && this.sala.filhosVisiveis()) {
            achouEntidade = this.sala.entidades.find(e => e.estaVisivel() && e.entidade.id === entidadeId);

            // 2.1 Filhos da entidade (Não implementado sempre vazio...)
            if(!achouEntidade) {
                for(let entidade of this.sala.entidades) {
                    if(!entidade.estaVisivel() || !entidade.filhosVisiveis()) continue;

                    achouEntidade = entidade.filhos.find(f => f.estaVisivel() && f.entidade.id === entidadeId);
                    if(achouEntidade) break;
                }
            }
        }

        return achouEntidade;
    }

    getItemVisivel(itemId: string): ItemBase | undefined {
        let achouItem: ItemBase | undefined = undefined;
        // Jogador
        if(this.jogador.filhosVisiveis()) {
            // 1. Mochila
            let achouItem = this.jogador.itens.find(i => i.estaVisivel() && i.item.id === itemId);

            // 1.1 Mochila de filhos na mochila
            if(!achouItem) {
                for(let filho of this.jogador.filhos) {
                    if(!filho.estaVisivel() || !filho.filhosVisiveis()) continue;

                    achouItem = filho.itens.find(i => i.estaVisivel() && i.item.id === itemId);
                    if(achouItem) break;
                }
            }
        }

        // 2. Chão da sala
        if(!achouItem && this.sala.estaVisivel() && this.sala.filhosVisiveis()) {
            achouItem = this.sala.itens.find(i => i.estaVisivel() && i.item.id === itemId);

            // 2.1 Mochila de entidades na sala
            if(!achouItem) {
                for(let entidade of this.sala.entidades) {
                    if(!entidade.estaVisivel() || !entidade.filhosVisiveis()) continue;

                    achouItem = entidade.itens.find(i => i.estaVisivel() && i.item.id === itemId);
                    if(achouItem) break;
                }
            }
        }

        return achouItem;
    }

    async _descricaoItens(itens: ItemBase[]) {
        const descricaoItens = [];
        for(let i of itens) {
            if(!i.estaVisivel()) continue;

            const acoes = await i._acoes(this);
            const descr = Acao.$Descricao in acoes ? await execArrowOrValue(acoes[Acao.$Descricao]) : "";
            if(descr && typeof descr === "string") {
                this.escrevaln(descr);
            }            
            const descricaoItem = this.obterTexto();

            descricaoItens.push({
                id: i.item.id,
                nome: i.item.nome,
                quantidade: i.item.quantidade,
                atualizadoEm: i.item.atualizadoEm,
                descricao: descricaoItem,
                acoes: Object.keys(acoes).filter(a => !a.startsWith("$"))
            });
        }
        return descricaoItens;
    }

    async _descricaoEntidades(entidades: EntidadeBase[]) {
        const descricaoEntidades = [];
        for(let e of entidades) {
            if(!e.estaVisivel()) continue;

            const acoes = await e._acoes(this);
            const descr = Acao.$Descricao in acoes ? await execArrowOrValue(acoes[Acao.$Descricao]) : "";
            if(descr && typeof descr === "string") {
                this.escrevaln(descr);
            }            
            const descricaoEntidade = this.obterTexto();
            //const { itens, filhos } = e.getFilhosVisiveis();
            let descrItens;
            let descrFilhos: any;
            if(e.filhosVisiveis()) {
                descrItens = await this._descricaoItens(e.itens);
                descrFilhos = await this._descricaoEntidades(e.filhos);
            }
            
            descricaoEntidades.push({
                id: e.entidade.id,
                tipo: e.entidade.tipo,
                nome: e.entidade.nome,
                username: e.entidade.username,
                atualizadoEm: e.entidade.atualizadoEm,
                descricao: descricaoEntidade,
                acoes: Object.keys(acoes).filter(a => !a.startsWith("$")),
                itens: descrItens || [],
                filhos: descrFilhos || []
            });
        }
        return descricaoEntidades;
    }

    async retornarSituacao() {
        const resposta = this.obterTexto();

        const [descricaoJogador] = await this._descricaoEntidades([this.jogador]);
        
        let descricaoSala = "";
        let descricaoItensNochao;
        let descricaoEntidades;
        let acoes: AcoesCallbackResult = {};
        if(!this.sala.estaVisivel()) {
            this.escrevaln("Está muito escuro, você não consegue ver nada.");
            descricaoSala = this.obterTexto();
        } else {
            acoes = await this.sala._acoes(this);
            const descr = Acao.$Descricao in acoes ? await execArrowOrValue(acoes[Acao.$Descricao]) : "";
            if(descr && typeof descr === "string") {
                this.escrevaln(descr);
            }
            descricaoSala = this.obterTexto();       

            //const { itens, entidades } = this.sala.getFilhosVisiveis();
            if(this.sala.filhosVisiveis()) {
                descricaoItensNochao = await this._descricaoItens(this.sala.itens);
                descricaoEntidades = await this._descricaoEntidades(this.sala.entidades.filter(e => e.entidade.id !== this.jogador.entidade.id));
            }
        }

        return {
            resposta: resposta,
            jogador: {
                ...descricaoJogador,
                ondeId: this.jogador.entidade.ondeId,
            },
            sala: {
                id: this.sala.sala.id,
                nome: this.sala.sala.nome,
                atualizadoEm: this.sala.sala.atualizadoEm,
                acoes: Object.keys(acoes).filter(a => !a.startsWith("$")),
                descricao: descricaoSala,
                itens: descricaoItensNochao || [],
                entidades: descricaoEntidades || [],
            },
        };
    }

    async _execAcao(acao: AcaoValue, extra: AcaoExtraPopulado | null, obj: ItemBase | EntidadeBase | SalaBase) {
        const acoes = await obj._acoes(this, extra);
        const result = acao in acoes ? await execArrowOrValue(acoes[acao]) : undefined;
        if(result && typeof result !== "string") {
            await this.moverParaSala(result);
            return true;
        } else if(result && typeof result === "string") {
            this.escrevaln(result);
            return true;
        }
        
        return false;
    }

    async executarAcoesAntes(extra?: AcaoExtraPopulado | null) {
        let acoesSala = await this.sala._acoes(this, extra);
        if(Acao.$AcaoAntes in acoesSala) {
            const parar = await this._execAcao(Acao.$AcaoAntes, null, this.sala);
            if(parar) return true;
        }
        for(let entidade of this.sala.entidades) {
            const acoesEntidade = await entidade._acoes(this, extra);
            if(Acao.$AcaoAntes in acoesEntidade) {
                const parar = await this._execAcao(Acao.$AcaoAntes, null, entidade);
                if(parar) return true;
            }
        }

        return false;
    }
    
    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    async moverParaSala(novaSala: typeof SalaBase & SalaBaseStatic) {
        const { entidade, sala } = (await EntidadeRepository.moveParaSalaNome(db, this.jogador.entidade.id, novaSala.nome)) || {};
        if(!entidade || !sala) {
            throw new JogoError("Erro ao mover para a sala " + novaSala.nome);
        }
        
        const info = await Contexto.carregar(this.jogador.entidade.username!, sala.id);
        this.sala = info.sala;
        this.jogador = info.jogador;
    }    
    
    async moverItem(i: ItemBase, { quantidade, onde, estado }: { 
        quantidade: number,
        onde: SalaBase | EntidadeBase | null,
        estado?: Estado | null,
    }) {
        if(onde === null) {
            // Descarta o item
            await ItemRepository.removerItem(db, i.item.id, quantidade);
        } else {
            // Move o item para outro lugar
            if(estado) {
                estado = { ...(i.item.estado || {}), ...estado };
            } else {
                estado = i.item.estado;
            }

            const seguro = "entidade" in onde && onde.itensSeguros();
            const id = "sala" in onde ? onde.sala.id : onde.entidade.id;
            await ItemRepository.moverItem(db, i.item.id, { quantidade, ondeId: id, seguro: seguro, pilhaId: gerarPilhaId(i.item.nome, estado), estado });
        }

        //this.mochila = null;
        //this.itensNoChao = null;
        // A FAZER: atualizar só em memória.

        const info = await Contexto.carregar(this.jogador.entidade.username!, this.sala.sala.id);
        this.sala = info.sala;
        this.jogador = info.jogador;
    }

    async criarItem(item: { item: typeof ItemBase & ItemBaseStatic, estado?: Estado | null, quantidade: number, onde: SalaBase | EntidadeBase }) {
        const onde = item.onde;
        const seguro = "entidade" in onde && onde.itensSeguros();
        const id = "sala" in onde ? onde.sala.id : onde.entidade.id;
        await ItemRepository.adicionarItem(db, {
            nome: item.item.nome,
            pilhaId: gerarPilhaId(item.item.nome, item.estado),
            quantidade: item.quantidade,
            estado: item.estado,
            ondeId: id,
            seguro: seguro
        });

        //this.mochila = null;
        //this.itensNoChao = null;
        // A FAZER: atualizar só em memória.


        const info = await Contexto.carregar(this.jogador.entidade.username!, this.sala.sala.id);
        this.sala = info.sala;
        this.jogador = info.jogador;
    }

    async alterarEstadoSala(novoEstado: Estado | null) {
        const sala = this.sala.sala;
        if(novoEstado) {
            sala.estado = { ...(sala.estado || {}), ...novoEstado };
        } else {
            sala.estado = null;
        }
        await SalaRepository.atualizar(db, sala.id, { estado: sala.estado });
    }

    async alterarEntidade(entidade: EntidadeBase, { onde, estado }: { 
        onde?: SalaBase | EntidadeBase | typeof SalaBase & SalaBaseStatic | null,
        estado?: Estado | null,
    }) {
        const ent = entidade.entidade;
        if(onde === null) {
            // Deleta a entidade
            await EntidadeRepository.deletar(db, ent.ondeId, ent.id);
        } else {
            // Move a entidade para outro lugar
            if(estado) {
                estado = { ...(ent.estado || {}), ...estado };
            }

            if(onde && "nome" in onde) {
                const { entidade, sala } = (await EntidadeRepository.moveParaSalaNome(db, ent.id, onde.nome, estado)) || {};
                if(!entidade || !sala) {
                    throw new JogoError("Erro ao mover para a sala " + onde.nome);
                }
            } else {
                const id = onde ? ("sala" in onde ? onde.sala.id : onde.entidade.id) : ent.ondeId;
                const result = await EntidadeRepository.atualizar(db, ent.id, { ondeId: id, estado: estado });
            }
        }
        // A FAZER: atualizar só em memória.

        const info = await Contexto.carregar(this.jogador.entidade.username!, this.sala.sala.id);
        this.sala = info.sala;
        this.jogador = info.jogador;
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