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

    await db
      .collection("messages")
      .insertOne({
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format("hh:mm:ss")
      });
      res.sendStatus(201)

  } catch (err) {
    res.status(422).send(err.message);
    return
  }
});

app.get("/participants");

app.post("/messages");

app.get("/messages");

app.post("/status");

app.listen(process.env.PORT, () => {
  console.log(`Server running in port ${process.env.PORT}`);
});
