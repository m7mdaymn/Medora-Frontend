using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

/// <summary>
/// Online booking created by an existing patient.
/// Produces a queue ticket upon confirmation.
/// Gated by OnlineBooking feature flag and ClinicSettings.BookingEnabled.
/// </summary>
public class Booking : TenantBaseEntity
{
    public Guid? BranchId { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? DoctorServiceId { get; set; }
    public VisitType VisitType { get; set; }
    public VisitSource Source { get; set; }
    public DateTime BookingDate { get; set; }
    public TimeSpan BookingTime { get; set; }
    public BookingStatus Status { get; set; }
    public string? Notes { get; set; }
    public Guid? QueueTicketId { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation
    public Patient Patient { get; set; } = null!;
    public Branch? Branch { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public DoctorService? DoctorService { get; set; }
    public QueueTicket? QueueTicket { get; set; }

    public Booking()
    {
        Status = BookingStatus.Confirmed;
        VisitType = VisitType.Exam;
        Source = VisitSource.Booking;
    }
}
