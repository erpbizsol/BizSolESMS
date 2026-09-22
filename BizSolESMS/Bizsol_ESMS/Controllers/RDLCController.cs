
using Bizsol_ESMS.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Reporting.NETCore;
using Microsoft.VisualBasic;
using MySql.Data.MySqlClient;
using MySqlX.XDevAPI;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using QRCoder;
using System.Collections.Generic;
using System.Data;
using System.Net.Http.Headers;
using System.Net.Http;
using System.Net.Http.Headers;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Text;
using Google.Apis.Admin.Directory.directory_v1.Data;

namespace Bizsol_ESMS.Controllers
{
    public class RDLCController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        #region Uom
        public IActionResult GetUOMReport()
        {

            string newConnectionString = HttpContext.Session.GetString("ConnectionString");
            if (string.IsNullOrEmpty(newConnectionString))
            {
                return StatusCode(500, "Database connection string is missing.");
            }
            DataTable dt = new DataTable();
            using (var connection = new MySqlConnection(newConnectionString))
            {
                using (var command = new MySqlCommand("CALL USP_UOMMaster1(@p_Code, @p_UOMName, @p_DigitAfterDecimal)", connection))
                {
                    command.CommandType = CommandType.Text;
                    command.Parameters.AddWithValue("@p_Code", 0);
                    command.Parameters.AddWithValue("@p_UOMName", "");
                    command.Parameters.AddWithValue("@p_DigitAfterDecimal", 0);

                    connection.Open();
                    using (MySqlDataReader reader = command.ExecuteReader())
                    {
                        dt.Load(reader);
                    }
                }
            }
            return View();


        }
        #endregion Uom

