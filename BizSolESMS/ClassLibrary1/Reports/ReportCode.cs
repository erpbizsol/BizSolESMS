
using Devart.Data.MySql;
using ESMS_R.Models;
using Microsoft.Reporting.NETCore;
using Microsoft.ReportingServices.ReportProcessing.ReportObjectModel;
using MySqlConnector;
using System.Data;
using System.Reflection;

namespace ESMS_R
{
    public class ReportCode
    {
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
                        string reportPath = "C:/Users/BizSol/source/repos/ESMS_R/ESMS_R/Reports/UomReport.rdlc";
                        using (var fs = new FileStream(reportPath, FileMode.Open, FileAccess.Read))
                        {
                            Report.LoadReportDefinition(fs); 
                        }
                        Report.DataSources.Add(new ReportDataSource("dt", dt));
                    }
                    connection.Close();
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
                        string reportPath = "C:/Users/BizSol/source/repos/ESMS_R/ESMS_R/Reports/UomReport.rdlc";
                        using (var fs = new FileStream(reportPath, FileMode.Open, FileAccess.Read))
                        {
                            Report.LoadReportDefinition(fs);
                        }
                        Report.DataSources.Add(new ReportDataSource("dt", dt));
                    }
                    connection.Close();
                }
            }
        }
    }
   
}
