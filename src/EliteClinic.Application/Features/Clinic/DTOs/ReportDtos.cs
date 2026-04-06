using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class ClinicOverviewReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalVisits { get; set; }
    public int ExamVisits { get; set; }
    public int ConsultationVisits { get; set; }
    public int BookingVisits { get; set; }
    public int WalkInVisits { get; set; }
    public int SelfServiceVisits { get; set; }
    public decimal TotalInvoiced { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalRefunded { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetCashflow { get; set; }
    public List<DoctorOverviewReportRowDto> Doctors { get; set; } = new();
    public List<DoctorPercentageReportRowDto> DoctorsPercentages { get; set; } = new();
    public List<ServiceSalesReportRowDto> ServicesSold { get; set; } = new();
    public ServiceSalesReportRowDto? TopSoldService { get; set; }
}

public class DoctorPercentageReportRowDto
{
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public decimal CollectedAmount { get; set; }
    public decimal PercentageOfClinicCollection { get; set; }
}

public class DoctorOverviewReportRowDto
{
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int VisitsCount { get; set; }
    public decimal CollectedAmount { get; set; }
    public decimal CollectedSharePercent { get; set; }
    public DoctorCompensationMode CompensationMode { get; set; }
    public decimal CompensationValue { get; set; }
    public decimal EstimatedCompensationAmount { get; set; }
}

public class ServicesSalesReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalItemsSold { get; set; }
    public decimal GrossSales { get; set; }
    public List<ServiceSalesReportRowDto> Rows { get; set; } = new();
}

public class ServiceSalesReportRowDto
{
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal GrossAmount { get; set; }
    public int InvoicesCount { get; set; }
}
