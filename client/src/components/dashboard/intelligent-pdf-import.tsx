/**
 * Intelligent PDF Import Component
 * 
 * Advanced PDF import interface with property matching suggestions,
 * progress tracking, and detailed import results.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Download, Trash2, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface PDFFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  reservations?: ProcessedReservation[];
  error?: string;
}

interface ProcessedReservation {
  id: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  confidence: number;
  status: 'matched' | 'suggested' | 'unmatched';
  suggestions?: PropertySuggestion[];
}

interface PropertySuggestion {
  id: number;
  name: string;
  score: number;
  reason: string;
}

interface ImportOptions {
  autoMatch: boolean;
  confidenceThreshold: number;
  createUnmatchedProperties: boolean;
  batchSize: number;
}

interface ImportReport {
  totalReservations: number;
  matchedReservations: number;
  suggestedReservations: number;
  unmatchedReservations: number;
  processingTime: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export function IntelligentPDFImport() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [selectedTab, setSelectedTab] = useState('upload');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    autoMatch: true,
    confidenceThreshold: 0.7,
    createUnmatchedProperties: false,
    batchSize: 10
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: PDFFile[] = Array.from(selectedFiles)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        status: 'pending',
        progress: 0
      }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setSelectedTab('progress');

    try {
      const formData = new FormData();
      
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      
      formData.append('options', JSON.stringify(importOptions));

      // Update file statuses to processing
      setFiles(prev => prev.map(file => ({ ...file, status: 'processing' as const })));

      const response = await fetch('/api/pdf-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update files with results
        setFiles(prev => prev.map((file, index) => ({
          ...file,
          status: 'completed',
          progress: 100,
          reservations: result.data.reservations.filter((r: any, i: number) => 
            Math.floor(i / Math.ceil(result.data.reservations.length / files.length)) === index
          )
        })));

        setImportReport(result.data.report);
        setSelectedTab('results');
      } else {
        throw new Error(result.message || 'Import failed');
      }

    } catch (error) {
      console.error('Import error:', error);
      setFiles(prev => prev.map(file => ({ 
        ...file, 
        status: 'error' as const, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default" className="bg-green-100 text-green-800">High ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligent PDF Import</h2>
          <p className="text-muted-foreground">
            Import reservations from Booking.com and Airbnb PDFs with intelligent property matching
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Select PDFs
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart PDF Processing
              </CardTitle>
              <CardDescription>
                Upload PDF files from booking platforms. Our AI will intelligently extract reservations and match properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Drop PDF files here or click to select
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  Supports Booking.com and Airbnb reservation PDFs
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Choose Files
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium">Selected Files ({files.length})</h3>
                  <ScrollArea className="h-64">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(file.status)}
                          <div>
                            <div className="font-medium">{file.file.name}</div>
                            <div className="text-sm text-gray-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.status === 'processing' && (
                            <Progress value={file.progress} className="w-24" />
                          )}
                          {file.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={processFiles}
                    disabled={isProcessing || files.length === 0}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Process Files
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Import Options
              </CardTitle>
              <CardDescription>
                Configure how the AI processes and matches your reservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-match Properties</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically match properties with high confidence scores
                  </div>
                </div>
                <Switch
                  checked={importOptions.autoMatch}
                  onCheckedChange={(checked) =>
                    setImportOptions(prev => ({ ...prev, autoMatch: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold</Label>
                <Select
                  value={importOptions.confidenceThreshold.toString()}
                  onValueChange={(value) =>
                    setImportOptions(prev => ({ ...prev, confidenceThreshold: parseFloat(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">50% - Low (More matches, less accuracy)</SelectItem>
                    <SelectItem value="0.7">70% - Medium (Balanced)</SelectItem>
                    <SelectItem value="0.8">80% - High (Fewer matches, higher accuracy)</SelectItem>
                    <SelectItem value="0.9">90% - Very High (Only near-perfect matches)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Create Unmatched Properties</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically create new properties for unmatched names
                  </div>
                </div>
                <Switch
                  checked={importOptions.createUnmatchedProperties}
                  onCheckedChange={(checked) =>
                    setImportOptions(prev => ({ ...prev, createUnmatchedProperties: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Batch Size</Label>
                <Select
                  value={importOptions.batchSize.toString()}
                  onValueChange={(value) =>
                    setImportOptions(prev => ({ ...prev, batchSize: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 files per batch</SelectItem>
                    <SelectItem value="10">10 files per batch</SelectItem>
                    <SelectItem value="20">20 files per batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Progress</CardTitle>
              <CardDescription>
                Monitoring AI processing and property matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{file.file.name}</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {file.status}
                          </span>
                        </div>
                      </div>
                      <Progress value={file.progress} />
                      {file.error && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{file.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No files to process
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {importReport ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{importReport.totalReservations}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Matched</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{importReport.matchedReservations}</div>
                    <p className="text-xs text-muted-foreground">
                      {((importReport.matchedReservations / importReport.totalReservations) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suggested</CardTitle>
                    <Brain className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{importReport.suggestedReservations}</div>
                    <p className="text-xs text-muted-foreground">
                      {((importReport.suggestedReservations / importReport.totalReservations) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(importReport.processingTime / 1000).toFixed(1)}s</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Confidence Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of match confidence levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">High Confidence (≥80%)</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {importReport.confidenceDistribution.high}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Medium Confidence (60-79%)</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {importReport.confidenceDistribution.medium}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Low Confidence (&lt;60%)</span>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        {importReport.confidenceDistribution.low}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Imported Reservations</CardTitle>
                  <CardDescription>
                    Review and confirm property matches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {files.flatMap(file => file.reservations || []).map((reservation, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{reservation.guestName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {reservation.checkIn} - {reservation.checkOut} ({reservation.guests} guests)
                              </p>
                            </div>
                            {getConfidenceBadge(reservation.confidence)}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">Property: </span>
                              <span className="text-sm">{reservation.propertyName}</span>
                            </div>
                            
                            {reservation.status === 'suggested' && reservation.suggestions && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    View Suggestions
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Property Match Suggestions</DialogTitle>
                                    <DialogDescription>
                                      Select the best match for "{reservation.propertyName}"
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    {reservation.suggestions.map((suggestion, i) => (
                                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                          <div className="font-medium">{suggestion.name}</div>
                                          <div className="text-sm text-muted-foreground">{suggestion.reason}</div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline">
                                            {(suggestion.score * 100).toFixed(0)}%
                                          </Badge>
                                          <Button size="sm">Select</Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No import results to display. Process some PDF files first.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}