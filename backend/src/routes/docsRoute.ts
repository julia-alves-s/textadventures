import express from "express";
import { apiReference } from "@scalar/express-api-reference";
import swaggerJsDoc from "swagger-jsdoc";
import generateOpenAPIDocs, { apiDocPaths } from "../docs/head.ts";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerDocPaths } from "../utils/docs.ts";

export const getDocsRouter = () => {
    const router = express.Router();

    router.get("/",(req, res) => {
        res.status(200).redirect("/reference/"); // redirecionando para documentação
	});

    let swaggerDocs: object | null = null;
    router.get("/reference/openapi.json", (req, res) => {
        if (!swaggerDocs) {
            const registry = new OpenAPIRegistry();

            // Registrar os schemas e paths aqui
            registerDocPaths(registry, apiDocPaths);

            swaggerDocs = swaggerJsDoc(generateOpenAPIDocs(registry));
        }
        res.json(swaggerDocs);
    });

    router.use(
        "/reference",
        apiReference({
            // Put your OpenAPI url here:
            url: "/reference/openapi.json",
        }),
    );

    return router;
};