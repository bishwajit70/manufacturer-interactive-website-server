const express = require('express')
const jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const userProfileCollection = client.db('manufacturer_portal').collection('userProfiles')
    const userReviewCollection = client.db('manufacturer_portal').collection('reviews')

    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    })

    app.post('/product', async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      console.log(result);
      res.send(result)
    })

    // purchase api 
    app.get('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    })

    // payment api 
    app.get('/payment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    })

    // app.post('/create-payment-intent', async(req,res)=>{
    //   const orders = req.body;
    //   const unitprice = orders.unitprice;
    //   const amount = unitprice*100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: 'usd',
    //     payment_method_types: ['card'],
    //   });

    //   res.send({clientSecret: paymentIntent.client_secret});
    // })





    // delete an order 
    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })

    // delete an order 
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })

    // delete a product 
    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/order', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email }
        const orders = await orderCollection.find(query).toArray()
        return res.send(orders);
      }
      else {
        return res.status(403).send({ message: 'Forbidden Access' })
      }

    })

    // post an order api 
    app.post('/order', verifyJWT, async (req, res) => {
      const order = req.body;
      console.log('New order', order);
      const result = await orderCollection.insertOne(order);
      console.log(result);
      res.send(result)
    })

    // get all orders api 
    app.get('/orders', async (req, res) => {
      const orders = await orderCollection.find().toArray()
      console.log(orders)
      res.send(orders)
    })


    app.get('/users', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users);
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

    
    app.get('/profile/:email', async (req, res) => {
      const email = req.params.email;
      const profile = await userProfileCollection.findOne({ email: email })
      res.send(profile)
    })

    // create or update profile 
    app.put('/profile/:email', async (req, res) => {
      const email = req.params.email;
      const userProfile = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: userProfile,
      };
      const result = await userProfileCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      })
      // res.send(result);
      res.send({ result, token });
    })

    // post review 
    app.post('/review', async (req, res) => {
      const userReview = req.body;
      console.log('New Review', userReview);
      const result = await userReviewCollection.insertOne(userReview);
      console.log(result);
      res.send(result)
    })

    // get all reviews 
    app.get('/review', async (req, res) => {
      const query = {}
      const reviews = await userReviewCollection.find(query).toArray()
      res.send(reviews);
    })

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email })
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })

    // create admin an user 
    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else {
        res.status(403).send({ message: 'Forbidden Access' })
      }

    })







  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


















app.listen(port, () => {
  console.log(`Manufacturer app listening on port ${port}`)
})