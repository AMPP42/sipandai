import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Normalize phone number to format required by WebSMS
const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");
  
  // If starts with 0, replace with 62
  if (normalized.startsWith("0")) {
    normalized = "62" + normalized.substring(1);
  }
  
  // If doesn't start with 62, add it
  if (!normalized.startsWith("62")) {
    normalized = "62" + normalized;
  }
  
  return normalized;
};

// Replace template variables
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
    
    // Validate required environment variables
    const websmsToken = Deno.env.get("WEBSMS_TOKEN");
    const websmsSender = Deno.env.get("WEBSMS_SENDER");
    
    if (!websmsToken || !websmsSender) {
      throw new Error("WEBSMS_TOKEN or WEBSMS_SENDER not configured");
    }

    const requestBody = await req.json() as RetirementReminderRequest;
    const { employeeId, templateId, monthsBeforeRetirement } = requestBody;

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
    const normalizedPhone = normalizePhoneNumber(employee.handphone);
    console.log("Normalized phone:", normalizedPhone);

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
    const retirementDate = employee.tmt_pensiun || "Belum ditentukan";

    // Replace template variables
    const messageBody = replaceTemplateVariables(
      template.body_template,
      employee,
      retirementDate
    );

    console.log("Sending SMS to:", normalizedPhone);
    console.log("Message length:", messageBody.length);

    // Send SMS using WebSMS API
    const websmsUrl = "https://app.websms.co.id/api/v1/sms/send";
    const smsPayload = {
      token: websmsToken,
      sender: websmsSender,
      number: normalizedPhone,
      message: messageBody,
    };

    console.log("WebSMS request:", JSON.stringify({
      ...smsPayload,
      token: "***hidden***"
    }));

    const smsResponse = await fetch(websmsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    });

    const responseText = await smsResponse.text();
    console.log("WebSMS raw response:", responseText);
    console.log("WebSMS status:", smsResponse.status);

    // Try to parse as JSON
    let smsResult;
    try {
      smsResult = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse WebSMS response as JSON:", e);
      throw new Error(`WebSMS returned invalid response: ${responseText.substring(0, 200)}`);
    }

    if (!smsResponse.ok || smsResult.status !== "success") {
      const errorMsg = smsResult.message || smsResult.error || "Unknown error";
      throw new Error(`WebSMS API error: ${errorMsg}`);
    }

    console.log("SMS sent successfully:", smsResult);

    // Log the sent reminder
    const { error: logError } = await supabase
      .from("retirement_reminders_sent")
      .insert({
        employee_id: employeeId,
        reminder_type: "sms",
        template_id: template.id,
        status: "sent",
        metadata: {
          phone: normalizedPhone,
          message_length: messageBody.length,
          websms_response: smsResult,
        },
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retirement reminder SMS sent successfully",
        phone: normalizedPhone,
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
      const requestBody = await req.clone().json();
      const { employeeId } = requestBody;

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
