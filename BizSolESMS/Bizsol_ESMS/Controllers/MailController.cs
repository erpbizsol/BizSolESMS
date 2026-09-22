using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using Newtonsoft.Json.Linq;
using System.Data;
using System.Net;
using System.Net.Mail;

namespace Bizsol_ESMS.Controllers
{
    public class MailController : Controller
    {
        [HttpGet]
        public async Task<IActionResult> SendPSRReportMail(int Code, string UserName, string AuthKey, string? CompanyCode = null)
        {
            try
            {
                JObject data = JObject.Parse(AuthKey);
                string? connectionString = data["DefultMysqlTemp"]?.ToString();
                if (string.IsNullOrEmpty(connectionString))
                    return BadRequest("Database connection string is missing.");

                var pdfTask = Task.Run(() => GeneratePsrReportPdf(Code, UserName, AuthKey, CompanyCode));
                var emailConfigTask = Task.Run(() => GetEmailConfiguration(connectionString));
                var recipientEmailsTask = Task.Run(() => GetPsrReportRecipientEmails(connectionString, Code));
                var dispatchDetailTask = Task.Run(() => GetDispatchReportDetail(connectionString, Code));

                await Task.WhenAll(pdfTask, emailConfigTask, recipientEmailsTask, dispatchDetailTask);

                byte[]? pdfBytes = pdfTask.Result;
                if (pdfBytes == null || pdfBytes.Length == 0)
                    return StatusCode(500, "Failed to generate PSR report PDF.");

                DataTable emailConfig = emailConfigTask.Result;
                if (emailConfig.Rows.Count == 0)
                    return StatusCode(500, "Email configuration not found.");

                string recipientEmails = recipientEmailsTask.Result;
                if (string.IsNullOrWhiteSpace(recipientEmails))
                    return BadRequest("Recipient email address is required.");

                DataRow? dispatchDetail = dispatchDetailTask.Result;
                string fileName = BuildPsrReportFileName(Code, dispatchDetail);
                string body = BuildPsrReportMailBody(dispatchDetail);

                await SendEmailWithAttachmentAsync(emailConfig, recipientEmails, pdfBytes, fileName, body);

                return Ok(new { success = true, message = "PSR Report sent successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        private static byte[]? GeneratePsrReportPdf(int code, string userName, string authKey, string? companyCode)
        {
            var rdlcController = new RDLCController();
            IActionResult result = rdlcController.PSRReportQR(code, userName, authKey, companyCode);

            if (result is FileContentResult fileResult)
                return fileResult.FileContents;

            return null;
        }

        private static DataTable GetEmailConfiguration(string connectionString)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("SELECT * FROM f_emailconfiguration LIMIT 1", conn))
                {
                    cmd.CommandType = CommandType.Text;

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }

            return ds.Tables.Count > 0 ? ds.Tables[0] : new DataTable();
        }

        private static string GetPsrReportRecipientEmails(string connectionString, int dispatchMasterCode)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("USP_DispatchMaster_MailSend", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("p_Mode", "GetEmails");
                    cmd.Parameters.AddWithValue("p_Code", dispatchMasterCode);
                    cmd.Parameters.AddWithValue("p_UserMasterCode", 0);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }

            if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
                return string.Empty;

            var emails = new List<string>();
            foreach (DataRow row in ds.Tables[0].Rows)
            {
                string? email = row.Table.Columns.Contains("EmailID")
                    ? row["EmailID"]?.ToString()
                    : row[0]?.ToString();
                if (!string.IsNullOrWhiteSpace(email))
                    emails.Add(email.Trim());
            }

            return string.Join(";", emails.Distinct(StringComparer.OrdinalIgnoreCase));
        }

        private static DataRow? GetDispatchReportDetail(string connectionString, int code)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("CALL USP_DispatchReport(@p_Code)", conn))
                {
                    cmd.CommandType = CommandType.Text;
                    cmd.Parameters.AddWithValue("@p_Code", code);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }

            if (ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                return ds.Tables[0].Rows[0];

            return null;
        }

        private static string BuildPsrReportFileName(int code, DataRow? row)
        {
            if (row != null)
            {
                string orderNo = row.Table.Columns.Contains("OrderNo") ? row["OrderNo"]?.ToString() ?? "" : "";
                if (!string.IsNullOrWhiteSpace(orderNo))
                    return $"PSRReport_{orderNo}.pdf";
            }

            return $"PSRReport_{code}.pdf";
        }

        private static string BuildPsrReportMailBody(DataRow? row)
        {
            if (row != null)
            {
                string orderNo = row.Table.Columns.Contains("OrderNo") ? row["OrderNo"]?.ToString() ?? "" : "";
                string companyName = row.Table.Columns.Contains("From") ? row["From"]?.ToString() ?? "" : "";

                return "Dear Team," + Environment.NewLine + Environment.NewLine +
                       "Please find attached the PSR Report." + Environment.NewLine +
                       (!string.IsNullOrWhiteSpace(orderNo) ? $"Order No: {orderNo}" + Environment.NewLine : "") +
                       Environment.NewLine +
                       "Regards," + Environment.NewLine +
                       (!string.IsNullOrWhiteSpace(companyName) ? companyName : "");
            }

            return "Dear Team," + Environment.NewLine + Environment.NewLine +
                   "Please find attached the PSR Report." + Environment.NewLine + Environment.NewLine +
                   "Regards," + Environment.NewLine +
                   "WeBiz";
        }

        private static async Task SendEmailWithAttachmentAsync(DataTable emailConfig, string recipientEmails, byte[] pdfBytes, string fileName, string body)
        {
            using var smtpClient = new SmtpClient(emailConfig.Rows[0]["ServerName"]?.ToString())
            {
                Port = Convert.ToInt32(emailConfig.Rows[0]["PortNo"]),
                Credentials = new NetworkCredential(
                    emailConfig.Rows[0]["UserID"]?.ToString(),
                    emailConfig.Rows[0]["UserPwd"]?.ToString()),
                EnableSsl = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(emailConfig.Rows[0]["UserID"]?.ToString() ?? string.Empty),
                Subject = "PSR Report",
                Body = body,
                IsBodyHtml = false
            };

            foreach (var email in recipientEmails.Split(';', ','))
            {
                if (!string.IsNullOrWhiteSpace(email))
                    mailMessage.To.Add(email.Trim());
            }

            if (mailMessage.To.Count == 0)
                throw new InvalidOperationException("No valid recipient email address found.");

            using var ms = new MemoryStream(pdfBytes);
            ms.Position = 0;
            mailMessage.Attachments.Add(new Attachment(ms, fileName, "application/pdf"));
            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}
