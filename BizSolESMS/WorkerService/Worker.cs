using System.Net.Mail;
using System.Net;
using Bizsol_ESMS;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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

                if (now.Hour == 12 && now.Minute == 32 && lastRunDate.Date != now.Date)
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

                        SendEmailWithAttachment("mgoel6789@gmail.com,ankityadavfzd2002@gmail.com", "Daily Report", "This is your 10:00 AM report email.", pdfBytes);
                        
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

                // ✅ attach PDF from memory
                using (MemoryStream ms = new MemoryStream(pdfBytes))
                {
                    ms.Position = 0;
                    Attachment attachment = new Attachment(ms, "OrderReport.pdf", "application/pdf");
                    mailMessage.Attachments.Add(attachment);

                    smtpClient.Send(mailMessage); // Send with in-memory PDF
                }
            }
            catch (Exception ex)
            {
                string logPath = @"D:\ServiceFile\log.txt";
                Directory.CreateDirectory(Path.GetDirectoryName(logPath));
                File.AppendAllText(logPath, $"[{DateTime.Now}] Email failed: {ex.Message}\n");
            }
        }
    }
}