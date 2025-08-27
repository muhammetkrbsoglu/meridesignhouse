import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsObject()
  elements!: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsObject()
  @IsOptional()
  elements?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


