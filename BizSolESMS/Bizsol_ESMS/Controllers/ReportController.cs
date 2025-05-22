
using Bizsol_ESMS.Models;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.VisualBasic;
using Org.BouncyCastle.Asn1.Ocsp;



namespace Bizsol_ESMS.Controllers
{
    public class ReportController : Controller
    {
        
        #region Location
        public IActionResult LocationReport()
        {
            return View();
        }
        #endregion Location
        #region TATReport
        public IActionResult TATReport()
        {
            return View();
        }
        #endregion TATReport
        #region StockLedger
        public IActionResult StockLedger()
        {
            return View();
        }
        #endregion StockLedger
        #region DispatchReport
        public IActionResult DispatchReport()
        {
            return View();
        }
        #endregion DispatchReport
    }
}
