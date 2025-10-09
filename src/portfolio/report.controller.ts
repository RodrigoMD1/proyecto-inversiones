import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('jwt'))
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
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    try {
      // 1. Generar análisis completo de datos
      const reportData = await this.reportAnalysisService.generateCompleteReportData(userId);

      // 2. Generar PDF de 10 páginas
      const pdfBuffer = await this.pdfGeneratorService.generatePdf(reportData);

      // 3. Enviar PDF
      const fileName = `Informe_${reportData.reportId}_${new Date().getTime()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generando reporte:', error);
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