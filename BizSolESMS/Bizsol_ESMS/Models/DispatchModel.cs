namespace Bizsol_ESMS.Models
{
    public class DispatchModel
    {
        public string? QRCode { get; set; }
        public int BoxNo { get; set; }
        public string? OrderNo { get; set; }
        public string? AccountName { get; set; }
        public string? Address { get; set; }
        public string? CompanyName { get; set; }
    }

    public class DispatchPdfAmountModel
    {
        public int DispatchMaster_Code { get; set; }
        public decimal Total { get; set; }
        public string? AddType { get; set; }
        public decimal AddValue { get; set; }
        public string? LessType { get; set; }
        public decimal LessValue { get; set; }
        public decimal NetAmount { get; set; }
        public string? IsManual { get; set; }
    }
}
