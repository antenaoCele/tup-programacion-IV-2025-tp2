import express from "express";
import { conectarDB } from "./db.js";
import rectangulosRouter from "./rectangulos.js";


conectarDB();

const app = express();
const port = 4000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hola mundo!");
});

app.use("/rectangulos", rectangulosRouter);

app.listen(port, () => {
    console.log(`La aplicación esta funcionando en el puerto ${port}`);
});
