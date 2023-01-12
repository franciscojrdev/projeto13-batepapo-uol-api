import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";

const app = express();
dotenv.config();
app.use(express.json());

// console.log(dayjs().format("hh:mm:ss"));

const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
  await mongoClient.connect();
  console.log("MongoDB Connected!");
} catch (err) {
  console.log(err.message);
}

const db = mongoClient.db("uoldb");

app.post("/participants", async (req, res) => {
  try {
    const { name } = req.body;
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
    const showParticipants = await db.collection("participants").find().toArray();
    return res.status(201).send(showParticipants);
  } catch (error) {
    return res.status(422).send(error.message);
  }
});

app.post("/messages", async (req,res) =>{
  const {to,text,type} = req.body
  const {User} = req.headers
  try {
    
  } catch (error) {
    
  }
});

app.get("/messages");

app.post("/status");

app.listen(process.env.PORT, () => {
  console.log(`Server running in port ${process.env.PORT}`);
});
