import { Injectable } from '@nestjs/common';
import * as Parser from 'rss-parser';

@Injectable()
export class NewsService {
  private parser = new Parser();
  private cache: any = null;
  private cacheTime = 0;

  async getNews() {
    // Sistema de caché para evitar requests excesivos (10 minutos)
    const now = Date.now();
    if (this.cache && now - this.cacheTime < 10 * 60 * 1000) {
      return this.cache;
    }

    const feeds = [
      { url: 'https://www.ambito.com/rss/finanzas.xml', name: 'Ámbito Financiero' },
      { url: 'https://www.cronista.com/rss/finanzas/', name: 'El Cronista' },
      { url: 'https://www.cronista.com/rss/economia/', name: 'El Cronista - Economía' },
      { url: 'https://www.ambito.com/rss/economia.xml', name: 'Ámbito - Economía' },
    ];

    const allArticles = [];

    for (const feed of feeds) {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        
        parsed.items.forEach(item => {
          allArticles.push({
            title: item.title,
            description: item.contentSnippet || item.content || item.summary || item.description,
            url: item.link,
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: {
              name: feed.name
            },
            image: item.enclosure?.url || item['media:thumbnail']?.$?.url || null,
          });
        });
      } catch (error) {
        console.error(`Error parsing feed ${feed.url}:`, error.message);
        // Continuar con los otros feeds si uno falla
      }
    }

    // Ordenar por fecha más reciente
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Retornar solo las últimas 20 noticias
    this.cache = {
      articles: allArticles.slice(0, 20),
      total: allArticles.length
    };
    this.cacheTime = now;
    
    return this.cache;
  }
}