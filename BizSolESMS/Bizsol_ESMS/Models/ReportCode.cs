using Microsoft.Reporting.NETCore;
using Microsoft.ReportingServices.Interfaces;
using Microsoft.ReportingServices.ReportProcessing.ReportObjectModel;
using MySqlConnector;
using System.Data;
using System.Data.SqlClient;
using System.Reflection;
using System.Reflection.Emit;

namespace Bizsol_ESMS.Models
{
    public class ReportCode
    {
        private readonly string connectionString = "Server=220.158.165.98;Port=65448;Database=bizsolesms_test;User=sa;Password=biz1981;";
        public static void Load(LocalReport Report, ReportRequest request)
        {

            DataTable dt = new DataTable();
            using (var connection = new MySqlConnection(request.newConnectionString))
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
                        Report.DataSources.Add(new ReportDataSource("DataSet1", dt));
                        //string reportPath = "C:/Users/BizSol/source/repos/ESMS_R/ESMS_R/Reports/UomReport.rdlc";
                        string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "UomReport.rdlc");
                        using (var fs = new FileStream(reportPath, FileMode.Open, FileAccess.Read))
                        {
                            Report.LoadReportDefinition(fs);
                        }
                        Report.DataSources.Add(new ReportDataSource("dt", dt));
                    }
                }
            }
        }

        public static void ItemLoad(LocalReport Report, ReportRequest request)
        {

            DataTable dt = new DataTable();
            using (var connection = new MySqlConnection(request.newConnectionString))
            {
                using (var command = new MySqlCommand("CALL USP_ItemMaster1()", connection))
                {
                    command.CommandType = CommandType.Text;
                    connection.Open();
                    using (MySqlDataReader reader = command.ExecuteReader())
                    {
                        dt.Load(reader);
                        Report.DataSources.Add(new ReportDataSource("DataSet1", dt));
                       // string reportPath = "C:/Users/BizSol/source/repos/ESMS_R/ESMS_R/Reports/item.rdlc";
                        string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "item.rdlc");
                        using (var fs = new FileStream(reportPath, FileMode.Open, FileAccess.Read))
                        {
                            Report.LoadReportDefinition(fs);
                        }
                        Report.DataSources.Add(new ReportDataSource("dt", dt));
                    }
                }
            }
        }

        //public static void OrderReport(LocalReport Report, ReportRequest request)
        //{
        //    DataTable dt = new DataTable();
        //    string query = "CALL bizsolesms_test.USP_Order1()";

        //    try
        //    {
        //        using (var conn = new MySqlConnection(request.newConnectionString))
        //        {
        //            using (var command = new MySqlCommand(query, conn))
        //            {
        //                // command.Parameters.AddWithValue("@p_Code", request.p_Code);
        //                //command.Parameters.AddWithValue("@p1_Code", request.p1_Code);
        //                conn.Open();

        //                using (MySqlDataReader reader = command.ExecuteReader())
        //                {
        //                    dt.Load(reader);
        //                }
        //            }
        //        }

        //        Report.DataSources.Clear();
        //        Report.DataSources.Add(new ReportDataSource("OrderDataset", dt));
        //        string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "Order.rdlc");
        //        using (var fs = new FileStream(reportPath, FileMode.Open, FileAccess.Read))
        //        {
        //            Report.LoadReportDefinition(fs);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception("Error generating report: " + ex.Message, ex);
        //    }
        //}
        public static void OrderReport(LocalReport Report, ReportRequest request)
        {
            DataTable dt = new DataTable();
            string query = "CALL bizsolesms_test.USP_CDispatch(@p_Code)"; // Update the procedure and use a parameter

            try
            {
                using (var conn = new MySqlConnection(request.newConnectionString))
                {
                    using (var command = new MySqlCommand(query, conn))
                    {
                        // Add the required parameter
                        command.Parameters.AddWithValue("@p_Code", request.p_Code); // Make sure request.p_Code has value

                        conn.Open();

                        using (MySqlDataReader reader = command.ExecuteReader())
                        {
                            dt.Load(reader);
                        }
                    }
                }

                Report.DataSources.Clear();
                Report.DataSources.Add(new ReportDataSource("OrderDataset", dt));
                string reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "Order.rdlc");
                using (var fs = new FileStream(reportPath, FileMode.Open, FileAccess.Read))
                {
                    Report.LoadReportDefinition(fs);
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error generating report: " + ex.Message, ex);
            }
        }



    }

}
