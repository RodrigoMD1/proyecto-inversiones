/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const axios = require('axios');

const API_URL = (process.env.HOST_API || 'https://proyecto-inversiones.onrender.com').replace(/\/$/, '');
const BASE = `${API_URL}/api`;

async function ensureUser(email, password) {
  const loginUrl = `${BASE}/auth/login`;
  try {
    const login = await axios.post(loginUrl, { email, password });
    return login.data.token;
  } catch (e) {
    await axios.post(`${BASE}/auth/registro`, { email, password, name: 'Render E2E User' });
    const login2 = await axios.post(loginUrl, { email, password });
    return login2.data.token;
  }
}

async function getPublicPlanId() {
  try {
    const res = await axios.get(`${BASE}/payments/preapproval-plan/public`);
    return res.data?.id || null;
  } catch {
    return null;
  }
}

async function getPrivatePlanId(token) {
  try {
    const res = await axios.get(`${BASE}/payments/preapproval-plan/id`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // puede devolver { id } o { id, created, data }
    return res.data?.id || null;
  } catch {
    return null;
  }
}

async function createPlanViaBackend(token) {
  try {
    const backUrl = process.env.MP_BACK_URL || process.env.FRONTEND_URL || 'https://financepr.netlify.app';
    const body = {
      reason: process.env.MP_PLAN_REASON || 'Plan Premium Mensual',
      frequency: Number(process.env.MP_PLAN_FREQUENCY || 1),
      frequency_type: process.env.MP_PLAN_FREQUENCY_TYPE || 'months',
      transaction_amount: Number(process.env.MP_PREMIUM_PRICE || 5000),
      currency_id: process.env.MP_CURRENCY || 'ARS',
      back_url: backUrl
    };
    const res = await axios.post(`${BASE}/payments/preapproval-plan`, body, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data?.id || null;
  } catch {
    return null;
  }
}

async function createPlanViaMP() {
  const url = 'https://api.mercadopago.com/preapproval_plan';
  const backUrl = process.env.MP_BACK_URL || process.env.FRONTEND_URL || 'https://financepr.netlify.app';
  const payload = {
    reason: process.env.MP_PLAN_REASON || 'Plan Premium Mensual',
    auto_recurring: {
      frequency: Number(process.env.MP_PLAN_FREQUENCY || 1),
      frequency_type: process.env.MP_PLAN_FREQUENCY_TYPE || 'months',
      transaction_amount: Number(process.env.MP_PREMIUM_PRICE || 5000),
      currency_id: process.env.MP_CURRENCY || 'ARS'
    },
    back_url: backUrl
  };
  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data?.id || null;
  } catch (e) {
    console.error('MP error creating plan:', e.response?.data || e.message);
    throw e;
  }
}

async function overridePlanId(planId, token) {
  await axios.post(
    `${BASE}/payments/preapproval-plan/override`,
    { id: planId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function createTestCardToken() {
  const pub = process.env.MP_PUBLIC_KEY;
  const res = await axios.post(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${pub}`,
    {
      card_number: '5031433215406351',
      security_code: '123',
      expiration_month: 12,
      expiration_year: 2030,
      cardholder: {
        name: 'APRO',
        identification: { type: 'DNI', number: '12345678' }
      }
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data?.id || null;
}

async function authorize(planId, cardTokenId, token) {
  const backUrl = process.env.MP_BACK_URL || process.env.FRONTEND_URL || 'https://financepr.netlify.app';
  const res = await axios.post(
    `${BASE}/payments/preapproval/authorize`,
    { preapproval_plan_id: planId, card_token_id: cardTokenId, back_url: backUrl },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function authorizeDirectMP(planId, cardTokenId, payerEmail) {
  const url = 'https://api.mercadopago.com/preapproval';
  const backUrl = process.env.MP_BACK_URL || process.env.FRONTEND_URL || 'https://financepr.netlify.app';
  const payload = {
    preapproval_plan_id: planId,
    reason: 'Suscripción con plan asociado',
    external_reference: payerEmail,
    payer_email: payerEmail,
    card_token_id: cardTokenId,
    auto_recurring: {},
    back_url: backUrl,
    status: 'authorized'
  };
  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (e) {
    console.error('MP direct authorize error:', e.response?.data || e.message);
    throw e;
  }
}

async function createCustomer(email) {
  const res = await axios.post(
    'https://api.mercadopago.com/v1/customers',
    { email },
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  );
  return res.data?.id;
}

async function addCardToCustomer(customerId, cardTokenId) {
  const res = await axios.post(
    `https://api.mercadopago.com/v1/customers/${customerId}/cards`,
    { token: cardTokenId },
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  );
  return res.data?.id;
}

async function authorizeDirectMPWithCustomer(planId, customerId, cardId, payerEmail) {
  const url = 'https://api.mercadopago.com/preapproval';
  const backUrl = process.env.MP_BACK_URL || process.env.FRONTEND_URL || 'https://financepr.netlify.app';
  const payload = {
    preapproval_plan_id: planId,
    reason: 'Suscripción con plan asociado',
    external_reference: payerEmail,
    payer_email: payerEmail,
    payer_id: customerId,
    card_id: cardId,
    auto_recurring: {},
    back_url: backUrl,
    status: 'authorized'
  };
  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (e) {
    console.error('MP direct authorize with customer error:', e.response?.data || e.message);
    throw e;
  }
}

async function currentSubscription(token) {
  const res = await axios.get(`${BASE}/subscriptions/current`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function main() {
  try {
    console.log(`API: ${API_URL}`);

    // 1) Asegurar usuario
    const email = process.env.TEST_EMAIL || 'render.e2e.user@example.com';
    const password = process.env.TEST_PASSWORD || 'Abc12345a';
    console.log('🔐 Login/registro usuario...');
    const jwt = await ensureUser(email, password);
    console.log('✅ Usuario listo');

    // 2) Obtener plan público
  console.log('🔎 Obteniendo plan (público o privado)...');
  let planId = await getPublicPlanId();
  if (!planId) planId = await getPrivatePlanId(jwt);
  console.log('Plan actual:', planId || '(ninguno)');

    // 3) Si no hay plan, intentar crearlo directo en MP y luego override
    if (!planId) {
      console.log('⚠️ Sin plan; intentando crearlo via backend...');
      const backendPlan = await createPlanViaBackend(jwt);
      if (backendPlan) {
        planId = backendPlan;
        console.log('✅ Plan creado por backend:', planId);
      } else {
        console.log('⚠️ Backend no pudo crear plan; creando directo en MP...');
        try {
          const createdPlanId = await createPlanViaMP();
          console.log('✅ Plan creado en MP:', createdPlanId);
          console.log('🔁 Override en backend...');
          await overridePlanId(createdPlanId, jwt);
          planId = createdPlanId;
          console.log('✅ Override listo');
        } catch (e) {
          console.error('❌ No se pudo crear el plan en MP directamente.');
          if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data));
          } else {
            console.error(e.message);
          }
          process.exit(2);
        }
      }
    }

    // 4) Crear card token de prueba
    console.log('💳 Creando card token de prueba...');
    const cardTokenId = await createTestCardToken();
    if (!cardTokenId) {
      console.error('❌ No se pudo generar card token');
      process.exit(3);
    }
    console.log('✅ Card token:', cardTokenId);

    // 5) Autorizar
    console.log('📝 Autorizando suscripción...');
    let authRes;
    try {
      authRes = await authorize(planId, cardTokenId, jwt);
      console.log('✅ Autorizado:', authRes.id, authRes.status);
    } catch (e) {
      console.error('Backend authorize  error:', e.response?.data || e.message);
      console.log('🔍 Probando autorización directa en MP (card_token_id)...');
      try {
        authRes = await authorizeDirectMP(planId, cardTokenId, email);
        console.log('✅ MP directo Autorizado:', authRes.id, authRes.status);
      } catch (e2) {
        console.log('🔁 Intentando con customer/card_id...');
        const customerId = await createCustomer(email);
        const cardId = await addCardToCustomer(customerId, cardTokenId);
        authRes = await authorizeDirectMPWithCustomer(planId, customerId, cardId, email);
        console.log('✅ MP directo con customer Autorizado:', authRes.id, authRes.status);
      }
    }

    // 6) Verificar suscripción
    const sub = await currentSubscription(jwt);
    console.log('📦 Suscripción actual:', JSON.stringify(sub));
  } catch (err) {
    console.error('❌ E2E fallo');
    const status = err.response?.status;
    const data = err.response?.data;
    if (status) console.error('HTTP Status:', status);
    if (data) console.error('Response:', JSON.stringify(data));
    if (!status && !data) console.error(err.message);
    process.exit(1);
  }
}

main();
