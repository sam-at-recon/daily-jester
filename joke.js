import { WebClient } from "@slack/web-api";
import OpenAI from "openai";

// Node 20 supports fetch natively
const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, OPENAI_API_KEY, WEATHER_API_KEY, CITY_NAME } = process.env;

if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID || !OPENAI_API_KEY || !WEATHER_API_KEY || !CITY_NAME) {
  console.error("Missing one of the required environment variables: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, OPENAI_API_KEY, WEATHER_API_KEY, CITY_NAME");
  process.exit(1);
}

const slack = new WebClient(SLACK_BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Fetch real weather from WeatherAPI
async function getWeather(city) {
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.current || !data.location) throw new Error("Invalid response from WeatherAPI");

    return {
      temp: data.current.temp_f,
      condition: data.current.condition.text,
      city: data.location.name,
      region: data.location.region
    };
  } catch (err) {
    console.error("Error fetching weather:", err);
    return null;
  }
}

async function run() {
  try {
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const weather = await getWeather(CITY_NAME);

    let weatherText = "I couldn't get the weather today, but it's probably fine!";
    if (weather) {
      weatherText = `The weather in ${weather.city}, ${weather.region} is ${weather.condition} with a temperature of ${weather.temp}°F.`;
    }

    // GPT prompt: make it funny
    const prompt = `
You are a witty cat that writes daily messages.
Today's date is ${dateStr}.
Weather info: ${weatherText}

Write a short Slack message from the perspective of a cat using cat-like voice that:
1. Gives the date in a funny way
2. Gives a comedic comment about today's weather
3. Ends with a short, clean joke
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are witty and humorous, writing short Slack messages from the perspective of a cat." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200
    });

    const message = response.choices?.[0]?.message?.content?.trim();
    if (!message) throw new Error("OpenAI did not return a message.");

    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: message
    });

    console.log("Daily Jester sent:", message);
  } catch (err) {
    console.error("Error running Daily Jester:", err);
    process.exit(1);
  }
}

run();
