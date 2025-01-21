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

        #region  Dispatch 
        public IActionResult Dispatch()
        {
            return View();
        }
        #endregion  Dispatch 
        #region  ItemOpeningBalance 
        public IActionResult ItemOpeningBalance()
        {
            return View();
        }
        #endregion  ItemOpeningBalance 
    }
}
