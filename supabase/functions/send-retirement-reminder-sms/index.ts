import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const zuwindaApiKey = Deno.env.get("ZUWINDA_API_KEY")!;
const zuwindaInstanceId = Deno.env.get("ZUWINDA_SMS_INSTANCE_ID")!;
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

    console.log("Processing SMS reminder for employee:", employeeId);

    // Get employee data
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (empError || !employee) {
      throw new Error(`Employee not found: ${empError?.message}`);
    }

    if (!employee.handphone) {
      throw new Error("Employee does not have a phone number");
    }

    // Normalize phone number
    let phoneNumber = employee.handphone.replace(/\s+/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "+62" + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith("+")) {
      phoneNumber = "+62" + phoneNumber;
    }

    // Get template
    let template;
    if (templateId) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("id", templateId)
        .eq("template_type", "sms")
        .single();

      if (error) throw error;
      template = data;
    } else if (monthsBeforeRetirement) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("template_type", "sms")
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
    const retirementDate = employee.tmt_pensiun
      ? new Date(employee.tmt_pensiun).toLocaleDateString("id-ID")
      : "Belum ditentukan";

    // Replace template variables
    const smsBody = replaceTemplateVariables(
      template.body_template,
      employee,
      retirementDate
    );

    // Send SMS using Zuwinda
    console.log("Sending SMS to:", phoneNumber);
    const zuwindaUrl = `https://api.zuwinda.com/v1.2/sms/send`;

    const zuwindaResponse = await fetch(zuwindaUrl, {
      method: "POST",
      headers: {
        "x-access-key": zuwindaApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instance_id: zuwindaInstanceId,
        phone_number: phoneNumber,
        message: smsBody,
      }),
    });

    const zuwindaData = await zuwindaResponse.json();

    if (!zuwindaResponse.ok) {
      throw new Error(`Zuwinda error: ${zuwindaData.message || 'Failed to send SMS'}`);
    }

    console.log("SMS sent successfully:", zuwindaData);

    // Log the sent reminder
    const { error: logError } = await supabase
      .from("retirement_reminders_sent")
      .insert({
        employee_id: employeeId,
        reminder_type: "sms",
        template_id: template.id,
        status: "sent",
        metadata: {
          phone: phoneNumber,
          zuwinda_response: zuwindaData,
        },
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retirement reminder SMS sent successfully",
        response: zuwindaData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-retirement-reminder-sms:", error);

    // Try to log the error
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { employeeId } = await req.json();

      await supabase.from("retirement_reminders_sent").insert({
        employee_id: employeeId,
        reminder_type: "sms",
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
