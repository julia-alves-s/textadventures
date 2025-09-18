import "dotenv/config";
import express from "express";
import cors from "cors";

import cookieSession from "cookie-session";
import { COOKIE_NAME, COOKIE_OPTIONS } from "./middlewares/authMiddleware.ts";
import routes from "./routes/index.ts";

const app = express();
// If app is served through a proxy, trust the proxy to allow HTTPS protocol to be detected
// https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', () => true);

app.use((req, res, next) => {
    try {
        res.locals = res.locals || {};
        res.locals.logData = {
            tempoInicio: performance.now()
        };

        // Força o protocolo https, pois atrás do proxy ele não reconhece por alguma razão
        req.headers["x-forwarded-proto"] = "https";

        //  Secure Flag cannot be set for unproxied localhost #837 
        // https://github.com/expressjs/session/issues/837
        // A ideia é que para o cookie ser enviado, o secure tem que ser true, pois express.session tá com bug
        // que mesmo quando é localhost ele não envia o cookie se secure for false
        if(!req.secure) {
            let objValue = Object.create(null);
            objValue.value = true;
            Object.defineProperty(req, "secure", objValue);
        }
    } catch(e) {
        console.error("Erro ao iniciar o log", e);
    }
    next();
});

// ========================================
//             Configuração Cors
// ========================================
let CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",");
if(!CORS_ORIGINS || CORS_ORIGINS.length === 0) {
    throw new Error("ENV CORS_ORIGINS não definido!");
}

// https://www.better-auth.com/docs/integrations/express#cors-configuration
app.use(cors({
    origin: (origin, callback) => {
        // https://www.npmjs.com/package/cors#configuring-cors-w-dynamic-origin
        if(!origin || CORS_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Não permitido para esta origem: ${origin}`));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Com Bearer token é necessário permitir o cabeçalho Authorization
    credentials: true, // Se utilizar cookies, habilitar isso
    // maxAge: 86400, // Cache the preflight response for 24 hours?
}));


// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieSession({
  name: COOKIE_NAME,
  secret: process.env.COOKIE_SECRET || 'default_cookie_secret_change_me',

  // Cookie Options
  ...COOKIE_OPTIONS
}));

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;