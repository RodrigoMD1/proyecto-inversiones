import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioItem } from './entities/portfolio.entity';
import {
  CompleteReportData,
  ExecutiveSummary,
  DistributionByType,
  AssetDetail,
  TopPerformer,
  DiversificationAnalysis,
  RiskAnalysis,
  Recommendation,
} from './dto/report-analysis.dto';

@Injectable()
export class ReportAnalysisService {
  constructor(
    @InjectRepository(PortfolioItem)
    private portfolioItemRepository: Repository<PortfolioItem>,
  ) {}

  async generateCompleteReportData(userId: string): Promise<CompleteReportData> {
    const portfolioItems = await this.portfolioItemRepository.find({
      where: { user: { id: userId } },
    });

    if (portfolioItems.length === 0) {
      throw new Error('Portfolio vacío');
    }

    // Calcular datos de assets
    const assets = this.calculateAssetDetails(portfolioItems);
    
    // Calcular distribución
    const distribution = this.calculateDistribution(assets);
    
    // Calcular resumen ejecutivo
    const summary = this.calculateExecutiveSummary(assets, distribution);
    
    // Top performers
    const { topPerformers, bottomPerformers, performanceStats } = 
      this.calculateTopPerformers(assets);
    
    // Análisis de diversificación
    const diversificationAnalysis = this.analyzeDiversification(assets, summary.totalValue);
    
    // Análisis de riesgo
    const riskAnalysis = this.analyzeRisk(assets, distribution, diversificationAnalysis);
    
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(
      summary,
      diversificationAnalysis,
      riskAnalysis,
      assets,
    );

    // Obtener usuario para email
    const user = await portfolioItems[0].user;

    return {
      userEmail: user.email,
      generatedAt: new Date().toISOString(),
      reportId: `RPT-${Date.now()}-${userId.substring(0, 8)}`,
      version: '2.0',
      summary,
      distribution,
      assets,
      topPerformers,
      bottomPerformers,
      performanceStats,
      diversificationAnalysis,
      riskAnalysis,
      recommendations,
    };
  }

