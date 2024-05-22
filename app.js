import express from 'express';
import {getUsers, getUserById,insertUser} from './database.js';

const app = express();
app.use(express.json());

/*
app.get("/notes", async(req, res) => {
    const users = await getUsers();
    res.send(users);
})*/

app.get("/notes/:id", async(req, res) => {
    const id = req.params.id;
    const user = await getUserById(id);
    res.send(user);
})

app.post("/notes", async(req, res) => {
    const {name,email,password} = req.body;
    const result = await insertUser(name, email, password);
    res.status(201).send(result);
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke');
})

app.listen(8080,() => {console.log('Listening on port 8080')})