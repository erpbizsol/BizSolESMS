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
       
        public IActionResult CreateUOMMaster()
        {
            string EncryptCode = HttpContext.Request.Query["Code"].ToString();
            string UOMMode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.UCode = EncryptCode == "" ? 0 : Convert.ToInt32(EncryptCode);
            ViewBag.UomMode = UOMMode == "" ? "New" : UOMMode;

            return View();
        }

        #endregion UOM

        #region LocationMaster
        public IActionResult LocationMasterList()
        {

            return View();
        }

        public IActionResult CreateLocationMaster()
        {
            string MLaCode = HttpContext.Request.Query["Code"].ToString();
            string MMaode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.MLCode = MLaCode == "" ? 0 : Convert.ToInt32(MLaCode);
            ViewBag.MMode = MMaode == "" ? "New" : MMaode;

            return View();
        }
        #endregion LocationMaster

        #region CategoryMaster
        public IActionResult CategoryMasterList()
        {

            return View();
        }

        public IActionResult CreateCategoryMaster()
        {
            string CCode = HttpContext.Request.Query["Code"].ToString();
            string CMaode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.CCode = CCode == "" ? 0 : Convert.ToInt32(CCode);
            ViewBag.CMode = CMaode == "" ? "New" : CMaode;

            return View();
        }
        #endregion CategoryMaster

        #region GroupMaster
        public IActionResult GroupMasterList()
        {

            return View();
        }

        public IActionResult CreateGroupMaster()
        {
            string GCode = HttpContext.Request.Query["Code"].ToString();
            string GMaode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.GCode = GCode == "" ? 0 : Convert.ToInt32(GCode);
            ViewBag.GMode = GMaode == "" ? "New" : GMaode;

            return View();
        }
        #endregion  GroupMaster

        #region SubGroupMaster
        public IActionResult SubGroupMasterList()
        {

            return View();
        }

        public IActionResult CreateSubGroupMaster()
        {
            string SGCode = HttpContext.Request.Query["Code"].ToString();
            string SGMaode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.SGCode = SGCode == "" ? 0 : Convert.ToInt32(SGCode);
            ViewBag.SGMode = SGMaode == "" ? "New" : SGMaode;

            return View();
        }
        #endregion  SubGroupMaster

        #region BrandMaster
        public IActionResult BrandMasterList()
        {

            return View();
        }

        public IActionResult CreateBrandMaster()
        {
            string BCode = HttpContext.Request.Query["Code"].ToString();
            string BMaode = HttpContext.Request.Query["Mode"].ToString();

            ViewBag.BCode = BCode == "" ? 0 : Convert.ToInt32(BCode);
            ViewBag.BMode = BMaode == "" ? "New" : BMaode;

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