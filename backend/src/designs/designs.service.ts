import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateDesignDto, UpdateDesignDto, CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class DesignsService {
  constructor(private readonly prisma: PrismaService) {}

  // naive per-user rate limit memory (process lifetime)
  private userOpTimestamps: Map<string, number[]> = new Map();

  private enforceRateLimit(userId: string, maxOps: number, windowMs: number) {
    const now = Date.now();
    const list = this.userOpTimestamps.get(userId) || [];
    const filtered = list.filter((ts) => now - ts < windowMs);
    if (filtered.length >= maxOps) {
      throw new BadRequestException('Rate limit exceeded. Please try again shortly.');
    }
    filtered.push(now);
    this.userOpTimestamps.set(userId, filtered);
  }

  private validateDesignPayloadSize(designData: Record<string, any>, maxBytes = 1_000_000) {
    try {
      const json = JSON.stringify(designData);
      if (json.length > maxBytes) {
        throw new BadRequestException('designData is too large');
      }
      const parsed = JSON.parse(json);
      const elements = Array.isArray(parsed?.elements) ? parsed.elements : [];
      if (elements.length > 300) {
        throw new BadRequestException('Too many elements in designData');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid designData payload');
    }
  }

  // Templates
  async getTemplates(params: { query?: string }) {
    const { query } = params;
    return this.prisma.designTemplate.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(body: CreateTemplateDto, userId: string) {
    // TODO: replace with admin authorization
    return this.prisma.designTemplate.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        thumbnail: body.thumbnail ?? null,
        elements: body.elements ?? {},
        isActive: body.isActive ?? true,
      },
    });
  }

  async updateTemplate(id: string, body: UpdateTemplateDto, userId: string) {
    // TODO: replace with admin authorization
    return this.prisma.designTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        thumbnail: body.thumbnail,
        elements: body.elements,
        isActive: body.isActive,
      },
    });
  }

  async deleteTemplate(id: string, userId: string) {
    // TODO: replace with admin authorization
    return this.prisma.designTemplate.delete({ where: { id } });
  }

  // User designs
  async createDesign(userId: string, dto: CreateDesignDto) {
    this.enforceRateLimit(userId, 6, 10_000); // max 6 ops per 10s
    this.validateDesignPayloadSize(dto.designData, 1_000_000);
    return this.prisma.design.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        designData: dto.designData,
        templateId: dto.templateId ?? null,
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async getDesign(userId: string, id: string) {
    const design = await this.prisma.design.findUnique({ where: { id } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    if (design.userId !== userId) {
      throw new ForbiddenException('You do not own this design');
    }
    return design;
  }

  async updateDesign(userId: string, id: string, dto: UpdateDesignDto) {
    const design = await this.prisma.design.findUnique({ where: { id } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    if (design.userId !== userId) {
      throw new ForbiddenException('You do not own this design');
    }
    if (dto.designData) {
      this.enforceRateLimit(userId, 10, 10_000); // allow a bit more for autosave
      this.validateDesignPayloadSize(dto.designData, 1_000_000);
    }
    return this.prisma.design.update({
      where: { id },
      data: {
        name: dto.name ?? design.name,
        description: dto.description ?? design.description,
        designData: dto.designData ?? design.designData,
        templateId: dto.templateId ?? design.templateId,
        isPublic: dto.isPublic ?? design.isPublic,
      },
    });
  }

  async deleteDesign(userId: string, id: string) {
    const design = await this.prisma.design.findUnique({ where: { id } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    if (design.userId !== userId) {
      throw new ForbiddenException('You do not own this design');
    }
    await this.prisma.design.delete({ where: { id } });
    return { message: 'Design deleted' };
  }
}


