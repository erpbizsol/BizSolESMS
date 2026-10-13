using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;

namespace Bizsol_ESMS.Controllers
{
    public class MasterController : Controller
    {
        private readonly IConfiguration _configuration;

        public MasterController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        #region UOM
        public IActionResult UOMMasterList()
        {
            
            return View();
        }

        #endregion UOM

        #region HSNMaster
        public IActionResult HSNMaster()
        {

            return View();
        }
        #endregion HSNMaster

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
        public IActionResult ClientMaster()
        {
            return View();
        }
        #endregion  AccountMaster 

        #region  CompanyMaster 
        public IActionResult CompanyMaster()
        {
            return View();
        }
        #endregion  CompanyMaster 

        #region ClientTypeMaster
        public IActionResult ClientTypeMaster()
        {
            return View();
        }
        #endregion ClientTypeMaster 

        #region BankMaster
        public IActionResult BankMaster()
        {
            return View();
        }
        #endregion BankMaster 

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
        public IActionResult FixParameterConfiguration()
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

        #region MailConfiguration
        public IActionResult MailConfiguration()
        {
            return View();
        }
        #endregion MailConfiguration

        #region Helpdesk
        public IActionResult Helpdesk()
        {
            return View();
        }
        #endregion Helpdesk

        #region ManualSalesReturn
        public IActionResult ManualSalesReturn()
        {
            return View();
        }
        #endregion ManualSalesReturn

        #region VendorReplacementOut
        public IActionResult VendorReplacementOut()
        {
            return View();
        }
        #endregion VendorReplacementOut

        #region VendorReplacementIn
        public IActionResult VendorReplacementIn()
        {
            return View();
        }
        #endregion VendorReplacementIn

        #region RetailerReplacementIn
        public IActionResult RetailerReplacementIn()
        {
            return View();
        }
        #endregion RetailerReplacementIn

        #region RetailerReplacementOut
        public IActionResult RetailerReplacementOut()
        {
            return View();
        }
        #endregion RetailerReplacementOut

        #region PriceListMaster
        public IActionResult PriceListMaster()
        {
            return View();
        }

        /// <summary>
        /// Same-origin proxy for PDF extract (avoids browser CORS to AppBaseURL API).
        /// </summary>
        [HttpPost]
        [RequestSizeLimit(104_857_600)]
        public async Task<IActionResult> PriceListPdfExtract(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, errors = new[] { "PDF file is required." } });
            }

            var apiBase = (_configuration["PdfExtractApiBaseUrl"]
                ?? _configuration["AppBaseURL"]
                ?? string.Empty).TrimEnd('/');
            if (string.IsNullOrEmpty(apiBase))
            {
                return StatusCode(500, new { success = false, errors = new[] { "PdfExtractApiBaseUrl or AppBaseURL must be set in appsettings." } });
            }

            var authKey = Request.Headers["Auth-Key"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authKey))
            {
                return Unauthorized(new { success = false, errors = new[] { "Auth-Key header is required." } });
            }

            using var client = new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
            using var multipart = new MultipartFormDataContent();
            await using var stream = file.OpenReadStream();
            var fileContent = new StreamContent(stream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(
                string.IsNullOrWhiteSpace(file.ContentType) ? "application/pdf" : file.ContentType);
            multipart.Add(fileContent, "file", file.FileName);

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{apiBase}/api/Pdf/extract")
            {
                Content = multipart
            };
            request.Headers.TryAddWithoutValidation("Auth-Key", authKey);

            HttpResponseMessage response;
            try
            {
                response = await client.SendAsync(request);
            }
            catch (Exception ex)
            {
                return StatusCode(502, new { success = false, errors = new[] { "Could not reach PDF extract API: " + ex.Message } });
            }

            var body = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrWhiteSpace(body))
            {
                body = "{}";
            }

            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = body,
                ContentType = "application/json"
            };
        }
        #endregion PriceListMaster
    }
}