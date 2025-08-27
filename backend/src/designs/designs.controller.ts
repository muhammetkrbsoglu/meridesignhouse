import { 
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { DesignsService } from './designs.service';
import { CreateDesignDto, UpdateDesignDto, CreateTemplateDto, UpdateTemplateDto } from './dto';
import { ClerkGuard } from '../auth/clerk.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  // Templates (public list)
  @Get('templates')
  async getTemplates(@Query('q') q?: string) {
    return this.designsService.getTemplates({ query: q });
  }

  // Templates admin CRUD (placeholder guards - to be replaced with AdminGuard if available)
  @Post('templates')
  @UseGuards(ClerkGuard, AdminGuard)
  async createTemplate(@Body() body: CreateTemplateDto, @Req() req: any) {
    return this.designsService.createTemplate(body, req.user?.id);
  }

  @Put('templates/:id')
  @UseGuards(ClerkGuard, AdminGuard)
  async updateTemplate(@Param('id') id: string, @Body() body: UpdateTemplateDto, @Req() req: any) {
    return this.designsService.updateTemplate(id, body, req.user?.id);
  }

  @Delete('templates/:id')
  @UseGuards(ClerkGuard, AdminGuard)
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    return this.designsService.deleteTemplate(id, req.user?.id);
  }

  // User designs
  @Post()
  @UseGuards(ClerkGuard)
  async createDesign(@Body() dto: CreateDesignDto, @Req() req: any) {
    return this.designsService.createDesign(req.user?.id, dto);
  }

  @Get(':id')
  @UseGuards(ClerkGuard)
  async getDesign(@Param('id') id: string, @Req() req: any) {
    return this.designsService.getDesign(req.user?.id, id);
  }

  @Put(':id')
  @UseGuards(ClerkGuard)
  async updateDesign(@Param('id') id: string, @Body() dto: UpdateDesignDto, @Req() req: any) {
    return this.designsService.updateDesign(req.user?.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(ClerkGuard)
  async deleteDesign(@Param('id') id: string, @Req() req: any) {
    return this.designsService.deleteDesign(req.user?.id, id);
  }
}


