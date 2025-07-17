using System.Net.Mail;
using System.Net;
using Bizsol_ESMS;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;
using System.Security.Policy;

namespace WorkerService
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        public Worker(ILogger<Worker> logger)
        {
            _logger = logger;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
           
            string folderPath = @"C:\Esms Email Service";
            string ConnectionString = "Server=220.158.165.98;Port=65448;database=MG_Corporation_Main;user=sa;password=biz1981;";
            //string pdfFilePath = @"C:\Users\Meetu\Downloads\Daily Health Report (2).pdf";
            Directory.CreateDirectory(folderPath);


            string filePath = Path.Combine(folderPath, "log.txt");

            DateTime lastRunDate = DateTime.MinValue;

            while (!stoppingToken.IsCancellationRequested)
            {
                DateTime now = DateTime.Now;

                if (now.Hour == 15 && now.Minute == 08 && lastRunDate.Date != now.Date)
                {
                    string logMessage = $"Scheduled task running at : {now}";
                    await File.AppendAllTextAsync(filePath, logMessage + Environment.NewLine, stoppingToken);

                    if (_logger.IsEnabled(LogLevel.Information))
                    {
                        _logger.LogInformation(logMessage);
                    }
                    try
                    {
                        string Date = DateTime.Now.ToString("yyyy-MM-dd");
                        var controller = new Bizsol_ESMS.Controllers.RDLCController();
                        //string ConnectionString = _configuration.GetConnectionString("ReportString");

                        byte[] pdfBytes = controller.GenerateOrderReport(Date, Date, ConnectionString);

                        SendEmailWithAttachment("ankityadavfzd2002@gmail.com", "Daily Report", "This is your 10:00 AM report email.", pdfBytes);
                        //SendWhatsAppGatePass(pdfBytes);
                        lastRunDate = now;
                    }
                    catch (Exception ex) {
                        await File.AppendAllTextAsync(filePath, ex.Message, stoppingToken);
                    }
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
        private void SendEmail(string toEmail, string subject, string body, string pdfFilePath)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("Erpbizsol@gmail.com", "gycc uvmp eveb xvry"),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("Erpbizsol@gmail.com"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = false
                };

                mailMessage.To.Add(toEmail);

                if (!string.IsNullOrEmpty(pdfFilePath) && File.Exists(pdfFilePath))
                {
                    Attachment attachment = new Attachment(pdfFilePath);
                    mailMessage.Attachments.Add(attachment);
                }

                smtpClient.Send(mailMessage);
            }
            catch (Exception ex)
            {
                string errorPath = @"D:\ServiceFile\log.txt"; ;
                Directory.CreateDirectory(Path.GetDirectoryName(errorPath));
                File.AppendAllText(errorPath, $"[{DateTime.Now}] Email failed: {ex.Message}\n");
            }
        }
        private void SendEmailWithAttachment(string toEmail, string subject, string body, byte[] pdfBytes)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("Erpbizsol@gmail.com", "gycc uvmp eveb xvry"),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("Erpbizsol@gmail.com"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = false
                };

                foreach (var email in toEmail.Split(','))
                {
                    mailMessage.To.Add(email.Trim());
                }
                using (MemoryStream ms = new MemoryStream(pdfBytes))
                {
                    ms.Position = 0;
                    Attachment attachment = new Attachment(ms, "OrderReport.pdf", "application/pdf");
                    mailMessage.Attachments.Add(attachment);

                    smtpClient.Send(mailMessage);
                }
            }
            catch (Exception ex)
            {
                string logPath = @"D:\ServiceFile\log.txt";
                Directory.CreateDirectory(Path.GetDirectoryName(logPath));
                File.AppendAllText(logPath, $"[{DateTime.Now}] Email failed: {ex.Message}\n");
            }
        }
        private async Task<string> UploadWhatsAppMediaAsync(byte[] fileBytes)
        {
            string apiAttachmentUrl = "http://web.bizsol.in/ERP/BizSolBlog/UploadWhatsappFile";
            string uploadFileName = $"Upload_{DateTime.Now:yyyyMMddHHmmss}.pdf";

            string fileBase64String = Convert.ToBase64String(fileBytes);

            string fileExtension = Path.GetExtension(uploadFileName);
            if (string.IsNullOrEmpty(fileExtension))
                fileExtension = ".pdf";

            var payload = new
            {
                FileName = Path.GetFileNameWithoutExtension(uploadFileName),
                FileExtension = fileExtension,
                FileDataBase64string = fileBase64String
            };

            string jsonPayload = Newtonsoft.Json.JsonConvert.SerializeObject(payload);

            using (var httpClient = new HttpClient())
            {
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync(apiAttachmentUrl, content);
                string result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        var responseJson = Newtonsoft.Json.Linq.JObject.Parse(result);
                        return responseJson["path"]?.ToString() ?? result; // fallback
                    }
                    catch
                    {
                        return result.Replace("\"", "");
                    }
                }
                else
                {
                    throw new Exception($"Upload failed: {response.StatusCode} - {result}");
                }
            }
        }
        //public async Task<string> SendWhatsAppGatePass(byte[] pdfBytes)
        //{
        //    try
        //    {
        //        DateTime now = DateTime.Now;
        //        string uploadedFileUrl = await UploadWhatsAppMediaAsync(pdfBytes);
        //        var json1 = Newtonsoft.Json.Linq.JObject.Parse(uploadedFileUrl);
        //        string fileUrl = json1["messages"]?[0]?["path"]?.ToString();
        //        string fileName = fileUrl.Substring(fileUrl.LastIndexOf('/') + 1);
        //        string chatMyBotApiUrl = "https://wa.chatmybot.in/gateway/wabuissness/v1/message/batchapi";
        //        string accessToken = "d7098185-4ed8-4ce6-8750-0aaae7439c6e";
        //        string toNumber = "918957798886";
        //        string Date = Convert.ToString(now.Date);
        //        var payload = new[]
        //        {
        //            new
        //            {
        //                template = new
        //                {
        //                    id = "a31d7a9b-386a-4762-af01-2c3bf1853a6e",
        //                    language = new { code = "en" },
        //                    components = new object[]
        //                    {
        //                        new {
        //                            type = "body",
        //                            parameters = new[] {
        //                                new { type = "text", text = Date },
        //                                new { type = "text", text = "BizSol Technologies Pvt Ltd." },
        //                                new { type = "text", text = fileUrl }
        //                            }
        //                        }
        //                    }
        //                },
        //                to = toNumber,
        //                type = "template"
        //            }
        //        };

        //        using (var httpClient = new HttpClient())
        //        {
        //            var json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
        //            var content = new StringContent(json, Encoding.UTF8, "application/json");
        //            content.Headers.Add("accessToken", accessToken);

        //            var response = await httpClient.PostAsync(chatMyBotApiUrl, content);
        //            string responseBody = await response.Content.ReadAsStringAsync();

        //            if (response.IsSuccessStatusCode)
        //            {
        //                return $"✅ WhatsApp Sent Successfully: {responseBody}";
        //            }
        //            else
        //            {
        //                throw new Exception($"❌ WhatsApp Send Failed: {response.StatusCode} - {responseBody}");
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return $"❌ Error: {ex.Message}";
        //    }
        //}
        public async Task<string> SendWhatsAppGatePass(byte[] pdfBytes)
        {
            try
            {
                // Current Date in readable format
                string formattedDate = DateTime.Now.ToString("dd-MMM-yyyy"); // e.g., 09-Jul-2025

                // Upload PDF and get file URL
                string uploadedFileUrl = await UploadWhatsAppMediaAsync(pdfBytes);
                var json1 = Newtonsoft.Json.Linq.JObject.Parse(uploadedFileUrl);
                string? fileUrl = json1["messages"]?[0]?["path"]?.ToString();

                if (string.IsNullOrEmpty(fileUrl))
                    throw new Exception("File upload failed or invalid response received.");

                string chatMyBotApiUrl = "https://wa.chatmybot.in/gateway/wabuissness/v1/message/batchapi";
                string accessToken = "d7098185-4ed8-4ce6-8750-0aaae7439c6e";
                string toNumber = "918957798886";

                var payload = new
                {
                    template = new
                    {
                        id = "a31d7a9b-386a-4762-af01-2c3bf1853a6e",
                        language = new { code = "en" },
                        components = new object[]
                        {
                    new
                    {
                        type = "body",
                        parameters = new[]
                        {
                            new { type = "text", text = formattedDate },
                            new { type = "text", text = "BizSol Technologies Pvt Ltd." },
                            new { type = "text", text = fileUrl }
                        }
                    }
                        }
                    },
                    to = toNumber,
                    type = "template"
                };

                using (var httpClient = new HttpClient())
                {
                    // Set AccessToken in header
                    httpClient.DefaultRequestHeaders.Add("accessToken", accessToken);

                    var json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await httpClient.PostAsync(chatMyBotApiUrl, content);
                    string responseBody = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        return $"✅ WhatsApp Sent Successfully: {responseBody}";
                    }
                    else
                    {
                        return $"❌ WhatsApp Send Failed: {response.StatusCode} - {responseBody}";
                    }
                }
            }
            catch (Exception ex)
            {
                return $"❌ Error: {ex.Message}";
            }
        }

    }
}