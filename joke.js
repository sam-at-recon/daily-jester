import { WebClient } from "@slack/web-api";
import OpenAI from "openai";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You write short, clean jokes." },
      { role: "user", content: "Write one funny joke based on current events from today." }
    ],
    max_tokens: 50
  });

  const joke = response.choices[0].message.content;

  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: joke
  });
}

run();
