import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

try {
    await client.connect();

    console.log("PG CONNECTED");

    const result = await client.query("SELECT NOW()");

    console.log(result.rows);

    await client.end();

} catch (error) {

    console.error("PG CONNECTION FAILED");
    console.error(error);
}