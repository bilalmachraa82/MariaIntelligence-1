import { apiRequest } from "./queryClient";

interface ExtractedData {
  propertyId: number;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: number;
  platform: string;
  platformFee: number;
  cleaningFee: number;
  checkInFee: number;
  commissionFee: number;
  teamPayment: number;
}

interface UploadResponse {
  extractedData: ExtractedData;
  file: {
    filename: string;
    path: string;
  };
}

export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

// Function to upload PDF and process with OCR
export async function uploadAndProcessPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await fetch("/api/upload-pdf", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to process PDF: ${errorText}`);
  }

  return await response.json();
}

// Function to create reservation from extracted data
export async function createReservationFromExtractedData(data: ExtractedData) {
  const reservationData = {
    propertyId: data.propertyId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    numGuests: data.numGuests,
    totalAmount: data.totalAmount.toString(),
    status: "confirmed",
    platform: data.platform,
    platformFee: data.platformFee.toString(),
    cleaningFee: data.cleaningFee.toString(),
    checkInFee: data.checkInFee.toString(),
    commissionFee: data.commissionFee.toString(),
    teamPayment: data.teamPayment.toString(),
    notes: "Created via PDF OCR extraction",
  };

  const response = await apiRequest("POST", "/api/reservations", reservationData);
  return await response.json();
}

// In a real implementation, this would call the Mistral AI API directly
// For now we'll just use our backend endpoint which simulates the OCR process
export async function processPDFWithMistralOCR(file: File): Promise<any> {
  // This function would use the MISTRAL_API_KEY to call their API directly
  // We're delegating to our backend for the demo
  return uploadAndProcessPDF(file);
}
