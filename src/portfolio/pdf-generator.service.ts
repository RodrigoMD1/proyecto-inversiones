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

  // Helper para sanitizar texto y evitar problemas con emojis/caracteres especiales
  private sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      // Medallas
      .replace(/🥇/g, '*1.')
      .replace(/🥈/g, '*2.')
      .replace(/🥉/g, '*3.')
      .replace(/4️⃣/g, '*4.')
      .replace(/5️⃣/g, '*5.')
      
      // Indicadores
      .replace(/📊/g, '[DIV]')
      .replace(/⚠️/g, '[!]')
      .replace(/🎯/g, '[*]')
      .replace(/💰/g, '[$]')
      .replace(/📉/g, '[v]')
      .replace(/📈/g, '[^]')
      .replace(/✅/g, '[OK]')
      .replace(/❌/g, '[X]')
      .replace(/💡/g, '[i]')
      .replace(/🔴/g, '[ALTA]')
      .replace(/🟡/g, '[MEDIA]')
      .replace(/🟢/g, '[BAJA]')
      .replace(/🚨/g, '[!!]')
      .replace(/🔥/g, '>>>')
      .replace(/⭐/g, '*')
      
      // Limpiar cualquier otro emoji que pueda causar problemas
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticonos
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Símbolos y pictogramas
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos misceláneos
      .replace(/[\u{2700}-\u{27BF}]/gu, '');  // Dingbats
  }

  // Helper para asegurar que un valor sea numérico
  private safeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
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
    
    // Título - SIN emoji para evitar [DIV]
    doc.fontSize(28).fillColor('#ffffff')
      .text('INFORME FINANCIERO', 50, 30, { align: 'center' });
    
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

    doc.font('Helvetica-Bold').text('Inversion Total:', leftCol, yStart + 25);
    doc.font('Helvetica').text(`$${this.formatNumber(summary.totalInvested)}`, leftCol + 120, yStart + 25);

    const gainLossColor = summary.totalGainLoss >= 0 ? '#10b981' : '#ef4444';
    doc.font('Helvetica-Bold').text('Ganancia/Perdida:', leftCol, yStart + 50);
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
      .text(this.sanitizeText(`✅ ${summary.status.toUpperCase()}`), leftCol + 120, yStart + 100);

    // Columna derecha
    doc.fillColor('#000000');
    doc.font('Helvetica-Bold').text('INDICADORES CLAVE:', rightCol, yStart);

    doc.font('Helvetica-Bold').text(this.sanitizeText('📊 Diversificacion:'), rightCol, yStart + 30);
    doc.font('Helvetica').text(`${summary.diversificationScore}/100`, rightCol + 120, yStart + 30);

    doc.font('Helvetica-Bold').text(this.sanitizeText('⚠️ Nivel de Riesgo:'), rightCol, yStart + 55);
    doc.font('Helvetica').text(summary.riskLevel, rightCol + 120, yStart + 55);

    doc.font('Helvetica-Bold').text(this.sanitizeText('🎯 Concentracion:'), rightCol, yStart + 80);
    doc.font('Helvetica').text(`${summary.maxConcentration.toFixed(1)}%`, rightCol + 120, yStart + 80);

    doc.font('Helvetica-Bold').text(this.sanitizeText('💰 Mejor Activo:'), rightCol, yStart + 105);
    doc.font('Helvetica').fillColor('#10b981').text(summary.bestAsset, rightCol + 120, yStart + 105);

    doc.fillColor('#000000');
    doc.font('Helvetica-Bold').text(this.sanitizeText('📉 Peor Activo:'), rightCol, yStart + 130);
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
          ? `Tu portfolio esta generando ganancias de $${this.formatNumber(summary.totalGainLoss)} (${summary.totalGainLossPercentage.toFixed(2)}%). Manten tu estrategia y considera las recomendaciones para optimizar.`
          : `Tu portfolio tiene perdidas de $${this.formatNumber(Math.abs(summary.totalGainLoss))} (${Math.abs(summary.totalGainLossPercentage).toFixed(2)}%). Revisa las recomendaciones para mejorar la situacion.`,
        60,
        495,
        { width: 475, align: 'justify' }
      );

    // Footer
    doc.fontSize(9).fillColor('#888888')
      .text('Pagina 1 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 2: DISTRIBUCIÓN ====================
  private async addDistributionPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { distribution } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text(this.sanitizeText('DISTRIBUCION POR TIPO DE ACTIVO'), 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Gráfico de torta (simulado con texto)
    doc.fontSize(14).fillColor('#000000')
      .text(this.sanitizeText('Distribucion de Inversion:'), 50, 100);

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
      .text(this.sanitizeText('💡 Analisis de Distribucion:'), 50, yPos);

    const mostInvested = distribution.reduce((prev, curr) => 
      curr.value > prev.value ? curr : prev
    );

    doc.fontSize(10).fillColor('#000000').font('Helvetica')
      .text(
        this.sanitizeText(`Tu mayor inversion esta en ${mostInvested.type} con $${this.formatNumber(mostInvested.value)} (${mostInvested.percentage.toFixed(1)}%). ` +
        `${distribution.length < 3 ? 'Considera diversificar en mas tipos de activos para reducir riesgo.' : 'Tienes una buena diversificacion por tipo de activo.'}`),
        50,
        yPos + 25,
        { width: 495, align: 'justify' }
      );

    // Footer
    doc.fontSize(9).fillColor('#888888')
      .text('Pagina 2 de 10', 50, 750, { align: 'center', width: 495 });
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
    const ROW_HEIGHT = 18; // Altura fija para cada fila

    // Definir posiciones X fijas para cada columna
    const cols = {
      ticker: 55,
      nombre: 105,
      cantidad: 200,
      precioCompra: 265,
      precioActual: 340,
      valor: 410,
      ganancia: 480
    };

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
        .text('Ticker', cols.ticker, yPos + 8)
        .text('Nombre', cols.nombre, yPos + 8)
        .text('Cant.', cols.cantidad, yPos + 8)
        .text('P. Compra', cols.precioCompra, yPos + 8)
        .text('P. Actual', cols.precioActual, yPos + 8)
        .text('Valor', cols.valor, yPos + 8)
        .text('Gan/Per', cols.ganancia, yPos + 8);

      yPos += 25;

      // Activos
      let subtotalInvested = 0;
      let subtotalCurrent = 0;

      assetsOfType.forEach((asset, index) => {
        subtotalInvested += asset.investedValue;
        subtotalCurrent += asset.currentValue;

        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(50, yPos, 495, ROW_HEIGHT).fill(bgColor);

        doc.fillColor('#000000').fontSize(8).font('Helvetica');
        
        // Ticker - con ancho fijo
        doc.text(
          asset.ticker && asset.ticker.length > 6 ? asset.ticker.substring(0, 6) : (asset.ticker || 'N/A'), 
          cols.ticker, 
          yPos + 5,
          { width: 45, ellipsis: true, lineBreak: false }
        );
        
        // Nombre - con ancho fijo
        doc.text(
          asset.name && asset.name.length > 15 ? asset.name.substring(0, 15) : (asset.name || 'Sin nombre'), 
          cols.nombre, 
          yPos + 5,
          { width: 90, ellipsis: true, lineBreak: false }
        );
        
        // Cantidad - PROTEGIDO contra valores no numéricos
        doc.text(
          this.safeNumber(asset.quantity, 0).toFixed(2), 
          cols.cantidad, 
          yPos + 5,
          { width: 60, lineBreak: false }
        );
        
        // Precio Compra
        doc.text(
          `$${this.formatNumber(asset.purchasePrice)}`, 
          cols.precioCompra, 
          yPos + 5,
          { width: 70, lineBreak: false }
        );
        
        // Precio Actual
        doc.text(
          `$${this.formatNumber(asset.currentPrice)}`, 
          cols.precioActual, 
          yPos + 5,
          { width: 65, lineBreak: false }
        );
        
        // Valor
        doc.text(
          `$${this.formatNumber(asset.currentValue)}`, 
          cols.valor, 
          yPos + 5,
          { width: 65, lineBreak: false }
        );

        // Ganancia/Pérdida
        const gainLoss = this.safeNumber(asset.gainLoss, 0);
        const gainLossPercentage = this.safeNumber(asset.gainLossPercentage, 0);
        const gainColor = gainLoss >= 0 ? '#10b981' : '#ef4444';
        doc.fillColor(gainColor)
          .text(
            `${gainLoss >= 0 ? '+' : ''}${gainLossPercentage.toFixed(1)}%`,
            cols.ganancia,
            yPos + 5,
            { width: 60, lineBreak: false }
          );

        yPos += ROW_HEIGHT;
      });

      // Subtotal
      yPos += 5;
      doc.rect(50, yPos, 495, 22).fill('#dbeafe');
      doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
      
      doc.text('SUBTOTAL:', cols.ticker, yPos + 6);
      doc.text(`$${this.formatNumber(subtotalInvested)}`, cols.precioCompra, yPos + 6, { width: 70, lineBreak: false });
      doc.text(`$${this.formatNumber(subtotalCurrent)}`, cols.valor, yPos + 6, { width: 65, lineBreak: false });

      const subtotalGain = subtotalCurrent - subtotalInvested;
      const subtotalGainPct = (subtotalGain / subtotalInvested) * 100;
      const gainColor = subtotalGain >= 0 ? '#10b981' : '#ef4444';
      
      doc.fillColor(gainColor)
        .text(
          `${subtotalGain >= 0 ? '+' : ''}${subtotalGainPct.toFixed(1)}%`,
          cols.ganancia,
          yPos + 6,
          { width: 60, lineBreak: false }
        );

      yPos += 35;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Paginas 3-4 de 10', 50, 750, { align: 'center', width: 495 });
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
      .text(this.sanitizeText('🥇 Top 5 Mejores Activos'), 50, 100);

    let yPos = 130;

    topPerformers.slice(0, 5).forEach((asset, index) => {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      
      doc.roundedRect(50, yPos, 495, 40, 5).fill('#f0fdf4');
      
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
        .text(this.sanitizeText(`${medals[index]} ${asset.ticker} - ${asset.name}`), 60, yPos + 8);

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
      .text(this.sanitizeText('📉 Activos con Perdidas'), 50, yPos);

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
        .text(this.sanitizeText('✅ ¡Excelente! Todos tus activos estan en ganancia.'), 60, yPos);
      yPos += 30;
    }

    // Estadísticas
    yPos += 20;
    doc.roundedRect(50, yPos, 495, 100, 5).fill('#f0f9ff');
    
    doc.fillColor('#2563eb').fontSize(12).font('Helvetica-Bold')
      .text(this.sanitizeText('📊 ESTADISTICAS GENERALES'), 60, yPos + 10);

    doc.fillColor('#000000').fontSize(10).font('Helvetica')
      .text(`Activos ganadores: ${performanceStats.winnersCount} (${performanceStats.winnersPercentage.toFixed(1)}%)`, 60, yPos + 35)
      .text(`Activos perdedores: ${performanceStats.losersCount}`, 60, yPos + 55)
      .text(`Ganancia promedio: $${this.formatNumber(performanceStats.averageGain)}`, 300, yPos + 35)
      .text(`Mejor ganancia: ${performanceStats.bestGainPercentage.toFixed(1)}%`, 300, yPos + 55);

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Pagina 5 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 6: DIVERSIFICACIÓN ====================
  private async addDiversificationPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { diversificationAnalysis } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text(this.sanitizeText('ANALISIS DE DIVERSIFICACION'), 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Score principal
    doc.roundedRect(50, 100, 495, 80, 5).fill('#f0f9ff');
    
    doc.fillColor('#2563eb').fontSize(16).font('Helvetica-Bold')
      .text('SCORE DE DIVERSIFICACION', 60, 115);

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
      .text(this.sanitizeText('Top 10 Activos por Tamaño:'), 50, yPos);

    yPos += 30;

    const ROW_HEIGHT = 22; // Altura fija para cada fila
    
    diversificationAnalysis.topAssets.slice(0, 10).forEach((asset, index) => {
      // Fondo alternado
      if (index % 2 === 0) {
        doc.rect(50, yPos - 2, 495, ROW_HEIGHT).fill('#f9fafb');
      }
      
      doc.fillColor('#000000').fontSize(10).font('Helvetica');
      
      // Número y Ticker
      doc.text(
        `${index + 1}. ${asset.ticker}`, 
        55, 
        yPos,
        { width: 70, lineBreak: false }
      );
      
      // Nombre
      doc.text(
        asset.name.length > 20 ? asset.name.substring(0, 20) : asset.name, 
        130, 
        yPos,
        { width: 110, ellipsis: true, lineBreak: false }
      );
      
      // Valor
      doc.text(
        `$${this.formatNumber(asset.value)}`, 
        250, 
        yPos,
        { width: 100, lineBreak: false }
      );
      
      // Porcentaje
      doc.text(
        `${asset.percentage.toFixed(1)}%`, 
        360, 
        yPos,
        { width: 50, lineBreak: false }
      );

      // Barra mini - DESPUÉS del texto, en posición separada
      const miniBarWidth = Math.min((asset.percentage / 100) * 100, 100); // Máximo 100px
      doc.rect(420, yPos + 3, miniBarWidth, 8).fill('#3b82f6');

      yPos += ROW_HEIGHT;
    });

    // Recomendación
    yPos += 20;
    doc.roundedRect(50, yPos, 495, 80, 5).fill('#fef3c7');
    
    doc.fillColor('#92400e').fontSize(12).font('Helvetica-Bold')
      .text(this.sanitizeText('💡 RECOMENDACION'), 60, yPos + 10);

    doc.fillColor('#000000').fontSize(10).font('Helvetica')
      .text(this.sanitizeText(diversificationAnalysis.recommendation), 60, yPos + 35, {
        width: 475,
        align: 'justify'
      });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Pagina 6 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 7: ANÁLISIS DE RIESGO ====================
  private async addRiskAnalysisPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { riskAnalysis } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text(this.sanitizeText('ANALISIS DE RIESGO'), 50, 50);

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
      .text(this.sanitizeText('Exposicion Crypto:'), 315, yPos + 15);
    doc.fontSize(14).font('Helvetica')
      .text(`${riskAnalysis.cryptoExposure.toFixed(1)}%`, 315, yPos + 35);

    // Factores de riesgo
    yPos += 80;
    doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
      .text(this.sanitizeText('⚠️ Factores de Riesgo Identificados:'), 50, yPos);

    yPos += 30;

    riskAnalysis.factors.forEach((factor) => {
      doc.fontSize(11).fillColor('#000000').font('Helvetica')
        .text(this.sanitizeText(`• ${factor}`), 60, yPos);
      yPos += 25;
    });

    // Advertencias
    yPos += 20;
    doc.fontSize(14).fillColor('#ef4444').font('Helvetica-Bold')
      .text(this.sanitizeText('🚨 Advertencias:'), 50, yPos);

    yPos += 30;

    riskAnalysis.warnings.forEach((warning) => {
      doc.roundedRect(50, yPos, 495, 35, 5).fill('#fee2e2');
      doc.fontSize(10).fillColor('#000000').font('Helvetica')
        .text(this.sanitizeText(warning), 60, yPos + 10, { width: 475 });
      yPos += 45;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Pagina 7 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 8: RECOMENDACIONES ====================
  private async addRecommendationsPage(doc: typeof PDFDocument, data: CompleteReportData) {
    const { recommendations } = data;

    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text(this.sanitizeText('🎯 RECOMENDACIONES PERSONALIZADAS'), 50, 50);

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
        .text(this.sanitizeText(`${colors.icon} PRIORIDAD ${priority.toUpperCase()}`), 50, yPos);

      yPos += 30;

      recs.forEach((rec, index) => {
        // Si no cabe, nueva página
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc.roundedRect(50, yPos, 495, 120, 5).fill(colors.bg);

        doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
          .text(this.sanitizeText(`${index + 1}. ${rec.title}`), 60, yPos + 10);

        doc.fontSize(10).font('Helvetica')
          .text(this.sanitizeText(rec.description), 60, yPos + 30, { width: 475, align: 'justify' });

        doc.fillColor(colors.title).fontSize(10).font('Helvetica-Bold')
          .text(this.sanitizeText('Accion sugerida:'), 60, yPos + 65);

        doc.fillColor('#000000').fontSize(9).font('Helvetica')
          .text(this.sanitizeText(rec.action), 60, yPos + 80, { width: 475, align: 'justify' });

        yPos += 130;
      });

      yPos += 10;
    });

    // Footer
    doc.fillColor('#888888').fontSize(9)
      .text('Pagina 8 de 10', 50, 750, { align: 'center', width: 495 });
  }

  // ==================== PÁGINA 9: GRÁFICOS ====================
  private async addChartsPage(doc: typeof PDFDocument, data: CompleteReportData) {
    // Header
    doc.fontSize(20).fillColor('#2563eb')
      .text(this.sanitizeText('GRAFICOS Y VISUALIZACIONES'), 50, 50);

    doc.moveTo(50, 80).lineTo(545, 80).stroke();

    // Gráfico 1: Distribución por tipo
    doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold')
      .text(this.sanitizeText('Distribucion por Tipo de Activo'), 50, 100);

    try {
      const pieChartImage = await this.generatePieChart(data.distribution);
      doc.image(pieChartImage, 75, 130, { width: 450 });
    } catch (error) {
      doc.fontSize(10).fillColor('#666666')
        .text(this.sanitizeText('(Grafico no disponible)'), 200, 300);
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
      .text(this.sanitizeText('✅ Proximos Pasos Sugeridos:'), 50, 100);

    doc.fontSize(10).fillColor('#000000').font('Helvetica')
      .text('1. Revisa las recomendaciones de prioridad ALTA', 60, 130)
      .text(this.sanitizeText('2. Analiza los activos con perdidas significativas'), 60, 150)
      .text('3. Considera rebalancear tu portfolio trimestralmente', 60, 170)
      .text(this.sanitizeText('4. Manten un seguimiento regular de tus inversiones'), 60, 190)
      .text('5. Consulta con un asesor financiero para decisiones importantes', 60, 210);

    // Información de contacto
    doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
      .text(this.sanitizeText('📧 Informacion de Contacto:'), 50, 250);

    doc.fontSize(10).fillColor('#000000').font('Helvetica')
      .text('Email: soporte@financepr.com', 60, 280)
      .text('Web: www.financepr.com', 60, 300)
      .text(this.sanitizeText('Telefono: +54 11 1234-5678'), 60, 320);

    // Disclaimer legal
    doc.fontSize(14).fillColor('#ef4444').font('Helvetica-Bold')
      .text(this.sanitizeText('⚠️ DISCLAIMER LEGAL'), 50, 370);

    doc.roundedRect(50, 400, 495, 200, 5).fill('#f9fafb');

    doc.fontSize(9).fillColor('#000000').font('Helvetica')
      .text(
        this.sanitizeText('Este informe es generado automaticamente por FINANCEPR y tiene fines informativos unicamente. ' +
        'No constituye asesoramiento financiero, de inversion, legal o fiscal. Las recomendaciones ' +
        'presentadas se basan en analisis algoritmicos y no deben considerarse como consejos personalizados.\n\n' +
        'Los valores de activos mostrados pueden no reflejar precios de mercado en tiempo real. ' +
        'Las inversiones en instrumentos financieros conllevan riesgos, incluyendo la posible perdida ' +
        'del capital invertido. El rendimiento pasado no garantiza resultados futuros.\n\n' +
        'Recomendamos encarecidamente consultar con un asesor financiero certificado antes de tomar ' +
        'decisiones de inversion. FINANCEPR no se hace responsable de perdidas o daños derivados del ' +
        'uso de este informe.'),
        60,
        410,
        { width: 475, align: 'justify', lineGap: 3 }
      );

    // Info del reporte
    doc.fontSize(8).fillColor('#666666')
      .text(`ID Reporte: ${data.reportId}`, 50, 620)
      .text(`Generado: ${new Date(data.generatedAt).toLocaleString('es-ES')}`, 50, 635)
      .text(`Version: FINANCEPR ${data.version}`, 50, 650);

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
  private formatNumber(num: any): string {
    const safeNum = this.safeNumber(num, 0);
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeNum);
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
