import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing retirement reminders...");

    // Get all employees with retirement dates
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, nama, nip, email, handphone, tmt_pensiun, unit, jabatan")
      .not("tmt_pensiun", "is", null);

    if (empError) {
      throw empError;
    }

    console.log(`Found ${employees?.length || 0} employees with retirement dates`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    const today = new Date();

    for (const employee of employees || []) {
      try {
        const retirementDate = new Date(employee.tmt_pensiun);
        const monthsUntilRetirement = Math.floor(
          (retirementDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        );

        console.log(
          `Employee ${employee.nama}: ${monthsUntilRetirement} months until retirement`
        );

        // Skip if already retired or more than 12 months away
        if (monthsUntilRetirement < 0 || monthsUntilRetirement > 12) {
          results.skipped++;
          continue;
        }

        results.processed++;

        // Check if reminder was already sent recently (within last 30 days)
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const { data: recentReminders } = await supabase
          .from("retirement_reminders_sent")
          .select("*")
          .eq("employee_id", employee.id)
          .gte("sent_at", thirtyDaysAgo.toISOString())
          .eq("status", "sent");

        if (recentReminders && recentReminders.length > 0) {
          console.log(`Skipping ${employee.nama} - reminder sent recently`);
          results.skipped++;
          continue;
        }

        // Determine which reminders to send based on months until retirement
        const remindersToSend: number[] = [];
        if (monthsUntilRetirement <= 1) remindersToSend.push(1);
        if (monthsUntilRetirement <= 3) remindersToSend.push(3);
        if (monthsUntilRetirement <= 6) remindersToSend.push(6);
        if (monthsUntilRetirement <= 12) remindersToSend.push(12);

        // Send reminders
        for (const months of remindersToSend) {
          try {
            // Send email
            if (employee.email) {
              const emailResponse = await fetch(
                `${supabaseUrl}/functions/v1/send-retirement-reminder-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    employeeId: employee.id,
                    monthsBeforeRetirement: months,
                  }),
                }
              );

              if (emailResponse.ok) {
                results.sent++;
                console.log(`Email sent to ${employee.nama} (${months} months)`);
              }
            }

            // Send SMS
            if (employee.handphone) {
              const smsResponse = await fetch(
                `${supabaseUrl}/functions/v1/send-retirement-reminder-sms`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    employeeId: employee.id,
                    monthsBeforeRetirement: months,
                  }),
                }
              );

              if (smsResponse.ok) {
                results.sent++;
                console.log(`SMS sent to ${employee.nama} (${months} months)`);
              }
            }

            // Send WhatsApp
            if (employee.handphone) {
              const whatsappResponse = await fetch(
                `${supabaseUrl}/functions/v1/send-retirement-reminder-whatsapp`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    employeeId: employee.id,
                    monthsBeforeRetirement: months,
                  }),
                }
              );

              if (whatsappResponse.ok) {
                results.sent++;
                console.log(
                  `WhatsApp sent to ${employee.nama} (${months} months)`
                );
              }
            }
          } catch (error) {
            console.error(
              `Error sending reminder to ${employee.nama}:`,
              error
            );
            results.failed++;
          }
        }

        results.details.push({
          employee: employee.nama,
          monthsUntilRetirement,
          remindersCount: remindersToSend.length * 3, // email + sms + whatsapp
        });
      } catch (error) {
        console.error(`Error processing employee ${employee.nama}:`, error);
        results.failed++;
      }
    }

    console.log("Retirement reminders processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retirement reminders processed successfully",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in process-retirement-reminders:", error);

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
