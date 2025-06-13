const axios = require('axios');
const crypto = require('crypto');

exports.config = {
    name: 'ai',
    author: 'Delfa Frost',
    description: 'Discuter avec Orochi Ai',
    method: 'get',
    category: 'Intelligence Artificielle',
    link: ['/asios-chat?prompt=hello&uid=123']
};

const conversationContexts = new Map();

exports.initialize = async function ({ req, res }) {
    try {
        const prompt = req.query.prompt;
        const uid = req.query.uid;

        if (!prompt) {
            return res.json({
                response: "Erreur : ajoutez ?prompt=your_message_here",
                author: "Orochi Ai 🤖"
            });
        }

        if (!uid) {
            return res.json({
                response: "Erreur : ajoutez &uid=your_user_id",
                author: "Orochi Ai 🤖"
            });
        }

        const conversationId = crypto.createHash('md5').update(uid).digest('hex');
        let conversationContext = conversationContexts.get(conversationId) || [];

        // Limite le contexte aux 20 derniers messages
        if (conversationContext.length > 20) {
            conversationContext = conversationContext.slice(-20);
        }

        const response = await axios.get('https://asios-api.vercel.app/api/llama3-8b', {
            params: {
                query: prompt, // 🔄 correction ici : la clé doit être "query", pas "q"
                userId: uid
            }
        });

        // Mise à jour du contexte
        conversationContext.push({ role: "user", content: prompt });
        conversationContext.push({ role: "assistant", content: response.data.response });

        // Sauvegarde du contexte
        conversationContexts.set(conversationId, conversationContext);

        return res.json({
            response: response.data.response,
            author: "Orochi Ai 🤖"
        });

    } catch (error) {
        console.error("Erreur :", error.message);
        return res.json({
            response: "Une erreur s'est produite lors de la communication avec l'API.",
            author: "Orochi Ai 🤖"
        });
    }
};
