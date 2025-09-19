import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { ItemController } from "../controllers/itemController.ts";

export const getItemRouter = () => {
    const router = express.Router();

    router.post("/item/pegar", authMiddleware, ItemController.pegarItem);
    router.post("/item/largar", authMiddleware, ItemController.largarItem);
    router.post("/item/acao", authMiddleware, ItemController.acaoItem);

    return router;
};