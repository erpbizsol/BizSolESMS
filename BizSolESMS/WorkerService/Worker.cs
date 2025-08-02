using System.Net.Mail;
using System.Net;
using Bizsol_ESMS;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;
using System.Security.Policy;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Data;
using MySql.Data.MySqlClient;
using System.Xml.Linq;
using Newtonsoft.Json;
using System.IO;

namespace WorkerService
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private static readonly HttpClient client = new HttpClient();

        public Worker(ILogger<Worker> logger)
        {
            _logger = logger;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
           
            string folderPath = @"C:\Esms Email Service";
            string ConnectionString = "Server=220.158.165.98;Port=65448;database=mg_corporation_main;user=sa;password=biz1981;";
            Directory.CreateDirectory(folderPath);

            string filePath = Path.Combine(folderPath, "log.txt");

            DateTime lastRunDate = DateTime.MinValue;

            while (!stoppingToken.IsCancellationRequested)
            {
                DateTime now = DateTime.Now;
                if (now.Hour == 19 && now.Minute == 00 && lastRunDate.Date != now.Date)
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
                        byte[] pdfBytes = controller.GenerateOrderReport(Date, Date, ConnectionString);
                        DataTable dt1 = EmailConfiguration(ConnectionString);
                        DataTable dt2 = AllEmailSendTo(ConnectionString);
                        if (dt1.Rows.Count > 0 && dt2.Rows.Count > 0)
                        {
                            SendEmailWithAttachment(dt1,dt2 ,pdfBytes);
                        }
                        DataTable dt3 = WhatsAppConfiguration(ConnectionString);
                        DataTable dt4 = AllWhatsAppSendTo(ConnectionString);
                        if (dt1.Rows.Count > 0 && dt2.Rows.Count > 0)
                        {
                           var result= await SendWhatsAppWithAttachment(dt3,dt4,pdfBytes);
                            if (_logger.IsEnabled(LogLevel.Information))
                            {
                                _logger.LogInformation(result);
                            }
                        }
                        
                        lastRunDate = now;
                    }
                    catch (Exception ex) {
                        await File.AppendAllTextAsync(filePath, ex.Message, stoppingToken);
                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation(ex.Message);
                        }
                    }
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
        private async Task<string> UploadWhatsAppMediaAsync(byte[] fileBytes)
        {
            string apiAttachmentUrl = "http://web.bizsol.in/ERP/BizSolBlog/UploadWhatsappFile";
            string uploadFileName = $"DailyOperationReport_{DateTime.Now:yyyyMMddHHmmss}.pdf";

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
        public DataTable EmailConfiguration(string connectionString)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("select * From f_emailconfiguration limit 1", conn))
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
        public DataTable AllEmailSendTo(string connectionString)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("Select EmailID From EmailSMSConfigurationMaster Where EmailSMSType='Email' And ForType='Daily Operation Summary' LIMIT 1;", conn))
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
        private void SendEmailWithAttachment(DataTable dt1, DataTable dt2, byte[] pdfBytes)
        {
            try
            {
                string date = DateTime.Now.ToString("yyyy-MM-dd");

                string body = "Dear Team," + Environment.NewLine + Environment.NewLine +
                              "Please find below the Daily Operation Summary for " + date + ".";
                              

                using (var smtpClient = new SmtpClient(dt1.Rows[0]["ServerName"].ToString()))
                {
                    smtpClient.Port = Convert.ToInt32(dt1.Rows[0]["PortNo"]);
                    smtpClient.Credentials = new NetworkCredential(
                        dt1.Rows[0]["UserID"].ToString(),
                        dt1.Rows[0]["UserPwd"].ToString());
                    smtpClient.EnableSsl = true;

                    using (var mailMessage = new MailMessage())
                    {
                        mailMessage.From = new MailAddress(dt1.Rows[0]["UserID"].ToString());
                        mailMessage.Subject = "Daily Operation Summary";
                        mailMessage.Body = body;
                        mailMessage.IsBodyHtml = false;
                        var emails = dt2.Rows[0]["EmailID"].ToString().Split(';');
                        foreach (var email in emails)
                        {
                            if (!string.IsNullOrWhiteSpace(email))
                                mailMessage.To.Add(email.Trim());
                        }
                        using (var ms = new MemoryStream(pdfBytes))
                        {
                            ms.Position = 0;
                            var attachment = new Attachment(ms, "OrderReport.pdf", "application/pdf");
                            mailMessage.Attachments.Add(attachment);

                            smtpClient.Send(mailMessage);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                string logPath = @"D:\ServiceFile\log.txt";
                Directory.CreateDirectory(Path.GetDirectoryName(logPath));
                File.AppendAllText(logPath, $"[{DateTime.Now}] Email failed: {ex.Message}\n");
            }
        }
        //public async Task<string> SendWhatsAppWithAttachment(DataTable dt1, DataTable dt2, byte[] pdfBytes)
        //{
        //    try
        //    {
        //        string formattedDate = DateTime.Now.ToString("dd-MMM-yyyy");

        //        string uploadedFileUrl = await UploadWhatsAppMediaAsync(pdfBytes);
        //        var jsonResponse = Newtonsoft.Json.Linq.JObject.Parse(uploadedFileUrl);
        //        string? fileUrl = jsonResponse["messages"]?[0]?["path"]?.ToString();

        //        if (string.IsNullOrEmpty(fileUrl))
        //            throw new Exception("File upload failed or invalid response received.");
        //        string? filename = null;
        //        if (!string.IsNullOrEmpty(fileUrl))
        //        {
        //            filename = Path.GetFileName(fileUrl);
        //        }
        //        var payload = new object[]
        //        {
        //            new
        //            {
        //                template = new
        //                {
        //                    id = "1dfffade-14c6-43d9-b0bf-6ee7f1022a44",
        //                    components = new object[]
        //                    {
        //                        new
        //                        {
        //                            type = "header",
        //                            parameters = new object[]
        //                            {
        //                                new
        //                                {
        //                                    type = "document",
        //                                    document = new
        //                                    {
        //                                        link = fileUrl,
        //                                        filename = filename
        //                                    }
        //                                }
        //                            }
        //                        },
        //                        new
        //                        {
        //                            type = "body",
        //                            parameters = new object[]
        //                            {
        //                                new { type = "text", text = formattedDate },
        //                                new { type = "text", text = "BizSol Technologies Pvt Ltd." }
        //                            }
        //                        }
        //                    }
        //                },
        //                to = dt2.Rows[0]["MobileNo"].ToString(),
        //                type = "template"
        //            }
        //        };

        //        string chatMyBotApiUrl = dt1.Rows[0]["API_URL"].ToString();
        //        string accessToken = dt1.Rows[0]["NameSpace"].ToString();

        //        using (var httpClient = new HttpClient())
        //        {
        //            httpClient.DefaultRequestHeaders.Add("accessToken", accessToken);
        //            var json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
        //            var content = new StringContent(json, Encoding.UTF8, "application/json");

        //            var response = await httpClient.PostAsync(chatMyBotApiUrl, content);
        //            var result = await response.Content.ReadAsStringAsync();

        //            if (response.IsSuccessStatusCode)
        //                return $"WhatsApp sent successfully.\nResponse: {result}";
        //            else
        //                return $"Failed to send WhatsApp.\nStatus: {response.StatusCode}\nBody: {result}";
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return $"Error: {ex.Message}";
        //    }
        //}
        public DataTable WhatsAppConfiguration(string connectionString)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("select * From f_whatsappconfiguration limit 1", conn))
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
        public DataTable AllWhatsAppSendTo(string connectionString)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("Select MobileNo From EmailSMSConfigurationMaster Where EmailSMSType='WhatsApp' And ForType='Daily Operation Summary' LIMIT 1;", conn))
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
        public async Task<string> SendWhatsAppWithAttachment(DataTable dt1, DataTable dt2, byte[] pdfBytes)
        {
            try
            {
                string formattedDate = DateTime.Now.ToString("dd-MMM-yyyy");

                string uploadedFileUrl = await UploadWhatsAppMediaAsync(pdfBytes);
                var jsonResponse = Newtonsoft.Json.Linq.JObject.Parse(uploadedFileUrl);
                string? fileUrl = jsonResponse["messages"]?[0]?["path"]?.ToString();

                if (string.IsNullOrEmpty(fileUrl))
                    throw new Exception("File upload failed or invalid response received.");

                string? filename = Path.GetFileName(fileUrl);
                string chatMyBotApiUrl = dt1.Rows[0]["API_URL"].ToString();
                string accessToken = dt1.Rows[0]["NameSpace"].ToString();

                string[] mobileNumbers = dt2.Rows[0]["MobileNo"].ToString()?.Split(',') ?? [];

                using (var httpClient = new HttpClient())
                {
                    httpClient.DefaultRequestHeaders.Add("accessToken", accessToken);
                    StringBuilder responseLog = new();

                    foreach (string mobile in mobileNumbers)
                    {
                        var trimmedMobile = mobile.Trim();

                        var payload = new object[]
                        {
                    new
                    {
                        template = new
                        {
                            id = "1dfffade-14c6-43d9-b0bf-6ee7f1022a44",
                            components = new object[]
                            {
                                new
                                {
                                    type = "header",
                                    parameters = new object[]
                                    {
                                        new
                                        {
                                            type = "document",
                                            document = new
                                            {
                                                link = fileUrl,
                                                filename = filename
                                            }
                                        }
                                    }
                                },
                                new
                                {
                                    type = "body",
                                    parameters = new object[]
                                    {
                                        new { type = "text", text = formattedDate },
                                        new { type = "text", text = "BizSol Technologies Pvt Ltd." }
                                    }
                                }
                            }
                        },
                        to = trimmedMobile,
                        type = "template"
                    }
                        };

                        var json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
                        var content = new StringContent(json, Encoding.UTF8, "application/json");

                        var response = await httpClient.PostAsync(chatMyBotApiUrl, content);
                        var result = await response.Content.ReadAsStringAsync();

                        responseLog.AppendLine($"To: {trimmedMobile}");
                        if (response.IsSuccessStatusCode)
                            responseLog.AppendLine($"✅ Success: {result}");
                        else
                            responseLog.AppendLine($"❌ Failed: {response.StatusCode} - {result}");
                    }

                    return responseLog.ToString();
                }
            }
            catch (Exception ex)
            {
                return $"Error: {ex.Message}";
            }
        }
    }
}