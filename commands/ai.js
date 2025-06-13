const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Vérification webhook (Facebook)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook vérifié");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Réception de messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (event.message && event.message.text) {
          const senderId = event.sender.id;
          const userMessage = event.message.text;

          // Appel à l'API IA
          const aiResponse = await getAIResponse(userMessage, senderId);

          // Réponse à l'utilisateur
          await sendMessage(senderId, aiResponse);
        }
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Fonction pour appeler l'IA
async function getAIResponse(query, userId) {
  try {
    const res = await axios.get("https://asios-api.vercel.app/api/llama3-8b", {
      params: { query, userId },
    });
    return res.data.response || "Je n'ai pas compris.";
  } catch (e) {
    console.error("Erreur IA:", e.message);
    return "Désolé, une erreur est survenue.";
  }
}

// Fonction pour envoyer un message avec Send API Facebook
async function sendMessage(recipientId, messageText) {
  const payload = {
    recipient: { id: recipientId },
    message: { text: messageText },
  };

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      payload
    );
  } catch (err) {
    console.error("Erreur d'envoi:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Bot lancé sur le port", PORT));
