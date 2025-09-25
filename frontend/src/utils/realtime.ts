import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

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
// let canalSala: RealtimeChannel | null = null;
let qualSala: string | null = null;
let fnCallbackChatMsg: ((global: boolean, username: string, mensagem: string) => void) = (global, username, mensagem) => {
    console.log("Mensagem recebida:", { global, username, mensagem });
};
export const inicializarRealtime = (_salaId: string, callback: typeof fnCallbackChatMsg) => {
    const supabase = getRealtimeClient();
    if(!supabase) {
        console.error("Não foi possível inicializar o realtime, supabase não está disponível.");
        return;
    }

    fnCallbackChatMsg = callback;
    qualSala = _salaId;

    // A FAZER ver isso de ser 1 canal só.
    if(!canalGlobal) {
        console.log("Inscrevendo no canal global");
        canalGlobal = supabase.channel("chat:global");
        canalGlobal.on("broadcast", { event: "mensagem" }, ({ event, payload, type }) => {
            console.log("Nova mensagem global:", payload);
            const msg = (typeof payload.mensagem === "string" && payload.mensagem || "").substring(0, 128);
            if(payload.global === true || payload.salaId === qualSala) {
                fnCallbackChatMsg(payload.global === true, payload.username || "<desconhecido>", msg);
            }
        })
        .subscribe();
    }

    /*if(canalSala && canalSala. !== `chat:sala_${salaId}`) {
        console.log("Removendo canal da sala antiga");
        supabase.removeChannel(canalSala);
        canalSala = null;
    }

    if(!canalSala) {
        console.log("Inscrevendo no canal da sala", salaId);
        canalSala = supabase.channel(`chat:sala_${salaId}`);
        canalSala.on("broadcast", { event: "mensagem" }, (payload) => {
            console.log(`Nova mensagem na sala ${salaId}:`, payload);
            const msg = (typeof payload.mensagem === "string" && payload.mensagem || "").substring(0, 128);
            fnCallbackChatMsg(false, payload.username || "<desconhecido>", msg);
        })
        .subscribe();
    }*/
};

export const enviarRealtimeMensagem = async (_salaId: string, global: boolean, username: string, mensagem: string | null) => {
    const supabase = getRealtimeClient();
    if(!supabase) {
        console.error("Não foi possível enviar a mensagem, supabase não está disponível.");
        return;
    }

    if(!canalGlobal) {
        console.error("Canal não está disponível para enviar a mensagem.");
        return;
    }
    
    const result = await canalGlobal.send({
        type: "broadcast",
        event: "mensagem",
        payload: {
            global: global,
            salaId: _salaId,
            username,
            mensagem
        }
    });
    console.log("Resultado do envio da mensagem:", result);
    return result === "ok";
};