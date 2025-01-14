using Microsoft.AspNetCore.Mvc;

namespace Bizsol_ESMS.Controllers
{
    public class OrderController : Controller
    {
     
        #region  OrderMaster 

        public IActionResult OrderMaster()
        {
            return View();
        }

        #endregion  OrderMaster 
    }
}
