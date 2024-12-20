using System.Data;

namespace Bizsol_ESMS.Models
{
    public class LoginModel
    {
        public int Id { get; set; }
        public string UserID { get; set; }
        public string Password { get; set; }
    }
}

public class BizSolERPLoginDetails
{
    public string CompanyCode { get; set; }
 
}