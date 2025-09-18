import "dotenv/config";
import app from "../src/app.ts";

// https://vercel.com/guides/using-express-with-vercel

const port = process.env.PORT || 3001;
const server = app.listen(port, (err) => {
    if (err) {
        console.error("Erro ao iniciar o servidor:", err);
        process.exit(1);
    }

	console.log(`Servidor iniciado em ${port} às ${new Date().toISOString()}`);
});

export default app;