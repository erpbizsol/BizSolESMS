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

        public IActionResult CreateWarehouseMaster()
        {
            string WCode = HttpContext.Request.Query["Code"].ToString();
            string WMaode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.WCode = WCode == "" ? 0 : Convert.ToInt32(WCode);
            ViewBag.WMode = WMaode == "" ? "New" : WMaode;

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
    }
}