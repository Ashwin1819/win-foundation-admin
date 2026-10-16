import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";
import { sendEmail } from "@/lib/email";

// Donation data is now fetched from the real backend instead of lib/db.ts (see
// prisma/contract.prisma for the now-unused legacy Donation model) — but per Phase
// 7 decision (b), the actual email send still goes through this admin app's own
// lib/email.ts (Resend), not a new backend endpoint.

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    // --------------------------------------------------
    // 1. Verify admin
    // --------------------------------------------------
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Read request body
    // --------------------------------------------------
    const body = await req.json();

    const donationId = body?.donationId;

    if (!donationId) {
      return NextResponse.json(
        { error: "Donation ID is required" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Find donation (from the real backend)
    // --------------------------------------------------
    const donationResponse = await backendAdminFetch(`/donations/${donationId}`, getAdminTokenFromRequest(req)!);

    if (!donationResponse.ok) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: donationResponse.status === 404 ? 404 : 500 }
      );
    }

    const donation = await donationResponse.json();

    // --------------------------------------------------
    // 4. Check donor email
    // --------------------------------------------------
    if (!donation.email) {
      return NextResponse.json(
        { error: "This donation does not have a donor email address" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Prepare receipt information
    // --------------------------------------------------
    const donationDate = new Date(
      String(donation.createdAt)
    ).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const donorName = escapeHtml(donation.donorName);
    const donorEmail = escapeHtml(donation.email);
    const donorPhone = escapeHtml(donation.phone || "Not provided");

    const campaign = escapeHtml(
      donation.campaign?.title ?? "General Donation"
    );

    const paymentMethod = escapeHtml(
      donation.paymentMethod || "Not available"
    );

    const paymentStatus = escapeHtml(
      donation.paymentStatus || "PENDING"
    );

    const transactionId = escapeHtml(
      donation.transactionId || "Not available"
    );

    const receiptNumber = escapeHtml(
      donation.receiptNumber || "Not generated"
    );

    const amount = Number(donation.amount || 0).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );

    // --------------------------------------------------
    // 6. Email HTML
    // --------------------------------------------------
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Donation Receipt</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f5f7fb;
            font-family:Arial,Helvetica,sans-serif;
            color:#1f2937;
          "
        >
          <div
            style="
              max-width:650px;
              margin:40px auto;
              background:#ffffff;
              border-radius:12px;
              overflow:hidden;
              box-shadow:0 4px 20px rgba(0,0,0,0.08);
            "
          >

            <!-- Header -->
            <div
              style="
                background:#2563eb;
                color:#ffffff;
                padding:30px;
                text-align:center;
              "
            >
              <h1 style="margin:0 0 8px;font-size:28px;">
                WIN Foundations
              </h1>

              <p style="margin:0;font-size:15px;">
                Donation Receipt
              </p>
            </div>

            <!-- Content -->
            <div style="padding:30px;">

              <p style="font-size:16px;">
                Dear <strong>${donorName}</strong>,
              </p>

              <p style="font-size:15px;line-height:1.7;">
                Thank you for your generous contribution to
                <strong>WIN Foundations</strong>.
                Your donation has been successfully recorded.
              </p>

              <!-- Amount -->
              <div
                style="
                  margin:25px 0;
                  padding:20px;
                  background:#f0fdf4;
                  border:1px solid #bbf7d0;
                  border-radius:10px;
                  text-align:center;
                "
              >
                <p
                  style="
                    margin:0 0 8px;
                    font-size:14px;
                    color:#166534;
                  "
                >
                  Donation Amount
                </p>

                <div
                  style="
                    font-size:30px;
                    font-weight:bold;
                    color:#15803d;
                  "
                >
                  ${amount}
                </div>
              </div>

              <!-- Details -->
              <table
                width="100%"
                cellpadding="8"
                cellspacing="0"
                style="
                  border-collapse:collapse;
                  font-size:14px;
                "
              >

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Donor Name
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      font-weight:600;
                    "
                  >
                    ${donorName}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Email
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                    "
                  >
                    ${donorEmail}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Phone
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                    "
                  >
                    ${donorPhone}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Campaign
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      font-weight:600;
                    "
                  >
                    ${campaign}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Payment Method
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                    "
                  >
                    ${paymentMethod}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Payment Status
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      font-weight:600;
                    "
                  >
                    ${paymentStatus}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Transaction ID
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                    "
                  >
                    ${transactionId}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                      color:#6b7280;
                    "
                  >
                    Receipt Number
                  </td>

                  <td
                    style="
                      border-bottom:1px solid #e5e7eb;
                    "
                  >
                    ${receiptNumber}
                  </td>
                </tr>

                <tr>
                  <td style="color:#6b7280;">
                    Donation Date
                  </td>

                  <td>
                    ${escapeHtml(donationDate)}
                  </td>
                </tr>

              </table>

              <p
                style="
                  margin-top:30px;
                  font-size:14px;
                  line-height:1.7;
                  color:#4b5563;
                "
              >
                We sincerely appreciate your support.
                Your contribution helps WIN Foundations continue
                its initiatives and make a positive difference.
              </p>

              <p
                style="
                  margin-top:25px;
                  font-size:14px;
                "
              >
                Regards,<br />
                <strong>WIN Foundations Team</strong>
              </p>

            </div>

            <!-- Footer -->
            <div
              style="
                background:#f9fafb;
                padding:20px 30px;
                text-align:center;
                font-size:12px;
                color:#6b7280;
              "
            >
              This is an automated donation receipt from WIN Foundations.
              Please do not reply directly to this email.
            </div>

          </div>
        </body>
      </html>
    `;

    // --------------------------------------------------
    // 7. Send to ACTUAL donor email
    // --------------------------------------------------
    const result = await sendEmail({
      to: donation.email,
      subject: `Donation Receipt - ${donation.receiptNumber || donation.id}`,
      html,
    });

    // --------------------------------------------------
    // 8. Success response
    // --------------------------------------------------
    return NextResponse.json({
      message: "Donation receipt email sent successfully",
      emailId: result?.id ?? null,
      recipient: donation.email,
    });

  } catch (error) {
    console.error("Resend donation email error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send donation receipt email",
      },
      { status: 500 }
    );
  }
}
