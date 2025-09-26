import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

/**
 * Guias:
 * - https://supabase.com/docs/guides/realtime/broadcast
 * 
 * Inspetor realtime para debug: https://realtime.supabase.com/inspector
 * 
 * 
 */

// A FAZER: autenticação. (https://github.com/supabase/realtime?tab=readme-ov-file#websocket-connection-authorization)
let _supabase: SupabaseClient<any, "public", "public", any, any> | null = null;
const getRealtimeClient = () => {
    if(_supabase) {
        return _supabase;
    }

    // @ts-ignore
    let SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    let SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("Supabase URL or Key is not defined in environment variables.");
        return null;
    }
    // Create a single supabase client for interacting with your database
    console.log("Conectando ao Supabase:", SUPABASE_URL);
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {});
    return _supabase;
}

let canalGlobal: RealtimeChannel | null = null;
let canalSala: RealtimeChannel | null = null;
let fnCallbackChatMsg: ((global: boolean, username: string, mensagem: string) => void) = (global, username, mensagem) => {
    console.log("Mensagem recebida:", { global, username, mensagem });
};

export const inicializarRealtime = (username: string, salaId: string, callback: typeof fnCallbackChatMsg) => {
    const supabase = getRealtimeClient();
    if(!supabase) {
        console.error("Não foi possível inicializar o realtime, supabase não está disponível.");
        return;
    }

    fnCallbackChatMsg = callback;

    if(!canalGlobal) {
        console.log("Inscrevendo no canal global");
        const _canalGlobal = supabase.channel("chat:global");
        _canalGlobal.on("broadcast", { event: "mensagem" }, ({ event, payload, type }) => {
            const msg = (typeof payload.mensagem === "string" && payload.mensagem || "").substring(0, 128);
            fnCallbackChatMsg(true, payload.username || "<desconhecido>", msg);
        })
        .on("presence", { event: "join" }, ({ newPresences, currentPresences }) => {
            for(let p of newPresences) {
                if(!p || !p.username || typeof p.username !== "string" || p.username === username) continue;
                fnCallbackChatMsg(true, `${p.username} entrou no jogo.`, "");
            }
        })
        .on("presence", { event: "leave" }, ({ leftPresences, currentPresences }) => {
            for(let p of leftPresences) {
                if(!p || !p.username || typeof p.username !== "string" || p.username === username) continue;
                fnCallbackChatMsg(true, `${p.username} saiu do jogo.`, "");
            }
        })
        .subscribe(async (status) => {
            if(status !== "SUBSCRIBED") return;
            console.log("Inscrito com sucesso canal global.");

            const trackResult = await _canalGlobal.track({ 
                username: username
            });
            if(trackResult !== "ok") console.error("Erro ao track de presença global:", trackResult);
        });

        canalGlobal = _canalGlobal;
    }

    // ------------------------------------
    // A FAZER: investigar o quão problemático é ficar removendo e recriando canais
    //          Será que tem uma forma melhor de fazer isso?
    // ------------------------------------
    const salaTopic = `chat:sala_${salaId}`;
    if(canalSala && !canalSala.topic.endsWith(salaTopic)) {
        console.log("Removendo canal da sala antiga", canalSala.topic);
        supabase.removeChannel(canalSala);
        canalSala = null;
    }

    if(!canalSala) {
        console.log("Inscrevendo no canal da sala", salaId);
        const _canalSala = supabase.channel(salaTopic);
        _canalSala.on("broadcast", { event: "mensagem" }, ({ event, payload, type }) => {
            const msg = (typeof payload.mensagem === "string" && payload.mensagem || "").substring(0, 128);
            fnCallbackChatMsg(false, payload.username || "<desconhecido>", msg);
        })
        .subscribe(async (status) => {
            if(status === "SUBSCRIBED") {
                const result = await _canalSala.send({
                    type: "broadcast",
                    event: "mensagem",
                    payload: {
                        username: username+" aparece aqui.",
                        mensagem: ""
                    }
                });
                if(result !== "ok") console.error("Erro ao enviar mensagem:", result);
            }
            if(status === "CLOSED") {
                const result = await _canalSala.send({
                    type: "broadcast",
                    event: "mensagem",
                    payload: {
                        username: username+" saiu daqui.",
                        mensagem: ""
                    }
                });
                if(result !== "ok") console.error("Erro ao enviar mensagem:", result);
            }
        });

        canalSala = _canalSala;
    }
};

export const enviarRealtimeMensagem = async (global: boolean, username: string, mensagem: string | null) => {
    const supabase = getRealtimeClient();
    if(!supabase) {
        console.error("Não foi possível enviar a mensagem, supabase não está disponível.");
        return;
    }

    const canal = global ? canalGlobal : canalSala;
    if(!canal) {
        console.error("Canal não está disponível para enviar a mensagem.");
        return;
    }
    
    const result = await canal.send({
        type: "broadcast",
        event: "mensagem",
        payload: {
            username,
            mensagem
        }
    });
    if(result !== "ok") console.error("Erro ao enviar mensagem:", result);
};

export const desconectarRealtime = async () => {
    const supabase = getRealtimeClient();
    if(!supabase) {
        return;
    }

    const result = await supabase.removeAllChannels();
    if(result.filter(r => r !== "ok").length > 0) {
        console.error("Erro ao remover canais:", result);
    }
    canalGlobal = null;
    canalSala = null;
    _supabase = null;

    console.log("Desconectado com sucesso do Supabase Realtime.");
};