using Microsoft.AspNetCore.Mvc;

namespace Bizsol_ESMS.Controllers
{
    public class ReportController : Controller
    {
        public IActionResult LocationReport()
        {
            return View();
        }
    }
}
