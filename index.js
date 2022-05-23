const express = require('express')
const jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000

// middletire 
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Manufacturer website server!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hztue.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' });
    }
    req.decoded = decoded;
    next()
  });
}

async function run() {
  try {
    await client.connect();

    const productCollection = client.db('manufacturer_portal').collection('products')
    const orderCollection = client.db('manufacturer_portal').collection('orders')
    const userCollection = client.db('manufacturer_portal').collection('users')

    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    })

    app.get('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    })

    app.get('/order', verifyJWT, async (req, res) => {
      const email = req.query.email;
      // console.log('Auth Header', authorization)
      const query = { email: email }
      const orders = await orderCollection.find(query).toArray()
      res.send(orders);
    })



    app.post('/order', verifyJWT, async (req, res) => {
      const order = req.body;
      console.log('New order', order);
      const result = await orderCollection.insertOne(order);
      console.log(result);
      res.send(result)
    })

    // create user or update user 
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      })
      // res.send(result);
      res.send({ result, token });

    })


    // app.get('/user', async (req, res) => {
    //   const users = await userCollection.find().toArray()
    //   res.send(users);
    // })



    // app.get('/inventory/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const result = await inventoryCollection.findOne(query)
    //   res.send(result);
    // })


  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


















app.listen(port, () => {
  console.log(`Manufacturer app listening on port ${port}`)
})