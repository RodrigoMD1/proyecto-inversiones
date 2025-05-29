import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('download')
  async downloadReport(@Req() req: Request, @Res() res: Response) {
    // Suponiendo que el userId está en req.user.id (ajusta según tu estrategia JWT)
    // Si usas Passport, asegúrate de que el usuario esté en req.user
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).send('No autorizado');
    }
    const report = await this.reportService.generateReport(userId);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte.html"');
    res.send(report);
  }
}