const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Função auxiliar para fazer o hash SHA256 (Meta exige hash minúsculo e sem espaços)
function hashData(data) {
  if (!data) return undefined;
  const cleanData = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(cleanData).digest('hex');
}

app.post('/api/track', async (req, res) => {
  try {
    const { eventName, userData, customData } = req.body;

    const pixelId = process.env.META_PIXEL_ID;
    const token = process.env.META_CAPI_TOKEN;

    if (!pixelId || !token) {
      console.warn('⚠️ Token ou Pixel ID não configurados no .env!');
      return res.status(500).json({ error: 'Configurações de ambiente ausentes no .env' });
    }

    // Preparando os dados sensíveis do usuário com HASH (SHA256)
    // O Agent (navegador) e o IP não precisam de hash.
    const hashedUserData = {
      em: [hashData(userData?.email)],
      ph: [hashData(userData?.phone)],
      fn: [hashData(userData?.firstName)],
      ct: [hashData(userData?.city)],
      client_user_agent: userData?.userAgent || req.headers['user-agent'],
      client_ip_address: userData?.ipAddress || req.ip || '127.0.0.1'
    };

    // Removendo campos vazios
    Object.keys(hashedUserData).forEach(key => {
      if (hashedUserData[key] === undefined || (Array.isArray(hashedUserData[key]) && hashedUserData[key][0] === undefined)) {
        delete hashedUserData[key];
      }
    });

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: hashedUserData,
          custom_data: customData || {}
        }
      ]
    };

    console.log(`\n🚀 [CAPI] Preparando disparo do evento: ${eventName}...`);
    console.log('📦 Payload Seguro (Hasheado):', JSON.stringify(payload, null, 2));

    // Descomente a linha abaixo e comente a de baixo dela para testar de verdade quando o Token for válido
    // const response = await axios.post(`https://graph.facebook.com/v19.0/${pixelId}/events`, payload, { params: { access_token: token } });
    
    console.log('✅ [MOCK CAPI] Evento processado pelo Node.js com sucesso! (O disparo final está comentado para evitar erros de token inválido no teste inicial)');
    
    // res.status(200).json({ success: true, metaResponse: response.data });
    res.status(200).json({ success: true, mockResponse: 'Disparo simulado com sucesso!' });

  } catch (error) {
    console.error('❌ [CAPI] Erro ao enviar evento:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    res.status(500).json({ success: false, error: 'Erro de comunicação' });
  }
});

app.listen(PORT, () => {
  console.log(`
=========================================
🟢 SERVIDOR IKIAPP (BACKEND CAPI)
=========================================
O servidor está ouvindo na porta ${PORT}.
Para testar, clique nos botões do index-aula.html
=========================================
  `);
});
