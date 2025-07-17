using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace Bizsol_ESMS.Controllers
{
    public class MasterController : Controller
    {
        #region UOM
        public IActionResult UOMMasterList()
        {
            
            return View();
        }

        #endregion UOM

        #region LocationMaster
        public IActionResult LocationMasterList()
        {

            return View();
        }
        #endregion LocationMaster

        #region CategoryMaster
        public IActionResult CategoryMasterList()
        {

            return View();
        }
        #endregion CategoryMaster

        #region GroupMaster
        public IActionResult GroupMasterList()
        {

            return View();
        }
        #endregion  GroupMaster

        #region SubGroupMaster
        public IActionResult SubGroupMasterList()
        {

            return View();
        }
        #endregion  SubGroupMaster

        #region BrandMaster
        public IActionResult BrandMasterList()
        {

            return View();
        }
        #endregion  BrandMaster

        #region WarehouseMaster
        public IActionResult WarehouseMasterList()
        {

            return View();
        }
        #endregion WarehouseMaster

        #region ItemMaster
        public IActionResult ItemConfigList()
        {

            return View();
        }
        public IActionResult ItemMasterList()
        {

            return View();
        }


        #endregion ItemMaster

        #region UserMaster
        public IActionResult UserMaster()
        {
            string Profile = HttpContext.Request.Query["Profile"].ToString();
            ViewBag.Profile = Profile == "" ? "" : Profile;
            return View();
        }
        #endregion UserMaster

        #region UserGroupMaster
        public IActionResult UserGroupMaster()
        {
            return View();
        }
        #endregion UserGroupMaster

        #region UserMenuRights
        public IActionResult UserMenuRights()
        {
            return View();
        }
        #endregion UserMenuRights

        #region StateMaster
        public IActionResult StateMasterList()
        {
            return View();
        }
        #endregion StateMaster

        #region CityMaster
        public IActionResult CityMasterList()
        {
            return View();
        }
        #endregion CityMaster

        #region  AccountMaster 
        public IActionResult AccountMaster()
        {
            return View();
        }
        #endregion  AccountMaster 

        #region  MRNMaster 
        public IActionResult MRNMaster()
        {
            return View();
        }
        #endregion  MRNMaster 

        #region  PrefixConfiguration 
        public IActionResult PrefixConfiguration()
        {
            return View();
        }
        public IActionResult PageSizeConfiguration()
        {
            return View();
        }
        public IActionResult StockAuditConfiguration()
        {
            return View();
        }
        #endregion  PrefixConfiguration 

        #region  EmployeeMaster
        public IActionResult EmployeeMaster()
        {
            return View();
        }
        #endregion  EmployeeMaster

        #region TAT_Configuration
        public IActionResult TATConfiguration()
        {
            return View();
        }
        #endregion TAT_Configuration

        #region HolidayMaster
        public IActionResult HolidayMaster()
        {
            return View();
        }
        #endregion HolidayMaster
    }
}