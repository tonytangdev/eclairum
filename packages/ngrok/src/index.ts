import ngrok from "ngrok";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN;

/**
 * Starts an ngrok tunnel to expose the local server to the internet
 * @returns Promise that resolves with the public URL
 */
export async function startNgrokTunnel(): Promise<string> {
  try {
    // Configure and start ngrok
    const url = await ngrok.connect({
      proto: "http",
      addr: PORT,
      authtoken: NGROK_AUTH_TOKEN,
      region: "us",
    });

    console.log(`Ngrok tunnel started at: ${url}`);
    return url;
  } catch (error) {
    console.error("Error starting ngrok tunnel:", error);
    throw error;
  }
}

/**
 * Stops the ngrok tunnel
 */
export function stopNgrokTunnel(): Promise<void> {
  return ngrok.kill();
}

// Run the ngrok tunnel
startNgrokTunnel();
