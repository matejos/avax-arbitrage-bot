import { config } from 'dotenv'

config();

const privateKey = process.env.PRIVATE_KEY;
console.log('key', privateKey)