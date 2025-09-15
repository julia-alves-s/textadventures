import { RequestHandler, Express, ErrorRequestHandler } from "express";
import { getDocsRouter } from "./docsRoute.ts";
import { getLinhaRouter } from "./linhaRoute.ts";
import { logMiddleware } from "./logMiddleware.ts";

const routes = (app: Express) => {
	// Só fazer log das rotas se estiver em desenvolvimento, desativar em produção
	if(process.env.DEBUGLOG === "true") {
		app.use(logMiddleware);
	}

    app.use(
        getDocsRouter(),
        getLinhaRouter()
    );

	app.use((req,res,next) => {
		res.sendStatus(404);
	});

	// Por último o middleware de tratamento de erros
	app.use(((error, req, res, next) => {
        console.error(error);
		if(!res.headersSent) {
			res.status(500).json({ error: "Erro interno do servidor", message: error.message });
		}
    }) as ErrorRequestHandler);
};

export default routes;