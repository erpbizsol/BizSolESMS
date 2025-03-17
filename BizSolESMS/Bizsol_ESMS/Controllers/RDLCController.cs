
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using MySql.Data.MySqlClient;
using System.Data;

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
    }
    
}
