const axios = require("axios");

module.exports = {
  name: "ai",
  description: "Parle avec l'IA basée sur LLaMA 3",
  usage: "/ai [message]",
  
  async execute(message, args) {
    const userMessage = args.join(" ");
    const userId = message.author?.id || "123"; // Si tu es dans un bot Discord ou web chat
    const apiUrl = "https://asios-api.vercel.app/api/llama3-8b";

    if (!userMessage) {
      return message.reply("❌ Tu dois écrire un message. Exemple : `/ai Bonjour, qui es-tu ?`");
    }

    try {
      const response = await axios.get(apiUrl, {
        params: {
          query: userMessage,
          userId: userId
        }
      });

      const aiResponse = response.data.response;
      if (!aiResponse) {
        return message.reply("🤖 L'IA n'a pas répondu.");
      }

      message.reply("🤖 " + aiResponse);
    } catch (err) {
      console.error("Erreur AI:", err.message);
      message.reply("⚠️ Une erreur est survenue lors de la communication avec l'IA.");
    }
  }
};
