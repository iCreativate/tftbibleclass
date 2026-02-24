/** Course-level downloadable materials (Word, PDF, images). */
export const MATERIAL_FORMATS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"] as const;
export type MaterialFormat = (typeof MATERIAL_FORMATS)[number];

/** Per-lesson attachments (includes slides). */
export const MODULE_MATERIAL_FORMATS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "pptx"] as const;
export type ModuleMaterialFormat = (typeof MODULE_MATERIAL_FORMATS)[number];
