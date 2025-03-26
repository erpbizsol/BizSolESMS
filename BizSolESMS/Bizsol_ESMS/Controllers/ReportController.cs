using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System;
using System.Diagnostics;
using System.IO;

namespace Bizsol_ESMS.Controllers
{
    public class ReportController : Controller
    {
        public IActionResult LocationReport()
        {
            return View();
        }

        public IActionResult Test()
        {
            return View();
        }

    }
}
