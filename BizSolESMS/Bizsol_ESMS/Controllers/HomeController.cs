using Bizsol_ESMS.Models;
using Microsoft.AspNetCore.Components.RenderTree;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Reporting.NETCore;
using System.Data;
using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Reflection.Emit;

namespace Bizsol_ESMS.Models.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly string connectionString = "Server=220.158.165.98;Port=65448;Database=bizsolesms_test;User=sa;Password=biz1981;";
        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }


        [HttpPost]
        public IActionResult Index1([FromBody] ReportRequest request)
        {
            string? RenderType = "";
            string? Ex = "";
            string? mintype = "";
            switch (request.ReportType)
            {
                case "PDF":
                    RenderType = "PDF";
                    Ex = "pdf";
                    mintype = "application/pdf";
                    break;
            }

            return PrivacyController(RenderType, Ex, mintype);
        }

        private IActionResult PrivacyController(string RenderType, string Ex, string mintype)
        {
            using var report = new LocalReport();
            ReportRequest request = new ReportRequest { newConnectionString = connectionString };
            ReportCode.Load(report, request);
            var result = report.Render(RenderType);
            return File(result, mintype, $"report.{Ex}");
        }

        [HttpPost]
        public IActionResult ItemMaster([FromBody] ReportRequest request)
        {
            string? RenderType = "";
            string? Ex = "";
            string? mintype = "";
            switch (request.ReportType)
            {
                case "PDF":
                    RenderType = "PDF";
                    Ex = "pdf";
                    mintype = "application/pdf";
                    break;
            }

            return ItemMasterController(RenderType, Ex, mintype);
        }

        private IActionResult ItemMasterController(string RenderType, string Ex, string mintype)
        {
            using var report = new LocalReport();
            ReportRequest request = new ReportRequest { newConnectionString = connectionString };

            ReportCode.ItemLoad(report, request);
            var result = report.Render(RenderType);
            return File(result, mintype, $"report.{Ex}");
        }

        [HttpPost]
        public IActionResult OrderMaster([FromBody] ReportRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.newConnectionString))
            {
                return BadRequest("Invalid request data");
            }

            string renderType = "PDF";
            string extension = "pdf";
            string mimeType = "application/pdf";

            return OrderReportController(request, renderType, extension, mimeType);
        }
        private IActionResult OrderReportController(ReportRequest request, string renderType, string extension, string mimeType)
        {
            using var report = new LocalReport();
            request.newConnectionString = connectionString; 
            ReportCode.OrderReport(report, request);
            var result = report.Render(renderType);
            return File(result, mimeType, $"OrderReport.{extension}");
        }

    }
}
