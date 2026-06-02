namespace Bizsol_ESMS.Models
{
    /// <summary>BODY shape for POST /api/Master/ImportLocationMasterForTemp and ImportLocationMaster.</summary>
    public sealed class LocationImportMasterRequest
    {
        /// <remarks>Row objects from Excel (UI-enriched).</remarks>
        public object? JsonData { get; set; }

        public int UserMaster_Code { get; set; }

        /// <summary>Y/N from UI — allow creating item master rows for unknown Part #.</summary>
        public string? InsertNewItem { get; set; }

        /// <summary>Y/N from UI — allow creating location master rows for unknown PG/Location.</summary>
        public string? InsertNewLocation { get; set; }
    }
}
