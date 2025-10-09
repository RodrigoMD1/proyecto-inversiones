export interface DiversificationAnalysis {
  score: number; // 0-100
  level: 'Baja' | 'Media' | 'Buena' | 'Excelente';
  topAssets: {
    ticker: string;
    name: string;
    percentage: number;
    value: number;
  }[];
  concentration: number; // % del activo más grande
  recommendation: string;
}

export interface RiskAnalysis {
  score: number; // 0-100
  level: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto';
  volatility: 'Baja' | 'Media' | 'Alta';
  factors: string[];
  cryptoExposure: number; // %
  warnings: string[];
}

export interface TopPerformer {
  ticker: string;
  name: string;
  type: string;
  gainLoss: number; // $
  gainLossPercentage: number; // %
  currentValue: number;
  quantity: number;
}

export interface Recommendation {
  priority: 'Alta' | 'Media' | 'Baja';
  title: string;
  description: string;
  action: string;
  icon: string; // emoji
}

export interface DistributionByType {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

export interface AssetDetail {
  ticker: string;
  name: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  daysHeld: number;
}

export interface ExecutiveSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalAssets: number;
  status: 'Positivo' | 'Negativo' | 'Neutro';
  diversificationScore: number;
  riskLevel: string;
  maxConcentration: number;
  bestAsset: string;
  worstAsset: string;
}

export interface CompleteReportData {
  // Información del usuario
  userEmail: string;
  generatedAt: string;
  reportId: string;
  version: string;

  // Resumen ejecutivo
  summary: ExecutiveSummary;

  // Distribución
  distribution: DistributionByType[];

  // Detalle de activos
  assets: AssetDetail[];

  // Top performers
  topPerformers: TopPerformer[];
  bottomPerformers: TopPerformer[];
  performanceStats: {
    winnersCount: number;
    losersCount: number;
    winnersPercentage: number;
    averageGain: number;
    bestGainAmount: number;
    bestGainPercentage: number;
  };

  // Análisis
  diversificationAnalysis: DiversificationAnalysis;
  riskAnalysis: RiskAnalysis;

  // Recomendaciones
  recommendations: Recommendation[];
}
