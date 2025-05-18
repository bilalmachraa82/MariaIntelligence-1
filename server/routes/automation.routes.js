/**
 * Rotas para automação de processos do sistema
 */

const express = require('express');
const router = express.Router();
const { runAutomations, generateOwnerInvoice, getPropertyManagementView } = require('../controllers/automation.controller');

// Rota para executar automações (atualização de status e agendamento de limpezas)
router.post('/run', runAutomations);

// Rota para gerar fatura para proprietário
router.get('/invoice/owner/:ownerId', generateOwnerInvoice);

// Rota para obter visão de gerenciamento de propriedades
router.get('/property-management', getPropertyManagementView);

module.exports = router;