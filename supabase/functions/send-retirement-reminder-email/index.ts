import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RetirementReminderRequest {
  employeeId: string;
  templateId?: string;
  monthsBeforeRetirement?: number;
}

const replaceTemplateVariables = (
  template: string,
  employee: any,
  retirementDate: string
): string => {
  return template
    .replace(/\{\{employee_name\}\}/g, employee.nama || "")
    .replace(/\{\{nip\}\}/g, employee.nip || "")
    .replace(/\{\{unit\}\}/g, employee.unit || "")
    .replace(/\{\{position\}\}/g, employee.jabatan || "")
    .replace(/\{\{retirement_date\}\}/g, retirementDate)
    .replace(/\{\{app_url\}\}/g, "https://tempo.lovable.app")
    .replace(/\{\{contact_phone\}\}/g, "+62-xxx-xxx-xxxx");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { employeeId, templateId, monthsBeforeRetirement } =
      (await req.json()) as RetirementReminderRequest;

    console.log("Processing retirement reminder for employee:", employeeId);

    // Get employee data
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (empError || !employee) {
      throw new Error(`Employee not found: ${empError?.message}`);
    }

    if (!employee.email) {
      throw new Error("Employee does not have an email address");
    }

    // Get template
    let template;
    if (templateId) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("id", templateId)
        .eq("template_type", "email")
        .single();

      if (error) throw error;
      template = data;
    } else if (monthsBeforeRetirement) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("template_type", "email")
        .eq("months_before_retirement", monthsBeforeRetirement)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) throw error;
      template = data;
    } else {
      throw new Error("Either templateId or monthsBeforeRetirement required");
    }

    // Calculate retirement date
    const retirementDate = employee.tmt_pensiun || "Belum ditentukan";

    // Replace template variables
    const subject = replaceTemplateVariables(
      template.subject,
      employee,
      retirementDate
    );
    const htmlBody = replaceTemplateVariables(
      template.body_template,
      employee,
      retirementDate
    ).replace(/\n/g, "<br>");

    // Send email using Resend
    console.log("Sending email to:", employee.email);
    const emailResponse = await resend.emails.send({
      from: "Sipandai - Sistem Kepegawaian <onboarding@resend.dev>",
      to: [employee.email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TEMPO - Sistem Kepegawaian</h1>
            </div>
            <div class="content">
              ${htmlBody}
            </div>
            <div class="footer">
              <p>Email otomatis dari Sistem TEMPO - Jangan membalas email ini</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the sent reminder
    const { error: logError } = await supabase
      .from("retirement_reminders_sent")
      .insert({
        employee_id: employeeId,
        reminder_type: "email",
        template_id: template.id,
        status: "sent",
        metadata: {
          email: employee.email,
          subject: subject,
        },
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retirement reminder email sent successfully",
        emailId: emailResponse.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-retirement-reminder-email:", error);

    // Try to log the error
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { employeeId } = await req.json();

      await supabase.from("retirement_reminders_sent").insert({
        employee_id: employeeId,
        reminder_type: "email",
        status: "failed",
        error_message: error.message,
      });
    } catch (logError) {
      console.error("Error logging failed reminder:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
