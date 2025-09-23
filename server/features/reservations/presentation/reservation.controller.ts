import type { Request, Response } from "express";
import { insertReservationSchema } from "@shared/schema";
import type { ReservationService } from "../domain/reservation.service.js";
import type { ReservationFilters, ImportFromTextRequest } from "../domain/reservation.entity.js";
import { handleError, createSuccessResponse, createErrorResponse } from "../../../shared/utils/error-handler.js";

export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  async getAllReservations(req: Request, res: Response): Promise<void> {
    try {
      const filters: ReservationFilters = {};

      if (req.query.propertyId) {
        filters.propertyId = Number(req.query.propertyId);
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.platform) {
        filters.platform = req.query.platform as string;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.guestName) {
        filters.guestName = req.query.guestName as string;
      }

      const result = await this.reservationService.getAllReservations(filters);

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || 'Failed to fetch reservations'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async getReservationById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid reservation ID'));
        return;
      }

      const result = await this.reservationService.getReservationById(id);

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        const statusCode = result.error === 'Reservation not found' ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to fetch reservation'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async getReservationsByProperty(req: Request, res: Response): Promise<void> {
    try {
      const propertyId = Number(req.params.propertyId);
      if (isNaN(propertyId)) {
        res.status(400).json(createErrorResponse('Invalid property ID'));
        return;
      }

      const result = await this.reservationService.getReservationsByProperty(propertyId);

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || 'Failed to fetch reservations by property'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async createReservation(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const result = await this.reservationService.createReservation(validatedData);

      if (result.success) {
        res.status(201).json(createSuccessResponse(result.data, 'Reservation created successfully'));
      } else {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to create reservation'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async updateReservation(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid reservation ID'));
        return;
      }

      const validatedData = insertReservationSchema.partial().parse(req.body);
      const result = await this.reservationService.updateReservation(id, validatedData);

      if (result.success) {
        res.json(createSuccessResponse(result.data, 'Reservation updated successfully'));
      } else {
        const statusCode = result.error === 'Reservation not found' ? 404 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to update reservation'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteReservation(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Invalid reservation ID'));
        return;
      }

      const result = await this.reservationService.deleteReservation(id);

      if (result.success) {
        res.status(204).end();
      } else {
        const statusCode = result.error === 'Reservation not found' ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || 'Failed to delete reservation'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.reservationService.getDashboardData();

      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || 'Failed to fetch dashboard data'));
      }
    } catch (err) {
      handleError(err, res);
    }
  }

  async importFromText(req: Request, res: Response): Promise<void> {
    try {
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        res.status(400).json(createErrorResponse(
          'Chave da API Google Gemini não configurada',
          'GEMINI_API_KEY_MISSING'
        ));
        return;
      }

      const { text, propertyId, userAnswers } = req.body;
      const importRequest: ImportFromTextRequest = {
        text,
        propertyId: propertyId ? Number(propertyId) : undefined,
        userAnswers
      };

      const result = await this.reservationService.importFromText(importRequest);

      if (result.success && result.data) {
        res.json({
          success: result.data.success,
          needsClarification: result.data.needsClarification,
          clarificationQuestions: result.data.clarificationQuestions,
          reservationData: result.data.reservationData,
          message: result.data.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json(createErrorResponse(
          result.error || 'Failed to import reservation from text'
        ));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
}