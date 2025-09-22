/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.HOST_API?.replace(/\/$/, '') || 'http://localhost:3000';
const BASE = `${API_URL}/api`;

async function ensureUser(email, password) {
  try {
    const login = await axios.post(`${BASE}/auth/login`, { email, password });
    return login.data.token;
  } catch (e) {
    // intentar registro
    try {
      await axios.post(`${BASE}/auth/registro`, {
        email,
        password,
        name: 'Test User Preapproval Plan'
      });
      const login2 = await axios.post(`${BASE}/auth/login`, { email, password });
      return login2.data.token;
    } catch (e2) {
      throw e2;
    }
  }
}

async function main() {
  try {
    console.log('🧪 Test: Crear preapproval_plan en Mercado Pago');

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

    // 2) Crear plan
    console.log('📝 Creando preapproval_plan...');
    const body = {
      reason: 'Plan Premium Mensual',
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: Number(process.env.TEST_PLAN_AMOUNT || 5000),
      currency_id: process.env.TEST_CURRENCY || 'ARS',
      back_url: process.env.TEST_BACK_URL || 'http://localhost:5173/suscripcion/resultado'
    };

    const res = await axios.post(`${BASE}/payments/preapproval-plan`, body, { headers });
    console.log('✅ Plan creado');
    console.log('ID del plan:', res.data.id);
    console.log('Respuesta completa:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    const code = err.code;
    console.error('❌ Error creando plan');
    if (status) console.error('HTTP Status:', status);
    if (data) console.error('Response:', JSON.stringify(data, null, 2));
    if (!status && !data) console.error('Error code:', code, 'Message:', err.message);
    process.exit(1);
  }
}

main();
