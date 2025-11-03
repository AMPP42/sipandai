import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, XCircle, Clock } from 'lucide-react';

interface WorkflowStep {
  title: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  date?: string;
  notes?: string;
}

interface ApplicationWorkflowProps {
  applicationStatus: string;
  submittedAt?: string;
  adminUnitReviewedAt?: string;
  adminPusatReviewedAt?: string;
  completedAt?: string;
  adminUnitNotes?: string;
  adminPusatNotes?: string;
}

export default function ApplicationWorkflow({
  applicationStatus,
  submittedAt,
  adminUnitReviewedAt,
  adminPusatReviewedAt,
  completedAt,
  adminUnitNotes,
  adminPusatNotes,
}: ApplicationWorkflowProps) {
  const getWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        title: 'Draft',
        status: applicationStatus === 'draft' ? 'current' : 'completed',
      },
      {
        title: 'Diajukan',
        status:
          applicationStatus === 'draft'
            ? 'pending'
            : applicationStatus === 'submitted'
            ? 'current'
            : 'completed',
        date: submittedAt,
      },
      {
        title: 'Review Admin Unit',
        status:
          applicationStatus === 'admin_unit_rejected'
            ? 'rejected'
            : ['draft', 'submitted'].includes(applicationStatus)
            ? 'pending'
            : ['admin_unit_review', 'admin_unit_approved'].includes(applicationStatus)
            ? applicationStatus === 'admin_unit_review'
              ? 'current'
              : 'completed'
            : 'completed',
        date: adminUnitReviewedAt,
        notes: adminUnitNotes,
      },
      {
        title: 'Review Admin Pusat',
        status:
          applicationStatus === 'admin_pusat_rejected'
            ? 'rejected'
            : ['draft', 'submitted', 'admin_unit_review', 'admin_unit_rejected'].includes(
                applicationStatus
              )
            ? 'pending'
            : ['admin_pusat_review', 'approved'].includes(applicationStatus)
            ? applicationStatus === 'admin_pusat_review'
              ? 'current'
              : 'completed'
            : 'completed',
        date: adminPusatReviewedAt,
        notes: adminPusatNotes,
      },
      {
        title: 'Selesai',
        status:
          applicationStatus === 'completed'
            ? 'completed'
            : applicationStatus === 'approved'
            ? 'current'
            : 'pending',
        date: completedAt,
      },
    ];

    return steps;
  };

  const steps = getWorkflowSteps();

  const getIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="relative">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {getIcon(step.status)}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-16 mt-2 ${
                    step.status === 'completed'
                      ? 'bg-green-600'
                      : step.status === 'rejected'
                      ? 'bg-red-600'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>

            <div className="flex-1 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{step.title}</h3>
                {step.status === 'current' && (
                  <Badge className="bg-blue-100 text-blue-700">Sedang Proses</Badge>
                )}
                {step.status === 'rejected' && (
                  <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
                )}
              </div>

              {step.date && (
                <p className="text-sm text-muted-foreground">
                  {new Date(step.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}

              {step.notes && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Catatan:</strong> {step.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
