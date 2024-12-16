const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "cred/.env") });
require("dotenv").config(); // Load environment variables


const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;

const uri = `mongodb+srv://${username}:${password}@cluster0.qj0ib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Command-line argument validation
if (process.argv.length !== 3) {
    console.log("Usage: node travel_agency.js <portNum>");
    process.exit(1);
  }
  const portNumber = process.argv[2];


// MongoDB setup
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

const databaseAndCollection = { db: dbName, collection: collectionName };

// MongoDB Functions
async function insertApplicant(client, databaseAndCollection, an_entry) {
  await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(an_entry);
}

async function lookUpTG(client, databaseAndCollection, destination) {
  let input_destination = destination.trim().toLowerCase();

  let filter = {destination : { $eq: input_destination}};

  const cursor = client.db(databaseAndCollection.db)
  .collection(databaseAndCollection.collection)
  .find(filter);

  const result = await cursor.toArray();
  return result;
}
//API function


// Express app setup
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


// Start the Express server
app.listen(portNumber, () => {
  console.log(`Web server is running at http://localhost:${portNumber}`);
  process.stdout.write(prompt);
});

// Command-line interface interpreter
const prompt = "Stop to shutdown the server: ";
process.stdin.setEncoding("utf8");

process.stdin.on("readable", () => {
  const dataInput = process.stdin.read();
  if (dataInput !== null) {
    const command = dataInput.trim();
    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0);
    } else {
      console.log(`Invalid command: ${command}`);
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});


//main function
async function main() {
  try {
    await client.connect();       //connect

// API here
app.get("/", (req, res) => {
  res.render("index", { country_info: null, error: null });
});

app.post("/", async (req, res) => {
  const country_name = req.body.country.trim().toLowerCase();
  const api_link = `https://restcountries.com/v3.1/name/${country_name}`;

  try {
    const response = await fetch(api_link);
    const data = await response.json();
    const country = data[0];

    const country_info = {
      name: country.name.common,
      capital: country.capital,
      population: country.population.toLocaleString(),
      continents: country.continents,
      languages: Object.values(country.languages).join(', '),
      currencies: Object.values(country.currencies).map(a_money => `${a_money.name} (${a_money.symbol})`).join(', '),
      flag: country.flags.svg
    };

    res.render("index", { country_info: country_info, error: null });

  } catch (error) {
    res.render("index", { country_info: null, error: error });
  }
});


  app.get("/current_trips", (req, res) => {
    res.render("current_trips");
  });

  app.get("/book_now", (req, res) => {
    res.render("book_now");
  });

  app.post("/ticket_confirmation", async (req, res) => {
    let {name, email, destination} = req.body;
    const randomTicketNumber = Math.floor(100000 + Math.random() * 900000);
    let an_entry = {name: name, email: email, randomTicketNumber:randomTicketNumber, destination: destination};
    insertApplicant(client, databaseAndCollection, an_entry);
    res.render("ticket_confirmation", an_entry);
  });
  
  app.get("/tour_groups", (req, res) => {
    res.render("tour_groups");
  });

  app.post("/display_group", async (req, res) => {
    let table;
    const destination = req.body.destination;
    const result = await lookUpTG(client, databaseAndCollection, destination);
    if (result) {
      table = 
      `<table border = '1'>
        <tr>
          <th>Name</th>
          <th>Email</th>
        </tr>`;
        result.forEach(elem => { 
          table +=
          `<tr>
            <td>${elem.name}</td>
            <td>${elem.email}</td>
          </tr>`
        });
        table += `</table>`;
    } else {
      table = `No tour groups available yet`;
    }
      const variables = {
        TGTable: table};
    res.render("display_group", variables);
  });
  }catch (err) {
    console.error("Error MongoDB", err);
    process.exit(1); // Exit the process 
  }
}

// Call the main function
main().catch(console.error); 