  private calculateAssetDetails(portfolioItems: PortfolioItem[]): AssetDetail[] {
    return portfolioItems.map(item => {
      // Simular precio actual (en producción vendría de una API de precios)
      const currentPrice = item.purchase_price * (1 + (Math.random() * 0.4 - 0.2)); // ±20% de variación simulada
      const investedValue = item.purchase_price * item.quantity;
      const currentValue = currentPrice * item.quantity;
      const gainLoss = currentValue - investedValue;
      const gainLossPercentage = (gainLoss / investedValue) * 100;
      
      const purchaseDate = item.purchase_date || new Date();
      const daysHeld = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ticker: item.ticker || item.name.substring(0, 4).toUpperCase(),
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        purchasePrice: item.purchase_price,
        currentPrice: currentPrice,
        investedValue: investedValue,
        currentValue: currentValue,
        gainLoss: gainLoss,
        gainLossPercentage: gainLossPercentage,
        daysHeld: daysHeld,
      };
    });
  }

  private calculateDistribution(assets: AssetDetail[]): DistributionByType[] {
    const distributionMap = new Map<string, { value: number; count: number }>();

    assets.forEach(asset => {
      const existing = distributionMap.get(asset.type) || { value: 0, count: 0 };
      distributionMap.set(asset.type, {
        value: existing.value + asset.currentValue,
        count: existing.count + 1,
      });
    });

    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    return Array.from(distributionMap.entries()).map(([type, data]) => ({
      type,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      count: data.count,
    }));
  }

  private calculateExecutiveSummary(
    assets: AssetDetail[],
    _distribution: DistributionByType[],
  ): ExecutiveSummary {
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalInvested = assets.reduce((sum, a) => sum + a.investedValue, 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercentage = (totalGainLoss / totalInvested) * 100;

    // Encontrar mejor y peor activo
    const sortedByPerformance = [...assets].sort(
      (a, b) => b.gainLossPercentage - a.gainLossPercentage,
    );
    const bestAsset = sortedByPerformance[0];
    const worstAsset = sortedByPerformance[sortedByPerformance.length - 1];

    // Calcular concentración máxima
    const maxConcentration = Math.max(...assets.map(a => (a.currentValue / totalValue) * 100));

    // Calcular score de diversificación preliminar
    const diversificationScore = this.calculateDiversificationScore(assets, totalValue);

    return {
      totalValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage,
      totalAssets: assets.length,
      status: totalGainLoss >= 0 ? 'Positivo' : 'Negativo',
      diversificationScore,
      riskLevel: 'Calculando...', // Se actualizará después
      maxConcentration,
      bestAsset: `${bestAsset.ticker} (+${bestAsset.gainLossPercentage.toFixed(1)}%)`,
      worstAsset: `${worstAsset.ticker} (${worstAsset.gainLossPercentage.toFixed(1)}%)`,
    };
  }

  private calculateTopPerformers(assets: AssetDetail[]) {
    const sorted = [...assets].sort((a, b) => b.gainLoss - a.gainLoss);

    const topPerformers: TopPerformer[] = sorted.slice(0, 5).map(asset => ({
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      gainLoss: asset.gainLoss,
      gainLossPercentage: asset.gainLossPercentage,
      currentValue: asset.currentValue,
      quantity: asset.quantity,
    }));

    const bottomPerformers: TopPerformer[] = sorted.slice(-5).reverse().map(asset => ({
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      gainLoss: asset.gainLoss,
      gainLossPercentage: asset.gainLossPercentage,
      currentValue: asset.currentValue,
      quantity: asset.quantity,
    }));

    const winners = assets.filter(a => a.gainLoss > 0);
    const losers = assets.filter(a => a.gainLoss < 0);

    const performanceStats = {
      winnersCount: winners.length,
      losersCount: losers.length,
      winnersPercentage: (winners.length / assets.length) * 100,
      averageGain: winners.length > 0 
        ? winners.reduce((sum, a) => sum + a.gainLoss, 0) / winners.length 
        : 0,
      bestGainAmount: Math.max(...assets.map(a => a.gainLoss)),
      bestGainPercentage: Math.max(...assets.map(a => a.gainLossPercentage)),
    };

    return { topPerformers, bottomPerformers, performanceStats };
  }

  private analyzeDiversification(
    assets: AssetDetail[],
    totalValue: number,
  ): DiversificationAnalysis {
    const score = this.calculateDiversificationScore(assets, totalValue);

    let level: 'Baja' | 'Media' | 'Buena' | 'Excelente';
    if (score >= 80) level = 'Excelente';
    else if (score >= 60) level = 'Buena';
    else if (score >= 40) level = 'Media';
    else level = 'Baja';

    const topAssets = [...assets]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10)
      .map(asset => ({
        ticker: asset.ticker,
        name: asset.name,
        percentage: (asset.currentValue / totalValue) * 100,
        value: asset.currentValue,
      }));

    const concentration = Math.max(...assets.map(a => (a.currentValue / totalValue) * 100));

    let recommendation = '';
    if (score < 40) {
      recommendation = 'Tu portfolio tiene baja diversificación. Considera agregar más activos de diferentes sectores.';
    } else if (score < 60) {
      recommendation = 'Tu diversificación es media. Podrías mejorarla agregando activos de otros sectores o tipos.';
    } else if (score < 80) {
      recommendation = 'Tu portfolio está bien diversificado. Considera mantener este nivel o mejorarlo ligeramente.';
    } else {
      recommendation = 'Excelente diversificación. Tu portfolio está bien balanceado entre diferentes activos.';
    }

    return {
      score,
      level,
      topAssets,
      concentration,
      recommendation,
    };
  }

  private calculateDiversificationScore(assets: AssetDetail[], totalValue: number): number {
    // Factores que afectan el score:
    // 1. Número de activos (más es mejor)
    // 2. Distribución equilibrada (menos concentración es mejor)
    // 3. Diversificación por tipo de activo

    let score = 0;

    // Factor 1: Número de activos (máximo 40 puntos)
    const numAssetsScore = Math.min((assets.length / 20) * 40, 40);
    score += numAssetsScore;

    // Factor 2: Concentración (máximo 40 puntos)
    const concentrations = assets.map(a => (a.currentValue / totalValue) * 100);
    const maxConcentration = Math.max(...concentrations);
    const concentrationScore = maxConcentration < 10 ? 40 : maxConcentration < 20 ? 30 : maxConcentration < 30 ? 20 : 10;
    score += concentrationScore;

    // Factor 3: Diversificación por tipo (máximo 20 puntos)
    const types = new Set(assets.map(a => a.type));
    const typeScore = Math.min((types.size / 5) * 20, 20);
    score += typeScore;

    return Math.round(score);
  }

  private analyzeRisk(
    assets: AssetDetail[],
    distribution: DistributionByType[],
    diversificationAnalysis: DiversificationAnalysis,
  ): RiskAnalysis {
    let riskScore = 0;
    const factors: string[] = [];
    const warnings: string[] = [];

    // Factor 1: Concentración (40 puntos)
    if (diversificationAnalysis.concentration > 30) {
      riskScore += 40;
      factors.push('Alta concentración en un activo');
      warnings.push(`Un activo representa ${diversificationAnalysis.concentration.toFixed(1)}% del portfolio`);
    } else if (diversificationAnalysis.concentration > 20) {
      riskScore += 25;
      factors.push('Concentración moderada');
    } else if (diversificationAnalysis.concentration > 10) {
      riskScore += 15;
    }

    // Factor 2: Exposición a crypto (30 puntos)
    const cryptoDist = distribution.find(d => d.type.toLowerCase().includes('crypto'));
    const cryptoExposure = cryptoDist ? cryptoDist.percentage : 0;
    
    if (cryptoExposure > 50) {
      riskScore += 30;
      factors.push('Muy alta exposición a criptomonedas');
      warnings.push(`${cryptoExposure.toFixed(1)}% del portfolio en crypto (alta volatilidad)`);
    } else if (cryptoExposure > 30) {
      riskScore += 20;
      factors.push('Alta exposición a criptomonedas');
    } else if (cryptoExposure > 15) {
      riskScore += 10;
      factors.push('Exposición moderada a crypto');
    }

    // Factor 3: Diversificación (30 puntos)
    if (diversificationAnalysis.score < 40) {
      riskScore += 30;
      factors.push('Baja diversificación');
      warnings.push('Diversificación insuficiente aumenta el riesgo');
    } else if (diversificationAnalysis.score < 60) {
      riskScore += 15;
      factors.push('Diversificación limitada');
    }

    // Determinar nivel de riesgo
    let level: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto';
    if (riskScore >= 70) level = 'Muy Alto';
    else if (riskScore >= 50) level = 'Alto';
    else if (riskScore >= 30) level = 'Medio';
    else level = 'Bajo';

    // Determinar volatilidad
    let volatility: 'Baja' | 'Media' | 'Alta';
    if (cryptoExposure > 40 || diversificationAnalysis.concentration > 40) {
      volatility = 'Alta';
    } else if (cryptoExposure > 20 || diversificationAnalysis.concentration > 25) {
      volatility = 'Media';
    } else {
      volatility = 'Baja';
    }

    return {
      score: Math.round(riskScore),
      level,
      volatility,
      factors: factors.length > 0 ? factors : ['Portfolio balanceado'],
      cryptoExposure,
      warnings: warnings.length > 0 ? warnings : ['No hay advertencias significativas'],
    };
  }

  private generateRecommendations(
    summary: ExecutiveSummary,
    diversificationAnalysis: DiversificationAnalysis,
    riskAnalysis: RiskAnalysis,
    assets: AssetDetail[],
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recomendación 1: Concentración alta
    if (diversificationAnalysis.concentration > 25) {
      recommendations.push({
        priority: 'Alta',
        title: 'Reducir Concentración',
        description: `Tu activo principal representa ${diversificationAnalysis.concentration.toFixed(1)}% del portfolio. Esto aumenta significativamente el riesgo.`,
        action: `Considera vender 5-10% de ${diversificationAnalysis.topAssets[0].ticker} y redistribuir en 2-3 activos diferentes. Apunta a un máximo de 15% por activo.`,
        icon: '⚠️',
      });
    }

    // Recomendación 2: Activos con pérdidas
    const assetsWithLosses = assets.filter(a => a.gainLossPercentage < -10);
    if (assetsWithLosses.length > 0) {
      const worstAsset = assetsWithLosses.reduce((prev, curr) => 
        curr.gainLossPercentage < prev.gainLossPercentage ? curr : prev
      );
      
      recommendations.push({
        priority: assetsWithLosses.length > 2 ? 'Alta' : 'Media',
        title: 'Revisar Activos con Pérdidas',
        description: `Tienes ${assetsWithLosses.length} activo(s) con pérdidas mayores al 10%. ${worstAsset.ticker} está en ${worstAsset.gainLossPercentage.toFixed(1)}%.`,
        action: `Analiza las razones de la caída de ${worstAsset.ticker}. Considera establecer un stop-loss en -20% o salir si las condiciones no mejoran.`,
        icon: '📉',
      });
    }

    // Recomendación 3: Baja diversificación
    if (diversificationAnalysis.score < 60) {
      recommendations.push({
        priority: diversificationAnalysis.score < 40 ? 'Alta' : 'Media',
        title: 'Aumentar Diversificación',
        description: `Tu score de diversificación es ${diversificationAnalysis.score}/100 (${diversificationAnalysis.level}). Esto aumenta el riesgo del portfolio.`,
        action: `Agrega 3-5 activos más de sectores diferentes. Considera bonos o ETFs para mayor estabilidad. Objetivo: alcanzar score de 70+.`,
        icon: '📊',
      });
    }

    // Recomendación 4: Diversificar por tipo
    const types = new Set(assets.map(a => a.type));
    if (types.size < 3) {
      recommendations.push({
        priority: 'Media',
        title: 'Diversificar por Tipo de Activo',
        description: `Solo tienes ${types.size} tipo(s) de activo. Una mayor diversificación reduce el riesgo.`,
        action: `Considera agregar ${types.has('Bonos') ? '' : 'Bonos, '}${types.has('Acciones') ? '' : 'Acciones, '}${types.has('Crypto') ? '' : 'Crypto (con moderación)'} para balancear el portfolio.`,
        icon: '🎯',
      });
    }

    // Recomendación 5: Alta exposición a crypto
    if (riskAnalysis.cryptoExposure > 30) {
      recommendations.push({
        priority: 'Alta',
        title: 'Reducir Exposición a Crypto',
        description: `${riskAnalysis.cryptoExposure.toFixed(1)}% del portfolio está en crypto. Esto genera alta volatilidad.`,
        action: `Reduce la exposición a crypto al 15-20% del portfolio. Mueve parte del capital a activos más estables como bonos o acciones blue-chip.`,
        icon: '⚠️',
      });
    }

    // Recomendación 6: Tomar ganancias
    const bigWinners = assets.filter(a => a.gainLossPercentage > 50);
    if (bigWinners.length > 0) {
      recommendations.push({
        priority: 'Baja',
        title: 'Considerar Toma de Ganancias',
        description: `Tienes ${bigWinners.length} activo(s) con ganancias superiores al 50%. ${bigWinners[0].ticker} está en +${bigWinners[0].gainLossPercentage.toFixed(1)}%.`,
        action: `Considera tomar ganancias parciales (20-30%) de ${bigWinners[0].ticker} para asegurar beneficios y reinvertir en otros activos.`,
        icon: '💰',
      });
    }

    // Recomendación 7: Mantener curso (si todo está bien)
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'Baja',
        title: 'Mantener Estrategia Actual',
        description: 'Tu portfolio está bien balanceado con buena diversificación y riesgo controlado.',
        action: 'Continúa monitoreando regularmente. Realiza rebalanceos trimestrales para mantener la distribución objetivo.',
        icon: '✅',
      });
    }

    // Ordenar por prioridad
    const priorityOrder = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
}
