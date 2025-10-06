import { Injectable } from '@nestjs/common';
import * as Parser from 'rss-parser';

interface FeedSource {
  url: string;
  name: string;
  country: 'AR' | 'US';
}

@Injectable()
export class NewsService {
  private parser = new Parser();
  private cache: { articles: any[]; timestamp: number } = null;
  private CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  // Lista de feeds RSS con país de origen
  private feeds: FeedSource[] = [
    // ========== ARGENTINA ==========
    { 
      url: 'https://www.ambito.com/rss/finanzas.xml', 
      name: 'Ámbito Financiero',
      country: 'AR'
    },
    { 
      url: 'https://www.cronista.com/rss/finanzas/', 
      name: 'El Cronista',
      country: 'AR'
    },
    { 
      url: 'https://www.cronista.com/rss/economia/', 
      name: 'El Cronista - Economía',
      country: 'AR'
    },
    { 
      url: 'https://www.ambito.com/rss/economia.xml', 
      name: 'Ámbito - Economía',
      country: 'AR'
    },

    // ========== USA ==========
    { 
      url: 'https://feeds.bloomberg.com/markets/news.rss', 
      name: 'Bloomberg Markets',
      country: 'US'
    },
    { 
      url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 
      name: 'CNBC Finance',
      country: 'US'
    },
    { 
      url: 'http://feeds.reuters.com/reuters/businessNews', 
      name: 'Reuters Business',
      country: 'US'
    },
    { 
      url: 'https://rss.cnn.com/rss/money_latest.rss', 
      name: 'CNN Money',
      country: 'US'
    },
    { 
      url: 'https://moxie.foxnews.com/google-publisher/markets.xml', 
      name: 'Fox Business',
      country: 'US'
    },
    { 
      url: 'https://www.marketwatch.com/rss/marketpulse', 
      name: 'MarketWatch',
      country: 'US'
    },
  ];

  async getNews(country?: 'AR' | 'US') {
    // Verificar si hay cache válido
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      console.log('✅ Usando cache de noticias');
      
      if (country) {
        const filtered = this.cache.articles.filter(a => a.country === country);
        return {
          articles: filtered.slice(0, 20),
          total: filtered.length,
          byCountry: {
            argentina: this.cache.articles.filter(a => a.country === 'AR').length,
            usa: this.cache.articles.filter(a => a.country === 'US').length
          }
        };
      }
      
      return {
        articles: this.cache.articles.slice(0, 20),
        total: this.cache.articles.length,
        byCountry: {
          argentina: this.cache.articles.filter(a => a.country === 'AR').length,
          usa: this.cache.articles.filter(a => a.country === 'US').length
        }
      };
    }

    console.log('🔄 Obteniendo noticias frescas de RSS...');

    const allArticles = [];

    // Filtrar feeds por país si se especifica
    const feedsToFetch = country 
      ? this.feeds.filter(feed => feed.country === country)
      : this.feeds;

    for (const feed of feedsToFetch) {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        
        parsed.items.forEach(item => {
          allArticles.push({
            title: item.title,
            description: item.contentSnippet || item.content || item.summary || item.description || '',
            url: item.link,
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: {
              name: feed.name
            },
            country: feed.country,
            image: item.enclosure?.url || item['media:thumbnail']?.$?.url || null,
          });
        });
      } catch (error) {
        console.error(`Error parsing feed ${feed.name} (${feed.url}):`, error.message);
        // Continuar con los otros feeds si uno falla
      }
    }

    // Ordenar por fecha más reciente
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Guardar en cache
    this.cache = {
      articles: allArticles,
      timestamp: Date.now()
    };

    return {
      articles: allArticles.slice(0, 20),
      total: allArticles.length,
      byCountry: {
        argentina: allArticles.filter(a => a.country === 'AR').length,
        usa: allArticles.filter(a => a.country === 'US').length
      }
    };
  }

  // Método específico para noticias de Argentina
  async getArgentinaNews() {
    return this.getNews('AR');
  }

  // Método específico para noticias de USA
  async getUSANews() {
    return this.getNews('US');
  }
}