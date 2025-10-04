import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import DocumentVerificationStatus from '@/components/applications/DocumentVerificationStatus';
import { ArrowLeft, User, Building, Calendar, FileText, Upload, Download, CheckCircle, CheckCircle2, AlertCircle, Clock, Send, Loader2, AlertTriangle, Eye, FileCheck, XCircle, ExternalLink } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import UpdateStatusModal from "@/components/verifikasi/UpdateStatusModal";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationDetail extends Application {
  employee_data?: {
    employee_id: string;
    employee_name: string;
    employee_nip: string;
    nomor_usulan: string;
    kategori?: string;
    kategori_name?: string;
    unit?: string;
    jabatan?: string;
    pangkat?: string;
  };
}

interface DocumentVerificationStatus {
  [key: string]: {
    status: 'approved' | 'needs_fix' | 'pending';
    admin_notes?: string;
    document_name: string;
  };
}

export default function DetailPensiun() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [documentVerificationStatus, setDocumentVerificationStatus] = useState<DocumentVerificationStatus>({});
  const [fixedDocuments, setFixedDocuments] = useState<Set<string>>(new Set());
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [documentRequirements, setDocumentRequirements] = useState<string[]>([]);
  const [workflowLinks, setWorkflowLinks] = useState<{ [key: string]: string }>({});
  const [workflowData, setWorkflowData] = useState<{ [key: string]: { note?: string; created_at?: string; file_link?: string } }>({});
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    loadApplication();
    loadWorkflows();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data);
    } catch (error: any) {
      console.error('Error loading application:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      // setWorkflows is not used in this page

      // Extract workflow data for timeline
      const dataMap: Record<string, { note?: string; created_at?: string }> = {};
      data?.forEach(wf => {
        if (wf.to_status && wf.note) {
          dataMap[wf.to_status] = {
            note: wf.note,
            created_at: wf.created_at
          };
        }
      });
      setWorkflowData(dataMap);
    } catch (error: any) {
      console.error('Error loading workflows:', error);
    }
  };

  if (loading || !application) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  const employeeData = application.estimasi ? JSON.parse(application.estimasi) : {};

  const timelineSteps = [
    {
      status: 'draft',
      label: 'Draft Dibuat',
      icon: FileText,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted'
    },
    {
      status: 'submitted',
      label: 'Menunggu Verifikasi',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      status: 'in_review',
      label: 'Sedang Ditinjau',
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950'
    },
    {
      status: 'approved',
      label: 'Disetujui',
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950'
    }
  ];

  const currentStepIndex = timelineSteps.findIndex(step => step.status === application.status);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'border-muted',
      submitted: 'border-blue-500',
      in_review: 'border-yellow-500',
      approved: 'border-green-500',
      rejected: 'border-red-500',
      revision_needed: 'border-orange-500'
    };
    return colors[status] || 'border-muted';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/apps/reminder-pensiun')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Detail Pengajuan Pensiun
            </h1>
            <p className="text-sm text-muted-foreground">
              {employeeData.nomor_usulan || 'N/A'}
            </p>
          </div>
        </div>
        {user?.role === 'admin_pusat' && application.status !== 'approved' && (
          <Button onClick={() => setIsStatusModalOpen(true)}>
            Update Status
          </Button>
        )}
      </div>

      {/* Timeline */}
      <Card className={`border-l-4 ${getStatusColor(application.status)}`}>
        <CardHeader>
          <CardTitle className="text-lg">Status Pengajuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex justify-between items-start">
              {timelineSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const stepData = workflowData[step.status];

                return (
                  <div key={step.status} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          isActive
                            ? `${step.bgColor} ${step.color} border-current`
                            : 'bg-background border-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <p className={`mt-2 text-sm font-medium text-center ${isActive ? step.color : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {stepData?.note && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs text-left max-w-xs">
                          <p className="text-muted-foreground">{stepData.note}</p>
                          {stepData.created_at && (
                            <p className="text-muted-foreground mt-1">
                              {new Date(stepData.created_at).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div
                        className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                          isActive ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pegawai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Nama Lengkap</Label>
              <p className="font-medium">{employeeData.employee_name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">NIP</Label>
              <p className="font-medium">{employeeData.employee_nip || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Unit Kerja</Label>
              <p className="font-medium">{employeeData.unit || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Jabatan</Label>
              <p className="font-medium">{employeeData.jabatan || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Pangkat</Label>
              <p className="font-medium">{employeeData.pangkat || '-'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">Kategori Pensiun</Label>
            <p className="mt-1 font-medium text-primary">{employeeData.kategori_name}</p>
          </div>
        </CardContent>
      </Card>

      <UpdateStatusModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        application={{ ...application, type: 'application' }}
        onSuccess={() => {
          loadApplication();
          loadWorkflows();
        }}
      />
    </div>
  );
}
