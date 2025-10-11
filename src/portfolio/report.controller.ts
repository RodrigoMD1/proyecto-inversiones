import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtOptionalPreflightGuard } from '../auth/guards/jwt-optional-preflight.guard';
import { ReportService } from './report.service';
import { ReportAnalysisService } from './report-analysis.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('portfolio/report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportAnalysisService: ReportAnalysisService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) { }

  // Endpoint LEGACY (simple) - mantener por compatibilidad
  @UseGuards(AuthGuard('jwt'))
  @Get('download-simple')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Descargar reporte simple (legacy)' })
  @ApiResponse({ status: 200, description: 'PDF generado exitosamente' })
  async downloadSimpleReport(@Req() req: Request, @Res() res: Response) {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).send('No autorizado');

    const htmlContent = await this.reportService.generateReport(userId);

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  }

  // Endpoint NUEVO (completo con 10 páginas)
  @UseGuards(JwtOptionalPreflightGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar informe completo de 10 páginas con análisis avanzado' })
  @ApiResponse({ status: 200, description: 'PDF profesional generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Portfolio vacío' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generateCompleteReport(
    @Req() req: Request, 
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    try {
      console.log(`[${new Date().toISOString()}] 📊 Iniciando generación de reporte para usuario ${userId}`);
      
      // 1. Generar análisis completo de datos
      const dataStart = Date.now();
      const reportData = await this.reportAnalysisService.generateCompleteReportData(userId);
      console.log(`[${new Date().toISOString()}] ✅ Análisis completado en ${Date.now() - dataStart}ms`);

      // 2. Generar PDF de 10 páginas
      const pdfStart = Date.now();
      const pdfBuffer = await this.pdfGeneratorService.generatePdf(reportData);
      console.log(`[${new Date().toISOString()}] ✅ PDF generado en ${Date.now() - pdfStart}ms`);

      // 3. Enviar PDF
      const fileName = `Informe_${reportData.reportId}_${new Date().getTime()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      
      res.send(pdfBuffer);
      
      console.log(`[${new Date().toISOString()}] 🎉 Reporte enviado. Tiempo total: ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error generando reporte después de ${Date.now() - startTime}ms:`, error);
      return res.status(500).json({ 
        message: 'Error generando reporte', 
        error: error.message 
      });
    }
  }

  // Endpoint para obtener solo los datos JSON (útil para frontend)
  @UseGuards(AuthGuard('jwt'))
  @Get('data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos completos del análisis en JSON' })
  @ApiResponse({ status: 200, description: 'Datos del análisis' })
  async getReportData(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    if (!userId) {
      throw new Error('No autorizado');
    }

    const reportData = await this.reportAnalysisService.generateCompleteReportData(userId);
    return reportData;
  }
}