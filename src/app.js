import express from "express"
import dotenv from "dotenv"
import { MongoClient } from "mongodb"


const app = express()
dotenv.config()
app.use(express.json())

app.listen(process.env.PORT, () =>{
    console.log(`Server running in port ${process.env.PORT}`)
})