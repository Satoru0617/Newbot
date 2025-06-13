const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Route pour vérifier le webhook (Facebook)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook vérifié");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Réception de messages Facebook
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (event.message && event.message.text) {
          const senderId = event.sender.id;
          const userMessage = event.message.text;

          const aiResponse = await askOpenAI(userMessage);
          await sendMessage(senderId, aiResponse);
        }
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Fonction OpenAI (GPT-4 ou GPT-3.5 selon ta clé)
async function askOpenAI(userText) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", // ou "gpt-4" si disponible
        messages: [{ role: "user", content: userText }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erreur OpenAI:", error.response?.data || error.message);
    return "Désolé, je ne peux pas répondre pour le moment.";
  }
}

// Fonction d’envoi de message Facebook
async function sendMessage(recipientId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text }
      }
    );
  } catch (err) {
    console.error("Erreur d'envoi à Messenger:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🤖 Bot Facebook avec OpenAI en ligne sur le port", PORT);
});
