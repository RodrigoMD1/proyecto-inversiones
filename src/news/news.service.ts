import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class NewsService {
  private cache: any = null;
  private cacheTime = 0;

  async getNews() {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < 10 * 60 * 1000) {
      return this.cache;
    }
    const apiKey = 'd76c3a701981f986107bfbce75eb32dd';
    const businessUrl = `https://gnews.io/api/v4/top-headlines?category=business&lang=es&max=5&token=${apiKey}`;
    const techUrl = `https://gnews.io/api/v4/top-headlines?category=technology&lang=es&max=5&token=${apiKey}`;

    const [businessRes, techRes] = await Promise.all([
      fetch(businessUrl).then(res => res.json()),
      fetch(techUrl).then(res => res.json()),
    ]);

    const cryptoNews = (techRes.articles || []).filter(
      (item: any) =>
        /crypto|bitcoin|ethereum|blockchain/i.test(item.title + " " + item.description)
    );

    this.cache = { articles: [...(businessRes.articles || []), ...cryptoNews] };
    this.cacheTime = now;
    return this.cache;
  }
}