        [HttpGet]
        public IActionResult OrderReport(string FromDate,string ToDate,string AuthKey)
        {
            JObject data = JObject.Parse(AuthKey);
            string connectionString = data["DefultMysqlTemp"]?.ToString();

            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("USP_DailyStockReport", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("p_Mode", "");
                    cmd.Parameters.AddWithValue("p_FromDate", FromDate);
                    cmd.Parameters.AddWithValue("p_ToDate", ToDate);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }

            string qrCompanyName = ds.Tables[9].Rows.Count > 0
                ? ds.Tables[9].Rows[0]["CompanyCode"]?.ToString() ?? ""
                : "";

            string reportPath = string.Equals(qrCompanyName, "MG0001", StringComparison.OrdinalIgnoreCase)
                ? Path.Combine(Directory.GetCurrentDirectory(), "Reports", "OrderReport.rdlc")
                : Path.Combine(Directory.GetCurrentDirectory(), "Reports", "OrderReportTata.rdlc"); 

            //string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "OrderReport.rdlc");

            LocalReport report = new LocalReport();
            report.ReportPath = reportPath;
            report.DataSources.Add(new ReportDataSource("DailyOrderReport", ds.Tables[0]));
            report.DataSources.Add(new ReportDataSource("LossOrderReport", ds.Tables[1]));
            report.DataSources.Add(new ReportDataSource("DeadStock", ds.Tables[2]));
            report.DataSources.Add(new ReportDataSource("MonthWiseSale", ds.Tables[3]));
            report.DataSources.Add(new ReportDataSource("AverageTrunAround", ds.Tables[4]));
            report.DataSources.Add(new ReportDataSource("TopCustomers", ds.Tables[5]));
            report.DataSources.Add(new ReportDataSource("Employee", ds.Tables[6]));
            report.DataSources.Add(new ReportDataSource("SaleLossOrder", ds.Tables[7]));
            report.DataSources.Add(new ReportDataSource("SaleReturn", ds.Tables[8]));
            report.DataSources.Add(new ReportDataSource("TatConfig", ds.Tables[9]));
            report.DataSources.Add(new ReportDataSource("TatMaster", ds.Tables[10]));
            report.DataSources.Add(new ReportDataSource("StockSummary", ds.Tables[11]));
            report.SetParameters(new[] { new ReportParameter("CompanyName", ds.Tables[12].Rows[0]["CompanyName"].ToString()) });

            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "WeBiz_DOS.pdf");
        }
        public byte[] GenerateOrderReport(string fromDate, string toDate, string connectionString)
        {
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("USP_DailyStockReport", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("p_Mode", "");
                    cmd.Parameters.AddWithValue("p_FromDate", fromDate);
                    cmd.Parameters.AddWithValue("p_ToDate", toDate);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }

            string qrCompanyName = ds.Tables[9].Rows.Count > 0
                ? ds.Tables[9].Rows[0]["CompanyCode"]?.ToString() ?? ""
                : "";

            string updatedPath = string.Equals(qrCompanyName, "MG0001", StringComparison.OrdinalIgnoreCase)
                ? @"C:\E-SMS_Publish\Reports\OrderReport.rdlc"
                : @"C:\E-SMS_Publish\Reports\OrderReportTata.rdlc";

            //string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "OrderReport.rdlc");
            //string updatedPath = reportPath.Replace(@"WorkerService", "BizSol_ESMS");
            //string updatedPath = @"C:\E-SMS_Publish\Reports\OrderReport.rdlc";
            //string updatedPath = @"C:\ESMS_RDLC\Reports\OrderReport.rdlc";

            LocalReport report = new LocalReport();
            report.ReportPath = updatedPath;
            report.DataSources.Add(new ReportDataSource("DailyOrderReport", ds.Tables[0]));
            report.DataSources.Add(new ReportDataSource("LossOrderReport", ds.Tables[1]));
            report.DataSources.Add(new ReportDataSource("DeadStock", ds.Tables[2]));
            report.DataSources.Add(new ReportDataSource("MonthWiseSale", ds.Tables[3]));
            report.DataSources.Add(new ReportDataSource("AverageTrunAround", ds.Tables[4]));
            report.DataSources.Add(new ReportDataSource("TopCustomers", ds.Tables[5]));
            report.DataSources.Add(new ReportDataSource("Employee", ds.Tables[6]));
            report.DataSources.Add(new ReportDataSource("SaleLossOrder", ds.Tables[7]));
            report.DataSources.Add(new ReportDataSource("SaleReturn", ds.Tables[8]));
            report.DataSources.Add(new ReportDataSource("TatConfig", ds.Tables[9]));
            report.DataSources.Add(new ReportDataSource("TatMaster", ds.Tables[10]));
            report.DataSources.Add(new ReportDataSource("StockSummary", ds.Tables[11]));
            report.SetParameters(new[] { new ReportParameter("CompanyName", ds.Tables[12].Rows[0]["CompanyName"].ToString()) });

            byte[] pdfBytes = report.Render("PDF");

            return pdfBytes;
        }
        
        [HttpGet]
        public IActionResult PSRReport(int Code,string UserName, string AuthKey)
        {
            JObject data = JObject.Parse(AuthKey);
            string connectionString = data["DefultMysqlTemp"]?.ToString();
            string reportPath="";
            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("USP_DispatchReport", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("p_Code", Code);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }
            string companyName = ds.Tables[0].Rows.Count > 0
                ? ds.Tables[0].Rows[0]["IsPSRQRShow"]?.ToString() ?? "N"
                : "N";

            if (companyName=="Y")
                reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "PSRReportTata.rdlc");
            else
                reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "PSRReportTata.rdlc");

            LocalReport report = new LocalReport();
            report.ReportPath = reportPath;
            BindPsrTataReport(report, ds, UserName, Code);
            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "OrderReport.pdf");
        }

        [HttpGet]
        public IActionResult PSRReportQR(int Code, string UserName, string AuthKey, string? CompanyCode = null)
        {
            JObject data = JObject.Parse(AuthKey);
            string connectionString = data["DefultMysqlTemp"]?.ToString();

            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("USP_DispatchReport", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("p_Code", Code);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }

            string? companyCode = CompanyCode ?? data["CompanyCode"]?.ToString();
            ApplyPsrReportQrPayload(ds, Code, companyCode);

            string qrCompanyName = ds.Tables[0].Rows.Count > 0
                ? ds.Tables[0].Rows[0]["IsPSRQRShow"]?.ToString() ?? "N"
                : "N";

            string reportPath = qrCompanyName=="Y"
                ? Path.Combine(Directory.GetCurrentDirectory(), "Reports", "PSRReportTata.rdlc")
                : Path.Combine(Directory.GetCurrentDirectory(), "Reports", "PSRReport.rdlc");

            LocalReport report = new LocalReport();
            report.ReportPath = reportPath;
            if (qrCompanyName == "Y")
                BindPsrTataReport(report, ds, UserName, Code);
            else
            {
                report.DataSources.Add(new ReportDataSource("PsrDetailData", ds.Tables[0]));
                report.DataSources.Add(new ReportDataSource("PsrTabledata", ds.Tables[1]));
                report.SetParameters(new[]
                {
                    new ReportParameter("PrintedBy", UserName),
                    new ReportParameter("PrintedOn", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"))
                });
            }
            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "PSRReport.pdf");
        }

        private static void BindPsrTataReport(LocalReport report, DataSet ds, string userName, int code)
        {
            ApplyPsrUpiQrPayload(ds, code);
            report.DataSources.Add(new ReportDataSource("PsrDetailData", ds.Tables[0]));
            report.DataSources.Add(new ReportDataSource("PsrTabledata", ds.Tables[1]));
            report.DataSources.Add(new ReportDataSource("PsrBankData", GetPsrBankData(ds)));
            report.SetParameters(new[]
            {
                new ReportParameter("PrintedBy", userName ?? ""),
                new ReportParameter("PrintedOn", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"))
            });
        }

        private static void ApplyPsrUpiQrPayload(DataSet ds, int code)
        {
            if (ds.Tables.Count < 1 || ds.Tables[0].Rows.Count == 0) return;

            DataTable detail = ds.Tables[0];
            if (!detail.Columns.Contains("UpiQRCode"))
                detail.Columns.Add("UpiQRCode", typeof(string));

            DataRow d0 = detail.Rows[0];
            string upiId = GetDataRowString(d0, "UPIId");
            if (string.IsNullOrEmpty(upiId))
                upiId = GetDataRowString(d0, "UPIID");
            if (string.IsNullOrEmpty(upiId))
                upiId = GetDataRowString(d0, "UPI Id");

            string payeeName = GetDataRowString(d0, "From");
            string scanMrpRaw = GetDataRowString(d0, "ScanMRP");
            string challanNo = GetDataRowString(d0, "ChallanNo");
            string orderNo = GetDataRowString(d0, "OrderNo");

            decimal amount = 0;
            if (!string.IsNullOrWhiteSpace(scanMrpRaw))
                decimal.TryParse(scanMrpRaw.Replace(",", ""), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out amount);

            string uri = BuildUpiPayUri(upiId, payeeName, amount, string.IsNullOrEmpty(challanNo) ? ("PSR " + (string.IsNullOrEmpty(orderNo) ? code.ToString() : orderNo)) : ("PSR " + challanNo));
            if (string.IsNullOrEmpty(uri)) return;

            string b64 = GenerateQrPngBase64(uri);
            foreach (DataRow row in detail.Rows)
                row["UpiQRCode"] = b64;
        }

        private static string BuildUpiPayUri(string upiId, string payeeName, decimal amount, string note)
        {
            if (string.IsNullOrWhiteSpace(upiId)) return "";
            var parts = new List<string> { "pa=" + Uri.EscapeDataString(upiId.Trim()) };
            if (!string.IsNullOrWhiteSpace(payeeName))
            {
                string pn = payeeName.Trim();
                if (pn.Length > 50) pn = pn.Substring(0, 50);
                parts.Add("pn=" + Uri.EscapeDataString(pn));
            }
            if (amount > 0)
                parts.Add("am=" + Uri.EscapeDataString(amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)));
            parts.Add("cu=INR");
            if (!string.IsNullOrWhiteSpace(note))
            {
                string tn = note.Trim();
                if (tn.Length > 80) tn = tn.Substring(0, 80);
                parts.Add("tn=" + Uri.EscapeDataString(tn));
            }
            return "upi://pay?" + string.Join("&", parts);
        }

        private static string GenerateQrPngBase64(string payload)
        {
            using var qrGenerator = new QRCodeGenerator();
            using QRCodeData qrData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
            var pngQr = new PngByteQRCode(qrData);
            return Convert.ToBase64String(pngQr.GetGraphic(20));
        }

        private static DataTable GetPsrBankData(DataSet ds)
        {
            var dt = new DataTable("PsrBankData");
            dt.Columns.Add("Bank1Text", typeof(string));
            dt.Columns.Add("Bank2Text", typeof(string));
            dt.Columns.Add("Bank3Text", typeof(string));
            dt.Columns.Add("Bank4Text", typeof(string));
            dt.Columns.Add("Bank5Text", typeof(string));
            dt.Columns.Add("Bank6Text", typeof(string));
            dt.Columns.Add("BankCount", typeof(int));

            if (ds.Tables.Count <= 2 || ds.Tables[2].Rows.Count == 0)
            {
                dt.Rows.Add("", "", "", "", "", "", 0);
                return dt;
            }

            var texts = new List<string>();
            foreach (DataRow row in ds.Tables[2].Rows)
                texts.Add(FormatPsrBankBlock(row));

            int bankCount = texts.Count;
            if (texts.Count > 6)
            {
                for (int i = 6; i < texts.Count; i++)
                    texts[5] += Environment.NewLine + Environment.NewLine + texts[i];
                bankCount = 6;
            }

            string Get(int index) => index < texts.Count ? texts[index] : "";
            dt.Rows.Add(Get(0), Get(1), Get(2), Get(3), Get(4), Get(5), bankCount);
            return dt;
        }

        private static string FormatPsrBankBlock(DataRow row)
        {
            string Line(string label, string column)
            {
                string value = System.Net.WebUtility.HtmlEncode(GetDataRowString(row, column));
                return $"<b>{label}</b> : {value}";
            }

            return string.Join("<br/>", new[]
            {
                Line("Bank Name", "BankName"),
                Line("Account No.", "AccountNo"),
                Line("IFSC Code", "IFSCCode"),
                Line("Branch", "Branch"),
                Line("Type", "Type")
            });
        }

        private static void ApplyPsrReportQrPayload(DataSet ds, int code, string? companyCode)
        {
            if (ds.Tables.Count < 2) return;
            DataTable detail = ds.Tables[0];
            DataTable lines = ds.Tables[1];
           
            string? payload = null;

            if (detail.Rows.Count > 0)
            {
                DataRow d0 = detail.Rows[0];
                string orderNo = GetDataRowString(d0, "OrderNo");
                string challanNo = GetDataRowString(d0, "ChallanNo");
                string noOfBoxes = GetDataRowString(d0, "NoOfBoxes");
                string totalScannedProducts = GetDataRowString(d0, "TotalScannedProducts");
                string clientName = GetDataRowString(d0, "To");
                if (string.IsNullOrEmpty(clientName))
                    clientName = GetDataRowString(d0, "TO");

                payload = $"Code={code}&OrderNo={orderNo}&ChallanNo={challanNo}&NoOfBoxes={noOfBoxes}&TotalScannedProducts={totalScannedProducts}&ClientName={clientName}&CompanyCode={companyCode ?? ""}";
            }

            if (string.IsNullOrEmpty(payload))
                payload = $"PSR|{code}|{companyCode ?? ""}".TrimEnd('|');

            using var qrGenerator = new QRCodeGenerator();
            using QRCodeData qrData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
            var pngQr = new PngByteQRCode(qrData);
            byte[] png = pngQr.GetGraphic(20);
            string b64 = Convert.ToBase64String(png);

            foreach (DataRow row in detail.Rows)
                row["QRCode"] = b64;
        }

        private static string GetDataRowString(DataRow row, string columnName)
        {
            if (!row.Table.Columns.Contains(columnName)) return "";
            object? v = row[columnName];
            return v == null || v == DBNull.Value ? "" : v.ToString() ?? "";
        }

        [HttpPost]
        public IActionResult PrintDispatchQR([FromBody] List<DispatchModel> model)
        {
            DataTable dt = new DataTable();
            dt.Columns.Add("QRCode", typeof(byte[]));
            dt.Columns.Add("OrderNo");
            dt.Columns.Add("BoxNo");
            dt.Columns.Add("AccountName");
            dt.Columns.Add("Address");
            dt.Columns.Add("CompanyCode");

            foreach (var item in model)
            {
                var img = Convert.FromBase64String(item.QRCode.Replace("data:image/png;base64,", ""));
                dt.Rows.Add(img, item.OrderNo, item.BoxNo,item.AccountName,item.Address,item.CompanyCode);
            }

            string qrCompanyName = dt.Rows.Count > 0
                ? dt.Rows[0]["CompanyCode"]?.ToString() ?? ""
                : "";

            LocalReport report = new LocalReport();
            string reportPath = qrCompanyName.IndexOf("DadaSales", StringComparison.OrdinalIgnoreCase) >= 0
                ? Path.Combine(Directory.GetCurrentDirectory(), "Reports", "DispatchQRTata.rdlc")
                : Path.Combine(Directory.GetCurrentDirectory(), "Reports", "DispatchQR.rdlc");
            report.ReportPath = reportPath;

            report.DataSources.Add(new ReportDataSource("DispatchQRData", dt));

            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "DispatchQR.pdf");
        }
        [HttpGet]
        public IActionResult PrintGatePass(string Code,string UserName, string AuthKey)
        {
            JObject data = JObject.Parse(AuthKey);
            string connectionString = data["DefultMysqlTemp"]?.ToString();

            DataSet ds = new DataSet();

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                conn.Open();

                using (MySqlCommand cmd = new MySqlCommand("USP_PrintGatePass", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("p_Mode", "GATEPASS");
                    cmd.Parameters.AddWithValue("p_VehicleNo", "");
                    cmd.Parameters.AddWithValue("p_Date", "");
                    cmd.Parameters.AddWithValue("p_Codes", Code);

                    using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                    {
                        adapter.Fill(ds);
                    }
                }
            }
            string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "PrintGatePass.rdlc");

            LocalReport report = new LocalReport();
            report.ReportPath = reportPath;
            report.DataSources.Add(new ReportDataSource("PrintGatePass", ds.Tables[0]));
            var reportParameters = new[]
            {
                new ReportParameter("PrintedBy", UserName),
                new ReportParameter("PrintedOn", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"))
            };
            report.SetParameters(reportParameters);
            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "PrintGatePass.pdf");
        }
        [HttpPost]
        public IActionResult GPrintQR([FromBody] List<MRNModel> model)
        {
            try
            {
                DataTable dt = new DataTable();
                dt.Columns.Add("QRCode", typeof(byte[]));
                dt.Columns.Add("ItemCode");
                dt.Columns.Add("ItemName");
                dt.Columns.Add("billqty");
                dt.Columns.Add("ItemRate");

                if (model == null || model.Count == 0)
                {
                    return StatusCode(400, "No data provided");
                }

                foreach (var item in model)
                {
                    int totalCopies = Convert.ToInt32(item.billqty);

                    for (int i = 1; i <= totalCopies; i++)
                    {
                        byte[] qrCodeBytes = null;
                        if (!string.IsNullOrEmpty(item.QRCode))
                        {
                            qrCodeBytes = Convert.FromBase64String(item.QRCode.Replace("data:image/png;base64,", ""));
                        }
                        dt.Rows.Add(
                            qrCodeBytes,
                            item.ItemCode,
                            item.ItemName,
                            item.billqty,
                            item.ItemRate
                        );
                    }
                }

                LocalReport report = new LocalReport();
                string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "ForceItemQR.rdlc");
                
                if (!System.IO.File.Exists(reportPath))
                {
                    return StatusCode(500, "Report file not found: " + reportPath);
                }

                report.ReportPath = reportPath;
                report.DataSources.Add(new ReportDataSource("PrintQR", dt));

                byte[] pdf = report.Render("PDF");
                return File(pdf, "application/pdf", "PrintQR.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error generating report: " + ex.Message + " | " + ex.InnerException?.Message);
            }
        }
    }
} 
