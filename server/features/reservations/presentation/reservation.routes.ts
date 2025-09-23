import { Router } from "express";
import { ReservationController } from "./reservation.controller.js";
import { ReservationDomainService } from "../domain/reservation.service.js";
import {
  DrizzleReservationRepository,
  DrizzlePropertyRepositoryForReservations,
  ReservationImportServiceImpl
} from "../infrastructure/reservation.repository.js";

// Dependency injection setup
const reservationRepository = new DrizzleReservationRepository();
const propertyRepository = new DrizzlePropertyRepositoryForReservations();
const importService = new ReservationImportServiceImpl();

const reservationService = new ReservationDomainService(
  reservationRepository,
  propertyRepository,
  importService
);

const reservationController = new ReservationController(reservationService);

const router = Router();

// Reservations routes
router.get("/", (req, res) => reservationController.getAllReservations(req, res));
router.get("/dashboard", (req, res) => reservationController.getDashboardData(req, res));
router.get("/:id", (req, res) => reservationController.getReservationById(req, res));
router.get("/property/:propertyId", (req, res) => reservationController.getReservationsByProperty(req, res));
router.post("/", (req, res) => reservationController.createReservation(req, res));
router.post("/import-text", (req, res) => reservationController.importFromText(req, res));
router.patch("/:id", (req, res) => reservationController.updateReservation(req, res));
router.delete("/:id", (req, res) => reservationController.deleteReservation(req, res));

export default router;