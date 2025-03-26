namespace Bizsol_ESMS.Models
{
    public class ReportRequest
    {
        public string ReportType { get; set; }
        public string newConnectionString { get; set; } = "";
        public int p_Code { get; set; }
        public int p1_Code { get; set; }
    }
}
