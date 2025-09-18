import type { RequestHandler } from "express";
import { apiDocPaths } from "../docs/head.ts";
import { UserRepository } from "../repositories/userRepository.ts";
import { db } from "../db/drizzle.ts";
import bcrypt from "bcryptjs";
import { RevokeSessionError } from "../middlewares/authMiddleware.ts";

// Autenticação simples usando nome de usuário e senha
export class AuthController {
    static cadastrar: RequestHandler = async (req, res) => {
        const { username, password } = apiDocPaths["/auth/cadastrar"].post.schema.body.parse(req.body);

        if(password.toLowerCase() === password.toUpperCase() || !/\d/.test(password)) {
            return res.status(400).json({ error: "A senha deve conter letras e números e ser forte" });
        }

        // Verifica se o nome de usuário já existe
        const existeUser = await UserRepository.buscarUsername(db, username);
        if(existeUser) {
            return res.status(400).json({ error: "Nome de usuário já existe" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const { user, entidade } = await UserRepository.cadastrarUsuario(db, { username, passwordHash });
        if(!user || !entidade) {
            return res.status(500).json({ error: "Erro ao cadastrar usuário" });
        }

        // Cria a sessão do usuário
        const session = req.session || {}; 
        session.username = user.username;
        req.session = session;

        res.status(201).json({ 
            username: user.username,
            createdAt: user.createdAt
        });
    }

    static login: RequestHandler = async (req, res) => {
        const { username, password } = apiDocPaths["/auth/login"].post.schema.body.parse(req.body);

        const user = await UserRepository.buscarUsername(db, username);
        if(!user) {
            return res.status(401).json({ error: "Nome de usuário ou senha inválidos" });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if(!passwordMatch) {
            return res.status(401).json({ error: "Nome de usuário ou senha inválidos" });
        }

        // Cria a sessão do usuário
        const session = req.session || {}; 
        session.username = user.username;
        req.session = session;

        res.status(200).json({
            username: user.username,
            createdAt: user.createdAt
        });
    }

    static logout: RequestHandler = async (req, res) => {
        throw new RevokeSessionError("OK");
    }
}