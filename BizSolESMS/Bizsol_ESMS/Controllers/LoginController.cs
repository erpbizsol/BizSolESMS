﻿using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using System.Data;
using Grpc.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Bizsol_ESMS.Models;
using MySql.Data.MySqlClient;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Xml.Linq;

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
                                CookieOptions options = new CookieOptions
                                {
                                    
                                    Expires = DateTime.UtcNow.AddMinutes(60 * 60 * 1000),
                                    HttpOnly = false,
                                    Secure = true,
                                    SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict
                                };
                                Response.Cookies.Append("CompanyCode", model.CompanyCode, options);
                                ViewBag.CompanyLogin = true;
                                ViewBag.IsValidCompanyCode = false;
                                return Json(new { success = true, message = "Company code is valid.", model.CompanyCode });
                            }
                        }
                        dr.Close();
                    }
                    connection.Close();
                    Response.Cookies.Delete("CompanyCode"); 
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
                string query = "SELECT usermaster.Code, UserID, UserName, Password, UserType, GroupMaster_Code, Status,ShowClientInProductionReport, FixedParameter_Code, CreatedBy, CreateDate,UpdatedBy, UpdateDate, ChangePasswordForNextLogIn, ShowRatesInQuotation,\r\nUserImage, UserMobileNo,DesignationMaster_Code, UserLocation, LoginAllowFromSystem,OTPApplicable, InActiveDate, NoOfSessionAllowed, IsBizSolUser, EmailID, DefaultPage, usermodulemaster.FormToOpen FROM usermaster\r\nLEFT JOIN UserModuleMaster ON usermodulemaster.Code=usermaster.DefaultPage WHERE UserID=@UserID And Status='Y' LIMIT 1";
                using (var command = new MySqlCommand(query, connections))
                {
                    command.Parameters.AddWithValue("@UserID", model.UserID.Trim());
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            
                            while (reader.Read())
                            {
                                var UserMaster_Code = reader["Code"].ToString();
                                var UserID = reader["UserID"].ToString();
                                var UserType = reader["UserType"].ToString();
                                var UserName = reader["UserName"].ToString();
                                var DefaultPage = reader["DefaultPage"].ToString();
                                var FormToOpen = reader["FormToOpen"].ToString();
                                var Data=CommonFunction.DecryptPasswordAsync(reader["Password"].ToString());
                                if (Data.Result == model.Password)
                                {
                                    HttpContext.Session.SetString("UserMaster_Code", UserMaster_Code);
                                    HttpContext.Session.SetString("UserID", UserID);
                                    HttpContext.Session.SetString("UserName", UserName);
                                    HttpContext.Session.SetString("UserType", UserType);
                                    HttpContext.Session.SetString("DefaultPage", DefaultPage);
                                    HttpContext.Session.SetString("FormToOpen", FormToOpen);
                                    ViewBag.AppBaseURL = _configuration["AppBaseURL"];
                                    ViewBag.AppBaseURLMenu = _configuration["AppBaseURLMenu"];
                                    return Ok(new { success = true, message = "Login successful!" });
                                }
                            }
                        }
                    }
                }
                connections.Close();
            }

            return Json(new { success = false, message = "Invalid credentials!" });
        }

    }

}



