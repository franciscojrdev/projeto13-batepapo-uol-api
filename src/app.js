import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import Joi from "joi";

const app = express();
dotenv.config();
app.use(express.json());

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
});

const messageSchema = Joi.object({
  to: Joi.string().min(3).max(30).required(),
  text: Joi.string().min(3).required(),
  type: Joi.string().required().valid("message", "private_message"),
});

// console.log(dayjs().format("hh:mm:ss"));
//objectid para pegar o id no banco de dados

const mongoClient = new MongoClient(process.env.DATABASE_URL);

let db;

try {
  await mongoClient.connect();
  db = mongoClient.db();
  console.log("MongoDB Connected!");
} catch (err) {
  console.log(err.message);
}
//tirar a port e tirar o nome do banco daqui

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  try {
    await userSchema.validateAsync({ name });

    const findUser = await db.collection("participants").findOne({ name });

    if (findUser) {
      return res.status(409).send({ message: "Usuário já existente!" });
    }
    await db.collection("participants").insertOne({
      name,
      lastStatus: Date.now(),
    });

    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("hh:mm:ss"),
    });

    return res.sendStatus(201);
  } catch (error) {
    res.status(422).send(error.message);
    return;
  }
});

app.get("/participants", async (req, res) => {
  try {
    const showParticipants = await db
      .collection("participants")
      .find()
      .toArray();
    return res.status(201).send(showParticipants);
  } catch (error) {
    return res.status(422).send(error.message);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  try {
    await messageSchema.validateAsync({ to, text, type });
    const findUser = await db
      .collection("participants")
      .findOne({ name: user });
    console.log(findUser);
    if (!findUser) {
      return res.status(422).send("Usuário não encontrado!");
    }
    await db.collection("messages").insertOne({
      from: user,
      to: to,
      text: text,
      type: type,
      time: dayjs().format("hh:mm:ss"),
    });
    res.sendStatus(201);
  } catch (error) {
    res.status(422).send(error.message);
  }
});

app.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers;

  if (limit < 1 || Number(limit) === NaN) {
    return res.status(422).send("Limite inválido");
  }
  try {
    const findMessages = await db
      .collection("messages")
      .find({ $or: [{ from: user }, { to: user }, { type: "message" }] })
      .toArray();
    console.log(findMessages);
    if (limit) {
      console.log("Está entrando aqui hem");
      return res.status(201).send([...findMessages].reverse().slice(-limit));
    }
    res.status(201).send([...findMessages].reverse());
  } catch (error) {
    res.status(422).send(error.message);
  }
});

app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { user } = req.headers;
  try {
    const findMessage = await db
      .collection("messages")
      .findOne({ _id: ObjectId(id) });
    if (!findMessage) {
      return res.status(404).send("Mensagem não existe!");
    }
    if (findMessage.from !== user) {
      return res.sendStatus(401);
    }
    await db.collection("messages").deleteOne({ _id: ObjectId(id) });
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(404);
  }
});

app.post("/status", async (req, res) => {
  const { user } = req.headers;
  try {
    let findUser = await db.collection("participants").findOne({ name: user });
    console.log(findUser);
    if (!findUser) {
      return res.status(404).send("User not found!");
    }
    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(404).send("erro veio do catch");
  }
});

try {
  setInterval(async () => {

    let dados = await db.collection("participants").find().toArray();
    console.log("entrou aqui",dados);
    dados.forEach(el=>{
      let timeNow  = Date.now()
      let name = el.name
      if(timeNow - el.lastStatus > 10){
        db.collection("participants").deleteOne({name:name})
        db.collection("messages").insertOne({
          from: name,
          to: "Todos",
          text: "sai na sala...",
          type: "status",
          time: dayjs().format("hh:mm:ss"),
        });
      }
    })
  }, 15000);
} catch (error) {
  console.log(error);
}

app.listen(5000, () => {
  console.log(`Server running in port 5000`);
});
