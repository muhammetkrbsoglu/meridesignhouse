import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDesignDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsObject()
  designData!: Record<string, any>;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateDesignDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsObject()
  @IsOptional()
  designData?: Record<string, any>;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}


