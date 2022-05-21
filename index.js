const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000

// middletire 
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Manufacturer website server!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hztue.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

async function run() {
  try {
    await client.connect();
    
    const productCollection = client.db('manufacturer_portal').collection('products')

    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
  })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


















app.listen(port, () => {
  console.log(`Manufacturer app listening on port ${port}`)
})