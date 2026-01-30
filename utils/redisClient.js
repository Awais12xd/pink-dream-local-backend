// lib/redisClient.js
const { createClient } = require("redis");
const dotenv = require("dotenv");

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const client = createClient({ url: redisUrl });
// const redis = new Redis({
//   url: 'https://peaceful-sheep-61052.upstash.io',
//   token: '********',
// })
client.on("error", (err) => console.error("Redis Client Error", err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

const getJSON = async (key) => {
  const v = await client.get(key);
  return v ? JSON.parse(v) : null;
};

const setJSON = async (key, value, ttlSeconds = 600) => {
  const s = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await client.setEx(key, ttlSeconds, s);
  } else {
    await client.set(key, s);
  }
};

const delKey = async (key) => {
  return client.del(key);
};

module.exports = {
  client,
  connectRedis,
  getJSON,
  setJSON,
  delKey,
};
