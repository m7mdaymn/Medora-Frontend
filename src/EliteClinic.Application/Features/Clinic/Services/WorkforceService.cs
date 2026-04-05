using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EliteClinic.Application.Features.Clinic.Services;

public class WorkforceService : IWorkforceService
{
    private const string SalaryPayoutCategory = "SalaryPayout";
    private readonly EliteClinicDbContext _context;

    public WorkforceService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<DoctorCompensationRuleDto>> CreateDoctorCompensationRuleAsync(Guid tenantId, Guid doctorId, Guid changedByUserId, CreateDoctorCompensationRuleRequest request, CancellationToken cancellationToken = default)
    {
        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.TenantId == tenantId && !d.IsDeleted && d.Id == doctorId, cancellationToken);

        if (doctor == null)
            return ApiResponse<DoctorCompensationRuleDto>.Error("Doctor not found");

        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value < request.EffectiveFrom)
            return ApiResponse<DoctorCompensationRuleDto>.Error("EffectiveTo must be greater than or equal to EffectiveFrom");

        var effectiveFrom = request.EffectiveFrom == default ? DateTime.UtcNow : request.EffectiveFrom;

        var history = new DoctorCompensationHistory
        {
            TenantId = tenantId,
            DoctorId = doctorId,
            Mode = request.Mode,
            Value = request.Value,
            EffectiveFrom = effectiveFrom,
            ChangedByUserId = changedByUserId,
            Notes = request.EffectiveTo.HasValue
                ? $"Effective to {request.EffectiveTo.Value:yyyy-MM-dd}"
                : "Compensation updated"
        };

        doctor.CompensationMode = request.Mode;
        doctor.CompensationValue = request.Value;
        doctor.CompensationEffectiveFrom = effectiveFrom;

        _context.DoctorCompensationHistories.Add(history);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<DoctorCompensationRuleDto>.Created(MapRuleFromHistory(history), "Compensation rule created");
    }

    public async Task<ApiResponse<List<DoctorCompensationRuleDto>>> ListDoctorCompensationRulesAsync(Guid tenantId, Guid doctorId, CancellationToken cancellationToken = default)
    {
        var history = await _context.DoctorCompensationHistories
            .Where(h => h.TenantId == tenantId && !h.IsDeleted && h.DoctorId == doctorId)
            .OrderByDescending(h => h.EffectiveFrom)
            .ToListAsync(cancellationToken);

        if (history.Count > 0)
            return ApiResponse<List<DoctorCompensationRuleDto>>.Ok(history.Select(MapRuleFromHistory).ToList(), $"Retrieved {history.Count} rule(s)");

        // Compatibility fallback for tenants with legacy standalone rules not yet migrated.
        var legacyRules = await _context.DoctorCompensationRules
            .Where(r => r.TenantId == tenantId && !r.IsDeleted && r.DoctorId == doctorId)
            .OrderByDescending(r => r.EffectiveFrom)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<DoctorCompensationRuleDto>>.Ok(legacyRules.Select(MapRuleFromLegacy).ToList(), $"Retrieved {legacyRules.Count} rule(s)");
    }

    public async Task<ApiResponse<AttendanceRecordDto>> CreateAttendanceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAttendanceRecordRequest request, CancellationToken cancellationToken = default)
    {
        if (!request.DoctorId.HasValue && !request.EmployeeId.HasValue)
            return ApiResponse<AttendanceRecordDto>.Error("Either doctorId or employeeId is required");

        if (request.DoctorId.HasValue && request.EmployeeId.HasValue)
            return ApiResponse<AttendanceRecordDto>.Error("Specify either doctorId or employeeId, not both");

        if (request.DoctorId.HasValue)
        {
            var doctorExists = await _context.Doctors
                .AnyAsync(d => d.TenantId == tenantId && !d.IsDeleted && d.Id == request.DoctorId.Value, cancellationToken);
            if (!doctorExists)
                return ApiResponse<AttendanceRecordDto>.Error("Doctor not found");
        }

        if (request.EmployeeId.HasValue)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.TenantId == tenantId && !e.IsDeleted && e.Id == request.EmployeeId.Value, cancellationToken);
            if (!employeeExists)
                return ApiResponse<AttendanceRecordDto>.Error("Employee not found");
        }

        var checkInAt = request.CheckInAt ?? DateTime.UtcNow;
        var dayStart = checkInAt.Date;
        var dayEnd = dayStart.AddDays(1);

        var duplicateExists = await _context.AttendanceRecords.AnyAsync(a =>
            a.TenantId == tenantId &&
            !a.IsDeleted &&
            a.CheckInAt >= dayStart && a.CheckInAt < dayEnd &&
            ((request.DoctorId.HasValue && a.DoctorId == request.DoctorId.Value) ||
             (request.EmployeeId.HasValue && a.EmployeeId == request.EmployeeId.Value)), cancellationToken);

        if (duplicateExists)
            return ApiResponse<AttendanceRecordDto>.Error("Attendance record already exists for this person and date");

        var attendance = new AttendanceRecord
        {
            TenantId = tenantId,
            DoctorId = request.DoctorId,
            EmployeeId = request.EmployeeId,
            BranchId = request.BranchId,
            EnteredByUserId = enteredByUserId,
            CheckInAt = checkInAt,
            LateMinutes = request.LateMinutes,
            IsAbsent = request.IsAbsent
        };

        _context.AttendanceRecords.Add(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        var saved = await GetAttendanceWithIncludesAsync(tenantId, attendance.Id, cancellationToken);
        return ApiResponse<AttendanceRecordDto>.Created(MapAttendance(saved!), "Attendance recorded");
    }

    public async Task<ApiResponse<AbsenceRecordDto>> CreateAbsenceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAbsenceRecordRequest request, CancellationToken cancellationToken = default)
    {
        if (!request.DoctorId.HasValue && !request.EmployeeId.HasValue)
            return ApiResponse<AbsenceRecordDto>.Error("Either doctorId or employeeId is required");

        if (request.DoctorId.HasValue && request.EmployeeId.HasValue)
            return ApiResponse<AbsenceRecordDto>.Error("Specify either doctorId or employeeId, not both");

        if (request.ToDate.Date < request.FromDate.Date)
            return ApiResponse<AbsenceRecordDto>.Error("toDate must be on or after fromDate");

        if (request.DoctorId.HasValue)
        {
            var doctorExists = await _context.Doctors
                .AnyAsync(d => d.TenantId == tenantId && !d.IsDeleted && d.Id == request.DoctorId.Value, cancellationToken);
            if (!doctorExists)
                return ApiResponse<AbsenceRecordDto>.Error("Doctor not found");
        }

        if (request.EmployeeId.HasValue)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.TenantId == tenantId && !e.IsDeleted && e.Id == request.EmployeeId.Value, cancellationToken);
            if (!employeeExists)
                return ApiResponse<AbsenceRecordDto>.Error("Employee not found");
        }

        var absence = new AbsenceRecord
        {
            TenantId = tenantId,
            DoctorId = request.DoctorId,
            EmployeeId = request.EmployeeId,
            FromDate = request.FromDate.Date,
            ToDate = request.ToDate.Date,
            Reason = request.Reason.Trim(),
            IsPaid = request.IsPaid,
            Notes = request.Notes,
            EnteredByUserId = enteredByUserId,
            BranchId = request.BranchId
        };

        _context.AbsenceRecords.Add(absence);
        await _context.SaveChangesAsync(cancellationToken);

        var saved = await _context.AbsenceRecords
            .Include(a => a.Doctor)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.TenantId == tenantId && !a.IsDeleted && a.Id == absence.Id, cancellationToken);

        return ApiResponse<AbsenceRecordDto>.Created(MapAbsence(saved!), "Absence recorded");
    }

    public async Task<ApiResponse<List<AbsenceRecordDto>>> ListAbsenceRecordsAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default)
    {
        var query = _context.AbsenceRecords
            .Include(a => a.Doctor)
            .Include(a => a.Employee)
            .Where(a => a.TenantId == tenantId && !a.IsDeleted);

        if (from.HasValue)
            query = query.Where(a => a.ToDate >= from.Value.Date);
        if (to.HasValue)
            query = query.Where(a => a.FromDate <= to.Value.Date);
        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);
        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId.Value);

        var items = await query
            .OrderByDescending(a => a.FromDate)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AbsenceRecordDto>>.Ok(items.Select(MapAbsence).ToList(), $"Retrieved {items.Count} absence record(s)");
    }

    public async Task<ApiResponse<AttendanceRecordDto>> CheckOutAttendanceAsync(Guid tenantId, Guid attendanceId, CheckOutAttendanceRequest request, CancellationToken cancellationToken = default)
    {
        var attendance = await _context.AttendanceRecords
            .FirstOrDefaultAsync(a => a.TenantId == tenantId && !a.IsDeleted && a.Id == attendanceId, cancellationToken);

        if (attendance == null)
            return ApiResponse<AttendanceRecordDto>.Error("Attendance record not found");

        if (attendance.CheckOutAt.HasValue)
            return ApiResponse<AttendanceRecordDto>.Error("Attendance already checked out");

        var checkOutAt = request.CheckOutAt ?? DateTime.UtcNow;
        if (checkOutAt < attendance.CheckInAt)
            return ApiResponse<AttendanceRecordDto>.Error("Check-out cannot be before check-in");

        attendance.CheckOutAt = checkOutAt;
        attendance.OvertimeMinutes = request.OvertimeMinutes;

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await GetAttendanceWithIncludesAsync(tenantId, attendance.Id, cancellationToken);
        return ApiResponse<AttendanceRecordDto>.Ok(MapAttendance(saved!), "Attendance checked out");
    }

    public async Task<ApiResponse<List<AttendanceRecordDto>>> ListAttendanceAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default)
    {
        var query = _context.AttendanceRecords
            .Include(a => a.Doctor)
            .Include(a => a.Employee)
            .Where(a => a.TenantId == tenantId && !a.IsDeleted);

        if (from.HasValue)
            query = query.Where(a => a.CheckInAt >= from.Value.Date);
        if (to.HasValue)
            query = query.Where(a => a.CheckInAt < to.Value.Date.AddDays(1));
        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);
        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId.Value);

        var items = await query
            .OrderByDescending(a => a.CheckInAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AttendanceRecordDto>>.Ok(items.Select(MapAttendance).ToList(), $"Retrieved {items.Count} attendance record(s)");
    }

    public async Task<ApiResponse<SalaryPayoutExpenseDto>> CreateSalaryPayoutAsync(Guid tenantId, Guid recordedByUserId, CreateSalaryPayoutRequest request, CancellationToken cancellationToken = default)
    {
        if (!request.DoctorId.HasValue && !request.EmployeeId.HasValue)
            return ApiResponse<SalaryPayoutExpenseDto>.Error("Either doctorId or employeeId is required");

        if (request.DoctorId.HasValue && request.EmployeeId.HasValue)
            return ApiResponse<SalaryPayoutExpenseDto>.Error("Specify either doctorId or employeeId, not both");

        string recipientName;
        if (request.DoctorId.HasValue)
        {
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.TenantId == tenantId && !d.IsDeleted && d.Id == request.DoctorId.Value, cancellationToken);
            if (doctor == null)
                return ApiResponse<SalaryPayoutExpenseDto>.Error("Doctor not found");
            recipientName = doctor.Name;
        }
        else
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.TenantId == tenantId && !e.IsDeleted && e.Id == request.EmployeeId!.Value, cancellationToken);
            if (employee == null)
                return ApiResponse<SalaryPayoutExpenseDto>.Error("Employee not found");
            recipientName = employee.Name;
        }

        var notePrefix = request.DoctorId.HasValue ? "Doctor" : "Employee";
        var composedNotes = $"{notePrefix} salary payout: {recipientName}. {request.Notes}".Trim();

        var expense = new Expense
        {
            TenantId = tenantId,
            Category = SalaryPayoutCategory,
            Amount = request.Amount,
            ExpenseDate = (request.PayoutDate ?? DateTime.UtcNow).Date,
            Notes = composedNotes,
            RecordedByUserId = recordedByUserId
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<SalaryPayoutExpenseDto>.Created(new SalaryPayoutExpenseDto
        {
            ExpenseId = expense.Id,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate,
            Category = expense.Category,
            Notes = expense.Notes
        }, "Salary payout recorded as expense");
    }

    public async Task<ApiResponse<DailyClosingSnapshotDto>> GenerateDailyClosingSnapshotAsync(Guid tenantId, Guid generatedByUserId, DateTime snapshotDate, CancellationToken cancellationToken = default)
    {
        var day = snapshotDate.Date;
        var dayEnd = day.AddDays(1);

        var existing = await _context.DailyClosingSnapshots
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && !s.IsDeleted && s.SnapshotDate == day, cancellationToken);

        var metrics = await BuildDailyMetricsAsync(tenantId, day, dayEnd, cancellationToken);
        var metricsJson = JsonSerializer.Serialize(metrics);

        if (existing == null)
        {
            existing = new DailyClosingSnapshot
            {
                TenantId = tenantId,
                SnapshotDate = day,
                GeneratedByUserId = generatedByUserId,
                MetricsJson = metricsJson
            };
            _context.DailyClosingSnapshots.Add(existing);
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<DailyClosingSnapshotDto>.Created(MapSnapshot(existing, metrics), "Daily closing snapshot generated");
        }

        existing.GeneratedByUserId = generatedByUserId;
        existing.MetricsJson = metricsJson;
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<DailyClosingSnapshotDto>.Ok(MapSnapshot(existing, metrics), "Daily closing snapshot regenerated");
    }

    public async Task<ApiResponse<List<DailyClosingSnapshotDto>>> GetDailyClosingSnapshotsAsync(Guid tenantId, DateTime? from, DateTime? to, CancellationToken cancellationToken = default)
    {
        var query = _context.DailyClosingSnapshots
            .Where(s => s.TenantId == tenantId && !s.IsDeleted);

        if (from.HasValue)
            query = query.Where(s => s.SnapshotDate >= from.Value.Date);

        if (to.HasValue)
            query = query.Where(s => s.SnapshotDate <= to.Value.Date);

        var snapshots = await query
            .OrderByDescending(s => s.SnapshotDate)
            .ToListAsync(cancellationToken);

        var result = snapshots.Select(s =>
        {
            var metrics = JsonSerializer.Deserialize<DailyMetricsInternal>(s.MetricsJson) ?? new DailyMetricsInternal();
            return MapSnapshot(s, metrics);
        }).ToList();

        return ApiResponse<List<DailyClosingSnapshotDto>>.Ok(result, $"Retrieved {result.Count} snapshot(s)");
    }

    private async Task<AttendanceRecord?> GetAttendanceWithIncludesAsync(Guid tenantId, Guid attendanceId, CancellationToken cancellationToken)
    {
        return await _context.AttendanceRecords
            .Include(a => a.Doctor)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.TenantId == tenantId && !a.IsDeleted && a.Id == attendanceId, cancellationToken);
    }

    private async Task<DailyMetricsInternal> BuildDailyMetricsAsync(Guid tenantId, DateTime day, DateTime dayEnd, CancellationToken cancellationToken)
    {
        var invoices = await _context.Invoices
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.CreatedAt >= day && i.CreatedAt < dayEnd)
            .ToListAsync(cancellationToken);

        var payments = await _context.Payments
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.PaidAt >= day && p.PaidAt < dayEnd)
            .ToListAsync(cancellationToken);

        var expenses = await _context.Expenses
            .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ExpenseDate >= day && e.ExpenseDate < dayEnd)
            .ToListAsync(cancellationToken);

        var completedVisits = await _context.Visits
            .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.Status == VisitStatus.Completed && v.CompletedAt >= day && v.CompletedAt < dayEnd)
            .CountAsync(cancellationToken);

        var totalInvoiced = invoices.Where(i => i.IsServiceRendered).Sum(i => i.Amount);
        var totalCollected = payments.Sum(p => p.Amount);
        var totalExpenses = expenses.Sum(e => e.Amount);

        return new DailyMetricsInternal
        {
            TotalInvoiced = totalInvoiced,
            TotalCollected = totalCollected,
            TotalExpenses = totalExpenses,
            NetCashFlow = totalCollected - totalExpenses,
            VisitsCompleted = completedVisits,
            PaymentsCount = payments.Count,
            ExpensesCount = expenses.Count
        };
    }

    private static DoctorCompensationRuleDto MapRuleFromLegacy(DoctorCompensationRule rule)
    {
        return new DoctorCompensationRuleDto
        {
            Id = rule.Id,
            DoctorId = rule.DoctorId,
            Mode = rule.Mode,
            Value = rule.Value,
            EffectiveFrom = rule.EffectiveFrom,
            EffectiveTo = rule.EffectiveTo,
            IsActive = rule.IsActive,
            CreatedAt = rule.CreatedAt
        };
    }

    private static DoctorCompensationRuleDto MapRuleFromHistory(DoctorCompensationHistory history)
    {
        return new DoctorCompensationRuleDto
        {
            Id = history.Id,
            DoctorId = history.DoctorId,
            Mode = history.Mode,
            Value = history.Value,
            EffectiveFrom = history.EffectiveFrom,
            EffectiveTo = null,
            IsActive = true,
            CreatedAt = history.CreatedAt
        };
    }

    private static AttendanceRecordDto MapAttendance(AttendanceRecord attendance)
    {
        return new AttendanceRecordDto
        {
            Id = attendance.Id,
            EmployeeId = attendance.EmployeeId,
            EmployeeName = attendance.Employee?.Name,
            DoctorId = attendance.DoctorId,
            DoctorName = attendance.Doctor?.Name,
            BranchId = attendance.BranchId,
            EnteredByUserId = attendance.EnteredByUserId,
            CheckInAt = attendance.CheckInAt,
            CheckOutAt = attendance.CheckOutAt,
            LateMinutes = attendance.LateMinutes,
            OvertimeMinutes = attendance.OvertimeMinutes,
            IsAbsent = attendance.IsAbsent,
            CreatedAt = attendance.CreatedAt
        };
    }

    private static AbsenceRecordDto MapAbsence(AbsenceRecord absence)
    {
        return new AbsenceRecordDto
        {
            Id = absence.Id,
            EmployeeId = absence.EmployeeId,
            EmployeeName = absence.Employee?.Name,
            DoctorId = absence.DoctorId,
            DoctorName = absence.Doctor?.Name,
            FromDate = absence.FromDate,
            ToDate = absence.ToDate,
            Reason = absence.Reason,
            IsPaid = absence.IsPaid,
            Notes = absence.Notes,
            EnteredByUserId = absence.EnteredByUserId,
            BranchId = absence.BranchId,
            CreatedAt = absence.CreatedAt
        };
    }

    private static DailyClosingSnapshotDto MapSnapshot(DailyClosingSnapshot snapshot, DailyMetricsInternal metrics)
    {
        return new DailyClosingSnapshotDto
        {
            Id = snapshot.Id,
            SnapshotDate = snapshot.SnapshotDate,
            GeneratedByUserId = snapshot.GeneratedByUserId,
            TotalInvoiced = metrics.TotalInvoiced,
            TotalCollected = metrics.TotalCollected,
            TotalExpenses = metrics.TotalExpenses,
            NetCashFlow = metrics.NetCashFlow,
            VisitsCompleted = metrics.VisitsCompleted,
            PaymentsCount = metrics.PaymentsCount,
            ExpensesCount = metrics.ExpensesCount,
            CreatedAt = snapshot.CreatedAt
        };
    }

    private sealed class DailyMetricsInternal
    {
        public decimal TotalInvoiced { get; set; }
        public decimal TotalCollected { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetCashFlow { get; set; }
        public int VisitsCompleted { get; set; }
        public int PaymentsCount { get; set; }
        public int ExpensesCount { get; set; }
    }
}
