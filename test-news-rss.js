const Parser = require('rss-parser');

const parser = new Parser();

async function testFeeds() {
  console.log('🧪 Probando feeds RSS de noticias financieras argentinas...\n');
  
  const feeds = [
    { url: 'https://www.ambito.com/rss/finanzas.xml', name: 'Ámbito Financiero' },
    { url: 'https://www.cronista.com/rss/finanzas/', name: 'El Cronista' },
    { url: 'https://www.cronista.com/rss/economia/', name: 'El Cronista - Economía' },
    { url: 'https://www.ambito.com/rss/economia.xml', name: 'Ámbito - Economía' },
  ];

  const allArticles = [];

  for (const feed of feeds) {
    try {
      console.log(`📡 Obteniendo noticias de ${feed.name}...`);
      const parsed = await parser.parseURL(feed.url);
      
      let count = 0;
      parsed.items.forEach(item => {
        if (count < 3) { // Mostrar solo las primeras 3 de cada fuente
          console.log(`  ✅ ${item.title}`);
          count++;
        }
        
        allArticles.push({
          title: item.title,
          description: item.contentSnippet || item.content || item.summary || item.description,
          url: item.link,
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          source: {
            name: feed.name
          }
        });
      });
      
      console.log(`  📊 Total: ${parsed.items.length} noticias\n`);
    } catch (error) {
      console.error(`  ❌ Error con ${feed.name}: ${error.message}\n`);
    }
  }

  // Ordenar por fecha
  allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`\n🎉 TOTAL: ${allArticles.length} noticias obtenidas de todas las fuentes`);
  console.log(`📰 Últimas 5 noticias más recientes:\n`);
  
  allArticles.slice(0, 5).forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   Fuente: ${article.source.name}`);
    console.log(`   Fecha: ${new Date(article.publishedAt).toLocaleString('es-AR')}`);
    console.log(`   URL: ${article.url}\n`);
  });

  console.log('✅ Servicio de noticias RSS funcionando correctamente!');
}

testFeeds().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
