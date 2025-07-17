
using Bizsol_ESMS.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Reporting.NETCore;
using Microsoft.VisualBasic;
using MySql.Data.MySqlClient;
using MySqlX.XDevAPI;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
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
                    connection.Close();
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
            string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "OrderReport.rdlc");

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

            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "OrderReport.pdf");
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

            //string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "OrderReport.rdlc");
            //string updatedPath = reportPath.Replace(@"WorkerService", "BizSol_ESMS");
            string updatedPath = @"C:\E-SMS_Publish\Reports\OrderReport.rdlc";
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

            byte[] pdfBytes = report.Render("PDF");

            return pdfBytes;
        }
        [HttpGet]
        public IActionResult PSRReport(int Code,string UserName, string AuthKey)
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
            string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "PSRReport.rdlc");

            LocalReport report = new LocalReport();
            report.ReportPath = reportPath;
            report.DataSources.Add(new ReportDataSource("PsrDetailData", ds.Tables[0]));
            report.DataSources.Add(new ReportDataSource("PsrTabledata", ds.Tables[1]));
            var reportParameters = new[]
            {
                new ReportParameter("PrintedBy", UserName),
                new ReportParameter("PrintedOn", DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"))
            };
            report.SetParameters(reportParameters);
            byte[] pdf = report.Render("PDF");
            return File(pdf, "application/pdf", "OrderReport.pdf");
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

            foreach (var item in model)
            {
                var img = Convert.FromBase64String(item.QRCode.Replace("data:image/png;base64,", ""));
                dt.Rows.Add(img, item.OrderNo, item.BoxNo,item.AccountName,item.Address);
            }

            LocalReport report = new LocalReport();
            string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "DispatchQR.rdlc");
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
    }
} 
