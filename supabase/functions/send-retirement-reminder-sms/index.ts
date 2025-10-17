import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  console.log("==== RETIREMENT REMINDER SMS FUNCTION STARTED ====");
  console.log("Request method:", req.method);
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting SMS sending process");
    const webSmsToken = Deno.env.get("WEBSMS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("VITE_SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY");
    
    console.log("Checking environment variables...");
    console.log("WEBSMS_TOKEN exists:", !!webSmsToken);
    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_KEY exists:", !!supabaseKey);

    if (!webSmsToken) {
      throw new Error("WEBSMS_TOKEN environment variable is not set");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }

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

    console.log("Employee found:", employee.nama);

    if (!employee.handphone) {
      throw new Error("Employee does not have a phone number");
    }

    // Normalize phone number - WebSMS mungkin memerlukan format internasional
    let phoneNumber = employee.handphone.replace(/\s+/g, "").replace(/-/g, "");
    
    // Format untuk WebSMS - pastikan format internasional dengan awalan 62
    if (phoneNumber.startsWith("+62")) {
      // Hapus + dari +62
      phoneNumber = phoneNumber.substring(1);
    } else if (phoneNumber.startsWith("0")) {
      // Ubah 08xxx menjadi 628xxx
      phoneNumber = "62" + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith("62")) {
      // Tambahkan 62 di depan jika belum ada
      phoneNumber = "62" + phoneNumber;
    }

    console.log("Normalized phone number for WebSMS:", phoneNumber);

    // Get template
    let template;
    if (templateId) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("Template fetch error:", error);
        throw new Error(`Template not found: ${error.message}`);
      }
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

      if (error) {
        console.error("Template fetch error:", error);
        throw new Error(`Template not found: ${error.message}`);
      }
      template = data;
    } else {
      throw new Error("Either templateId or monthsBeforeRetirement required");
    }

    if (!template) {
      throw new Error("Template not found");
    }

    console.log("Template found:", template.template_name);

    // Calculate retirement date
    const retirementDate = employee.tmt_pensiun
      ? new Date(employee.tmt_pensiun).toLocaleDateString("id-ID")
      : "Belum ditentukan";

    // Replace template variables
    let smsBody = replaceTemplateVariables(
      template.body_template,
      employee,
      retirementDate
    );

    console.log("SMS body prepared, length:", smsBody.length);

    // URL encode the message
    const encodedMessage = encodeURIComponent(smsBody);

    // Send SMS using WebSMS - using GET with query parameters as per documentation
    console.log("Sending SMS to:", phoneNumber);
    
    // Construct URL exactly as per documentation
    const webSmsUrl = `https://websms.co.id/api/smsgateway?token=${webSmsToken}&to=${phoneNumber}&msg=${encodedMessage}`;
    
    // Log the full URL for debugging (masking the token)
    const debugUrl = webSmsUrl.replace(webSmsToken, "***TOKEN***");
    console.log("WebSMS request URL:", debugUrl);
    
    let webSmsData;
    try {
      // Simple GET request without any extra headers
      console.log("Sending GET request to WebSMS API");
      const webSmsResponse = await fetch(webSmsUrl);
      
      console.log("WebSMS response status:", webSmsResponse.status);
      
      if (!webSmsResponse.ok) {
        throw new Error(`WebSMS API returned status ${webSmsResponse.status}`);
      }
      
      const responseText = await webSmsResponse.text();
      console.log("WebSMS raw response:", responseText);
      
      // Handle empty response
      if (!responseText.trim()) {
        console.log("WebSMS returned empty response, assuming success");
        webSmsData = { status: "success" };
      } else {
        try {
          webSmsData = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse WebSMS response:", e);
          // If we can't parse as JSON but got a 200 OK, assume success
          if (webSmsResponse.ok) {
            console.log("Non-JSON response with 200 OK, assuming success");
            webSmsData = { status: "success", raw_response: responseText };
          } else {
            throw new Error(`WebSMS returned non-JSON response: ${responseText}`);
          }
        }
      }
      
      console.log("WebSMS parsed response:", webSmsData);
      
      if (webSmsData.status !== "success") {
        throw new Error(`WebSMS error: ${webSmsData.message || 'Failed to send SMS'}`);
      }
    } catch (error) {
      console.error("Error calling WebSMS API:", error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }

    console.log("SMS sent successfully:", webSmsData);

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
          websms_response: webSmsData,
        },
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retirement reminder SMS sent successfully",
        response: webSmsData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-retirement-reminder-sms:", error);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});