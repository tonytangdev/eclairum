import axios from "axios";

export const serverApi = axios.create({
  baseURL: process.env.SERVER_API_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.SERVER_API_KEY,
  },
});
