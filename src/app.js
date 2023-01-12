import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import Joi from "joi";

const app = express();
dotenv.config();
app.use(express.json());

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required()
})

const messageSchema = Joi.object({
  to: Joi.string().min(3).max(30).required(),
  text: Joi.string().min(3).required(),
  type: Joi.string().required().valid("message","private_message")
})

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
  const { name } = req.body;
  
  try {

    await userSchema.validateAsync({ name })
    
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
    await messageSchema.validateAsync({to,text,type})
    const findParticipant =  db.collection("participants").findOne({name:User})
    if(!findParticipant){
      return res.status(422).send("Usuário não encontrado!")
    }
    await db.collection("messages").insertOne({
      from: User,
      to: to,
      text: text,
      type: type,
      time: dayjs().format("hh:mm:ss")
    });
    res.sendStatus(201)
  } catch (error) {
    res.status(422).send(error.message)
  }
});

app.get("/messages", async (req,res)=>{
  const {limit} = req.query

  try {
    
  } catch (error) {
    
  }
});

app.post("/status");

app.listen(process.env.PORT, () => {
  console.log(`Server running in port ${process.env.PORT}`);
});
