// Properties Feature Module Export
export { default as propertyRoutes } from "./presentation/property.routes.js";
export { PropertyController } from "./presentation/property.controller.js";
export { PropertyDomainService } from "./domain/property.service.js";
export { DrizzlePropertyRepository } from "./infrastructure/property.repository.js";
export type { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyStatistics } from "./domain/property.entity.js";
export type { PropertyService, PropertyRepository } from "./domain/property.service.js";