using Google.Apis.Admin.Directory.directory_v1.Data;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Bizsol_ESMS.Controllers
{
    public class DashbordController : Controller
    {
        private readonly ILogger<DashbordController> _logger;
        private readonly IConfiguration _configuration;
        public DashbordController(ILogger<DashbordController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }
        public IActionResult Dashbord(string AuthKey)
        {
            string newconnectionStrings = HttpContext.Session.GetString("ConnectionString");
            string UserMaster_Code = HttpContext.Session.GetString("UserMaster_Code");
            string UserID = HttpContext.Session.GetString("UserID");
            string UserName = HttpContext.Session.GetString("UserName");
            string UserType=HttpContext.Session.GetString("UserType");
            string FormToOpen = HttpContext.Session.GetString("FormToOpen");
            string DefaultPage = HttpContext.Session.GetString("DefaultPage");

            //string newconnectionStrings = "Server=220.158.165.98;Port = 65448;database=bizsolesms_test;user=sa;password=biz1981";
            //AuthKey = $"{{" +
            //          $"\"DefultMysqlTemp\":\"{newconnectionStrings}\"," +
            //          $"\"AuthToken\":\"xyz\"," +
            //          $"\"UserMaster_Code\":\"" + UserMaster_Code + "\"," +
            //          $"\"UserID\":\"" + UserID + "\"," +
            //          $"}}";
            var authKey = new
            {
                DefultMysqlTemp = newconnectionStrings,
                AuthToken = "xyz",
                UserMaster_Code,
                UserID,
                UserType
            };

            string jsonAuthKey = JsonSerializer.Serialize(authKey);
            ViewBag.AppBaseURL = _configuration["AppBaseURL"];
            ViewBag.AppBaseURLMenu = _configuration["AppBaseURLMenu"];
            ViewBag.UserName = UserName;
            ViewBag.FormToOpen = FormToOpen;
            ViewBag.DefaultPage = DefaultPage;
            ViewBag.UserMaster_Code = UserMaster_Code;
            ViewBag.AuthKey = jsonAuthKey;

            return View();
        }
    }
}
