// Test script para probar el endpoint POST /api/portfolio localmente
// Ejecutar con: node test-create-portfolio.js

const testData = {
  name: "Test Asset",
  description: "Descripción de prueba",
  type: "Acción",
  quantity: 10,
  purchase_price: 100.50,
  purchase_date: "2025-10-13",
  ticker: "AAPL"
};

console.log('📦 Datos que debería enviar el frontend:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n📋 Validaciones del DTO:');
console.log('- name:', typeof testData.name === 'string' ? '✅' : '❌', testData.name);
console.log('- description:', typeof testData.description === 'string' ? '✅' : '❌', testData.description);
console.log('- type:', typeof testData.type === 'string' ? '✅' : '❌', testData.type);
console.log('- quantity:', typeof testData.quantity === 'number' ? '✅' : '❌', testData.quantity, `(${typeof testData.quantity})`);
console.log('- purchase_price:', typeof testData.purchase_price === 'number' ? '✅' : '❌', testData.purchase_price, `(${typeof testData.purchase_price})`);
console.log('- purchase_date:', typeof testData.purchase_date === 'string' ? '✅' : '❌', testData.purchase_date);
console.log('- ticker:', typeof testData.ticker === 'string' ? '✅' : '❌', testData.ticker);

console.log('\n❌ Ejemplo de datos INCORRECTOS que causarían 400:');
const badData = {
  name: "Test Asset",
  description: "Descripción de prueba",
  type: "Acción",
  quantity: "10",  // ❌ String en vez de number
  purchase_price: "100.50",  // ❌ String en vez de number
  purchase_date: "2025-10-13",
  ticker: "AAPL"
};

console.log(JSON.stringify(badData, null, 2));
console.log('- quantity:', typeof badData.quantity === 'number' ? '✅' : '❌', badData.quantity, `(${typeof badData.quantity})`);
console.log('- purchase_price:', typeof badData.purchase_price === 'number' ? '✅' : '❌', badData.purchase_price, `(${typeof badData.purchase_price})`);

console.log('\n💡 Si el frontend está enviando strings, necesita convertir:');
console.log('  quantity: Number(formData.quantity) o parseFloat(formData.quantity)');
console.log('  purchase_price: Number(formData.purchase_price) o parseFloat(formData.purchase_price)');
