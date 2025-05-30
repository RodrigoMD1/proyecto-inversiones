import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
// Cambia la importación de PDFKit:
import PDFDocument from 'pdfkit';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('download')
  async downloadReport(@Req() req: Request, @Res() res: Response) {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).send('No autorizado');

    const stats = await this.reportService.generateReportData(userId);

    // Crear PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');
    doc.pipe(res);

    doc.fontSize(18).text('Reporte de tu Portfolio', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Valor total: $${stats.totalValue}`);
    doc.text(`Precio promedio ponderado: $${stats.weightedAveragePrice}`);
    doc.text(`Distribución: ${JSON.stringify(stats.distribution)}`);

    doc.end();
  }
}