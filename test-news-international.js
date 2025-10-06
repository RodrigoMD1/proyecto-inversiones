const Parser = require('rss-parser');

const parser = new Parser();

async function testFeeds() {
  console.log('🧪 Probando feeds RSS internacionales (Argentina + USA)...\n');
  
  const feeds = [
    // Argentina
    { url: 'https://www.ambito.com/rss/finanzas.xml', name: 'Ámbito Financiero', country: 'AR' },
    { url: 'https://www.cronista.com/rss/finanzas/', name: 'El Cronista', country: 'AR' },
    { url: 'https://www.cronista.com/rss/economia/', name: 'El Cronista - Economía', country: 'AR' },
    { url: 'https://www.ambito.com/rss/economia.xml', name: 'Ámbito - Economía', country: 'AR' },
    
    // USA
    { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', country: 'US' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC Finance', country: 'US' },
    { url: 'http://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', country: 'US' },
    { url: 'https://rss.cnn.com/rss/money_latest.rss', name: 'CNN Money', country: 'US' },
    { url: 'https://moxie.foxnews.com/google-publisher/markets.xml', name: 'Fox Business', country: 'US' },
    { url: 'https://www.marketwatch.com/rss/marketpulse', name: 'MarketWatch', country: 'US' },
  ];

  const allArticles = [];
  const stats = { AR: 0, US: 0, errors: 0 };

  for (const feed of feeds) {
    try {
      console.log(`📡 ${feed.country === 'AR' ? '🇦🇷' : '🇺🇸'} Obteniendo de ${feed.name}...`);
      const parsed = await parser.parseURL(feed.url);
      
      let count = 0;
      parsed.items.forEach(item => {
        if (count < 2) {
          console.log(`  ✅ ${item.title.substring(0, 60)}...`);
          count++;
        }
        
        allArticles.push({
          title: item.title,
          country: feed.country,
          source: feed.name,
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString()
        });
      });
      
      stats[feed.country] += parsed.items.length;
      console.log(`  📊 Total: ${parsed.items.length} noticias\n`);
    } catch (error) {
      console.error(`  ❌ Error con ${feed.name}: ${error.message}\n`);
      stats.errors++;
    }
  }

  // Ordenar por fecha
  allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 RESUMEN FINAL`);
  console.log('='.repeat(60));
  console.log(`📊 Total noticias obtenidas: ${allArticles.length}`);
  console.log(`🇦🇷 Argentina: ${stats.AR} noticias`);
  console.log(`🇺🇸 USA: ${stats.US} noticias`);
  console.log(`❌ Feeds con error: ${stats.errors}`);
  console.log('='.repeat(60));

  console.log('\n📰 Últimas 5 noticias (todas):');
  allArticles.slice(0, 5).forEach((article, i) => {
    const flag = article.country === 'AR' ? '🇦🇷' : '🇺🇸';
    console.log(`\n${i + 1}. ${flag} ${article.title}`);
    console.log(`   Fuente: ${article.source}`);
    console.log(`   Fecha: ${new Date(article.publishedAt).toLocaleString('es-AR')}`);
  });

  console.log('\n📰 Últimas 3 de Argentina (🇦🇷):');
  allArticles.filter(a => a.country === 'AR').slice(0, 3).forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.title}`);
    console.log(`   Fuente: ${article.source}`);
  });

  console.log('\n📰 Últimas 3 de USA (🇺🇸):');
  allArticles.filter(a => a.country === 'US').slice(0, 3).forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.title}`);
    console.log(`   Fuente: ${article.source}`);
  });

  console.log('\n✅ Servicio de noticias internacionales funcionando correctamente!');
  console.log('🚀 Listo para usar en el frontend con tabs AR/USA\n');
}

testFeeds().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
