import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { CompleteReportData } from './dto/report-analysis.dto';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

@Injectable()
export class PdfGeneratorService {
  private readonly chartJSNodeCanvas: ChartJSNodeCanvas;

  constructor() {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width: 500, 
      height: 300,
      backgroundColour: 'white'
    });
  }

  async generatePdf(reportData: CompleteReportData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // PÁGINA 1: Portada + Resumen Ejecutivo
        await this.addCoverPage(doc, reportData);
        doc.addPage();

        // PÁGINA 2: Distribución por Tipo de Activo
        await this.addDistributionPage(doc, reportData);
        doc.addPage();

        // PÁGINAS 3-4: Detalle Completo de Activos
        await this.addAssetsDetailPage(doc, reportData);
        doc.addPage();

        // PÁGINA 5: Top Performers
        await this.addTopPerformersPage(doc, reportData);
        doc.addPage();

        // PÁGINA 6: Análisis de Diversificación
        await this.addDiversificationPage(doc, reportData);
        doc.addPage();

        // PÁGINA 7: Análisis de Riesgo
        await this.addRiskAnalysisPage(doc, reportData);
        doc.addPage();

        // PÁGINA 8: Recomendaciones
        await this.addRecommendationsPage(doc, reportData);
        doc.addPage();

        // PÁGINA 9: Gráficos
        await this.addChartsPage(doc, reportData);
        doc.addPage();

        // PÁGINA 10: Notas Finales + Disclaimer
        await this.addDisclaimerPage(doc, reportData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== PÁGINA 1: PORTADA + RESUMEN EJECUTIVO ====================
  private addCoverPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { summary, userEmail, generatedAt, reportId, version } = data;

    // Header con color
    doc.rect(0, 0, 600, 100).fill('#2563eb');
    
    // Título
    doc.fontSize(28).fillColor('#ffffff')
      .text('📊 INFORME FINANCIERO', 50, 30, { align: 'center' });
    
    doc.fontSize(16).fillColor('#ffffff')
      .text('FINANCEPR v' + version, 50, 70, { align: 'center' });

    doc.moveDown(3);

    // Información del usuario
    doc.fontSize(12).fillColor('#000000')
      .text(`Usuario: ${userEmail}`, 50, 130);
    
    const date = new Date(generatedAt);
    doc.text(`Fecha: ${date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 50, 145);

    doc.text(`ID Reporte: ${reportId}`, 50, 160);

    // Separador
    doc.moveTo(50, 190).lineTo(545, 190).stroke();

    // RESUMEN EJECUTIVO
    doc.fontSize(18).fillColor('#2563eb')
      .text('RESUMEN EJECUTIVO', 50, 210);

    doc.fontSize(12).fillColor('#000000');
    
    const yStart = 240;
    const leftCol = 50;
    const rightCol = 300;

    // Columna izquierda
    doc.font('Helvetica-Bold').text('Valor Total:', leftCol, yStart);
    doc.font('Helvetica').text(`$${this.formatNumber(summary.totalValue)}`, leftCol + 120, yStart);

    doc.font('Helvetica-Bold').text('Inversión Total:', leftCol, yStart + 25);
    doc.font('Helvetica').text(`$${this.formatNumber(summary.totalInvested)}`, leftCol + 120, yStart + 25);

    const gainLossColor = summary.totalGainLoss >= 0 ? '#10b981' : '#ef4444';
    doc.font('Helvetica-Bold').text('Ganancia/Pérdida:', leftCol, yStart + 50);
    doc.font('Helvetica').fillColor(gainLossColor)
      .text(
        `${summary.totalGainLoss >= 0 ? '+' : ''}$${this.formatNumber(summary.totalGainLoss)} (${summary.totalGainLossPercentage.toFixed(2)}%)`,
        leftCol + 120,
        yStart + 50
      );

    doc.fillColor('#000000');
    doc.font('Helvetica-Bold').text('Total Activos:', leftCol, yStart + 75);
    doc.font('Helvetica').text(`${summary.totalAssets} posiciones`, leftCol + 120, yStart + 75);

    doc.font('Helvetica-Bold').text('Estado:', leftCol, yStart + 100);
    const statusColor = summary.status === 'Positivo' ? '#10b981' : '#ef4444';
    doc.font('Helvetica').fillColor(statusColor)
      .text(`✅ ${summary.status.toUpperCase()}`, leftCol + 120, yStart + 100);

    // Columna derecha
    doc.fillColor('#000000');
    doc.font('Helvetica-Bold').text('INDICADORES CLAVE:', rightCol, yStart);

    doc.font('Helvetica-Bold').text('📊 Diversificación:', rightCol, yStart + 30);
    doc.font('Helvetica').text(`${summary.diversificationScore}/100`, rightCol + 120, yStart + 30);

    doc.font('Helvetica-Bold').text('⚠️ Nivel de Riesgo:', rightCol, yStart + 55);
    doc.font('Helvetica').text(summary.riskLevel, rightCol + 120, yStart + 55);

    doc.font('Helvetica-Bold').text('🎯 Concentración:', rightCol, yStart + 80);
    doc.font('Helvetica').text(`${summary.maxConcentration.toFixed(1)}%`, rightCol + 120, yStart + 80);

    doc.font('Helvetica-Bold').text('💰 Mejor Activo:', rightCol, yStart + 105);
    doc.font('Helvetica').fillColor('#10b981').text(summary.bestAsset, rightCol + 120, yStart + 105);

    doc.fillColor('#000000');
    doc.font('Helvetica-Bold').text('📉 Peor Activo:', rightCol, yStart + 130);
    doc.font('Helvetica').fillColor('#ef4444').text(summary.worstAsset, rightCol + 120, yStart + 130);

    // Box destacado con estado general
    doc.fillColor('#000000');
    doc.roundedRect(50, 450, 495, 80, 5).fill('#f0f9ff');
    doc.fillColor('#2563eb')
      .fontSize(14).font('Helvetica-Bold')
      .text('ESTADO GENERAL DEL PORTFOLIO', 60, 470);
    
    doc.fillColor('#000000').fontSize(11).font('Helvetica')
      .text(
        summary.status === 'Positivo' 
          ? `Tu portfolio está generando ganancias de $${this.formatNumber(summary.totalGainLoss)} (${summary.totalGainLossPercentage.toFixed(2)}%). Mantén tu estrategia y considera las recomendaciones para optimizar.`
          : `Tu portfolio tiene pérdidas de $${this.formatNumber(Math.abs(summary.totalGainLoss))} (${Math.abs(summary.totalGainLossPercentage).toFixed(2)}%). Revisa las recomendaciones para mejorar la situación.`,
        60,
        495,
        { width: 475, align: 'justify' }
      );

    // Footer
    doc.fontSize(9).fillColor('#888888')
      .text('Página 1 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 2: DISTRIBUCIÓN ====================
  private async addDistributionPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { distribution } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('DISTRIBUCIÓN POR TIPO DE ACTIVO', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Gráfico de torta (simulado con texto)
    doc.fontSize(14).fillColor('#000000')
      .text('Distribución de Inversión:', 50, 100);

    let yPos = 140;
    distribution.forEach((dist, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const color = colors[index % colors.length];

      // Barra visual
      const barWidth = (dist.percentage / 100) * 400;
      doc.rect(50, yPos, barWidth, 25).fill(color);

      // Texto
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text(dist.type, 55, yPos + 7);

      doc.fillColor('#000000').fontSize(10).font('Helvetica')
        .text(
          `$${this.formatNumber(dist.value)} (${dist.percentage.toFixed(1)}%) - ${dist.count} activos`,
          460,
          yPos + 7,
          { width: 85, align: 'right' }
        );

      yPos += 40;
    });

    // Tabla resumen
    yPos += 20;
    doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
      .text('Resumen Detallado:', 50, yPos);

    yPos += 30;

    // Header de tabla
    doc.rect(50, yPos, 495, 30).fill('#2563eb');
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text('Tipo', 60, yPos + 10)
      .text('Cantidad', 200, yPos + 10)
      .text('Valor', 320, yPos + 10)
      .text('Porcentaje', 440, yPos + 10);

    yPos += 30;

    // Filas
    distribution.forEach((dist, index) => {
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(50, yPos, 495, 25).fill(bgColor);
      
      doc.fillColor('#000000').fontSize(10).font('Helvetica')
        .text(dist.type, 60, yPos + 7)
        .text(dist.count.toString(), 200, yPos + 7)
        .text(`$${this.formatNumber(dist.value)}`, 320, yPos + 7)
        .text(`${dist.percentage.toFixed(1)}%`, 440, yPos + 7);

      yPos += 25;
    });

    // Análisis
    yPos += 30;
    doc.fontSize(12).fillColor('#2563eb').font('Helvetica-Bold')
      .text('💡 Análisis de Distribución:', 50, yPos);

    const mostInvested = distribution.reduce((prev, curr) => 
      curr.value > prev.value ? curr : prev
    );

    doc.fontSize(10).fillColor('#000000').font('Helvetica')
      .text(
        `Tu mayor inversión está en ${mostInvested.type} con $${this.formatNumber(mostInvested.value)} (${mostInvested.percentage.toFixed(1)}%). ` +
        `${distribution.length < 3 ? 'Considera diversificar en más tipos de activos para reducir riesgo.' : 'Tienes una buena diversificación por tipo de activo.'}`,
        50,
        yPos + 25,
        { width: 495, align: 'justify' }
      );

    // Footer
    doc.fontSize(9).fillColor('#888888')
      .text('Página 2 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINAS 3-4: DETALLE DE ACTIVOS ====================
  private async addAssetsDetailPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { assets, distribution } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('DETALLE COMPLETO DE ACTIVOS', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    let yPos = 100;
    const PAGE_HEIGHT = 700;

    // Agrupar por tipo
    distribution.forEach((dist) => {
      const assetsOfType = assets.filter(a => a.type === dist.type);
      
      if (assetsOfType.length === 0) return;

      // Si no hay espacio, nueva página
      if (yPos > PAGE_HEIGHT - 200) {
        doc.addPage();
        yPos = 50;
      }

      // Título del tipo
      doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
        .text(`━━━━ ${dist.type.toUpperCase()} ━━━━`, 50, yPos);

      yPos += 25;

      // Header de tabla mini
      doc.rect(50, yPos, 495, 25).fill('#e5e7eb');
      doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
        .text('Ticker', 55, yPos + 8)
        .text('Nombre', 105, yPos + 8)
        .text('Cant.', 220, yPos + 8)
        .text('P. Compra', 270, yPos + 8)
        .text('P. Actual', 340, yPos + 8)
        .text('Valor', 410, yPos + 8)
        .text('Gan/Pér', 480, yPos + 8);

      yPos += 25;

      // Activos
      let subtotalInvested = 0;
      let subtotalCurrent = 0;

      assetsOfType.forEach((asset, index) => {
        subtotalInvested += asset.investedValue;
        subtotalCurrent += asset.currentValue;

        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(50, yPos, 495, 20).fill(bgColor);

        doc.fillColor('#000000').fontSize(8).font('Helvetica')
          .text(asset.ticker, 55, yPos + 6, { width: 45 })
          .text(asset.name.substring(0, 20), 105, yPos + 6, { width: 110 })
          .text(asset.quantity.toString(), 220, yPos + 6)
          .text(`$${this.formatNumber(asset.purchasePrice)}`, 270, yPos + 6)
          .text(`$${this.formatNumber(asset.currentPrice)}`, 340, yPos + 6)
          .text(`$${this.formatNumber(asset.currentValue)}`, 410, yPos + 6);

        const gainColor = asset.gainLoss >= 0 ? '#10b981' : '#ef4444';
        doc.fillColor(gainColor)
          .text(
            `${asset.gainLoss >= 0 ? '+' : ''}${asset.gainLossPercentage.toFixed(1)}%`,
            480,
            yPos + 6
          );

        yPos += 20;
      });

      // Subtotal
      yPos += 5;
      doc.rect(50, yPos, 495, 25).fill('#dbeafe');
      doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
        .text('SUBTOTAL:', 55, yPos + 8)
        .text(`$${this.formatNumber(subtotalInvested)}`, 270, yPos + 8)
        .text(`$${this.formatNumber(subtotalCurrent)}`, 410, yPos + 8);

      const subtotalGain = subtotalCurrent - subtotalInvested;
      const subtotalGainPct = (subtotalGain / subtotalInvested) * 100;
      const gainColor = subtotalGain >= 0 ? '#10b981' : '#ef4444';
      
      doc.fillColor(gainColor)
        .text(
          `${subtotalGain >= 0 ? '+' : ''}$${this.formatNumber(Math.abs(subtotalGain))} (${subtotalGainPct.toFixed(1)}%)`,
          340,
          yPos + 8,
          { width: 200, align: 'right' }
        );

      yPos += 45;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Páginas 3-4 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 5: TOP PERFORMERS ====================
  private async addTopPerformersPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { topPerformers, bottomPerformers, performanceStats } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('TOP PERFORMERS', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // 🥇 TOP 5 MEJORES
    doc.fontSize(14).fillColor('#10b981').font('Helvetica-Bold')
      .text('🥇 Top 5 Mejores Activos', 50, 100);

    let yPos = 130;

    topPerformers.slice(0, 5).forEach((asset, index) => {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      
      doc.roundedRect(50, yPos, 495, 40, 5).fill('#f0fdf4');
      
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
        .text(`${medals[index]} ${asset.ticker} - ${asset.name}`, 60, yPos + 8);

      doc.fillColor('#10b981').fontSize(11).font('Helvetica')
        .text(
          `+$${this.formatNumber(asset.gainLoss)} (+${asset.gainLossPercentage.toFixed(1)}%)`,
          60,
          yPos + 25
        );

      doc.fillColor('#666666').fontSize(10)
        .text(`Valor: $${this.formatNumber(asset.currentValue)}`, 400, yPos + 15);

      yPos += 50;
    });

    // 📉 ACTIVOS CON PÉRDIDAS
    yPos += 20;
    doc.fontSize(14).fillColor('#ef4444').font('Helvetica-Bold')
      .text('📉 Activos con Pérdidas', 50, yPos);

    yPos += 30;

    const losers = bottomPerformers.filter(a => a.gainLoss < 0);
    
    if (losers.length > 0) {
      losers.slice(0, 5).forEach((asset) => {
        doc.roundedRect(50, yPos, 495, 35, 5).fill('#fef2f2');
        
        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
          .text(`${asset.ticker} - ${asset.name}`, 60, yPos + 8);

        doc.fillColor('#ef4444').fontSize(10).font('Helvetica')
          .text(
            `-$${this.formatNumber(Math.abs(asset.gainLoss))} (${asset.gainLossPercentage.toFixed(1)}%)`,
            60,
            yPos + 22
          );

        yPos += 45;
      });
    } else {
      doc.fillColor('#10b981').fontSize(11).font('Helvetica')
        .text('✅ ¡Excelente! Todos tus activos están en ganancia.', 60, yPos);
      yPos += 30;
    }

    // Estadísticas
    yPos += 20;
    doc.roundedRect(50, yPos, 495, 100, 5).fill('#f0f9ff');
    
    doc.fillColor('#2563eb').fontSize(12).font('Helvetica-Bold')
      .text('📊 ESTADÍSTICAS GENERALES', 60, yPos + 10);

    doc.fillColor('#000000').fontSize(10).font('Helvetica')
      .text(`Activos ganadores: ${performanceStats.winnersCount} (${performanceStats.winnersPercentage.toFixed(1)}%)`, 60, yPos + 35)
      .text(`Activos perdedores: ${performanceStats.losersCount}`, 60, yPos + 55)
      .text(`Ganancia promedio: $${this.formatNumber(performanceStats.averageGain)}`, 300, yPos + 35)
      .text(`Mejor ganancia: ${performanceStats.bestGainPercentage.toFixed(1)}%`, 300, yPos + 55);

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Página 5 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 6: DIVERSIFICACIÓN ====================
  private async addDiversificationPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { diversificationAnalysis } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('ANÁLISIS DE DIVERSIFICACIÓN', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Score principal
    doc.roundedRect(50, 100, 495, 80, 5).fill('#f0f9ff');
    
    doc.fillColor('#2563eb').fontSize(16).font('Helvetica-Bold')
      .text('SCORE DE DIVERSIFICACIÓN', 60, 115);

    doc.fontSize(40).font('Helvetica-Bold')
      .text(`${diversificationAnalysis.score}/100`, 60, 140);

    const levelColor = 
      diversificationAnalysis.level === 'Excelente' ? '#10b981' :
      diversificationAnalysis.level === 'Buena' ? '#3b82f6' :
      diversificationAnalysis.level === 'Media' ? '#f59e0b' : '#ef4444';

    doc.fillColor(levelColor).fontSize(18)
      .text(diversificationAnalysis.level.toUpperCase(), 250, 150);

    // Barra de progreso
    const barY = 200;
    doc.rect(50, barY, 495, 30).fill('#e5e7eb');
    const scoreWidth = (diversificationAnalysis.score / 100) * 495;
    doc.rect(50, barY, scoreWidth, 30).fill(levelColor);

    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
      .text(`${diversificationAnalysis.score}%`, scoreWidth > 50 ? 55 : scoreWidth + 10, barY + 8);

    // Top 10 activos
    let yPos = 250;
    doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
      .text('Top 10 Activos por Tamaño:', 50, yPos);

    yPos += 30;

    diversificationAnalysis.topAssets.slice(0, 10).forEach((asset, index) => {
      doc.fontSize(10).font('Helvetica')
        .text(`${index + 1}. ${asset.ticker}`, 55, yPos)
        .text(asset.name.substring(0, 30), 130, yPos)
        .text(`$${this.formatNumber(asset.value)}`, 350, yPos)
        .text(`${asset.percentage.toFixed(1)}%`, 480, yPos);

      // Barra mini
      const miniBarWidth = (asset.percentage / 100) * 200;
      doc.rect(280, yPos + 2, miniBarWidth, 10).fill('#3b82f6');

      yPos += 20;
    });

    // Recomendación
    yPos += 20;
    doc.roundedRect(50, yPos, 495, 80, 5).fill('#fef3c7');
    
    doc.fillColor('#92400e').fontSize(12).font('Helvetica-Bold')
      .text('💡 RECOMENDACIÓN', 60, yPos + 10);

    doc.fillColor('#000000').fontSize(10).font('Helvetica')
      .text(diversificationAnalysis.recommendation, 60, yPos + 35, {
        width: 475,
        align: 'justify'
      });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Página 6 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 7: ANÁLISIS DE RIESGO ====================
  private async addRiskAnalysisPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { riskAnalysis } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('ANÁLISIS DE RIESGO', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Score de riesgo
    doc.roundedRect(50, 100, 495, 80, 5).fill('#fef2f2');
    
    doc.fillColor('#ef4444').fontSize(16).font('Helvetica-Bold')
      .text('SCORE DE RIESGO', 60, 115);

    doc.fontSize(40).font('Helvetica-Bold')
      .text(`${riskAnalysis.score}/100`, 60, 140);

    const riskColor = 
      riskAnalysis.level === 'Muy Alto' ? '#dc2626' :
      riskAnalysis.level === 'Alto' ? '#f59e0b' :
      riskAnalysis.level === 'Medio' ? '#3b82f6' : '#10b981';

    doc.fillColor(riskColor).fontSize(18)
      .text(`RIESGO ${riskAnalysis.level.toUpperCase()}`, 250, 150);

    // Nivel de volatilidad
    let yPos = 200;
    doc.roundedRect(50, yPos, 240, 60, 5).fill('#f9fafb');
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
      .text('Volatilidad:', 60, yPos + 15);
    doc.fontSize(14).font('Helvetica')
      .text(riskAnalysis.volatility, 60, yPos + 35);

    doc.roundedRect(305, yPos, 240, 60, 5).fill('#f9fafb');
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
      .text('Exposición Crypto:', 315, yPos + 15);
    doc.fontSize(14).font('Helvetica')
      .text(`${riskAnalysis.cryptoExposure.toFixed(1)}%`, 315, yPos + 35);

    // Factores de riesgo
    yPos += 80;
    doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
      .text('⚠️ Factores de Riesgo Identificados:', 50, yPos);

    yPos += 30;

    riskAnalysis.factors.forEach((factor) => {
      doc.fontSize(11).fillColor('#000000').font('Helvetica')
        .text(`• ${factor}`, 60, yPos);
      yPos += 25;
    });

    // Advertencias
    yPos += 20;
    doc.fontSize(14).fillColor('#ef4444').font('Helvetica-Bold')
      .text('🚨 Advertencias:', 50, yPos);

    yPos += 30;

    riskAnalysis.warnings.forEach((warning) => {
      doc.roundedRect(50, yPos, 495, 35, 5).fill('#fee2e2');
      doc.fontSize(10).fillColor('#000000').font('Helvetica')
        .text(warning, 60, yPos + 10, { width: 475 });
      yPos += 45;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Página 7 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 8: RECOMENDACIONES ====================
  private async addRecommendationsPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { recommendations } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('🎯 RECOMENDACIONES PERSONALIZADAS', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    let yPos = 100;

    // Agrupar por prioridad
    const priorities: ('Alta' | 'Media' | 'Baja')[] = ['Alta', 'Media', 'Baja'];
    const priorityColors = {
      'Alta': { bg: '#fee2e2', title: '#dc2626', icon: '⚠️' },
      'Media': { bg: '#fef3c7', title: '#d97706', icon: '📊' },
      'Baja': { bg: '#dcfce7', title: '#16a34a', icon: '✅' }
    };

    priorities.forEach((priority) => {
      const recs = recommendations.filter(r => r.priority === priority);
      
      if (recs.length === 0) return;

      // Título de prioridad
      const colors = priorityColors[priority];
      doc.fontSize(14).fillColor(colors.title).font('Helvetica-Bold')
        .text(`${colors.icon} PRIORIDAD ${priority.toUpperCase()}`, 50, yPos);

      yPos += 30;

      recs.forEach((rec, index) => {
        // Si no cabe, nueva página
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc.roundedRect(50, yPos, 495, 120, 5).fill(colors.bg);

        doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
          .text(`${index + 1}. ${rec.title}`, 60, yPos + 10);

        doc.fontSize(10).font('Helvetica')
          .text(rec.description, 60, yPos + 30, { width: 475, align: 'justify' });

        doc.fillColor(colors.title).fontSize(10).font('Helvetica-Bold')
          .text('Acción sugerida:', 60, yPos + 65);

        doc.fillColor('#000000').fontSize(9).font('Helvetica')
          .text(rec.action, 60, yPos + 80, { width: 475, align: 'justify' });

        yPos += 130;
      });

      yPos += 10;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Página 8 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 9: GRÁFICOS ====================
  private async addChartsPage(doc: typeof PDFDocument, data: CompleteReportData) {
    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('GRÁFICOS Y VISUALIZACIONES', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Gráfico 1: Distribución por tipo
    doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold')
      .text('Distribución por Tipo de Activo', 50, 100);

    try {
      const pieChartImage = await this.generatePieChart(data.distribution);
      doc.image(pieChartImage, 75, 130, { width: 450 });
    } catch (error) {
      doc.fontSize(10).fillColor('#666666')
        .text('(Gráfico no disponible)', 200, 300);
    }

    // Gráfico 2: Top 5 performers
    doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold')
      .text('Top 5 Activos por Ganancia', 50, 450);

    // Simulación de barras
    let yPos = 480;
    data.topPerformers.slice(0, 5).forEach((asset) => {
      const barWidth = Math.abs(asset.gainLossPercentage) * 3;
      const color = asset.gainLoss >= 0 ? '#10b981' : '#ef4444';
      
      doc.rect(150, yPos, barWidth, 20).fill(color);
      
      doc.fillColor('#000000').fontSize(9)
        .text(asset.ticker, 50, yPos + 5)
        .text(`${asset.gainLossPercentage.toFixed(1)}%`, barWidth + 160, yPos + 5);

      yPos += 30;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Página 9 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 10: DISCLAIMER ====================
  private async addDisclaimerPage(doc: typeof PDFDocument, data: CompleteReportData) {
    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text('NOTAS FINALES', 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Próximos pasos
    doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
      .text('✅ Próximos Pasos Sugeridos:', 50, 100);

    doc.fontSize(10).fillColor('#000000').font('Helvetica')
      .text('1. Revisa las recomendaciones de prioridad ALTA', 60, 130)
      .text('2. Analiza los activos con pérdidas significativas', 60, 150)
      .text('3. Considera rebalancear tu portfolio trimestralmente', 60, 170)
      .text('4. Mantén un seguimiento regular de tus inversiones', 60, 190)
      .text('5. Consulta con un asesor financiero para decisiones importantes', 60, 210);

    // Información de contacto
    doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
      .text('📧 Información de Contacto:', 50, 250);

    doc.fontSize(10).fillColor('#000000').font('Helvetica')
      .text('Email: soporte@financepr.com', 60, 280)
      .text('Web: www.financepr.com', 60, 300)
      .text('Teléfono: +54 11 1234-5678', 60, 320);

    // Disclaimer legal
    doc.fontSize(14).fillColor('#ef4444').font('Helvetica-Bold')
      .text('⚠️ DISCLAIMER LEGAL', 50, 370);

    doc.roundedRect(50, 400, 495, 200, 5).fill('#f9fafb');

    doc.fontSize(9).fillColor('#000000').font('Helvetica')
      .text(
        'Este informe es generado automáticamente por FINANCEPR y tiene fines informativos únicamente. ' +
        'No constituye asesoramiento financiero, de inversión, legal o fiscal. Las recomendaciones ' +
        'presentadas se basan en análisis algorítmicos y no deben considerarse como consejos personalizados.\n\n' +
        'Los valores de activos mostrados pueden no reflejar precios de mercado en tiempo real. ' +
        'Las inversiones en instrumentos financieros conllevan riesgos, incluyendo la posible pérdida ' +
        'del capital invertido. El rendimiento pasado no garantiza resultados futuros.\n\n' +
        'Recomendamos encarecidamente consultar con un asesor financiero certificado antes de tomar ' +
        'decisiones de inversión. FINANCEPR no se hace responsable de pérdidas o daños derivados del ' +
        'uso de este informe.',
        60,
        410,
        { width: 475, align: 'justify', lineGap: 3 }
      );

    // Info del reporte
    doc.fontSize(8).fillColor('#666666')
      .text(`ID Reporte: ${data.reportId}`, 50, 620)
      .text(`Generado: ${new Date(data.generatedAt).toLocaleString('es-ES')}`, 50, 635)
      .text(`Versión: FINANCEPR ${data.version}`, 50, 650);

    // Footer final
    doc.rect(0, 720, 600, 100).fill('#2563eb');
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
      .text('Gracias por usar FINANCEPR', 50, 745, { align: 'center', width: 495 });
    
    doc.fontSize(10).font('Helvetica')
      .text('Tu plataforma de gestión de inversiones', 50, 770, { align: 'center', width: 495 });

    doc.fontSize(9).fillColor('#ffffff')
      .text('Página 10 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== HELPERS ====================
  private formatNumber(num: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  private async generatePieChart(distribution: any[]): Promise<Buffer> {
    const configuration = {
      type: 'pie',
      data: {
        labels: distribution.map(d => d.type),
        datasets: [{
          data: distribution.map(d => d.value),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }
}
