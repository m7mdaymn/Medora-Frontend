using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class FinanceService : IFinanceService
{
    private readonly EliteClinicDbContext _context;

    public FinanceService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<DailyRevenueDto>> GetDailyRevenueAsync(Guid tenantId, DateTime date)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        var invoices = await _context.Invoices
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.CreatedAt >= dayStart && i.CreatedAt < dayEnd)
            .ToListAsync();

        var payments = await _context.Payments
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.PaidAt >= dayStart && p.PaidAt < dayEnd)
            .ToListAsync();

        var dto = new DailyRevenueDto
        {
            Date = dayStart,
            TotalRevenue = invoices.Where(i => i.IsServiceRendered).Sum(i => i.Amount),
            TotalPaid = invoices.Sum(i => i.PaidAmount),
            TotalUnpaid = invoices.Sum(i => i.RemainingAmount),
            InvoiceCount = invoices.Count,
            PaymentCount = payments.Count
        };

        return ApiResponse<DailyRevenueDto>.Ok(dto, "Daily revenue retrieved");
    }

    public async Task<ApiResponse<List<DoctorRevenueDto>>> GetRevenueByDoctorAsync(Guid tenantId, DateTime date, Guid? doctorId, decimal commissionPercent = 0)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        var query = _context.Invoices
            .Include(i => i.Doctor)
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.CreatedAt >= dayStart && i.CreatedAt < dayEnd);

        if (doctorId.HasValue)
            query = query.Where(i => i.DoctorId == doctorId.Value);

        var safeCommissionPercent = Math.Max(commissionPercent, 0);

        var grouped = await query
            .GroupBy(i => new { i.DoctorId, DoctorName = i.Doctor.Name })
            .Select(g => new DoctorRevenueDto
            {
                DoctorId = g.Key.DoctorId,
                DoctorName = g.Key.DoctorName,
                TotalRevenue = g.Where(i => i.IsServiceRendered).Sum(i => i.Amount),
                TotalPaid = g.Sum(i => i.PaidAmount),
                VisitCount = g.Count(),
                CommissionPercent = safeCommissionPercent,
                CommissionAmount = g.Sum(i => i.PaidAmount) * safeCommissionPercent / 100m
            })
            .ToListAsync();

        return ApiResponse<List<DoctorRevenueDto>>.Ok(grouped, $"Revenue for {grouped.Count} doctor(s)");
    }

    public async Task<ApiResponse<MonthlyRevenueDto>> GetMonthlyRevenueAsync(Guid tenantId, int year, int month)
    {
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var invoices = await _context.Invoices
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.CreatedAt >= monthStart && i.CreatedAt < monthEnd)
            .ToListAsync();

        var expenses = await _context.Expenses
            .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ExpenseDate >= monthStart && e.ExpenseDate < monthEnd)
            .ToListAsync();

        var totalRevenue = invoices.Where(i => i.IsServiceRendered).Sum(i => i.Amount);
        var totalPaid = invoices.Sum(i => i.PaidAmount);
        var totalExpenses = expenses.Sum(e => e.Amount);
        var salaryExpenses = expenses.Where(e => IsSalaryCategory(e.Category)).Sum(e => e.Amount);
        var nonSalaryExpenses = totalExpenses - salaryExpenses;

        var dto = new MonthlyRevenueDto
        {
            Year = year,
            Month = month,
            TotalRevenue = totalRevenue,
            TotalPaid = totalPaid,
            TotalExpenses = totalExpenses,
            SalaryExpenses = salaryExpenses,
            NonSalaryExpenses = nonSalaryExpenses,
            NetProfit = totalPaid - totalExpenses,
            InvoiceCount = invoices.Count
        };

        return ApiResponse<MonthlyRevenueDto>.Ok(dto, "Monthly revenue retrieved");
    }

    public async Task<ApiResponse<YearlyRevenueDto>> GetYearlyRevenueAsync(Guid tenantId, int year)
    {
        var yearStart = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearEnd = yearStart.AddYears(1);

        var invoices = await _context.Invoices
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.CreatedAt >= yearStart && i.CreatedAt < yearEnd)
            .ToListAsync();

        var expenses = await _context.Expenses
            .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ExpenseDate >= yearStart && e.ExpenseDate < yearEnd)
            .ToListAsync();

        var totalRevenue = invoices.Where(i => i.IsServiceRendered).Sum(i => i.Amount);
        var totalPaid = invoices.Sum(i => i.PaidAmount);
        var totalExpenses = expenses.Sum(e => e.Amount);
        var totalSalaryExpenses = expenses.Where(e => IsSalaryCategory(e.Category)).Sum(e => e.Amount);

        // Monthly breakdown
        var months = new List<MonthlyRevenueDto>();
        for (int m = 1; m <= 12; m++)
        {
            var ms = new DateTime(year, m, 1, 0, 0, 0, DateTimeKind.Utc);
            var me = ms.AddMonths(1);

            var mInvoices = invoices.Where(i => i.CreatedAt >= ms && i.CreatedAt < me).ToList();
            var mExpenses = expenses.Where(e => e.ExpenseDate >= ms && e.ExpenseDate < me).ToList();
            var mRev = mInvoices.Where(i => i.IsServiceRendered).Sum(i => i.Amount);
            var mPaid = mInvoices.Sum(i => i.PaidAmount);
            var mExp = mExpenses.Sum(e => e.Amount);
            var mSalary = mExpenses.Where(e => IsSalaryCategory(e.Category)).Sum(e => e.Amount);

            months.Add(new MonthlyRevenueDto
            {
                Year = year,
                Month = m,
                TotalRevenue = mRev,
                TotalPaid = mPaid,
                TotalExpenses = mExp,
                SalaryExpenses = mSalary,
                NonSalaryExpenses = mExp - mSalary,
                NetProfit = mPaid - mExp,
                InvoiceCount = mInvoices.Count
            });
        }

        var dto = new YearlyRevenueDto
        {
            Year = year,
            TotalRevenue = totalRevenue,
            TotalPaid = totalPaid,
            TotalExpenses = totalExpenses,
            SalaryExpenses = totalSalaryExpenses,
            NonSalaryExpenses = totalExpenses - totalSalaryExpenses,
            NetProfit = totalPaid - totalExpenses,
            InvoiceCount = invoices.Count,
            Months = months
        };

        return ApiResponse<YearlyRevenueDto>.Ok(dto, "Yearly revenue retrieved");
    }

    public async Task<ApiResponse<ProfitReportDto>> GetProfitReportAsync(Guid tenantId, DateTime from, DateTime to)
    {
        var fromDate = from.Date;
        var toDate = to.Date.AddDays(1);

        var invoices = await _context.Invoices
            .Include(i => i.Doctor)
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.CreatedAt >= fromDate && i.CreatedAt < toDate)
            .ToListAsync();

        var expenses = await _context.Expenses
            .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ExpenseDate >= fromDate && e.ExpenseDate < toDate)
            .ToListAsync();

        var totalRevenue = invoices.Where(i => i.IsServiceRendered).Sum(i => i.Amount);
        var totalPaid = invoices.Sum(i => i.PaidAmount);
        var totalExpenses = expenses.Sum(e => e.Amount);
        var salaryExpenses = expenses.Where(e => IsSalaryCategory(e.Category)).Sum(e => e.Amount);

        var byDoctor = invoices
            .GroupBy(i => new { i.DoctorId, DoctorName = i.Doctor?.Name ?? "Unknown" })
            .Select(g => new DoctorRevenueDto
            {
                DoctorId = g.Key.DoctorId,
                DoctorName = g.Key.DoctorName,
                TotalRevenue = g.Where(i => i.IsServiceRendered).Sum(i => i.Amount),
                TotalPaid = g.Sum(i => i.PaidAmount),
                VisitCount = g.Count()
            }).ToList();

        var dto = new ProfitReportDto
        {
            From = fromDate,
            To = to.Date,
            TotalRevenue = totalRevenue,
            TotalPaid = totalPaid,
            TotalExpenses = totalExpenses,
            SalaryExpenses = salaryExpenses,
            NonSalaryExpenses = totalExpenses - salaryExpenses,
            NetProfit = totalPaid - totalExpenses,
            InvoiceCount = invoices.Count,
            ExpenseCount = expenses.Count,
            ByDoctor = byDoctor
        };

        return ApiResponse<ProfitReportDto>.Ok(dto, "Profit report retrieved");
    }

    private static bool IsSalaryCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return false;

        var normalized = category.Trim().ToLowerInvariant();
        return normalized.Contains("salary")
            || normalized.Contains("payroll")
            || normalized.Contains("wage")
            || normalized.Contains("compensation");
    }
}
