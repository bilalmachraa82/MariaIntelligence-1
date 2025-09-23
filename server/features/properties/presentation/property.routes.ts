import { Router } from "express";
import { PropertyController } from "./property.controller.js";
import { PropertyDomainService } from "../domain/property.service.js";
import { DrizzlePropertyRepository } from "../infrastructure/property.repository.js";

// Dependency injection setup
const propertyRepository = new DrizzlePropertyRepository();
const propertyService = new PropertyDomainService(propertyRepository);
const propertyController = new PropertyController(propertyService);

const router = Router();

// Properties routes
router.get("/", (req, res) => propertyController.getAllProperties(req, res));
router.get("/active", (req, res) => propertyController.getActiveProperties(req, res));
router.get("/:id", (req, res) => propertyController.getPropertyById(req, res));
router.get("/:id/statistics", (req, res) => propertyController.getPropertyStatistics(req, res));
router.post("/", (req, res) => propertyController.createProperty(req, res));
router.patch("/:id", (req, res) => propertyController.updateProperty(req, res));
router.delete("/:id", (req, res) => propertyController.deleteProperty(req, res));

export default router;