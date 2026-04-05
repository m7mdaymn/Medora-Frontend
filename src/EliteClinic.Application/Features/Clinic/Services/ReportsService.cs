using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class ReportsService : IReportsService
{
    private readonly EliteClinicDbContext _context;

    public ReportsService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ClinicOverviewReportDto>> GetClinicOverviewAsync(
        Guid tenantId,
        DateTime fromDate,
        DateTime toDate,
        Guid? doctorId = null,
        VisitType? visitType = null,
        VisitSource? source = null)
    {
        if (toDate.Date < fromDate.Date)
            return ApiResponse<ClinicOverviewReportDto>.Error("toDate must be on or after fromDate");

        var start = fromDate.Date;
        var endExclusive = toDate.Date.AddDays(1);

        var visitsQuery = _context.Visits
            .Include(v => v.Doctor)
            .Include(v => v.Invoice)
                .ThenInclude(i => i!.Payments.Where(p => !p.IsDeleted))
            .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.StartedAt >= start && v.StartedAt < endExclusive);

        if (doctorId.HasValue)
            visitsQuery = visitsQuery.Where(v => v.DoctorId == doctorId.Value);
        if (visitType.HasValue)
            visitsQuery = visitsQuery.Where(v => v.VisitType == visitType.Value);
        if (source.HasValue)
            visitsQuery = visitsQuery.Where(v => v.Source == source.Value);

        var visits = await visitsQuery.ToListAsync();
        var visitIds = visits.Select(v => v.Id).ToList();

        var invoices = await _context.Invoices
            .Include(i => i.Payments.Where(p => !p.IsDeleted))
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && visitIds.Contains(i.VisitId))
            .ToListAsync();

        var invoiceSnapshots = invoices.ToDictionary(i => i.Id, ComputeFinancialSnapshot);

        var expenses = await _context.Expenses
            .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ExpenseDate >= start && e.ExpenseDate < endExclusive)
            .ToListAsync();

        var doctorIds = visits.Select(v => v.DoctorId).Distinct().ToList();
        var doctors = await _context.Doctors
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && doctorIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d);

        var doctorRows = visits
            .GroupBy(v => new { v.DoctorId, DoctorName = v.Doctor?.Name ?? string.Empty })
            .Select(group =>
            {
                var collected = group
                    .Where(v => v.Invoice != null)
                    .Select(v => v.Invoice!.Id)
                    .Distinct()
                    .Sum(invoiceId => invoiceSnapshots.TryGetValue(invoiceId, out var snapshot) ? snapshot.PaidAmount : 0m);

                doctors.TryGetValue(group.Key.DoctorId, out var doctor);
                var mode = doctor?.CompensationMode ?? DoctorCompensationMode.Percentage;
                var value = doctor?.CompensationValue ?? 0m;
                var estimatedCompensation = mode == DoctorCompensationMode.Percentage
                    ? collected * value / 100m
                    : value;

                return new DoctorOverviewReportRowDto
                {
                    DoctorId = group.Key.DoctorId,
                    DoctorName = group.Key.DoctorName,
                    VisitsCount = group.Count(),
                    CollectedAmount = collected,
                    CompensationMode = mode,
                    CompensationValue = value,
                    EstimatedCompensationAmount = estimatedCompensation
                };
            })
            .OrderByDescending(r => r.CollectedAmount)
            .ToList();

        var report = new ClinicOverviewReportDto
        {
            FromDate = start,
            ToDate = toDate.Date,
            TotalVisits = visits.Count,
            ExamVisits = visits.Count(v => v.VisitType == VisitType.Exam),
            ConsultationVisits = visits.Count(v => v.VisitType == VisitType.Consultation),
            BookingVisits = visits.Count(v => v.Source == VisitSource.Booking || v.Source == VisitSource.ConsultationBooking || v.Source == VisitSource.PatientSelfServiceBooking),
            WalkInVisits = visits.Count(v => v.Source == VisitSource.WalkInTicket),
            SelfServiceVisits = visits.Count(v => IsSelfServiceSource(v.Source)),
            TotalInvoiced = invoices.Sum(i => i.Amount),
            TotalCollected = invoiceSnapshots.Sum(x => x.Value.PaidAmount),
            TotalRefunded = invoiceSnapshots.Sum(x => x.Value.RefundedAmount),
            TotalExpenses = expenses.Sum(e => e.Amount),
            NetCashflow = invoiceSnapshots.Sum(x => x.Value.PaidAmount) - expenses.Sum(e => e.Amount),
            Doctors = doctorRows
        };

        return ApiResponse<ClinicOverviewReportDto>.Ok(report, "Overview report generated");
    }

    public async Task<ApiResponse<ServicesSalesReportDto>> GetServicesSalesAsync(
        Guid tenantId,
        DateTime fromDate,
        DateTime toDate,
        Guid? doctorId = null,
        VisitType? visitType = null,
        VisitSource? source = null)
    {
        if (toDate.Date < fromDate.Date)
            return ApiResponse<ServicesSalesReportDto>.Error("toDate must be on or after fromDate");

        var start = fromDate.Date;
        var endExclusive = toDate.Date.AddDays(1);

        var query = _context.InvoiceLineItems
            .Include(li => li.Invoice)
                .ThenInclude(i => i.Payments.Where(p => !p.IsDeleted))
            .Include(li => li.Invoice)
                .ThenInclude(i => i.Visit)
            .Where(li => li.TenantId == tenantId
                && !li.IsDeleted
                && !li.Invoice.IsDeleted
                && li.Invoice.CreatedAt >= start
                && li.Invoice.CreatedAt < endExclusive);

        if (doctorId.HasValue)
            query = query.Where(li => li.Invoice.DoctorId == doctorId.Value);
        if (visitType.HasValue)
            query = query.Where(li => li.Invoice.Visit.VisitType == visitType.Value);
        if (source.HasValue)
            query = query.Where(li => li.Invoice.Visit.Source == source.Value);

        var lineItems = await query.ToListAsync();

        var rows = lineItems
            .GroupBy(li => string.IsNullOrWhiteSpace(li.ItemName) ? "Unspecified Service" : li.ItemName.Trim())
            .Select(group => new ServiceSalesReportRowDto
            {
                ServiceName = group.Key,
                Quantity = group.Sum(x => x.Quantity),
                GrossAmount = group.Sum(x => x.TotalPrice),
                InvoicesCount = group.Select(x => x.InvoiceId).Distinct().Count()
            })
            .OrderByDescending(r => r.GrossAmount)
            .ToList();

        var report = new ServicesSalesReportDto
        {
            FromDate = start,
            ToDate = toDate.Date,
            TotalItemsSold = rows.Sum(r => r.Quantity),
            GrossSales = rows.Sum(r => r.GrossAmount),
            Rows = rows
        };

        return ApiResponse<ServicesSalesReportDto>.Ok(report, "Services sales report generated");
    }

    public async Task<ApiResponse<ClinicOverviewReportDto>> GetDoctorOwnOverviewAsync(
        Guid tenantId,
        Guid doctorUserId,
        DateTime fromDate,
        DateTime toDate,
        VisitType? visitType = null,
        VisitSource? source = null)
    {
        var doctorId = await _context.Doctors
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.UserId == doctorUserId)
            .Select(d => (Guid?)d.Id)
            .FirstOrDefaultAsync();

        if (!doctorId.HasValue)
            return ApiResponse<ClinicOverviewReportDto>.Error("Doctor profile not found");

        return await GetClinicOverviewAsync(tenantId, fromDate, toDate, doctorId.Value, visitType, source);
    }

    private static bool IsSelfServiceSource(VisitSource source)
    {
        return source == VisitSource.PatientSelfServiceTicket || source == VisitSource.PatientSelfServiceBooking;
    }

    private static InvoiceFinancialSnapshot ComputeFinancialSnapshot(Invoice invoice)
    {
        var activePayments = invoice.Payments?.Where(p => !p.IsDeleted).ToList() ?? new List<Payment>();
        var hasPaymentRows = activePayments.Count > 0;
        var paidAmount = hasPaymentRows
            ? Math.Max(activePayments.Sum(p => p.Amount), 0m)
            : invoice.PaidAmount;
        var refunded = activePayments.Where(p => p.Amount < 0).Sum(p => Math.Abs(p.Amount));

        return new InvoiceFinancialSnapshot
        {
            PaidAmount = paidAmount,
            RefundedAmount = refunded
        };
    }

    private sealed class InvoiceFinancialSnapshot
    {
        public decimal PaidAmount { get; set; }
        public decimal RefundedAmount { get; set; }
    }
}
