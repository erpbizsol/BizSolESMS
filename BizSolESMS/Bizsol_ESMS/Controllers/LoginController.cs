using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using System.Data;
using Grpc.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Bizsol_ESMS.Models;
using MySql.Data.MySqlClient;

namespace Bizsol_ESMS.Controllers
{
    public class LoginController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly IConfiguration _configurations;

        public LoginController(IConfiguration configuration)
        {
            _configuration = configuration;
            _configurations = configuration;
        }
        public IActionResult Login()
        {
            return View();

        }

        [HttpPost]
        public IActionResult ValidateCompanyCode([FromBody] BizSolERPLoginDetails model)
        {
            if (string.IsNullOrEmpty(model.CompanyCode))
            {             
                return Json(new { success = false, message = "Company code is required!" });
            }
            string connectionString = _configuration.GetConnectionString("DefaultConnectionSQL");
            string connectionMYSqlString = _configuration.GetConnectionString("DefaultConnectionMYSQL");
            using (var connection = new SqlConnection(connectionString))
            {
                connection.Open();
                string query = "SELECT * FROM BizSolESMSLoginDetails WHERE CompanyCode = @CompanyCode";
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@CompanyCode", model.CompanyCode);
                    int count = Convert.ToInt32(command.ExecuteScalar());
                    SqlDataReader dr = command.ExecuteReader();

                    if (count > 0)
                    {

                        if (dr.HasRows)
                        {
                            if (dr.Read())
                            {
                                connectionMYSqlString = connectionMYSqlString.Replace("IPMySql", dr["sqladdress"].ToString());
                                connectionMYSqlString = connectionMYSqlString.Replace("MySqlPort", "65448");
                                connectionMYSqlString = connectionMYSqlString.Replace("MySqlDatabase", dr["LoginDatabase"].ToString());
                                connectionMYSqlString = connectionMYSqlString.Replace("MySqlUser", dr["userid"].ToString());
                                connectionMYSqlString = connectionMYSqlString.Replace("MySqlPassword", dr["pwd"].ToString());

                                HttpContext.Session.SetString("ConnectionString", connectionMYSqlString);
                                ViewBag.CompanyLogin = true;
                                ViewBag.IsValidCompanyCode = false;
                                return Json(new { success = true, message = "Company code is valid." });
                            }
                        }
                        dr.Close();
                    }
                    connection.Close();
                }
                return Json(new { success = false, message = "Invalid company code!" });
            }
        }

        [HttpPost]
        public IActionResult Authenticate([FromBody] LoginModel model)
        {
            if (string.IsNullOrEmpty(model.UserID) || string.IsNullOrEmpty(model.Password))
            {
                return Json(new { success = false, message = "All fields are required!" });
            }
            string connectionString = HttpContext.Session.GetString("ConnectionString");
            using (var connections = new MySqlConnection(connectionString))
            {

                connections.Open();
                string query = "SELECT * FROM usermaster WHERE UserID=@UserID AND Password=@Password";
                using (var command = new MySqlCommand(query, connections))
                {
                    command.Parameters.AddWithValue("@UserID", model.UserID);
                    command.Parameters.AddWithValue("@Password", model.Password);
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            return Ok(new { success = true, message = "Login successful!" });
                            
                        }
                    }
                }
                connections.Close();
            }

            return Json(new { success = false, message = "Invalid credentials!" });
        }

    }

}



