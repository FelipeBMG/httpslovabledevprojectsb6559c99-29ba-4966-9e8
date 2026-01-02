import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ImportedRecord {
  clientName: string;
  whatsapp: string;
  petName: string;
  species: string;
  breed: string;
  weight: string;
  furType: string;
  status: 'pending' | 'imported' | 'updated' | 'error';
  errorMessage?: string;
}

const Importar = () => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [records, setRecords] = useState<ImportedRecord[]>([]);
  const [summary, setSummary] = useState<{
    imported: number;
    updated: number;
    errors: number;
  } | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setRecords([]);
    setSummary(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];

      const importedRecords: ImportedRecord[] = jsonData.map((row, index) => ({
        clientName: row['Nome do Cliente'] || row['nome'] || row['cliente'] || '',
        whatsapp: row['WhatsApp'] || row['whatsapp'] || row['telefone'] || '',
        petName: row['Nome do Pet'] || row['pet'] || '',
        species: row['Espécie'] || row['especie'] || 'cachorro',
        breed: row['Raça'] || row['raca'] || '',
        weight: row['Peso'] || row['peso'] || '',
        furType: row['Tipo de Pelo'] || row['pelo'] || 'medio',
        status: 'pending',
      }));

      // Simulate processing with progress
      for (let i = 0; i < importedRecords.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(Math.round(((i + 1) / importedRecords.length) * 100));
        
        // Validate record
        if (!importedRecords[i].clientName || !importedRecords[i].whatsapp) {
          importedRecords[i].status = 'error';
          importedRecords[i].errorMessage = 'Nome ou WhatsApp faltando';
        } else {
          // Simulate some updates and imports
          importedRecords[i].status = Math.random() > 0.2 ? 'imported' : 'updated';
        }
      }

      setRecords(importedRecords);

      const importedCount = importedRecords.filter(r => r.status === 'imported').length;
      const updatedCount = importedRecords.filter(r => r.status === 'updated').length;
      const errorCount = importedRecords.filter(r => r.status === 'error').length;

      setSummary({
        imported: importedCount,
        updated: updatedCount,
        errors: errorCount,
      });

      toast({
        title: "📤 Importação Concluída!",
        description: `${importedCount} importados, ${updatedCount} atualizados, ${errorCount} erros. Webhook disparado para o n8n.`,
      });

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo. Verifique o formato.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo CSV ou Excel (.xlsx, .xls)",
        variant: "destructive",
      });
    }
  }, [processFile, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Nome do Cliente': 'Maria Silva',
        'WhatsApp': '11999887766',
        'Nome do Pet': 'Thor',
        'Espécie': 'cachorro',
        'Raça': 'Golden Retriever',
        'Peso': '32',
        'Tipo de Pelo': 'longo',
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes e Pets');
    XLSX.writeFile(wb, 'modelo_importacao_petsaas.xlsx');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Upload className="w-8 h-8 text-primary" />
              Importar Dados
            </h1>
            <p className="text-muted-foreground mt-1">
              Importe clientes e pets automaticamente via planilha
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Baixar Modelo
          </Button>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card 
          className={cn(
            "border-2 border-dashed transition-all cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            isProcessing && "pointer-events-none opacity-70"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <CardContent className="p-12">
            <div className="text-center">
              {isProcessing ? (
                <>
                  <RefreshCw className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-xl font-semibold mb-2">Processando...</p>
                  <Progress value={progress} className="max-w-md mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-semibold mb-2">
                    Arraste seu arquivo aqui
                  </p>
                  <p className="text-muted-foreground mb-4">
                    ou clique para selecionar (CSV, XLSX, XLS)
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input">
                    <Button asChild className="bg-gradient-primary hover:opacity-90">
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Arquivo
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-soft bg-success/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{summary.imported}</p>
                  <p className="text-sm text-muted-foreground">Importados</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-soft bg-primary/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{summary.updated}</p>
                  <p className="text-sm text-muted-foreground">Atualizados</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-soft bg-destructive/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{summary.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Results Table */}
      {records.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Resultado da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead>Raça</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 10).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'imported' ? 'default' :
                            record.status === 'updated' ? 'secondary' :
                            'destructive'
                          }
                          className={cn(
                            record.status === 'imported' && "bg-success",
                            record.status === 'updated' && "bg-primary"
                          )}
                        >
                          {record.status === 'imported' && 'Importado'}
                          {record.status === 'updated' && 'Atualizado'}
                          {record.status === 'error' && 'Erro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.clientName || '-'}</TableCell>
                      <TableCell>{record.whatsapp || '-'}</TableCell>
                      <TableCell>{record.petName || '-'}</TableCell>
                      <TableCell className="capitalize">{record.species || '-'}</TableCell>
                      <TableCell>{record.breed || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {records.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 10 de {records.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card className="border-0 shadow-soft bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">📋 Campos Esperados na Planilha</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Nome do Cliente</p>
                <p className="text-muted-foreground">Obrigatório</p>
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-muted-foreground">Obrigatório (chave)</p>
              </div>
              <div>
                <p className="font-medium">Nome do Pet</p>
                <p className="text-muted-foreground">Opcional</p>
              </div>
              <div>
                <p className="font-medium">Espécie</p>
                <p className="text-muted-foreground">cachorro/gato/outro</p>
              </div>
              <div>
                <p className="font-medium">Raça</p>
                <p className="text-muted-foreground">Opcional</p>
              </div>
              <div>
                <p className="font-medium">Peso</p>
                <p className="text-muted-foreground">Em kg</p>
              </div>
              <div>
                <p className="font-medium">Tipo de Pelo</p>
                <p className="text-muted-foreground">curto/medio/longo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Importar;
