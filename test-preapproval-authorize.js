/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.HOST_API?.replace(/\/$/, '') || 'http://localhost:3000';
const BASE = `${API_URL}/api`;

async function ensureUser(email, password) {
  const loginUrl = `${BASE}/auth/login`;
  try {
    const login = await axios.post(loginUrl, { email, password });
    return login.data.token;
  } catch (e) {
    try {
      await axios.post(`${BASE}/auth/registro`, { email, password, name: 'Test User Preapproval Authorize' });
      const login2 = await axios.post(loginUrl, { email, password });
      return login2.data.token;
    } catch (e2) {
      throw e2;
    }
  }
}

async function main() {
  try {
    console.log('🧪 Test: Autorizar suscripción con plan + card token');

    // 1) Login
    console.log('🔐 Login...');
    const email = process.env.TEST_EMAIL || 'test.portfolio.user@example.com';
    const password = process.env.TEST_PASSWORD || 'TestPassword123!';
    const token = await ensureUser(email, password);
    console.log('✅ Login OK');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const preapproval_plan_id = process.env.TEST_PREAPPROVAL_PLAN_ID; // setear antes de correr
    const card_token_id = process.env.TEST_CARD_TOKEN_ID; // generado por Bricks Card en el front

    if (!preapproval_plan_id || !card_token_id) {
      console.error('❌ Falta TEST_PREAPPROVAL_PLAN_ID o TEST_CARD_TOKEN_ID en el .env');
      process.exit(1);
    }

    // 2) Autorizar suscripción
    console.log('📝 Autorizando suscripción...');
    const body = {
      preapproval_plan_id,
      card_token_id,
      back_url: process.env.TEST_BACK_URL || 'http://localhost:5173/suscripcion/resultado'
    };

    const res = await axios.post(`${BASE}/payments/preapproval/authorize`, body, { headers });
    console.log('✅ Suscripción autorizada');
    console.log('Preapproval ID:', res.data.id);
    console.log('Status:', res.data.status);
    console.log('Respuesta completa:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    const code = err.code;
    console.error('❌ Error autorizando suscripción');
    if (status) console.error('HTTP Status:', status);
    if (data) console.error('Response:', JSON.stringify(data, null, 2));
    if (!status && !data) console.error('Error code:', code, 'Message:', err.message);
    process.exit(1);
  }
}

main();
