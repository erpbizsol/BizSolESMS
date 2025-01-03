using Microsoft.AspNetCore.Mvc;

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

            string newconnectionStrings = "Server=220.158.165.98;Port = 65448;database=bizsolesms_test;user=sa;password=biz1981";
            AuthKey = $"{{" +
                      $"\"DefultMysqlTemp\":\"{newconnectionStrings}\"," +
                      $"\"AuthToken\":\"xyz\"," +
                      $"}}";
            
            ViewBag.AppBaseURL = _configuration["AppBaseURL"];
            ViewBag.AuthKey = AuthKey;
            return View();
        }



    }
}
