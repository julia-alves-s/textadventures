import express from "express";
import { apiReference } from "@scalar/express-api-reference";
import swaggerJsDoc from "swagger-jsdoc";
import getSwaggerOptions from "../docs/head.ts";

export const getDocsRouter = () => {
    const router = express.Router();

    router.get("/",(req, res) => {
        res.status(200).redirect("/reference/"); // redirecionando para documentação
	});

    let swaggerDocs: object | null = null;
    router.get("/reference/openapi.json", (req, res) => {
        if (!swaggerDocs) {
            swaggerDocs = swaggerJsDoc(getSwaggerOptions());
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