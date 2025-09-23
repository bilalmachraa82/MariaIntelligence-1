import type { Request, Response } from "express";
import { insertPropertySchema } from "@shared/schema";
import type { PropertyService } from "../domain/property.service.js";
import { handleError, createSuccessResponse, createErrorResponse } from "../../../shared/utils/error-handler.js";

export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  async getAllProperties(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.propertyService.getAllProperties();

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || 'Failed to fetch properties'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async getPropertyById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid property ID'));
        return;
      }

      const result = await this.propertyService.getPropertyById(id);

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        const statusCode = result.error === 'Property not found' ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to fetch property'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async createProperty(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const result = await this.propertyService.createProperty(validatedData);

      if (result.success) {
        res.status(201).json(createSuccessResponse(result.data, 'Property created successfully'));
      } else {
        const statusCode = result.error?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to create property'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async updateProperty(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid property ID'));
        return;
      }

      // Partial validation for updates
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const result = await this.propertyService.updateProperty(id, validatedData);

      if (result.success) {
        res.json(createSuccessResponse(result.data, 'Property updated successfully'));
      } else {
        const statusCode = result.error === 'Property not found' ? 404 :
                          result.error?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to update property'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteProperty(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid property ID'));
        return;
      }

      const result = await this.propertyService.deleteProperty(id);

      if (result.success) {
        res.status(204).end();
      } else {
        const statusCode = result.error === 'Property not found' ? 404 :
                          result.error?.includes('active reservations') ? 409 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to delete property'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async getPropertyStatistics(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid property ID'));
        return;
      }

      const result = await this.propertyService.getPropertyStatistics(id);

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        const statusCode = result.error === 'Property not found' ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to fetch property statistics'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async getActiveProperties(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.propertyService.getActiveProperties();

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || 'Failed to fetch active properties'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
}