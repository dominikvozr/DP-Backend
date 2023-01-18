import { config } from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MongoClient, ServerApiVersion } = require('mongodb');

config();
console.log(process.env.DB_URI);

const uri =
    'mongodb+srv://dp_turbo_user:<password>@cluster0.6vwhkfu.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
    const collection = client.db('test').collection('devices');
    // perform actions on the collection object
    client.close();
});