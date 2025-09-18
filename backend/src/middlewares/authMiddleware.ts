import { type RequestHandler } from "express";

export const COOKIE_NAME = '__Secure-textadventures.session_token';
export const COOKIE_OPTIONS = {
    maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days
    secure: true,
    httpOnly: true,
    sameSite: "none",
    domain: process.env.COOKIE_DOMAIN || undefined,
    partitioned: true,
} as const;

export class RevokeSessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RevokeSessionError";
    }
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
    const session = req.session || {};
    if(!session || !session.username) {
        throw new RevokeSessionError("Usuário não autenticado");
    }
    
    next();
};