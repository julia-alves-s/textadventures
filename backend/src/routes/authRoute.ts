import express from "express";
import { AuthController } from "../controllers/authController.ts";

export const getAuthRouter = () => {
    const router = express.Router();

    router.post("/auth/cadastrar", AuthController.cadastrar);
    router.post("/auth/login", AuthController.login);
    router.post("/auth/logout", AuthController.logout);

    return router;
};