﻿using Microsoft.AspNetCore.Mvc;

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

        #region  BoxUnloading 
        public IActionResult BoxUnloading()
        {
            return View();
        }
        #endregion  BoxUnloading

        #region  ItemLocator 
        public IActionResult ItemLocator()
        {
            return View();
        }
        #endregion  ItemLocator 

        #region  BoxValidation 
        public IActionResult BoxValidation()
        {
            return View();
        }
        #endregion  BoxValidation
        
        #region  SalesReturnMaster 
        public IActionResult SalesReturnMaster()
        {
            return View();
        }
        #endregion  SalesReturnMaster 

        #region  StockAudit 
        public IActionResult StockAudit()
        {
            return View();
        }
        #endregion  StockAudit 

        #region  DispatchBoxValidation 
        public IActionResult DispatchBoxValidation()
        {
            return View();
        }
        #endregion  DispatchBoxValidation 
    }
}
