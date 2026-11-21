using Microsoft.AspNetCore.Mvc;

namespace Bizsol_ESMS.Controllers
{
    public class AccountAppIntegrationController : Controller
    {
        private readonly IConfiguration _configuration;

        public AccountAppIntegrationController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public IActionResult AccountAppIntegration()
        {
            return View();
        }
    }
}
