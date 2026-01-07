import { WebClient } from "@slack/web-api";
import OpenAI from "openai";

// Make sure these env vars exist
const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, OPENAI_API_KEY } = process.env;

if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID || !OPENAI_API_KEY) {
  console.error("Missing one of the required environment variables: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, OPENAI_API_KEY");
  process.exit(1);
}

const slack = new WebClient(SLACK_BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function run() {
  try {
    // Generate the joke
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You write short, clean jokes." },
        { role: "user", content: "Write one funny joke based on current events from today." }
      ],
      max_tokens: 50
    });

    const joke = response.choices?.[0]?.message?.content?.trim();
    if (!joke) {
      throw new Error("OpenAI did not return a joke.");
    }

    // Send joke to Slack
    const result = await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID, // must be channel ID like C12345678
      text: joke
    });

    console.log(`Joke sent to Slack channel ${SLACK_CHANNEL_ID}: ${joke}`);
  } catch (err) {
    console.error("Error running Daily Jester:", err);
    process.exit(1); // ensures GitHub Action fails if there’s an error
  }
}

run();
